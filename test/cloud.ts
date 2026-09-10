// End-to-end test of voidbase.cloud on the Bun runtime, against voidbase's mocks. The site keeps sign-in, sealed
// tokens, rows and two pass-throughs; the work is done by the browser client (src/lib/cloud.ts), which this test
// drives the way the page does, against:
// test/mock-oidc.ts (a Cloudflare-shaped OAuth client: userinfo = {sub}, access token = the cf-mock bearer) and
// test/cf-mock.ts (the Cloudflare REST API). Boots `bun main.ts` on a temporary data directory.
//   bun test/cloud.ts
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { assetHash, contentTypeFor, type ReleaseManifest } from "@voidbase-cloud/voidbase/cloud";
import { CloudClient, CloudError, type Instance } from "../src/lib/cloud";
const VOIDBASE = resolve(import.meta.dir, "../node_modules/@voidbase-cloud/voidbase");
// The npm package ships no test/; the mocks come from a sibling voidbase checkout when the package lacks them.
const MOCKS = [`${VOIDBASE}/test`, resolve(import.meta.dir, "../../voidbase/test")].find((d) => existsSync(`${d}/cf-mock.ts`)) ?? `${VOIDBASE}/test`;
const freePort = () => { const s = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => new Response() }); const p = s.port; s.stop(true); return p; };
const OIDC_PORT = freePort(), CF_PORT = freePort(), VB_PORT = freePort(), GH_PORT = freePort();
const OIDC = `http://127.0.0.1:${OIDC_PORT}`, CF = `http://127.0.0.1:${CF_PORT}`, VB = `http://127.0.0.1:${VB_PORT}`, GH = `http://127.0.0.1:${GH_PORT}`;
let pass = 0, fail = 0; const check = (l: string, ok: boolean, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${l}${ok ? "" : "  " + d}`); };
const waitFor = async (url: string, tries = 100) => { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not up */ } await Bun.sleep(150); } throw new Error(`${url} did not come up`); };
const data = mkdtempSync(join(tmpdir(), "vb-cloud-")); mkdirSync(`${data}/pb_data`, { recursive: true });
const procs: ReturnType<typeof Bun.spawn>[] = [];
procs.push(Bun.spawn(["bun", `${MOCKS}/mock-oidc.ts`, String(OIDC_PORT)], { stdout: "ignore", stderr: "inherit" }));
procs.push(Bun.spawn(["bun", `${MOCKS}/cf-mock.ts`, String(CF_PORT)], { stdout: "ignore", stderr: "inherit" }));
procs.push(Bun.spawn(["bun", resolve(import.meta.dir, "gh-mock.ts"), String(GH_PORT)], { stdout: "ignore", stderr: "inherit" }));
const env = {
  ...process.env, VOIDBASE_SUPERUSER_EMAIL: "root@example.com", VOIDBASE_SUPERUSER_PASSWORD: "root-password-1", VOIDBASE_USER_EMAIL: "", VOIDBASE_USER_PASSWORD: "",
  CF_OAUTH_CLIENT_ID: "cf-test-client", CF_OAUTH_CLIENT_SECRET: "cf-s3cret", CF_OAUTH_AUTH_URL: `${OIDC}/authorize`, CF_OAUTH_TOKEN_URL: `${OIDC}/token`, CF_OAUTH_USERINFO_URL: `${OIDC}/userinfo`,
  CLOUDFLARE_API_BASE: CF, VOIDBASE_WORKER_NAME: "voidbase-site", VOIDBASE_ACCOUNT_ID: "acc123", VB_ADMIN_EMAILS: "owner@example.com", VB_INSTANCE_PREFIX: "vb-", VB_MAX_INSTANCES_PER_USER: "2",
  VOIDBASE_LOG_MIN_LEVEL: "8",
  VOIDBASE_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef", VB_ALLOW_SELF_DELETE: "1",
  VOIDBASE_HOOKS_DIR: resolve(import.meta.dir, "../.voidbase/pb_hooks"), VOIDBASE_MIGRATIONS_DIR: resolve(import.meta.dir, "../.voidbase/pb_migrations"),
  GH_OAUTH_CLIENT_ID: "gh-test-client", GH_OAUTH_CLIENT_SECRET: "gh-s3cret", GITHUB_API_BASE: GH, GITHUB_OAUTH_BASE: GH, VB_SITE_URL: "http://site.test",
  VB_GH_TOKEN: "gh-test-token", VB_SYSTEM_PROJECTS: "voidbase-cloud/voidbase-demo=voidbase-demo@http://demo.test",
};
// the app under test is the generated one: `bun run build` (or `voidbase adapt`) writes .voidbase/main.ts
const server = Bun.spawn(["bun", resolve(import.meta.dir, "../.voidbase/main.ts"), "--http", `127.0.0.1:${VB_PORT}`, "--dir", `${data}/pb_data`], { cwd: resolve(import.meta.dir, "../.voidbase"), env, stdout: "pipe", stderr: "pipe" });
procs.push(server);
const serverLog: string[] = []; for (const stream of [server.stdout, server.stderr]) (async () => { const r = (stream as ReadableStream<Uint8Array>).getReader(); const dec = new TextDecoder(); for (;;) { const { value, done } = await r.read(); if (done) break; serverLog.push(dec.decode(value)); } })();
const api = async (method: string, path: string, body?: unknown, token?: string, raw?: BodyInit) => { const r = await fetch(`${VB}${path}`, { method, headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { authorization: token } : {}) }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) }); const text = await r.text(); let json: Record<string, any> = {}; try { json = JSON.parse(text); } catch { json = { raw: text }; } return { status: r.status, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
const cfState = async () => (await fetch(`${CF}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// a release: the real one from `voidbase bundle` when it exists, else a tiny fake
const fake = mkdtempSync(join(tmpdir(), "vb-fake-release-"));
function fakeRelease(): string {
  const put = (rel: string, content: string | Uint8Array) => { mkdirSync(resolve(fake, rel, ".."), { recursive: true }); writeFileSync(resolve(fake, rel), content); };
  put("worker/index.js", "export default { fetch() { return new Response('ok') } }"); put("worker/assets/app.js", "export const x = 1;");
  const assets = [["_/index.html", "<!doctype html><title>panel</title>"], ["404.html", "<h1>404</h1>"]] as const;
  const m: ReleaseManifest = { version: "0.1.0-e2e", voidbase: "0.1.0", builtAt: new Date().toISOString(), compatibilityDate: "2026-09-05", compatibilityFlags: ["nodejs_compat"], mainModule: "index.js", modules: [{ path: "index.js", type: "esm", size: 1 }, { path: "assets/app.js", type: "esm", size: 1 }], assets: [], migrations: [{ name: "0000_init.sql", size: 1 }], crons: ["0 * * * *"], durableObjects: [{ binding: "HUB", className: "VoidbaseHub", tag: "voidbase-hub-v1" }], queueBinding: "QUEUE_JOBS", assetsConfig: { not_found_handling: "404-page" } };
  return (async () => { for (const [path, body] of assets) { put(`assets/${path}`, body); m.assets.push({ path, size: body.length, hash: await assetHash(new TextEncoder().encode(body)), contentType: contentTypeFor(path) }); } put("migrations/0000_init.sql", "CREATE TABLE a (id TEXT);"); put("manifest.json", JSON.stringify(m)); return fake; })() as unknown as string;
}
const walk = (dir: string, base = dir): string[] => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? walk(f, base) : [f.slice(base.length + 1)]; });

try {
  await waitFor(`${OIDC}/userinfo`); await waitFor(`${CF}/__calls`); await waitFor(`${GH}/__state`); await waitFor(`${VB}/api/health`);
  const su = await api("POST", "/api/collections/_superusers/auth-with-password", { identity: "root@example.com", password: "root-password-1" });
  check("superuser login", su.status === 200, JSON.stringify(su.json)); const SU = String(su.json.token);

  // releases
  const noRelease = await api("GET", "/api/vbcloud/release", undefined, SU);
  check("no release yet", noRelease.status === 200 && noRelease.json.current === null, JSON.stringify(noRelease.json));
  const releaseDir = existsSync(`${VOIDBASE}/.cloud/releases/dev/manifest.json`) ? `${VOIDBASE}/.cloud/releases/dev` : await (fakeRelease() as unknown as Promise<string>);
  const manifest = JSON.parse(await Bun.file(`${releaseDir}/manifest.json`).text()) as ReleaseManifest;
  const files = walk(releaseDir).filter((f) => f !== "manifest.json"); files.push("manifest.json");
  const anon = await api("POST", `/api/vbcloud/releases/${manifest.version}/files?path=manifest.json`, undefined, undefined, "x");
  check("release upload needs a superuser", anon.status === 401, String(anon.status));
  let pushed = 0; for (const f of files) { const r = await fetch(`${VB}/api/vbcloud/releases/${manifest.version}/files?path=${encodeURIComponent(f)}`, { method: "POST", headers: { authorization: SU, "content-type": "application/octet-stream" }, body: await Bun.file(resolve(releaseDir, f)).arrayBuffer() }); if (r.ok) pushed++; else console.log("push failed", f, r.status, await r.text()); }
  check(`release files pushed (${manifest.version}, ${files.length} files)`, pushed === files.length, `${pushed}/${files.length}`);
  const activate = await api("POST", `/api/vbcloud/releases/${manifest.version}/activate`, undefined, SU);
  const listed = await api("GET", "/api/vbcloud/releases", undefined, SU);
  check("release activated and listed", activate.status === 200 && activate.json.current === manifest.version && listed.json.current === manifest.version && listed.json.releases[0].version === manifest.version, JSON.stringify([activate.json, listed.json]));
  const traversal = await api("POST", `/api/vbcloud/releases/x/files?path=../etc`, undefined, SU, "x");
  check("path traversal refused", traversal.status === 400);

  // sign in with Cloudflare (headless: the mock authorize redirects straight back with a code)
  const methods = await api("GET", "/api/collections/users/auth-methods");
  const provider = (methods.json.oauth2?.providers ?? []).find((p: Record<string, string>) => p.name === "cloudflare") as Record<string, string> | undefined;
  check("auth-methods lists the cloudflare provider with the configured scopes", !!provider && provider.displayName === "Cloudflare" && decodeURIComponent(provider.authURL).includes("workers-scripts.write") && provider.authURL.startsWith(`${OIDC}/authorize`), JSON.stringify(methods.json.oauth2));
  const redirectURL = `${VB}/api/oauth2-redirect`;
  const authz = await fetch(provider!.authURL + encodeURIComponent(redirectURL), { redirect: "manual" });
  const code = new URL(authz.headers.get("location")!).searchParams.get("code")!;
  const login = await api("POST", "/api/collections/users/auth-with-oauth2", { provider: "cloudflare", code, codeVerifier: provider!.codeVerifier, redirectURL, createData: {} });
  check("login creates the user from Cloudflare's /user (email, name)", login.status === 200 && login.json.record?.email === "owner@example.com" && login.json.record?.name === "Test Owner" && login.json.meta?.accessToken === "cf-test-token", JSON.stringify(login.json.record));
  const U = String(login.json.token);
  const me = await api("GET", "/api/vbcloud/me", undefined, U);
  check("me: connected, granted accounts stored, admin by email, self worker known", me.json.connected === true && me.json.connection?.accounts?.[0]?.id === "acc123" && me.json.admin === true && me.json.self?.worker === "voidbase-site" && me.json.providerConfigured === true, JSON.stringify(me.json));
  const meAnon = await api("GET", "/api/vbcloud/me");
  check("me needs auth", meAnon.status === 401);

  // ---- the browser client, as the page holds it: the site's URL and the user's session
  const client = new CloudClient(VB, () => U);
  const uid = String(login.json.record?.id);
  const list0 = await api("GET", "/api/vbcloud/instances", undefined, U);
  const self0 = (list0.json.instances ?? []).find((i: Record<string, unknown>) => i.self);
  check("the site's own backend is listed as the system instance", !!self0 && self0.system === true && self0.url === VB && self0.status === "live", JSON.stringify(list0.json).slice(0, 300));

  // ---- the pass-throughs: the user's own tokens stay on the site, the browser calls through
  const cfAnon = await api("GET", "/api/vbcloud/cf/accounts");
  const cfOut = await api("GET", "/api/vbcloud/cf/client/v4/whatever", undefined, U);
  const cfAccounts = await api("GET", "/api/vbcloud/cf/accounts", undefined, U);
  check("the Cloudflare pass-through: sign-in required, only account/zone/user paths, Cloudflare's own answer", cfAnon.status === 401 && cfOut.status === 400 && cfAccounts.status === 200 && cfAccounts.json.success === true && cfAccounts.json.result?.[0]?.id === "acc123", JSON.stringify([cfAnon.status, cfOut.status, cfAccounts.json]).slice(0, 200));
  const ghEarly = await api("GET", "/api/vbcloud/gh/user", undefined, U);
  check("the GitHub pass-through needs a GitHub connection first", ghEarly.status === 400 && /Connect your GitHub/.test(ghEarly.json.message ?? ""), JSON.stringify(ghEarly.json));

  // ---- instances: provisioned by the browser in the user's account, the row written through the rules
  const suRow = await api("POST", "/api/collections/vb_instances/records", { owner: uid, name: "vb-sys", account_id: "acc123", status: "live", system: true }, U);
  check("the rules: a user cannot write a system row", suRow.status === 400 || suRow.status === 403, String(suRow.status));
  let created: Awaited<ReturnType<CloudClient["createInstance"]>>;
  try { created = await client.createInstance({ name: "My Shop", account: { id: "acc123", name: "Test Account" }, owner: uid, superuserEmail: "owner@example.com", prefix: "vb-" }); }
  catch (e) { throw new Error(`createInstance: ${e instanceof Error ? e.message : e} ${e instanceof CloudError ? e.log.join(" | ") : ""}`); }
  const inst = created.instance;
  check("one click, from the browser: instance provisioned on the user's account, row live", inst.name === "vb-my-shop" && inst.status === "live" && inst.url === "https://vb-my-shop.testsub.workers.dev" && inst.release === manifest.version, JSON.stringify(inst));
  const st = await cfState();
  const script = st.scripts["vb-my-shop"];
  check("cloudflare: worker with all modules, assets, per-instance D1/R2/queue, owner tag", !!script && script.modules.length === manifest.modules.length && st.uploadedHashes.length === new Set(manifest.assets.map((a) => a.hash)).size && st.d1.some((d: string[] | { name: string }) => JSON.stringify(d).includes("vb-my-shop-db")) && JSON.stringify(script.metadata.tags ?? script.tags ?? []).includes(`vbcloud-owner:${uid}`), JSON.stringify({ script: !!script, d1: st.d1 }).slice(0, 300));
  check("the superuser password comes back once, with the creation, and went to the worker as a secret", created.credentials.superuserEmail === "owner@example.com" && String(created.credentials.superuserPassword).length === 24 && (script?.metadata.bindings as { name: string; text?: string }[]).find((b) => b.name === "VOIDBASE_SUPERUSER_PASSWORD")?.text === created.credentials.superuserPassword, JSON.stringify(created.credentials));
  const listed1 = await api("GET", "/api/vbcloud/instances", undefined, U);
  const row1 = (listed1.json.instances ?? []).find((i: Record<string, unknown>) => i.id === inst.id);
  check("the site lists the row the browser wrote, with the owner's rights", !!row1 && row1.canDelete === true && row1.canLink === true && row1.superuserEmail === "owner@example.com", JSON.stringify(row1));
  const viaSdk = await api("GET", "/api/collections/vb_instances/records", undefined, U);
  check("the collection lists only the owner's rows, never a password", viaSdk.status === 200 && viaSdk.json.totalItems === 1 && viaSdk.json.items.every((i: Record<string, unknown>) => i.superuser_password === undefined), JSON.stringify(viaSdk.json).slice(0, 200));
  const notMine = await api("PATCH", `/api/collections/vb_instances/records/${inst.id}`, { owner: "somebody-else" }, U);
  check("the rules: the owner cannot hand a row to somebody else", notMine.status === 400 || notMine.status === 403, String(notMine.status));
  const dupName = await client.createInstance({ name: "my-shop", account: { id: "acc123" }, owner: uid, superuserEmail: "owner@example.com" }).then(() => "made", (e) => (e instanceof Error ? e.message : String(e)));
  check("a Worker that exists on the account is not created twice", /already exists/.test(String(dupName)), String(dupName));

  // ---- upgrade, from the browser: a second release, the same instance, secrets inherited
  const v2 = `${manifest.version}-next`;
  { const m2 = { ...manifest, version: v2 }; let n = 0; for (const f of files) { const body = f === "manifest.json" ? new TextEncoder().encode(JSON.stringify(m2)) : new Uint8Array(await Bun.file(`${releaseDir}/${f}`).arrayBuffer()); const r = await fetch(`${VB}/api/vbcloud/releases/${v2}/files?path=${encodeURIComponent(f)}`, { method: "POST", headers: { authorization: SU, "content-type": "application/octet-stream" }, body }); if (r.ok) n++; } await api("POST", `/api/vbcloud/releases/${v2}/activate`, undefined, SU); check(`a second release is pushed and activated (${n} files)`, n === files.length); }
  const putsOf = async () => (((await (await fetch(`${CF}/__calls`)).json()) as string[]).filter((c) => /^PUT \/accounts\/acc123\/workers\/scripts\/vb-my-shop$/.test(c)).length);
  const uploadsBefore = await putsOf();
  const up = await client.upgradeInstance(inst);
  const uploadsAfter = await putsOf();
  const upRow = (await api("GET", `/api/collections/vb_instances/records/${inst.id}`, undefined, U)).json;
  check("upgrade: the same worker uploaded again from the new release, the row moved, secrets inherited", up.upgraded === true && up.from === manifest.version && up.to === v2 && uploadsAfter === uploadsBefore + 1 && upRow.release === v2 && upRow.status === "live", JSON.stringify({ up: up.upgraded, uploadsBefore, uploadsAfter, release: upRow.release, status: upRow.status }));
  const again = await client.upgradeInstance({ ...inst, release: v2 });
  check("already on it: nothing uploaded", again.upgraded === false, JSON.stringify(again));
  const sysUp = await client.upgradeInstance({ ...(self0 as Instance), system: true }).then(() => "did", (e) => (e instanceof Error ? e.message : String(e)));
  check("a system instance is never re-provisioned from here", /deployed from its repository/.test(String(sysUp)), String(sysUp));

  // ---- plugins: the instance's own installer, with a session minted on the instance itself
  const calls: { path: string; auth: string; body: unknown }[] = [];
  const instance = Bun.serve({ port: 0, hostname: "127.0.0.1", async fetch(req) {
    const p = new URL(req.url).pathname; const auth = req.headers.get("authorization") ?? "";
    if (p === "/api/collections/_superusers/auth-with-password") { const b = (await req.json()) as { identity: string; password: string }; return b.password === created.credentials.superuserPassword ? Response.json({ token: "inst-session" }) : Response.json({ message: "Failed to authenticate." }, { status: 400 }); }
    if (auth !== "inst-session") return Response.json({ message: "The request requires valid record authorization token." }, { status: 401 });
    if (p === "/api/plugins") return Response.json({ names: ["auth", "realtime", "hardening", "backups", "installer", "echo"], origins: { auth: "shipped", realtime: "shipped", hardening: "shipped", backups: "shipped", installer: "shipped", echo: "http://market.test 0.1.0" }, disabled: [], installer: { mode: "repository", repository: "octo-tester/existing", branch: "master" } });
    if (p === "/api/plugins/available") return Response.json({ installer: { mode: "repository" }, available: [{ marketplace: "https://marketplace.voidbase.cloud", plugins: [{ name: "echo", title: "Echo", summary: "x", latest: "0.2.0" }] }] });
    const body = await req.json().catch(() => null); calls.push({ path: p, auth, body });
    if (p === "/api/plugins/install") return Response.json({ applied: "repository", committed: { sha: "abc", url: "https://github.example/octo-tester/existing/commit/abc" }, message: "Committed." });
    if (p === "/api/plugins/remove" || p === "/api/plugins/update") return Response.json({ applied: "repository", message: "Committed." });
    return Response.json({ message: "no" }, { status: 404 });
  } });
  const instUrl = `http://127.0.0.1:${instance.port}`;
  await api("PATCH", `/api/collections/vb_instances/records/${inst.id}`, { url: instUrl }, U);
  const reachable = { ...inst, url: instUrl };
  const badSession = await client.instanceSession(reachable, "owner@example.com", "wrong").then(() => "ok", (e) => (e instanceof Error ? e.message : String(e)));
  const session = await client.instanceSession(reachable, "owner@example.com", created.credentials.superuserPassword!);
  check("the owner signs in to the instance from the browser; a wrong password is the instance's refusal", session === "inst-session" && /Failed to authenticate/.test(String(badSession)), String(badSession));
  const plugins = client.plugins(reachable, session);
  const running = await plugins.running(); const available = await plugins.available();
  check("the instance says what runs and where its plugins live; the marketplace's list comes through the instance", running.installer.mode === "repository" && running.origins.echo.startsWith("http://market.test") && available.available[0]?.plugins[0]?.name === "echo", JSON.stringify(running).slice(0, 200));
  const installed = await plugins.install("echo", { marketplace: "https://marketplace.voidbase.cloud" }); await plugins.remove("echo"); await plugins.update();
  check("install, remove and update reach the instance with the instance's own session, and the instance answers with its commit", calls.length === 3 && calls.every((c) => c.auth === "inst-session") && (calls[0]!.body as { name: string }).name === "echo" && (installed.committed as { sha: string }).sha === "abc", JSON.stringify(calls));
  instance.stop(true);
  await api("PATCH", `/api/collections/vb_instances/records/${inst.id}`, { url: inst.url }, U);

  // ---- sealed at rest
  {
    const { Database } = await import("bun:sqlite");
    const db = new Database(`${data}/pb_data/data.db`, { readonly: true });
    const rows = db.query("SELECT access_token, refresh_token FROM cf_connections").all() as { access_token: string; refresh_token: string }[];
    db.close();
    check("cloudflare tokens are sealed at rest (enc: prefix, not the bearer)", rows.length === 1 && rows[0]!.access_token.startsWith("enc:") && !rows[0]!.access_token.includes("cf-test-token") && rows[0]!.refresh_token.startsWith("enc:"), JSON.stringify(rows).slice(0, 120));
  }

  // ---- GitHub: connect on the site; repositories created, linked and unlinked from the browser
  const gh0 = await api("GET", "/api/vbcloud/github", undefined, U);
  check("github: configured, not connected yet", gh0.status === 200 && gh0.json.configured === true && gh0.json.connected === false, JSON.stringify(gh0.json));
  const tplAnon = await api("GET", "/api/vbcloud/templates");
  const tpl = await api("GET", "/api/vbcloud/templates", undefined, U);
  const siteTpl = tpl.json.templates?.[0];
  check("templates: auth required, the site template is registered with its variables", tplAnon.status === 401 && tpl.status === 200 && siteTpl?.name === "voidbase-site" && siteTpl.variables?.some((v: { name: string }) => v.name === "PB_VB_URL"), JSON.stringify(tpl.json).slice(0, 200));
  const connect = await api("GET", "/api/vbcloud/github/connect", undefined, U);
  check("connect returns GitHub's authorize url with our callback, scopes and a signed state", connect.status === 200 && String(connect.json.url).startsWith(`${GH}/login/oauth/authorize`) && decodeURIComponent(String(connect.json.url)).includes("/api/vbcloud/github/callback") && /state=/.test(String(connect.json.url)), JSON.stringify(connect.json));
  const ghAuthz = await fetch(connect.json.url, { redirect: "manual" }); const cb = ghAuthz.headers.get("location")!;
  const done = await fetch(cb, { redirect: "manual" });
  check("callback exchanges the code, stores the connection and sends the browser back to the site", done.status === 302 && done.headers.get("location") === "http://site.test/cloud?github=connected", `${done.status} ${done.headers.get("location")}`);
  const tampered = await fetch(cb.replace(/state=([^&]+)/, (m, st) => "state=" + st.replace(/\.(.)/, ".x")), { redirect: "manual" });
  check("a tampered state is refused", /github=error&message=invalid\+state|invalid%20state/.test(tampered.headers.get("location") ?? ""), tampered.headers.get("location") ?? "");
  const gh1 = await api("GET", "/api/vbcloud/github", undefined, U);
  check("github: connected as the mock account", gh1.json.connected === true && gh1.json.connection?.login === "octo-tester", JSON.stringify(gh1.json));
  {
    const { Database } = await import("bun:sqlite");
    const db = new Database(`${data}/pb_data/data.db`, { readonly: true });
    const rows = db.query("SELECT access_token FROM gh_connections").all() as { access_token: string }[]; db.close();
    check("the GitHub token is sealed at rest", rows.length === 1 && rows[0]!.access_token.startsWith("enc:") && !rows[0]!.access_token.includes("gh-test-token"), JSON.stringify(rows).slice(0, 80));
  }
  const ghUser = await api("GET", "/api/vbcloud/gh/user", undefined, U);
  check("the GitHub pass-through answers with the user's connection", ghUser.status === 200 && ghUser.json.login === "octo-tester", JSON.stringify(ghUser.json));
  const mk = await client.createRepo({ template: siteTpl, name: "My Site!", private: true, instance: inst, user: uid, inputs: { domain: "site.example.com" } });
  const ghs = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("repository generated from the template in the user's account, private, from the right template", mk.repo.fullName === "octo-tester/my-site" && mk.repo.status === "ready" && ghs.repos["octo-tester/my-site"]?.private === true && ghs.repos["octo-tester/my-site"]?.template === "voidbase-cloud/voidbase-site", JSON.stringify(mk.repo));
  check("the instance url and the domain were written as repository variables", ghs.variables["octo-tester/my-site"]?.PB_VB_URL === inst.url && ghs.variables["octo-tester/my-site"]?.PAGES_CNAME === "site.example.com", JSON.stringify(ghs.variables));
  const wiredScript = (await cfState()).scripts["vb-my-shop"];
  check("the instance's Worker was wired: repository, branch and the user's GitHub token as its secrets", ["VOIDBASE_PROJECT_REPO", "VOIDBASE_PROJECT_BRANCH", "VOIDBASE_GH_TOKEN"].every((k) => (wiredScript?.secrets ?? []).includes(k)) && mk.wired.length === 3, JSON.stringify(wiredScript?.secrets));
  const dupRepo = await client.createRepo({ template: siteTpl, name: "my-site", instance: inst, user: uid }).then(() => "made", (e) => (e instanceof Error ? e.message : String(e)));
  check("the same repository cannot be created twice", /already exists|Name already/.test(String(dupRepo)), String(dupRepo));
  const repos = await api("GET", "/api/vbcloud/repos", undefined, U);
  const r0 = repos.json.repos?.[0];
  check("repos: the row the browser wrote is listed with its instance and template", repos.status === 200 && r0?.fullName === "octo-tester/my-site" && r0.instanceName === "vb-my-shop" && r0.templateName === "voidbase-site", JSON.stringify(repos.json).slice(0, 300));
  const live = await client.checkRepo(r0, inst);
  check("the browser asks GitHub about the repository: it exists and points at the instance", live.exists && live.connected && live.backendUrl === inst.url, JSON.stringify(live));
  await client.unlinkRepo(r0, inst);
  const ghs2 = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const unwiredScript = (await cfState()).scripts["vb-my-shop"];
  const reposAfter = ((await api("GET", "/api/vbcloud/repos", undefined, U)).json.repos as { system?: boolean }[]).filter((r) => !r.system);
  check("unlink removes the row and the wiring, and leaves the repository on GitHub", "octo-tester/my-site" in ghs2.repos && reposAfter.length === 0 && !(unwiredScript?.secrets ?? []).includes("VOIDBASE_GH_TOKEN"), JSON.stringify({ onGitHub: "octo-tester/my-site" in ghs2.repos, rows: reposAfter.length, secrets: unwiredScript?.secrets }));
  await fetch(`${GH}/__seed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "octo-tester/existing", private: true }) });
  const missing = await client.linkRepo({ fullName: "octo-tester/nope", instance: inst, user: uid }).then(() => "linked", (e) => (e instanceof Error ? e.message : String(e)));
  check("linking a repository GitHub does not know is refused", /not found on GitHub/.test(String(missing)), String(missing));
  const linked = await client.linkRepo({ fullName: "https://github.com/Octo-Tester/existing.git", instance: inst, user: uid });
  const ghsL = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("an existing repository (given as a URL) is linked: PB_VB_URL written, private flag read from GitHub, wired", linked.repo.fullName === "octo-tester/existing" && linked.repo.private === true && ghsL.variables["octo-tester/existing"]?.PB_VB_URL === inst.url && linked.wired.length === 3, JSON.stringify(linked));
  const relink = await client.linkRepo({ fullName: "octo-tester/existing", instance: inst, user: uid }).then(() => "linked", (e) => (e instanceof Error ? e.message : String(e)));
  check("a linked repository cannot be linked twice (the unique name)", /already|unique|failed/i.test(String(relink)), String(relink));

  // ---- the system rows: the site's own repository, the demo project; admins see them, nobody writes them from here
  await fetch(`${GH}/__seed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "voidbase-cloud/voidbase-site", variables: { PB_VB_URL: VB } }) });
  await fetch(`${GH}/__seed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "voidbase-cloud/voidbase-demo" }) });
  const sysList = await api("GET", "/api/vbcloud/instances", undefined, U);
  const demo = (sysList.json.instances ?? []).find((i: Record<string, unknown>) => i.name === "voidbase-demo");
  const dog = await api("GET", "/api/vbcloud/repos", undefined, U);
  const site = (dog.json.repos ?? []).find((r: Record<string, unknown>) => r.fullName === "voidbase-cloud/voidbase-site");
  const demoRepo = (dog.json.repos ?? []).find((r: Record<string, unknown>) => r.fullName === "voidbase-cloud/voidbase-demo");
  check("the admin sees the site's own repository and the demo project as system rows wired to their instances", !!site && site.system === true && site.canUnlink === false && site.instanceName === "voidbase-site" && !!demo && demo.system === true && demo.url === "http://demo.test" && !!demoRepo && demoRepo.instanceName === "voidbase-demo", JSON.stringify({ site, demo, demoRepo }).slice(0, 300));
  const noUnlink = await client.unlinkRepo(site, null).then(() => "unlinked", (e) => (e instanceof Error ? e.message : String(e)));
  const noSysDelete = await api("DELETE", `/api/collections/vb_repos/records/${site?.id}`, undefined, U);
  check("a system repository cannot be unlinked, from the client or through the rules", /stays linked/.test(String(noUnlink)) && (noSysDelete.status === 403 || noSysDelete.status === 404), `${noUnlink} ${noSysDelete.status}`);
  const noSelfDelete = await client.deleteInstance({ ...(self0 as Instance), system: true }).then(() => "deleted", (e) => (e instanceof Error ? e.message : String(e)));
  check("a system instance is not deleted from the browser", /not deleted from here/.test(String(noSelfDelete)), String(noSelfDelete));
  const disc = await api("DELETE", "/api/vbcloud/github", undefined, U);
  const ghs3 = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("disconnect removes the connection and revokes the grant on GitHub", disc.json.disconnected === true && ghs3.grantRevoked === 1 && (await api("GET", "/api/vbcloud/github", undefined, U)).json.connected === false, JSON.stringify(disc.json));

  // ---- delete, from the browser: everything of the instance goes, then the row
  const del = await client.deleteInstance(inst);
  const st2 = await cfState();
  check("one click delete: worker, D1, bucket and queue gone, row removed", del.deleted.length >= 3 && !st2.scripts["vb-my-shop"] && (await api("GET", `/api/collections/vb_instances/records/${inst.id}`, undefined, U)).status === 404, JSON.stringify(del));
  const delAgain = await client.deleteInstance(inst).then(() => "deleted", (e) => (e instanceof Error ? e.message : String(e)));
  check("deleting a removed instance is refused", /404|not found|wasn't found/i.test(String(delAgain)), String(delAgain));
} catch (e) { fail++; console.log("FAIL  unexpected error", e); console.log(serverLog.join("").slice(-3000)); }
finally { for (const p of procs) p.kill(); rmSync(data, { recursive: true, force: true }); rmSync(fake, { recursive: true, force: true }); }
if (fail) console.log("--- server log tail ---\n" + serverLog.join("").slice(-4000));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
