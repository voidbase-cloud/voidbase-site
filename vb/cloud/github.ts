// The template marketplace behind the /cloud page: connect a GitHub account (OAuth app, GH_OAUTH_CLIENT_ID / _SECRET),
// list templates (vb_templates: GitHub template repositories, the first is voidbase-cloud/voidbase-site), create a
// repository from a template in the visitor's GitHub account and wire it to one of their voidbase instances by
// writing the instance URL as a repository Actions variable, and list the repositories linked that way (checked
// live against GitHub). Tokens are sealed at rest like the Cloudflare ones. Everything is plain fetch (Bun and Workers).
import type { VoidbaseApp, RequestEvent, HookRecord } from "@voidbase-cloud/voidbase";

type Hooks = VoidbaseApp["hooks"];
type Ev = RequestEvent & { auth: HookRecord | null };
export interface GithubDeps {
  env: (k: string, d?: string) => string;
  seal: (plain: string) => Promise<string>;
  open: (stored: string) => Promise<string>;
  userId: (e: Ev) => string;
  readBody: (e: Ev) => Promise<Record<string, unknown>>;
}
export const DEFAULT_GH_SCOPES = ["repo", "read:user", "user:email"]; // repo: create from a template, set Actions variables, private repos

const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)))));
}

export function registerGithub(app: VoidbaseApp, d: GithubDeps) {
  const H: Hooks = app.hooks;
  const cfg = () => {
    const worker = d.env("VOIDBASE_WORKER_NAME");
    return {
      clientId: d.env("GH_OAUTH_CLIENT_ID"), clientSecret: d.env("GH_OAUTH_CLIENT_SECRET"),
      scopes: d.env("GH_OAUTH_SCOPES", DEFAULT_GH_SCOPES.join(" ")).split(/[\s,]+/).filter(Boolean),
      api: d.env("GITHUB_API_BASE", "https://api.github.com").replace(/\/$/, ""),
      oauth: d.env("GITHUB_OAUTH_BASE", "https://github.com").replace(/\/$/, ""),
      // where the callback sends the browser back to: the site (production) or the local site dev server
      site: d.env("VB_SITE_URL", worker ? "https://voidbase.cloud" : "http://127.0.0.1:5173").replace(/\/$/, ""),
    };
  };
  const callbackUrl = (e: Ev) => new URL(e.request.url).origin + "/api/vbcloud/github/callback";

  // ---- GitHub API with the visitor's token ---------------------------------------------------------------------
  interface GhError { status: number; message: string }
  async function gh<T>(token: string, method: string, path: string, body?: unknown, tolerate: number[] = []): Promise<{ status: number; data: T }> {
    const res = await fetch(cfg().api + path, { method, headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "voidbase-cloud", ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text(); let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = { message: text.slice(0, 200) }; }
    if (!res.ok && !tolerate.includes(res.status)) { const err: GhError = { status: res.status, message: `GitHub ${method} ${path}: ${res.status} ${(data as { message?: string } | null)?.message ?? ""}`.trim() }; throw Object.assign(new Error(err.message), err); }
    return { status: res.status, data: data as T };
  }
  async function connectionFor(uid: string): Promise<{ conn: HookRecord; token: string }> {
    let conn: HookRecord; try { conn = await H.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: uid }); } catch { throw new H.BadRequestError("Connect your GitHub account first."); }
    const token = await d.open(conn.getString("access_token"));
    if (!token) throw new H.BadRequestError("Your GitHub connection has no token: connect GitHub again.");
    return { conn, token };
  }
  const connectionJSON = (c: HookRecord | null) => c ? { login: c.getString("login"), name: c.getString("name"), avatarUrl: c.getString("avatar_url"), scopes: c.getString("scopes"), connected: String(c.get("created") ?? "") } : null;

  // ---- connect: state = user + time, HMAC-signed with the client secret, so no server-side state is kept ----------
  H.routerAdd("GET", "/api/vbcloud/github", async (e: Ev) => {
    const c = cfg(); let conn: HookRecord | null = null;
    if (e.auth && !e.auth.isSuperuser()) { try { conn = await H.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: e.auth.id }); } catch { conn = null; } }
    return e.json(200, { configured: !!c.clientId, connected: !!conn, connection: connectionJSON(conn), scopes: c.scopes.join(" ") });
  }, H.$apis.requireAuth());
  H.routerAdd("GET", "/api/vbcloud/github/connect", async (e: Ev) => {
    const uid = d.userId(e); const c = cfg();
    if (!c.clientId || !c.clientSecret) throw new H.BadRequestError("The backend has no GitHub OAuth app configured (GH_OAUTH_CLIENT_ID / GH_OAUTH_CLIENT_SECRET).");
    const payload = b64url(JSON.stringify({ u: uid, t: Date.now(), n: crypto.randomUUID() }));
    const state = `${payload}.${await hmac(c.clientSecret, payload)}`;
    const url = new URL(c.oauth + "/login/oauth/authorize");
    url.searchParams.set("client_id", c.clientId); url.searchParams.set("redirect_uri", callbackUrl(e)); url.searchParams.set("scope", c.scopes.join(" ")); url.searchParams.set("state", state);
    return e.json(200, { url: url.toString() });
  }, H.$apis.requireAuth("users"));
  H.routerAdd("GET", "/api/vbcloud/github/callback", async (e: Ev) => {
    const c = cfg(); const back = (q: string) => e.redirect(302, `${c.site}/cloud?${q}`);
    const code = e.queryParam("code"), state = e.queryParam("state"), denied = e.queryParam("error");
    if (denied) return back(`github=error&message=${encodeURIComponent(e.queryParam("error_description") || denied)}`);
    const [payload, sig] = state.split(".");
    if (!payload || !sig || sig !== (await hmac(c.clientSecret, payload))) return back("github=error&message=" + encodeURIComponent("invalid state"));
    const st = JSON.parse(unb64url(payload)) as { u: string; t: number };
    if (Date.now() - st.t > 10 * 60_000) return back("github=error&message=" + encodeURIComponent("the sign-in link expired, try again"));
    const tokenRes = await fetch(c.oauth + "/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: c.clientId, client_secret: c.clientSecret, code, redirect_uri: callbackUrl(e) }) });
    const tok = (await tokenRes.json().catch(() => ({}))) as { access_token?: string; scope?: string; error?: string; error_description?: string };
    if (!tok.access_token) return back("github=error&message=" + encodeURIComponent(tok.error_description || tok.error || "GitHub returned no token"));
    const { data: me } = await gh<{ id: number; login: string; name: string | null; avatar_url: string }>(tok.access_token, "GET", "/user");
    let conn: HookRecord; try { conn = await H.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: st.u }); } catch { conn = new H.Record(H.$app.findCollectionByNameOrId("gh_connections")); conn.set("user", st.u); }
    conn.set("gh_user_id", String(me.id)); conn.set("login", me.login); conn.set("name", me.name ?? ""); conn.set("avatar_url", me.avatar_url ?? ""); conn.set("scopes", tok.scope ?? c.scopes.join(" ")); conn.set("access_token", await d.seal(tok.access_token));
    await H.$app.save(conn);
    return back("github=connected");
  });
  H.routerAdd("DELETE", "/api/vbcloud/github", async (e: Ev) => {
    const uid = d.userId(e); const c = cfg();
    let conn: HookRecord | null = null; try { conn = await H.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: uid }); } catch { conn = null; }
    if (!conn) return e.json(200, { disconnected: false });
    // revoke the grant on GitHub too (best effort: the OAuth app's own credentials authorize this call)
    try { const token = await d.open(conn.getString("access_token")); await fetch(`${c.api}/applications/${c.clientId}/grant`, { method: "DELETE", headers: { authorization: "Basic " + btoa(`${c.clientId}:${c.clientSecret}`), accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "voidbase-cloud" }, body: JSON.stringify({ access_token: token }) }); } catch { /* revocation is a courtesy */ }
    await H.$app.delete(conn);
    return e.json(200, { disconnected: true });
  }, H.$apis.requireAuth("users"));

  // ---- templates: GitHub template repositories registered in vb_templates (superusers add more from the panel) -------
  // the first template, this site, is seeded once the collection exists (a migration cannot see a collection it just created)
  H.onBootstrap(async (e: { next: () => Promise<unknown> }) => {
    await e.next();
    try {
      const existing = (await H.$app.findRecordsByFilter("vb_templates", "name = 'voidbase-site'", "", 1, 0)) as HookRecord[];
      if (existing.length) return;
      const t = new H.Record(H.$app.findCollectionByNameOrId("vb_templates"));
      t.set("name", "voidbase-site"); t.set("repo", "voidbase-cloud/voidbase-site"); t.set("title", "voidbase site"); t.set("kind", "site");
      t.set("description", "This site: SvelteKit on GitHub Pages with docs, FAQ and the cloud control plane in vb/. The Pages workflow reads the backend URL and the custom domain from repository variables.");
      t.set("url", "https://github.com/voidbase-cloud/voidbase-site");
      t.set("variables", [{ name: "PB_VB_URL", source: "instance_url" }, { name: "PAGES_CNAME", source: "input:domain" }]);
      await H.$app.save(t); console.log("vbcloud: template voidbase-site registered");
    } catch (err) { console.warn("vbcloud: template seeding", err); }
  });
  const templateJSON = (t: HookRecord) => ({ id: t.id, name: t.getString("name"), repo: t.getString("repo"), title: t.getString("title"), description: t.getString("description"), url: t.getString("url"), kind: t.getString("kind"), variables: (() => { const v = t.get("variables"); return Array.isArray(v) ? v : typeof v === "string" ? JSON.parse(v || "[]") : []; })() as { name: string; source: string; value?: string }[] });
  H.routerAdd("GET", "/api/vbcloud/templates", async (e: Ev) => {
    const rows = (await H.$app.findRecordsByFilter("vb_templates", "", "name", 100, 0)) as HookRecord[];
    return e.json(200, { templates: rows.map(templateJSON) });
  }, H.$apis.requireAuth());

  // ---- repositories created from a template and wired to an instance -------------------------------------------------
  const repoJSON = (r: HookRecord, extra: Record<string, unknown> = {}) => ({ id: r.id, fullName: r.getString("full_name"), htmlUrl: r.getString("html_url"), defaultBranch: r.getString("default_branch"), private: r.getBool("private"), status: r.getString("status"), error: r.getString("error"), template: r.getString("template"), instance: r.getString("instance"), created: String(r.get("created") ?? ""), ...extra });
  const varValue = (source: string, inst: HookRecord, input: Record<string, unknown>, literal?: string): string => {
    if (source === "instance_url") return inst.getString("url");
    if (source === "instance_panel") return inst.getString("url") ? `${inst.getString("url")}/_/` : "";
    if (source === "instance_name") return inst.getString("name");
    if (source.startsWith("input:")) return String(input[source.slice(6)] ?? "").trim();
    return literal ?? "";
  };
  async function setVariable(token: string, fullName: string, name: string, value: string) {
    const r = await gh(token, "POST", `/repos/${fullName}/actions/variables`, { name, value }, [409]);
    if (r.status === 409) await gh(token, "PATCH", `/repos/${fullName}/actions/variables/${name}`, { name, value });
  }
  H.routerAdd("GET", "/api/vbcloud/repos", async (e: Ev) => {
    const uid = d.userId(e);
    const rows = (await H.$app.findRecordsByFilter("vb_repos", "user = {:u}", "-created", 100, 0, { u: uid })) as HookRecord[];
    let token = ""; try { token = (await connectionFor(uid)).token; } catch { token = ""; }
    const out = [];
    for (const r of rows) {
      let inst: HookRecord | null = null; try { inst = r.getString("instance") ? await H.$app.findRecordById("vb_instances", r.getString("instance")) : null; } catch { inst = null; }
      let tpl: HookRecord | null = null; try { tpl = r.getString("template") ? await H.$app.findRecordById("vb_templates", r.getString("template")) : null; } catch { tpl = null; }
      // live check: the repository still exists and its PB_VB_URL variable points at the instance
      let live: Record<string, unknown> = { checked: false };
      if (token) {
        try {
          const repo = await gh<{ html_url: string; default_branch: string; private: boolean }>(token, "GET", `/repos/${r.getString("full_name")}`, undefined, [404]);
          if (repo.status === 404) live = { checked: true, exists: false, connected: false };
          else {
            const v = await gh<{ value?: string }>(token, "GET", `/repos/${r.getString("full_name")}/actions/variables/PB_VB_URL`, undefined, [404]);
            const value = v.status === 404 ? "" : String(v.data?.value ?? "");
            live = { checked: true, exists: true, connected: !!inst && !!value && value === inst.getString("url"), backendUrl: value };
          }
        } catch (err) { live = { checked: false, error: err instanceof Error ? err.message : String(err) }; }
      }
      out.push(repoJSON(r, { instanceName: inst?.getString("name") ?? "", instanceUrl: inst?.getString("url") ?? "", templateName: tpl?.getString("name") ?? "", templateTitle: tpl?.getString("title") ?? "", live }));
    }
    return e.json(200, { repos: out, githubConnected: !!token });
  }, H.$apis.requireAuth("users"));
  H.routerAdd("POST", "/api/vbcloud/repos", async (e: Ev) => {
    const uid = d.userId(e); const body = await d.readBody(e);
    const { conn, token } = await connectionFor(uid);
    const tplKey = String(body.template ?? "").trim(); if (!tplKey) throw new H.BadRequestError("Pick a template.");
    let tpl: HookRecord; try { tpl = await H.$app.findFirstRecordByFilter("vb_templates", "name = {:n} || id = {:n}", { n: tplKey }); } catch { throw new H.BadRequestError(`Unknown template "${tplKey}".`); }
    const instId = String(body.instance ?? "").trim(); if (!instId) throw new H.BadRequestError("Pick the voidbase instance the repository should use.");
    let inst: HookRecord; try { inst = await H.$app.findRecordById("vb_instances", instId); } catch { throw new H.BadRequestError("Unknown instance."); }
    if (inst.getString("owner") !== uid) throw new H.ForbiddenError("That instance is not yours.");
    if (inst.getString("status") !== "live" || !inst.getString("url")) throw new H.BadRequestError("The instance is not live yet.");
    // GitHub treats repository names case-insensitively: keep them lowercase so the "already linked" check is exact
    const name = String(body.name ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
    if (!name || name.length > 100) throw new H.BadRequestError("Give the repository a name (letters, digits, dashes, dots, underscores).");
    const owner = String(body.owner ?? conn.getString("login")); const fullName = `${owner}/${name}`;
    if (await H.$app.findRecordsByFilter("vb_repos", "full_name = {:f}", "", 1, 0, { f: fullName }).then((r: HookRecord[]) => r.length)) throw new H.BadRequestError(`${fullName} is already linked here.`);
    const row = new H.Record(H.$app.findCollectionByNameOrId("vb_repos"));
    row.set("user", uid); row.set("instance", inst.id); row.set("template", tpl.id); row.set("full_name", fullName); row.set("private", !!body.private); row.set("status", "creating");
    await H.$app.save(row);
    const t = templateJSON(tpl);
    try {
      const made = await gh<{ full_name: string; html_url: string; default_branch: string; private: boolean }>(token, "POST", `/repos/${t.repo}/generate`, { owner, name, private: !!body.private, description: String(body.description ?? `${t.title} on voidbase (${inst.getString("name")})`), include_all_branches: false });
      row.set("full_name", made.data.full_name); row.set("html_url", made.data.html_url); row.set("default_branch", made.data.default_branch ?? "main"); row.set("private", !!made.data.private);
      // the template's variables: the instance URL is what connects the repository to the instance
      const set: Record<string, string> = {};
      for (const v of t.variables) { const value = varValue(v.source, inst, body, v.value); if (!value) continue; await setVariable(token, made.data.full_name, v.name, value); set[v.name] = value; }
      row.set("status", "ready"); row.set("error", ""); await H.$app.save(row);
      return e.json(200, { repo: repoJSON(row, { variables: set, instanceName: inst.getString("name"), instanceUrl: inst.getString("url"), templateName: t.name, templateTitle: t.title }) });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      row.set("status", "error"); row.set("error", message.slice(0, 1000)); await H.$app.save(row);
      throw new H.BadRequestError(`Creating ${fullName} failed: ${message}`);
    }
  }, H.$apis.requireAuth("users"));
  H.routerAdd("DELETE", "/api/vbcloud/repos/{id}", async (e: Ev) => {
    const uid = d.userId(e); const row = await H.$app.findRecordById("vb_repos", e.pathParam("id")); if (!row) throw new H.NotFoundError();
    if (row.getString("owner") !== uid && row.getString("user") !== uid) throw new H.ForbiddenError();
    await H.$app.delete(row); // unlinks only: the repository stays in the visitor's GitHub account
    return e.json(200, { unlinked: true });
  }, H.$apis.requireAuth("users"));
}
