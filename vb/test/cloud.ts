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
const OIDC_PORT = freePort(), CF_PORT = freePort(), VB_PORT = freePort();
const OIDC = `http://127.0.0.1:${OIDC_PORT}`, CF = `http://127.0.0.1:${CF_PORT}`, VB = `http://127.0.0.1:${VB_PORT}`;
let pass = 0, fail = 0; const check = (l: string, ok: boolean, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${l}${ok ? "" : "  " + d}`); };
const waitFor = async (url: string, tries = 100) => { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not up */ } await Bun.sleep(150); } throw new Error(`${url} did not come up`); };
const data = mkdtempSync(join(tmpdir(), "vb-cloud-")); mkdirSync(`${data}/pb_data`, { recursive: true });
const procs: ReturnType<typeof Bun.spawn>[] = [];
procs.push(Bun.spawn(["bun", `${VOIDBASE}/test/mock-oidc.ts`, String(OIDC_PORT)], { stdout: "ignore", stderr: "inherit" }));
procs.push(Bun.spawn(["bun", `${VOIDBASE}/test/cf-mock.ts`, String(CF_PORT)], { stdout: "ignore", stderr: "inherit" }));
const env = {
  ...process.env, VOIDBASE_SUPERUSER_EMAIL: "root@example.com", VOIDBASE_SUPERUSER_PASSWORD: "root-password-1", VOIDBASE_USER_EMAIL: "", VOIDBASE_USER_PASSWORD: "",
  CF_OAUTH_CLIENT_ID: "cf-test-client", CF_OAUTH_CLIENT_SECRET: "cf-s3cret", CF_OAUTH_AUTH_URL: `${OIDC}/authorize`, CF_OAUTH_TOKEN_URL: `${OIDC}/token`, CF_OAUTH_USERINFO_URL: `${OIDC}/userinfo`,
  CLOUDFLARE_API_BASE: CF, VOIDBASE_WORKER_NAME: "voidbase-site-backend", VOIDBASE_ACCOUNT_ID: "acc123", VB_ADMIN_EMAILS: "owner@example.com", VB_INSTANCE_PREFIX: "vb-", VB_MAX_INSTANCES_PER_USER: "2",
  VOIDBASE_LOG_MIN_LEVEL: "8",
  VOIDBASE_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef", VB_ALLOW_SELF_DELETE: "1",
};
const server = Bun.spawn(["bun", resolve(import.meta.dir, "../main.ts"), "--http", `127.0.0.1:${VB_PORT}`, "--dir", `${data}/pb_data`], { cwd: resolve(import.meta.dir, ".."), env, stdout: "pipe", stderr: "pipe" });
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
  await waitFor(`${OIDC}/userinfo`); await waitFor(`${CF}/__calls`); await waitFor(`${VB}/api/health`);
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
  check("me: connected, granted accounts stored, admin by email, self worker known", me.json.connected === true && me.json.connection?.accounts?.[0]?.id === "acc123" && me.json.admin === true && me.json.self?.worker === "voidbase-site-backend" && me.json.providerConfigured === true, JSON.stringify(me.json));
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
  {
    const { Database } = await import("bun:sqlite");
    const db = new Database(`${data}/pb_data/data.db`, { readonly: true });
    const rows = db.query("SELECT access_token, refresh_token FROM cf_connections").all() as { access_token: string; refresh_token: string }[];
    db.close();
    check("cloudflare tokens are sealed at rest (enc: prefix, not the bearer)", rows.length === 1 && rows[0]!.access_token.startsWith("enc:") && !rows[0]!.access_token.includes("cf-test-token") && rows[0]!.refresh_token.startsWith("enc:"), JSON.stringify(rows).slice(0, 120));
  }
  const dup = await api("POST", "/api/vbcloud/instances", { name: "my-shop" }, U);
  check("duplicate name refused", dup.status === 400 && /named vb-my-shop|taken/.test(dup.json.message ?? ""), JSON.stringify(dup.json));
  const second = await api("POST", "/api/vbcloud/instances", { name: "second" }, U);
  const third = await api("POST", "/api/vbcloud/instances", { name: "third" }, U);
  check("per-user limit enforced", second.status === 200 && third.status === 400 && /limit/.test(third.json.message ?? ""), JSON.stringify([second.status, third.json]));
  const viaSdk = await api("GET", "/api/collections/vb_instances/records", undefined, U);
  check("the collection itself lists only the owner's rows through the API rules, without the password", viaSdk.status === 200 && viaSdk.json.totalItems === 2 && viaSdk.json.items.every((i: Record<string, unknown>) => i.superuser_password === undefined), JSON.stringify(viaSdk.json).slice(0, 300));
  const del = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
  const st2 = await cfState();
  check("one click delete: worker, queue, D1 and bucket gone, row removed", del.status === 200 && del.json.deleted.length === 4 && del.json.errors.length === 0 && !st2.scripts["vb-my-shop"] && !st2.d1.some((d: string[]) => d[0] === "vb-my-shop-db") && (await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances.every((i: Record<string, unknown>) => i.name !== "vb-my-shop"), JSON.stringify([del.json, Object.keys(st2.scripts)]));
  const delAgain = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
  check("deleting a removed instance is a 404", delAgain.status === 404);

  // dogfood: the site's own backend, deployed earlier, is destroyed from the site by the admin
  await fetch(`${CF}/accounts/acc123/d1/database`, { method: "POST", headers: { authorization: "Bearer cf-test-token", "content-type": "application/json" }, body: JSON.stringify({ name: "voidbase-site-backend-db" }) });
  await fetch(`${CF}/accounts/acc123/r2/buckets`, { method: "POST", headers: { authorization: "Bearer cf-test-token", "content-type": "application/json" }, body: JSON.stringify({ name: "voidbase-site-backend-storage" }) });
  const form = new FormData(); form.append("metadata", new Blob([JSON.stringify({ main_module: "index.js" })], { type: "application/json" }), "metadata.json"); form.append("index.js", new Blob(["export default {}"], { type: "application/javascript+module" }), "index.js");
  await fetch(`${CF}/accounts/acc123/workers/scripts/voidbase-site-backend`, { method: "PUT", headers: { authorization: "Bearer cf-test-token" }, body: form });
  const selfDel = await api("DELETE", `/api/vbcloud/instances/${self0.id}`, undefined, U);
  const st3 = await cfState();
  check("admin deletes the site's own backend: worker, D1 and bucket removed on Cloudflare", selfDel.status === 200 && selfDel.json.self === true && selfDel.json.deleted.length === 3 && !st3.scripts["voidbase-site-backend"] && st3.d1.every((d: string[]) => d[0] !== "voidbase-site-backend-db"), JSON.stringify([selfDel.json, Object.keys(st3.scripts)]));
} catch (e) { fail++; console.log("FAIL  unexpected error", e); console.log(serverLog.join("").slice(-3000)); }
finally { for (const p of procs) p.kill(); rmSync(data, { recursive: true, force: true }); rmSync(fake, { recursive: true, force: true }); }
if (fail) console.log("--- server log tail ---\n" + serverLog.join("").slice(-4000));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
