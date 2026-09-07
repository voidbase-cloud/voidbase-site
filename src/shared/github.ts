// The template marketplace behind the /cloud page: connect a GitHub account (OAuth app, GH_OAUTH_CLIENT_ID /
// _SECRET), list templates (vb_templates: GitHub template repositories, the first is voidbase-cloud/voidbase-site),
// create a repository from a template in the visitor's GitHub account and wire it to one of their voidbase
// instances by writing the instance URL as a repository Actions variable, and list the repositories linked that way
// (checked live against GitHub). Existing repositories can be linked the same way, and the site's own repository
// (VB_SITE_REPO) is listed to admins as a `system` row wired to the site's own backend: this site dogfoods itself.
// Tokens are sealed at rest like the Cloudflare ones. Everything is plain fetch, so it runs on Bun and on Workers.
import type { Context } from "hono";
import { pb, type HookRecord } from "./pb";
import { ghCfg } from "./config";
import { open } from "./secrets";

export const callbackUrl = (c: Context) => new URL(c.req.raw.url).origin + "/api/vbcloud/github/callback";

// ---- GitHub API with the visitor's token ---------------------------------------------------------------------
interface GhError { status: number; message: string }
export async function gh<T>(token: string, method: string, path: string, body?: unknown, tolerate: number[] = []): Promise<{ status: number; data: T }> {
  const res = await fetch(ghCfg().api + path, { method, headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "voidbase-cloud", ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); let data: unknown = null; try { data = text ? JSON.parse(text) : null; } catch { data = { message: text.slice(0, 200) }; }
  if (!res.ok && !tolerate.includes(res.status)) { const err: GhError = { status: res.status, message: `GitHub ${method} ${path}: ${res.status} ${(data as { message?: string } | null)?.message ?? ""}`.trim() }; throw Object.assign(new Error(err.message), err); }
  return { status: res.status, data: data as T };
}
export async function ghConnectionFor(uid: string): Promise<{ conn: HookRecord; token: string }> {
  let conn: HookRecord; try { conn = await pb.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: uid }); } catch { throw new pb.BadRequestError("Connect your GitHub account first."); }
  const token = await open(conn.getString("access_token"));
  if (!token) throw new pb.BadRequestError("Your GitHub connection has no token: connect GitHub again.");
  return { conn, token };
}
export const ghConnectionJSON = (c: HookRecord | null) => c ? { login: c.getString("login"), name: c.getString("name"), avatarUrl: c.getString("avatar_url"), scopes: c.getString("scopes"), connected: String(c.get("created") ?? "") } : null;

// ---- templates: GitHub template repositories registered in vb_templates (superusers add more from the panel) ----
/** The first template, this site. Seeded once the collection exists: a migration cannot see one it just created. */
export async function seedTemplate(): Promise<void> {
  const existing = (await pb.$app.findRecordsByFilter("vb_templates", "name = 'voidbase-site'", "", 1, 0)) as HookRecord[];
  if (existing.length) return;
  const t = new pb.Record(pb.$app.findCollectionByNameOrId("vb_templates"));
  t.set("name", "voidbase-site"); t.set("repo", "voidbase-cloud/voidbase-site"); t.set("title", "voidbase site"); t.set("kind", "site");
  t.set("description", "This site: SvelteKit on GitHub Pages with docs, FAQ and the cloud control plane in vb/. The Pages workflow reads the backend URL and the custom domain from repository variables.");
  t.set("url", "https://github.com/voidbase-cloud/voidbase-site");
  t.set("variables", [{ name: "PB_VB_URL", source: "instance_url" }, { name: "PAGES_CNAME", source: "input:domain" }]);
  await pb.$app.save(t); console.log("vbcloud: template voidbase-site registered");
}

/** The site's own repository as a system row of vb_repos, wired to the system instance (this backend). Idempotent. */
export async function ensureSiteRepo(): Promise<void> {
  const c = ghCfg(); if (!c.siteRepo || !c.worker) return;
  if ((await pb.$app.findRecordsByFilter("vb_repos", "full_name = {:f}", "", 1, 0, { f: c.siteRepo }) as HookRecord[]).length) return;
  let self: HookRecord; try { self = await pb.$app.findFirstRecordByFilter("vb_instances", "system = true && name = {:n}", { n: c.worker }); } catch { return; }
  let tpl: HookRecord | null = null; try { tpl = await pb.$app.findFirstRecordByFilter("vb_templates", "repo = {:r}", { r: c.siteRepo }); } catch { tpl = null; }
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_repos"));
  row.set("system", true); row.set("instance", self.id); row.set("template", tpl?.id ?? ""); row.set("full_name", c.siteRepo); row.set("html_url", `https://github.com/${c.siteRepo}`); row.set("private", false); row.set("status", "ready");
  await pb.$app.save(row); console.log(`vbcloud: site repository ${c.siteRepo} registered against ${c.worker}`);
}
export const templateJSON = (t: HookRecord) => ({ id: t.id, name: t.getString("name"), repo: t.getString("repo"), title: t.getString("title"), description: t.getString("description"), url: t.getString("url"), kind: t.getString("kind"), variables: (() => { const v = t.get("variables"); return Array.isArray(v) ? v : typeof v === "string" ? JSON.parse(v || "[]") : []; })() as { name: string; source: string; value?: string }[] });

// ---- repositories created from a template and wired to an instance ---------------------------------------------
export const repoJSON = (r: HookRecord, extra: Record<string, unknown> = {}) => ({ id: r.id, system: r.getBool("system"), canUnlink: !r.getBool("system"), fullName: r.getString("full_name"), htmlUrl: r.getString("html_url"), defaultBranch: r.getString("default_branch"), private: r.getBool("private"), status: r.getString("status"), error: r.getString("error"), template: r.getString("template"), instance: r.getString("instance"), created: String(r.get("created") ?? ""), ...extra });
/** What a template's declared Actions variable resolves to for the instance it is being wired to. */
export const varValue = (source: string, inst: HookRecord, input: Record<string, unknown>, literal?: string): string => {
  if (source === "instance_url") return inst.getString("url");
  if (source === "instance_panel") return inst.getString("url") ? `${inst.getString("url")}/_/` : "";
  if (source === "instance_name") return inst.getString("name");
  if (source.startsWith("input:")) return String(input[source.slice(6)] ?? "").trim();
  return literal ?? "";
};
export const alreadyLinked = async (fullName: string) => (await pb.$app.findRecordsByFilter("vb_repos", "full_name = {:f}", "", 1, 0, { f: fullName }) as HookRecord[]).length > 0;
export async function setVariable(token: string, fullName: string, name: string, value: string) {
  const r = await gh(token, "POST", `/repos/${fullName}/actions/variables`, { name, value }, [409]);
  if (r.status === 409) await gh(token, "PATCH", `/repos/${fullName}/actions/variables/${name}`, { name, value });
}
