// End-to-end test of the voidbase cloud control plane on the Bun runtime, against voidbase's mocks:
// test/mock-oidc.ts (a Cloudflare-shaped OAuth client: userinfo = {sub}, access token = the cf-mock bearer) and
// test/cf-mock.ts (the Cloudflare REST API). Boots `bun main.ts` on a temporary data directory.
//   bun test/cloud.ts
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { assetHash, contentTypeFor, type ReleaseManifest } from "@voidbase-cloud/voidbase/cloud";
const VOIDBASE = resolve(import.meta.dir, "../node_modules/@voidbase-cloud/voidbase");
const freePort = () => { const s = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => new Response() }); const p = s.port; s.stop(true); return p; };
const OIDC_PORT = freePort(), CF_PORT = freePort(), VB_PORT = freePort(), GH_PORT = freePort();
const OIDC = `http://127.0.0.1:${OIDC_PORT}`, CF = `http://127.0.0.1:${CF_PORT}`, VB = `http://127.0.0.1:${VB_PORT}`, GH = `http://127.0.0.1:${GH_PORT}`;
let pass = 0, fail = 0; const check = (l: string, ok: boolean, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${l}${ok ? "" : "  " + d}`); };
const waitFor = async (url: string, tries = 100) => { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not up */ } await Bun.sleep(150); } throw new Error(`${url} did not come up`); };
const data = mkdtempSync(join(tmpdir(), "vb-cloud-")); mkdirSync(`${data}/pb_data`, { recursive: true });
const procs: ReturnType<typeof Bun.spawn>[] = [];
procs.push(Bun.spawn(["bun", `${VOIDBASE}/test/mock-oidc.ts`, String(OIDC_PORT)], { stdout: "ignore", stderr: "inherit" }));
procs.push(Bun.spawn(["bun", `${VOIDBASE}/test/cf-mock.ts`, String(CF_PORT)], { stdout: "ignore", stderr: "inherit" }));
procs.push(Bun.spawn(["bun", resolve(import.meta.dir, "gh-mock.ts"), String(GH_PORT)], { stdout: "ignore", stderr: "inherit" }));
const env = {
  ...process.env, VOIDBASE_SUPERUSER_EMAIL: "root@example.com", VOIDBASE_SUPERUSER_PASSWORD: "root-password-1", VOIDBASE_USER_EMAIL: "", VOIDBASE_USER_PASSWORD: "",
  CF_OAUTH_CLIENT_ID: "cf-test-client", CF_OAUTH_CLIENT_SECRET: "cf-s3cret", CF_OAUTH_AUTH_URL: `${OIDC}/authorize`, CF_OAUTH_TOKEN_URL: `${OIDC}/token`, CF_OAUTH_USERINFO_URL: `${OIDC}/userinfo`,
  CLOUDFLARE_API_BASE: CF, VOIDBASE_WORKER_NAME: "voidbase-site", VOIDBASE_ACCOUNT_ID: "acc123", VB_ADMIN_EMAILS: "owner@example.com", VB_INSTANCE_PREFIX: "vb-", VB_MAX_INSTANCES_PER_USER: "2",
  VOIDBASE_LOG_MIN_LEVEL: "8",
  VOIDBASE_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef", VB_ALLOW_SELF_DELETE: "1",
  VOIDBASE_HOOKS_DIR: resolve(import.meta.dir, "../.voidbase/pb_hooks"), VOIDBASE_MIGRATIONS_DIR: resolve(import.meta.dir, "../.voidbase/pb_migrations"),
  GH_OAUTH_CLIENT_ID: "gh-test-client", GH_OAUTH_CLIENT_SECRET: "gh-s3cret", GITHUB_API_BASE: GH, GITHUB_OAUTH_BASE: GH, VB_SITE_URL: "http://site.test",
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

  // instances
  const list0 = await api("GET", "/api/vbcloud/instances", undefined, U);
  const self0 = (list0.json.instances ?? []).find((i: Record<string, unknown>) => i.self);
  check("the site's own backend is listed as the system instance (admin can delete it)", !!self0 && self0.system === true && self0.canDelete === true && self0.url === VB && self0.status === "live", JSON.stringify(list0.json));
  const suCreate = await api("POST", "/api/vbcloud/instances", { name: "x" }, SU);
  check("superusers cannot create instances", suCreate.status === 401 || suCreate.status === 403, String(suCreate.status));
  const created = await api("POST", "/api/vbcloud/instances", { name: "My Shop", account: "acc123" }, U);
  const inst = created.json.instance ?? {};
  check("one click: instance provisioned on the user's account", created.status === 200 && inst.name === "vb-my-shop" && inst.status === "live" && inst.url === "https://vb-my-shop.testsub.workers.dev" && inst.release === manifest.version && inst.canDelete === true, JSON.stringify(created.json).slice(0, 600));
  const st = await cfState();
  const script = st.scripts["vb-my-shop"];
  check("cloudflare: worker with all modules, assets, per-instance D1/R2/queue, owner tag", !!script && script.modules.length === manifest.modules.length && st.uploadedHashes.length === new Set(manifest.assets.map((a) => a.hash)).size && st.d1.some((d: string[]) => d[0] === "vb-my-shop-db") && "vb-my-shop-storage" in st.r2 && st.queues.some((q: string[]) => q[0] === "vb-my-shop-jobs") && (script.metadata.tags as string[]).some((t) => t.startsWith("vbcloud-owner:")), JSON.stringify({ modules: script?.modules?.length, hashes: st.uploadedHashes.length, d1: st.d1, queues: st.queues }));
  const once = created.json.credentials ?? {};
  check("the superuser password comes back once, with the creation", once.superuserEmail === "owner@example.com" && String(once.superuserPassword).length === 24 && once.panel === "https://vb-my-shop.testsub.workers.dev/_/", JSON.stringify(once));
  const secret = (script.metadata.bindings as { name: string; text?: string }[]).find((b) => b.name === "VOIDBASE_SUPERUSER_PASSWORD");
  check("the same password went to the worker as a secret", secret?.text === once.superuserPassword);
  const creds = await api("GET", `/api/vbcloud/instances/${inst.id}/credentials`, undefined, U);
  check("credentials afterwards: url, email and panel, never the password", creds.status === 200 && creds.json.superuserEmail === "owner@example.com" && creds.json.superuserPassword === undefined && creds.json.panel === "https://vb-my-shop.testsub.workers.dev/_/", JSON.stringify(creds.json));

  // ---- plugins on a cloud instance: recorded, built elsewhere, deployed from the release the builder pushes ------------
  // a marketplace of this test's own: the registry protocol is three GETs, and Bun serving three strings is one
  const echo = 'const manifest = { name: "echo", version: "0.1.0", tier: "community", voidbase: "*" };\nexport default { manifest, apply(ctx) { ctx.app.get("/api/echo", (c) => c.text("echo")); } };\n';
  const echoBytes = new TextEncoder().encode(echo);
  const integrity = `sha256-${btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", echoBytes))))}`;
  const record = { version: "0.1.0", manifest: { name: "echo", version: "0.1.0", tier: "community", voidbase: "*" }, integrity, bundle: "plugins/echo/0.1.0/bundle.js", bytes: echoBytes.length, source: { repository: "example/voidbase-plugin-echo", commit: "0123456789abcdef0123456789abcdef01234567" }, publishedOn: "2026-09-09" };
  const index = { schemaVersion: 1, marketplace: { name: "test", url: "http://test.invalid" }, generatedOn: "2026-09-09", plugins: [{ name: "echo", repository: "example/voidbase-plugin-echo", title: "Echo", summary: "Answers /api/echo.", latest: "0.1.0", versions: [record] }], templates: [] };
  const market = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: (req) => { const p = new URL(req.url).pathname; if (p === "/registry/v1/index.json") return Response.json(index); if (p === "/registry/v1/plugins/echo/0.1.0.json") return Response.json(record); if (p === "/registry/v1/plugins/echo/0.1.0/bundle.js") return new Response(echoBytes); return new Response("not found", { status: 404 }); } });
  const MARKET = `http://127.0.0.1:${market.port}`;
  try {
    const selfUpgrade = await api("POST", `/api/vbcloud/instances/${self0.id}/upgrade`, undefined, U);
    const selfPlugins = await api("POST", `/api/vbcloud/instances/${self0.id}/plugins`, { add: [{ name: "echo", marketplace: MARKET }] }, U);
    check("the site's own backend is never re-provisioned from a release: upgrade and plugins refuse the system row", selfUpgrade.status === 400 && /its repository/.test(selfUpgrade.json.message ?? "") && selfPlugins.status === 400 && /its repository/.test(selfPlugins.json.message ?? ""), `${selfUpgrade.status} ${selfPlugins.status}`);
    const nothingQueued = await api("GET", "/api/vbcloud/builds/next", undefined, SU);
    check("builds/next with nothing queued is 204", nothingQueued.status === 204, String(nothingQueued.status));
    const offered = await api("GET", `/api/vbcloud/instances/${inst.id}/plugins?marketplace=${encodeURIComponent(MARKET)}`, undefined, U);
    const fromTest = (offered.json.available ?? []).find((m: { marketplace: string }) => m.marketplace === MARKET);
    check("plugins: the instance's set is empty, and a named marketplace's releases are offered beside the official one", offered.status === 200 && Array.isArray(offered.json.plugins) && offered.json.plugins.length === 0 && fromTest?.plugins?.[0]?.name === "echo" && (offered.json.available ?? []).length === 2, JSON.stringify(offered.json).slice(0, 300));
    const notServed = await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { add: [{ name: "nothing", marketplace: MARKET }] }, U);
    check("a plugin the marketplace does not serve is refused, nothing recorded", notServed.status === 400 && /not served by/.test(notServed.json.message ?? ""), JSON.stringify(notServed.json));
    const added = await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { add: [{ name: "echo", marketplace: MARKET }] }, U);
    check("installing records the plugin as voidbase.lock would (version, marketplace, integrity, source) and queues a build", added.status === 200 && added.json.build === "queued" && added.json.plugins?.[0]?.name === "echo" && added.json.plugins[0].integrity === integrity && added.json.plugins[0].marketplace === MARKET && added.json.plugins[0].source?.commit?.length === 40, JSON.stringify(added.json).slice(0, 300));
    const someoneElse = await api("GET", "/api/vbcloud/builds/next", undefined, U);
    check("claiming a build takes a superuser (the builder), not an owner", someoneElse.status === 401 || someoneElse.status === 403, String(someoneElse.status));
    const claimed = await api("GET", "/api/vbcloud/builds/next", undefined, SU);
    check("the builder claims the queued build: instance, base release and the plugin set", claimed.status === 200 && claimed.json.id === inst.id && claimed.json.name === "vb-my-shop" && claimed.json.base === manifest.version && claimed.json.plugins?.[0]?.integrity === integrity, JSON.stringify(claimed.json));
    const again = await api("GET", "/api/vbcloud/builds/next", undefined, SU);
    check("a claimed build is not handed out twice", again.status === 204, String(again.status));
    const midway = await api("GET", `/api/vbcloud/instances/${inst.id}/plugins`, undefined, U);
    check("while it builds, the owner sees the state and cannot change the set", midway.json.build === "building" && (await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { remove: ["echo"] }, U)).status === 400, JSON.stringify(midway.json).slice(0, 200));
    // the builder pushes the release it made for this instance (the same files here), without making it the default
    const built = `${manifest.version}-vb-my-shop.t1`;
    let pushedBuilt = 0; for (const f of files) { const r = await fetch(`${VB}/api/vbcloud/releases/${built}/files?path=${encodeURIComponent(f)}`, { method: "POST", headers: { authorization: SU, "content-type": "application/octet-stream" }, body: await Bun.file(`${releaseDir}/${f}`).arrayBuffer() }); if (r.ok) pushedBuilt++; }
    const stillCurrent = await api("GET", "/api/vbcloud/release", undefined, SU);
    check("the per-instance release is pushed without becoming the default", pushedBuilt === files.length && stillCurrent.json.current === manifest.version, `${pushedBuilt}/${files.length} ${stillCurrent.json.current}`);
    const uploadsBefore = (await cfState()).scripts["vb-my-shop"]?.uploads ?? 0;
    const done = await api("POST", `/api/vbcloud/builds/${inst.id}/done`, { version: built }, SU);
    const after = await cfState();
    check("done: the instance is deployed from that release, secrets inherited, and runs it", done.status === 200 && done.json.instance?.release === built && done.json.instance?.build === "" && !!after.scripts["vb-my-shop"] && (after.scripts["vb-my-shop"].uploads ?? uploadsBefore + 1) > uploadsBefore, JSON.stringify(done.json).slice(0, 300));
    const upgradeWithPlugins = await api("POST", `/api/vbcloud/instances/${inst.id}/upgrade`, undefined, U);
    check("an upgrade of an instance with plugins is a rebuild on the base, not a bare re-provision", upgradeWithPlugins.status === 200 && upgradeWithPlugins.json.upgraded === false && (upgradeWithPlugins.json.queued === true || /Already built/.test(upgradeWithPlugins.json.message ?? "")), JSON.stringify(upgradeWithPlugins.json).slice(0, 200));
    const reclaim = await api("GET", "/api/vbcloud/builds/next", undefined, SU);
    if (reclaim.status !== 200) await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { remove: ["echo"] }, U);
    const claim2 = reclaim.status === 200 ? reclaim : await api("GET", "/api/vbcloud/builds/next", undefined, SU);
    const failed = await api("POST", `/api/vbcloud/builds/${inst.id}/failed`, { error: "the bundler said no" }, SU);
    const seen = await api("GET", `/api/vbcloud/instances/${inst.id}/plugins`, undefined, U);
    check("a failed build is reported with its reason, and the instance keeps the release it runs", claim2.status === 200 && failed.status === 200 && seen.json.build === "failed" && seen.json.buildError === "the bundler said no" && seen.json.instance?.release === built, JSON.stringify(seen.json).slice(0, 300));
  } finally { market.stop(true); }
  {
    const { Database } = await import("bun:sqlite");
    const db = new Database(`${data}/pb_data/data.db`, { readonly: true });
    const rows = db.query("SELECT access_token, refresh_token FROM cf_connections").all() as { access_token: string; refresh_token: string }[];
    db.close();
    check("cloudflare tokens are sealed at rest (enc: prefix, not the bearer)", rows.length === 1 && rows[0]!.access_token.startsWith("enc:") && !rows[0]!.access_token.includes("cf-test-token") && rows[0]!.refresh_token.startsWith("enc:"), JSON.stringify(rows).slice(0, 120));
  }
  // ---- template marketplace: connect GitHub, create a repository from the site template wired to the instance
  const gh0 = await api("GET", "/api/vbcloud/github", undefined, U);
  check("github: configured, not connected yet", gh0.status === 200 && gh0.json.configured === true && gh0.json.connected === false, JSON.stringify(gh0.json));
  const tplAnon = await api("GET", "/api/vbcloud/templates");
  const tpl = await api("GET", "/api/vbcloud/templates", undefined, U);
  check("templates: auth required, the site template is registered with its variables", tplAnon.status === 401 && tpl.status === 200 && tpl.json.templates?.[0]?.name === "voidbase-site" && tpl.json.templates[0].repo === "voidbase-cloud/voidbase-site" && tpl.json.templates[0].variables?.some((v: { name: string }) => v.name === "PB_VB_URL"), JSON.stringify(tpl.json).slice(0, 300));
  const tooEarly = await api("POST", "/api/vbcloud/repos", { template: "voidbase-site", name: "my-site", instance: inst.id }, U);
  check("creating a repository needs a GitHub connection", tooEarly.status === 400 && /Connect your GitHub/.test(tooEarly.json.message ?? ""), JSON.stringify(tooEarly.json));
  const connect = await api("GET", "/api/vbcloud/github/connect", undefined, U);
  check("connect returns GitHub's authorize url with our callback, scopes and a signed state", connect.status === 200 && String(connect.json.url).startsWith(`${GH}/login/oauth/authorize`) && decodeURIComponent(connect.json.url).includes(`${VB}/api/vbcloud/github/callback`) && /scope=repo/.test(connect.json.url) && /state=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(connect.json.url), String(connect.json.url).slice(0, 200));
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
  const mk = await api("POST", "/api/vbcloud/repos", { template: "voidbase-site", name: "My Site!", instance: inst.id, private: true, domain: "site.example.com" }, U);
  const ghs = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("repository generated from the template in the user's account, private, from the right template", mk.status === 200 && mk.json.repo?.fullName === "octo-tester/my-site" && mk.json.repo.status === "ready" && ghs.repos["octo-tester/my-site"]?.template === "voidbase-cloud/voidbase-site" && ghs.repos["octo-tester/my-site"].private === true, JSON.stringify(mk.json).slice(0, 300));
  check("the instance url and the domain were written as repository variables", ghs.variables["octo-tester/my-site"]?.PB_VB_URL === inst.url && ghs.variables["octo-tester/my-site"]?.PAGES_CNAME === "site.example.com", JSON.stringify(ghs.variables));
  const dupRepo = await api("POST", "/api/vbcloud/repos", { template: "voidbase-site", name: "my-site", instance: inst.id }, U);
  check("the same repository cannot be linked twice", dupRepo.status === 400 && /already linked/.test(dupRepo.json.message ?? ""), JSON.stringify(dupRepo.json));
  const repos = await api("GET", "/api/vbcloud/repos", undefined, U);
  const r0 = repos.json.repos?.[0];
  check("repos: listed with instance, template and a live connection check", repos.status === 200 && r0?.fullName === "octo-tester/my-site" && r0.instanceName === "vb-my-shop" && r0.templateName === "voidbase-site" && r0.live?.checked === true && r0.live.exists === true && r0.live.connected === true, JSON.stringify(repos.json).slice(0, 300));
  const viaSdkRepos = await api("GET", "/api/collections/vb_repos/records", undefined, U);
  check("vb_repos through the API rules: only the owner's rows", viaSdkRepos.status === 200 && viaSdkRepos.json.totalItems === 1, JSON.stringify(viaSdkRepos.json).slice(0, 120));
  const unlink = await api("DELETE", `/api/vbcloud/repos/${r0.id}`, undefined, U);
  const ghs2 = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("unlink removes the link and leaves the repository on GitHub", unlink.status === 200 && unlink.json.unlinked === true && "octo-tester/my-site" in ghs2.repos && (await api("GET", "/api/vbcloud/repos", undefined, U)).json.repos.filter((r: Record<string, unknown>) => !r.system).length === 0, JSON.stringify(unlink.json));
  // ---- dogfooding: the site's own repository is a system row wired to the site's own backend; admins may wire more
  // repositories to that backend; existing repositories can be linked without a template
  await fetch(`${GH}/__seed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "voidbase-cloud/voidbase-site", variables: { PB_VB_URL: VB } }) });
  await fetch(`${GH}/__seed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "octo-tester/existing", private: true }) });
  const allInst = await api("GET", "/api/vbcloud/instances", undefined, U);
  const sysInst = (allInst.json.instances ?? []).find((i: Record<string, unknown>) => i.system);
  check("the admin sees the system instance as linkable, others' instances are not offered", !!sysInst && sysInst.canLink === true && sysInst.self === true, JSON.stringify(allInst.json).slice(0, 200));
  const dog = await api("GET", "/api/vbcloud/repos", undefined, U);
  const site = (dog.json.repos ?? []).find((r: Record<string, unknown>) => r.fullName === "voidbase-cloud/voidbase-site");
  check("the site's own repository is listed to the admin as a system row wired to this backend, live-checked connected", dog.status === 200 && !!site && site.system === true && site.canUnlink === false && site.instanceName === "voidbase-site" && site.templateName === "voidbase-site" && site.live?.connected === true, JSON.stringify(dog.json).slice(0, 300));
  const noUnlink = await api("DELETE", `/api/vbcloud/repos/${site?.id}`, undefined, U);
  check("the site's own repository cannot be unlinked", noUnlink.status === 403, JSON.stringify(noUnlink.json));
  const dogfood = await api("POST", "/api/vbcloud/repos", { template: "voidbase-site", name: "dogfood", instance: sysInst?.id }, U);
  const ghsD = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("an admin creates a repository from the template wired to the site's own backend", dogfood.status === 200 && dogfood.json.repo?.instanceName === "voidbase-site" && ghsD.variables["octo-tester/dogfood"]?.PB_VB_URL === VB, JSON.stringify(dogfood.json).slice(0, 200));
  const linkMissing = await api("POST", "/api/vbcloud/repos/link", { fullName: "octo-tester/nope", instance: inst.id }, U);
  check("linking a repository GitHub does not know is refused", linkMissing.status === 400 && /not found on GitHub/.test(linkMissing.json.message ?? ""), JSON.stringify(linkMissing.json));
  const linked = await api("POST", "/api/vbcloud/repos/link", { fullName: "https://github.com/Octo-Tester/existing.git", instance: inst.id }, U);
  const ghsL = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("an existing repository (given as a URL) is linked: PB_VB_URL written, private flag read from GitHub", linked.status === 200 && linked.json.repo?.fullName === "octo-tester/existing" && linked.json.repo.private === true && linked.json.repo.instanceName === "vb-my-shop" && ghsL.variables["octo-tester/existing"]?.PB_VB_URL === inst.url, JSON.stringify(linked.json).slice(0, 200));
  const relink = await api("POST", "/api/vbcloud/repos/link", { fullName: "octo-tester/existing", instance: inst.id }, U);
  check("a linked repository cannot be linked twice", relink.status === 400 && /already linked/.test(relink.json.message ?? ""), JSON.stringify(relink.json));
  const after = await api("GET", "/api/vbcloud/repos", undefined, U);
  check("repos: the user's rows first, then the system row; all live-checked", after.json.repos?.length === 3 && after.json.repos[0].system === false && after.json.repos[2].system === true && after.json.repos.every((r: Record<string, any>) => r.live?.checked === true), JSON.stringify(after.json.repos?.map((r: Record<string, unknown>) => [r.fullName, r.system])));
  const disc = await api("DELETE", "/api/vbcloud/github", undefined, U);
  const ghs3 = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  check("disconnect removes the connection and revokes the grant on GitHub", disc.json.disconnected === true && ghs3.grantRevoked === 1 && (await api("GET", "/api/vbcloud/github", undefined, U)).json.connected === false, JSON.stringify(disc.json));

  const dup = await api("POST", "/api/vbcloud/instances", { name: "my-shop" }, U);
  check("duplicate name refused", dup.status === 400 && /named vb-my-shop|taken/.test(dup.json.message ?? ""), JSON.stringify(dup.json));
  const second = await api("POST", "/api/vbcloud/instances", { name: "second" }, U);
  const third = await api("POST", "/api/vbcloud/instances", { name: "third" }, U);
  check("per-user limit enforced", second.status === 200 && third.status === 400 && /limit/.test(third.json.message ?? ""), JSON.stringify([second.status, third.json]));
  const viaSdk = await api("GET", "/api/collections/vb_instances/records", undefined, U);
  check("the collection itself lists only the owner's rows through the API rules, without the password", viaSdk.status === 200 && viaSdk.json.totalItems === 2 && viaSdk.json.items.every((i: Record<string, unknown>) => i.superuser_password === undefined), JSON.stringify(viaSdk.json).slice(0, 300));
  const del = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
  const st2 = await cfState();
  check("one click delete: queue consumer, worker, queue, D1 and bucket gone, row removed", del.status === 200 && del.json.deleted.length === 5 && del.json.errors.length === 0 && !st2.scripts["vb-my-shop"] && !st2.d1.some((d: string[]) => d[0] === "vb-my-shop-db") && (await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances.every((i: Record<string, unknown>) => i.name !== "vb-my-shop"), JSON.stringify([del.json, Object.keys(st2.scripts)]));
  const delAgain = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
  check("deleting a removed instance is a 404", delAgain.status === 404);

  // dogfood: the site's own backend, deployed earlier, is destroyed from the site by the admin
  await fetch(`${CF}/accounts/acc123/d1/database`, { method: "POST", headers: { authorization: "Bearer cf-test-token", "content-type": "application/json" }, body: JSON.stringify({ name: "voidbase-site-db" }) });
  await fetch(`${CF}/accounts/acc123/r2/buckets`, { method: "POST", headers: { authorization: "Bearer cf-test-token", "content-type": "application/json" }, body: JSON.stringify({ name: "voidbase-site-storage" }) });
  const form = new FormData(); form.append("metadata", new Blob([JSON.stringify({ main_module: "index.js" })], { type: "application/json" }), "metadata.json"); form.append("index.js", new Blob(["export default {}"], { type: "application/javascript+module" }), "index.js");
  await fetch(`${CF}/accounts/acc123/workers/scripts/voidbase-site`, { method: "PUT", headers: { authorization: "Bearer cf-test-token" }, body: form });
  const selfDel = await api("DELETE", `/api/vbcloud/instances/${self0.id}`, undefined, U);
  const st3 = await cfState();
  check("admin deletes the site's own backend: worker, D1 and bucket removed on Cloudflare", selfDel.status === 200 && selfDel.json.self === true && selfDel.json.deleted.length === 3 && !st3.scripts["voidbase-site"] && st3.d1.every((d: string[]) => d[0] !== "voidbase-site-db"), JSON.stringify([selfDel.json, Object.keys(st3.scripts)]));
} catch (e) { fail++; console.log("FAIL  unexpected error", e); console.log(serverLog.join("").slice(-3000)); }
finally { for (const p of procs) p.kill(); rmSync(data, { recursive: true, force: true }); rmSync(fake, { recursive: true, force: true }); }
if (fail) console.log("--- server log tail ---\n" + serverLog.join("").slice(-4000));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
