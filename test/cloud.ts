// End-to-end test of voidbase.cloud on the Bun runtime, against voidbase's mocks. The site keeps sign-in, sealed
// tokens, rows and two pass-throughs; the work is done by the browser client (src/lib/cloud.ts), which this test
// drives the way the page does (instances, repositories, then the life of one: plugins and what the instance reports
// it runs, logs, metrics, backups, superusers, payments, domains, secrets), against:
// test/mock-oidc.ts (a Cloudflare-shaped OAuth client: userinfo = {sub}, access token = the cf-mock bearer) and
// test/cf-mock.ts (the Cloudflare REST API). Boots `bun main.ts` on a temporary data directory.
//   bun test/cloud.ts
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { assetHash, contentTypeFor, type ReleaseManifest } from "@voidbase-cloud/voidbase/cloud";
import { CloudClient, CloudError, rollbackTarget, ROLLBACK_WINDOW_DAYS, type Instance } from "../src/lib/cloud";
const VOIDBASE = resolve(import.meta.dir, "../node_modules/@voidbase-cloud/voidbase");
// The npm package ships no test/; the mocks come from a sibling voidbase checkout when the package lacks them
// (a sibling of the site, or of the site a worktree under .claude/worktrees/ belongs to).
const MOCKS = [`${VOIDBASE}/test`, resolve(import.meta.dir, "../../voidbase/test"), resolve(import.meta.dir, "../../../../../voidbase/test")].find((d) => existsSync(`${d}/cf-mock.ts`)) ?? `${VOIDBASE}/test`;
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

  // ---- and back: the row keeps the release the upgrade left, the card offers it for seven days, a rollback clears it
  const recorded = { previousRelease: String(upRow.previous_release ?? ""), upgradedAt: String(upRow.upgraded_at ?? ""), status: "live" };
  const offered = rollbackTarget(recorded);
  const expired = rollbackTarget(recorded, Date.now() + (ROLLBACK_WINDOW_DAYS + 1) * 24 * 3600 * 1000);
  const never = rollbackTarget({ ...recorded, previousRelease: "" });
  check("upgrade: the row keeps the release it left and when it moved; the way back is offered for seven days, not after, and not without one", recorded.previousRelease === manifest.version && recorded.upgradedAt.length > 0 && offered === manifest.version && expired === null && never === null, JSON.stringify({ recorded, offered, expired, never }));
  const uploadsBeforeBack = await putsOf();
  const back = await client.upgradeInstance({ ...inst, release: v2 }, { release: manifest.version, rollback: true });
  const backRow = (await api("GET", `/api/collections/vb_instances/records/${inst.id}`, undefined, U)).json;
  check("rollback: the worker is provisioned again from the recorded release, the row moves back, and the record is cleared, so a rollback is not itself rollable", back.upgraded === true && back.from === v2 && back.to === manifest.version && (await putsOf()) === uploadsBeforeBack + 1 && backRow.release === manifest.version && backRow.status === "live" && String(backRow.previous_release ?? "") === "" && String(backRow.upgraded_at ?? "") === "" && rollbackTarget({ previousRelease: String(backRow.previous_release ?? ""), upgradedAt: String(backRow.upgraded_at ?? ""), status: "live" }) === null, JSON.stringify({ back: { from: back.from, to: back.to }, row: { release: backRow.release, previous: backRow.previous_release, at: backRow.upgraded_at } }));
  // on the active release again, where the rest of this run expects it
  await client.upgradeInstance({ ...inst, release: manifest.version });

  // ---- plugins: the instance's own installer, with a session minted on the instance itself
  const calls: { path: string; auth: string; body: unknown }[] = [];
  // what the instance also serves: PocketBase's logs API (entries and hourly stats), its backups API with the file
  // token a download needs, the backups plugin's kinds and verification, its _superusers collection, and the
  // payments plugin's three collections
  const logRows = [{ id: "l0", created: "2026-09-10 09:30:00.000Z", level: 0, message: "GET /", data: { status: 200 } }, { id: "l1", created: "2026-09-10 10:00:00.000Z", level: 0, message: "GET /api/health", data: { status: 200 } }, { id: "l2", created: "2026-09-10 10:01:00.000Z", level: 8, message: "POST /api/collections/x/records", data: { status: 500 } }, { id: "l3", created: "2026-09-10 10:02:00.000Z", level: 4, message: "slow query", data: {} }];
  const logCalls: string[] = [];
  const backups: { key: string; modified: string; size: number; kind: string; verified: boolean; voidbase: string | null; restore?: Record<string, unknown> }[] = [];
  const backupCalls: string[] = [];
  const restored: string[] = [];
  const paymentRows = {
    customers: [{ id: "c1", email: "a@example.com", created: "2026-09-01 10:00:00.000Z" }, { id: "c2", email: "b@example.com", created: "2026-09-02 10:00:00.000Z" }],
    subscriptions: [{ id: "s1", customer: "c1", status: "active", created: "2026-09-03 10:00:00.000Z" }],
    payments: [{ id: "p1", customer: "c1", amount: 500, currency: "usd", status: "succeeded", created: "2026-09-04 10:00:00.000Z" }, { id: "p2", customer: "c2", amount: 1200, currency: "eur", status: "failed", created: "2026-09-05 10:00:00.000Z" }, { id: "p3", customer: "c1", subscription: "s1", amount: 1999, currency: "usd", status: "succeeded", created: "2026-09-06 10:00:00.000Z" }],
  } as Record<string, Record<string, unknown>[]>;
  const paymentCalls: string[] = [];
  const superusers = [{ id: "su1", email: "owner@example.com", created: "2026-09-01 00:00:00.000Z" }];
  const instance = Bun.serve({ port: 0, hostname: "127.0.0.1", async fetch(req) {
    const url = new URL(req.url); const p = url.pathname; const auth = req.headers.get("authorization") ?? "";
    if (p === "/api/collections/_superusers/auth-with-password") { const b = (await req.json()) as { identity: string; password: string }; return b.password === created.credentials.superuserPassword ? Response.json({ token: "inst-session" }) : Response.json({ message: "Failed to authenticate." }, { status: 400 }); }
    // a backup download carries a file token in the query, not the session
    { const m = p.match(/^\/api\/backups\/([^/]+)$/); if (m && req.method === "GET") { backupCalls.push(`GET ${p}?${url.searchParams}`); if (url.searchParams.get("token") !== "file-token") return Response.json({ message: "Insufficient permissions to access the resource." }, { status: 403 }); const b = backups.find((x) => x.key === decodeURIComponent(m[1]!)); if (!b) return Response.json({ message: "The requested resource wasn't found." }, { status: 404 }); return new Response(new Uint8Array([0x50, 0x4b, 0x05, 0x06]), { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${b.key}"` } }); } }
    if (auth !== "inst-session") return Response.json({ message: "The request requires valid record authorization token." }, { status: 401 });
    if (p === "/api/logs" || p === "/api/logs/stats") {
      logCalls.push(`${p}?${url.searchParams}`); const filter = url.searchParams.get("filter") ?? "";
      const level = filter.match(/level\s*>=\s*(-?\d+)/);
      const items = [...logRows].filter((l) => !level || l.level >= Number(level[1])).sort((a, b) => (url.searchParams.get("sort") === "-created" ? b.created.localeCompare(a.created) : a.created.localeCompare(b.created)));
      // stats: one bucket per hour, as PocketBase groups them
      if (p === "/api/logs/stats") { const hours = new Map<string, number>(); for (const l of items) { const h = `${l.created.slice(0, 13)}:00:00.000Z`; hours.set(h, (hours.get(h) ?? 0) + 1); } return Response.json([...hours].map(([date, total]) => ({ total, date }))); }
      return Response.json({ page: 1, perPage: Number(url.searchParams.get("perPage") ?? 30), totalItems: items.length, totalPages: 1, items });
    }
    if (p === "/api/files/token" && req.method === "POST") return Response.json({ token: "file-token" });
    if (p === "/api/backups" && req.method === "GET") return Response.json(backups);
    if (p === "/api/backups" && req.method === "POST") {
      const b = (await req.json().catch(() => ({}))) as { kind?: string; name?: string }; backupCalls.push(`POST /api/backups ${JSON.stringify(b)}`);
      const name = b.name || `pb_backup_test_${backups.length + 1}.zip`;
      if (!/^[a-z0-9_-]+\.zip$/.test(name) || backups.some((x) => x.key === name)) return Response.json({ message: "An error occurred while validating the submitted data.", data: { name: { code: "validation_backup_name_exists", message: "The backup file name is invalid or already exists." } } }, { status: 400 });
      // written, then read back and verified, as the backups plugin does; the listing carries the sidecar's fields
      backups.push({ key: name, modified: "2026-09-10 12:00:00.000Z", size: 2048, kind: b.kind ?? "full", verified: true, voidbase: "0.9.0-beta.31" }); return new Response(null, { status: 204 });
    }
    { const m = p.match(/^\/api\/backups\/([^/]+)\/verify$/); if (m && req.method === "POST") { backupCalls.push(`POST ${p}`); const b = backups.find((x) => x.key === decodeURIComponent(m[1]!)); if (!b) return Response.json({ message: "The requested resource wasn't found." }, { status: 404 }); return Response.json({ key: b.key, kind: b.kind, verified: b.verified, voidbase: b.voidbase, checksum: "sha256-of-the-entries", entries: 5, corrupted: [], missing: [] }); } }
    { const m = p.match(/^\/api\/backups\/([^/]+)(\/restore)?$/); if (m && (req.method === "DELETE" || (req.method === "POST" && m[2]))) { const raw = req.method === "POST" ? await req.text() : ""; backupCalls.push(`${req.method} ${p}${raw ? " " + raw : ""}`); const key = decodeURIComponent(m[1]!); const i = backups.findIndex((x) => x.key === key); if (i < 0) return Response.json({ message: "The requested resource wasn't found." }, { status: 404 }); if (m[2]) { restored.push(key); const o = (raw ? JSON.parse(raw) : {}) as { createMissing?: boolean }; const b = backups[i]!; b.restore = { at: "2026-09-10 12:30:00.000Z", kind: b.kind, restored: o.createMissing ? ["posts", "tags"] : ["posts"], created: o.createMissing ? ["tags"] : [], skipped: o.createMissing ? [] : [{ collection: "tags", reason: "the instance has no such collection (pass createMissing to create it from the archive's definition)" }], settings: b.kind === "full" }; } else backups.splice(i, 1); return new Response(null, { status: 204 }); } }
    { const m = p.match(/^\/api\/collections\/(customers|subscriptions|payments)\/records$/); if (m && req.method === "GET") { paymentCalls.push(`${p}?${url.searchParams}`); const rows = [...paymentRows[m[1]!]!]; if (url.searchParams.get("sort") === "-created") rows.sort((a, b) => String(b.created).localeCompare(String(a.created))); const perPage = Number(url.searchParams.get("perPage") ?? 30); return Response.json({ page: 1, perPage, totalItems: rows.length, totalPages: 1, items: rows.slice(0, perPage) }); } }
    if (p === "/api/collections/_superusers/records" && req.method === "GET") return Response.json({ page: 1, perPage: 200, totalItems: superusers.length, totalPages: 1, items: superusers });
    if (p === "/api/collections/_superusers/records" && req.method === "POST") { const b = (await req.json()) as { email: string; password: string; passwordConfirm: string }; if (!b.email || b.password !== b.passwordConfirm || b.password.length < 8) return Response.json({ message: "Failed to create record.", data: { password: { message: "invalid" } } }, { status: 400 }); if (superusers.some((s) => s.email === b.email)) return Response.json({ message: "Failed to create record.", data: { email: { message: "Value must be unique." } } }, { status: 400 }); const row = { id: `su${superusers.length + 1}`, email: b.email, created: new Date().toISOString() }; superusers.push(row); return Response.json(row); }
    { const m = p.match(/^\/api\/collections\/_superusers\/records\/([^/]+)$/); if (m && req.method === "DELETE") { const i = superusers.findIndex((s) => s.id === m[1]); if (i < 0) return Response.json({ message: "The requested resource wasn't found." }, { status: 404 }); superusers.splice(i, 1); return new Response(null, { status: 204 }); } }
    // the inventory, with what the shipped plugins report about themselves on 0.9.0-beta.31
    if (p === "/api/plugins") return Response.json({ names: ["auth", "realtime", "hardening", "backups", "installer", "echo"], origins: { auth: "shipped", realtime: "shipped", hardening: "shipped", backups: "shipped", installer: "shipped", echo: "http://market.test 0.1.0" }, disabled: [], installer: { mode: "repository", repository: "octo-tester/existing", branch: "master" },
      mail: { via: "plugin", carrier: "Cloudflare Email Service, from example.com", sender: "hello@example.com" }, ai: { via: "workers-ai", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" }, translations: { source: "en", locales: ["en", "ar"], collections: { posts: ["title", "body"] } }, domains: { hostnames: ["shop.example.com", "www.shop.example.com"], canonical: "shop.example.com" },
      payments: { via: "stripe", webhook: "/api/payments/stripe/webhook", livemode: false, also: ["polar"], reason: "POLAR_ACCESS_TOKEN is set too; stripe answers because it comes first in the shipped order" } });
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
  check("the instance reports what it runs: where its mail goes, the ai binding, the translations, the hostnames with the canonical one, and the payments provider with the second key's reason", running.mail?.via === "plugin" && String(running.mail.carrier).startsWith("Cloudflare Email Service") && running.mail.sender === "hello@example.com" && running.ai?.via === "workers-ai" && running.ai.model === "@cf/meta/llama-3.3-70b-instruct-fp8-fast" && running.translations?.source === "en" && running.translations.locales?.length === 2 && running.translations.collections?.posts?.length === 2 && running.domains?.canonical === "shop.example.com" && running.domains.hostnames.length === 2 && running.payments?.via === "stripe" && running.payments.webhook === "/api/payments/stripe/webhook" && running.payments.livemode === false && running.payments.also?.[0] === "polar" && /POLAR_ACCESS_TOKEN/.test(running.payments.reason ?? ""), JSON.stringify(running));
  const installed = await plugins.install("echo", { marketplace: "https://marketplace.voidbase.cloud" }); await plugins.remove("echo"); await plugins.update();
  check("install, remove and update reach the instance with the instance's own session, and the instance answers with its commit", calls.length === 3 && calls.every((c) => c.auth === "inst-session") && (calls[0]!.body as { name: string }).name === "echo" && (installed.committed as { sha: string }).sha === "abc", JSON.stringify(calls));

  // ---- logs: the instance's own logs API, with the same session; the filter and the sort travel as given
  const logsApi = client.logs(reachable, session);
  const lastLogs = await logsApi.list(); const errorsOnly = await logsApi.list({ filter: "level >= 4" }); const stats = await logsApi.stats("level >= 4");
  check("logs: the last entries newest first, a filter narrows them, stats come back", lastLogs.totalItems === 4 && lastLogs.items[0]!.id === "l3" && errorsOnly.items.length === 2 && errorsOnly.items.every((l) => l.level >= 4) && stats[0]!.total === 2, JSON.stringify({ last: lastLogs.items.map((l) => l.id), errors: errorsOnly.items.map((l) => l.id), stats }));
  check("logs: sort=-created and the filter reach the instance verbatim", logCalls[0]!.includes("sort=-created") && !logCalls[0]!.includes("filter") && new URLSearchParams(logCalls[1]!.split("?")[1]).get("filter") === "level >= 4" && logCalls[2]!.startsWith("/api/logs/stats?filter="), JSON.stringify(logCalls));
  const noSession = await client.logs(reachable, "stale").list().then(() => "listed", (e) => (e instanceof Error ? e.message : String(e)));
  check("logs: a stale session is the instance's refusal", /valid record authorization/.test(String(noSession)), String(noSession));

  // ---- metrics: the hourly stats twice (everything, then the error level), joined by hour
  const statsBefore = logCalls.length;
  const metrics = await client.metrics(reachable, session);
  const statsCalls = logCalls.slice(statsBefore).map((c) => new URLSearchParams(c.split("?")[1]).get("filter") ?? "");
  check("metrics: requests and errors per hour, joined by the hour, with the totals", metrics.hours.length === 2 && metrics.hours[0]!.date.startsWith("2026-09-10 09:") && metrics.hours[0]!.total === 1 && metrics.hours[0]!.errors === 0 && metrics.hours[1]!.total === 3 && metrics.hours[1]!.errors === 1 && metrics.totals.requests === 4 && metrics.totals.errors === 1, JSON.stringify(metrics));
  check("metrics: two stats calls on the instance, both bounded to the last 24 hours, the second at the error level", statsCalls.length === 2 && statsCalls.every((f) => /^created >= "\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}Z"/.test(f)) && !/level/.test(statsCalls[0]!) && /level >= 8/.test(statsCalls[1]!), JSON.stringify(statsCalls));

  // ---- backups: the instance's archives, taken, downloaded through a file token, restored, deleted
  const bkApi = client.backups(reachable, session);
  const bk0 = await bkApi.list();
  const unnamed = await bkApi.create();
  const named = await bkApi.create("Nightly");
  const badBackupName = await bkApi.create("no spaces here").then(() => "taken", (e) => (e instanceof Error ? e.message : String(e)));
  const dupBackup = await bkApi.create("nightly.zip").then(() => "taken", (e) => (e instanceof Error ? e.message : String(e)));
  const bk1 = await bkApi.list();
  check("backups: none at first; one taken with the instance's name and one with ours (.zip added); a bad name is refused here, a taken one by the instance", bk0.length === 0 && unnamed.name === "" && named.name === "nightly.zip" && bk1.length === 2 && bk1.some((b) => b.key === "nightly.zip" && b.size === 2048) && bk1.some((b) => /^pb_backup_.*\.zip$/.test(b.key)) && /ending in \.zip/.test(String(badBackupName)) && /validating the submitted data/.test(String(dupBackup)), JSON.stringify({ bk1, badBackupName, dupBackup }));
  check("backups: the name travels as given, and none is sent when there is none", backupCalls[0] === "POST /api/backups {}" && backupCalls[1] === 'POST /api/backups {"name":"nightly.zip"}', JSON.stringify(backupCalls));
  const dl = await bkApi.downloadUrl("nightly.zip");
  const dlRes = await fetch(dl);
  check("backups: a download is the archive's URL on the instance with a file token minted there; it answers with the zip", dl.startsWith(`${instUrl}/api/backups/nightly.zip?token=`) && dlRes.status === 200 && dlRes.headers.get("content-type") === "application/zip" && /attachment/.test(dlRes.headers.get("content-disposition") ?? ""), `${dl} ${dlRes.status}`);
  const noToken = await fetch(`${instUrl}/api/backups/nightly.zip`);
  check("backups: the archive is not served without the token", noToken.status === 403, String(noToken.status));
  await bkApi.restore("nightly.zip");
  const restoreUnknown = await bkApi.restore("gone.zip").then(() => "restored", (e) => (e instanceof Error ? e.message : String(e)));
  check("backups: a restore reaches the instance for the key; an unknown key is the instance's refusal", restored.length === 1 && restored[0] === "nightly.zip" && backupCalls.includes("POST /api/backups/nightly.zip/restore") && /wasn't found/.test(String(restoreUnknown)), JSON.stringify({ restored, restoreUnknown }));
  const removeUnknown = await bkApi.remove("gone.zip").then(() => "removed", (e) => (e instanceof Error ? e.message : String(e)));
  await bkApi.remove("nightly.zip");
  const bk2 = await bkApi.list();
  check("backups: deleting an unknown key is the instance's refusal; a known one goes", /wasn't found/.test(String(removeUnknown)) && bk2.length === 1 && !bk2.some((b) => b.key === "nightly.zip"), JSON.stringify({ removeUnknown, bk2 }));
  const bkStale = await client.backups(reachable, "stale").list().then(() => "listed", (e) => (e instanceof Error ? e.message : String(e)));
  check("backups: a stale session is the instance's refusal", /valid record authorization/.test(String(bkStale)), String(bkStale));
  // ---- the backups plugin on 0.9.0-beta.31: an archive of one kind, the listing's verification, a verify on demand,
  // a data restore that creates the collections the instance lacks when asked
  const dataBackup = await bkApi.create("Content", "data");
  const bk3 = await bkApi.list();
  const content = bk3.find((b) => b.key === "content.zip");
  check("backups: a data archive is asked for by kind (full travels as no kind), and the listing says each archive's kind, verification and voidbase", dataBackup.kind === "data" && dataBackup.name === "content.zip" && backupCalls.includes('POST /api/backups {"kind":"data","name":"content.zip"}') && content?.kind === "data" && content.verified === true && content.voidbase === "0.9.0-beta.31" && bk3.length === 2 && bk3.every((b) => b.kind === "full" || b.kind === "data"), JSON.stringify({ dataBackup, bk3 }));
  const verified = await bkApi.verify("content.zip");
  const verifyUnknown = await bkApi.verify("gone.zip").then(() => "verified", (e) => (e instanceof Error ? e.message : String(e)));
  check("backups: verify reaches the instance for the key and answers with the check; an unknown key is the instance's refusal", verified.key === "content.zip" && verified.verified === true && verified.kind === "data" && verified.entries === 5 && verified.corrupted.length === 0 && backupCalls.includes("POST /api/backups/content.zip/verify") && /wasn't found/.test(String(verifyUnknown)), JSON.stringify({ verified, verifyUnknown }));
  await bkApi.restore("content.zip", { createMissing: true });
  const restoredContent = (await bkApi.list()).find((b) => b.key === "content.zip");
  check("backups: a data restore sends createMissing when asked, and the listing then carries the restore report", backupCalls.includes('POST /api/backups/content.zip/restore {"createMissing":true}') && restored.at(-1) === "content.zip" && restoredContent?.restore?.kind === "data" && restoredContent.restore.created.length === 1 && restoredContent.restore.skipped.length === 0 && restoredContent.restore.settings === false, JSON.stringify({ calls: backupCalls.slice(-2), restore: restoredContent?.restore }));
  await bkApi.restore("content.zip");
  check("backups: without the option a restore sends no body, and a skipped collection is reported with its reason", backupCalls.at(-1) === "POST /api/backups/content.zip/restore" && (await bkApi.list()).find((b) => b.key === "content.zip")?.restore?.skipped[0]?.collection === "tags", JSON.stringify(backupCalls.slice(-1)));
  await bkApi.remove("content.zip");

  // ---- superusers: the instance's _superusers, with the same session; the last one stays
  const suApi = client.superusers(reachable, session);
  const su0 = await suApi.list();
  const lastOne = await suApi.remove("su1").then(() => "removed", (e) => (e instanceof Error ? e.message : String(e)));
  check("superusers: the owner is listed, and the last superuser is not removed", su0.length === 1 && su0[0]!.email === "owner@example.com" && /last superuser stays/.test(String(lastOne)) && superusers.length === 1, String(lastOne));
  const badEmail = await suApi.add("nope", "long-enough-1").then(() => "added", (e) => (e instanceof Error ? e.message : String(e)));
  const shortPw = await suApi.add("second@example.com", "short").then(() => "added", (e) => (e instanceof Error ? e.message : String(e)));
  const added = await suApi.add("second@example.com", "second-password-1");
  check("superusers: a bad email or a short password is refused here; a good one is created with passwordConfirm", /email address/.test(String(badEmail)) && /8 characters/.test(String(shortPw)) && added.email === "second@example.com" && (await suApi.list()).length === 2, JSON.stringify({ badEmail, shortPw, added }));
  await suApi.remove("su1");
  const su2 = await suApi.list();
  check("superusers: with two, the first can go", su2.length === 1 && su2[0]!.email === "second@example.com", JSON.stringify(su2));

  // ---- payments: the plugin's three collections read with the same session; the counts, and the latest payments newest first
  const pay = await client.payments(reachable, session).summary();
  const payQuery = paymentCalls.filter((c) => c.startsWith("/api/collections/payments/records?")).map((c) => new URLSearchParams(c.split("?")[1]));
  check("payments: the counts of customers, subscriptions and payments, and the latest payments newest first with amount, currency, status and date", pay.customers === 2 && pay.subscriptions === 1 && pay.payments === 3 && pay.latest.length === 3 && pay.latest[0]!.id === "p3" && pay.latest[0]!.amount === 1999 && pay.latest[0]!.currency === "usd" && pay.latest[0]!.status === "succeeded" && pay.latest[0]!.created.startsWith("2026-09-06") && pay.latest[0]!.subscription === "s1", JSON.stringify(pay));
  check("payments: ten at most, sorted -created, the fields the panel shows; the counts cost one row each", payQuery.length === 1 && payQuery[0]!.get("perPage") === "10" && payQuery[0]!.get("sort") === "-created" && (payQuery[0]!.get("fields") ?? "").includes("amount") && paymentCalls.filter((c) => c.startsWith("/api/collections/customers/")).every((c) => new URLSearchParams(c.split("?")[1]).get("perPage") === "1"), JSON.stringify(paymentCalls));
  const payStale = await client.payments(reachable, "stale").summary().then(() => "listed", (e) => (e instanceof Error ? e.message : String(e)));
  check("payments: a stale session is the instance's refusal", /valid record authorization/.test(String(payStale)), String(payStale));
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

  // ---- custom domains: the account's zones, a hostname put on the Worker, taken off again
  const domApi = client.domains(inst);
  const zones = await domApi.zones();
  const attached = await domApi.attach("Shop.example.com");
  const attachedAgain = await domApi.attach("shop.example.com");
  const stDom = await cfState();
  check("domains: the account's zones are listed; a hostname is attached to the Worker on its zone, once", zones.some((z) => z.name === "example.com") && attached.created === true && attached.hostname === "shop.example.com" && attached.zone_id === "zone123" && attached.service === "vb-my-shop" && attachedAgain.created === false && attachedAgain.id === attached.id && stDom.domains.length === 1 && stDom.domains[0].environment === "production", JSON.stringify({ zones, attached, again: attachedAgain.created, domains: stDom.domains }));
  const listedDom = await domApi.list();
  const noZone = await domApi.attach("api.nozone.test").then(() => "attached", (e) => (e instanceof Error ? e.message : String(e)));
  const badHost = await domApi.attach("not a host").then(() => "attached", (e) => (e instanceof Error ? e.message : String(e)));
  check("domains: the Worker's domains are listed; a hostname off the account's zones or malformed is refused", listedDom.length === 1 && listedDom[0]!.hostname === "shop.example.com" && /no zone on account/.test(String(noZone)) && /hostname like/.test(String(badHost)), JSON.stringify({ listedDom, noZone, badHost }));
  await domApi.detach(attached.id);
  check("domains: detached, the Worker has none", (await domApi.list()).length === 0 && (await cfState()).domains.length === 0);

  // ---- the domains plugin on an instance with no repository: nothing here can run a deploy, so the two vars the
  // plugin would bake go on the Worker itself and each hostname is attached here, which is what its `after` does
  const setWorker = await client.setDomains(inst, "Shop.example.com, www.shop.example.com", null);
  const stSet = await cfState();
  const workerSecrets = (stSet.scripts["vb-my-shop"]?.secrets ?? []) as string[];
  check("domains without a repository: the plugin's own vars go on the Worker and each hostname is attached here, the first canonical", setWorker.via === "worker" && setWorker.canonical === "shop.example.com" && setWorker.hostnames.length === 2 && workerSecrets.includes("VOIDBASE_DOMAINS") && workerSecrets.includes("VOIDBASE_CANONICAL_DOMAIN") && stSet.domains.length === 2 && stSet.domains.every((d: { service: string }) => d.service === "vb-my-shop"), JSON.stringify({ setWorker, secrets: workerSecrets, domains: stSet.domains.map((d: { hostname: string }) => d.hostname) }));
  const setFewer = await client.setDomains(inst, ["shop.example.com"], null);
  const stFewer = await cfState();
  check("domains without a repository: the list is the whole list, so a hostname it no longer names comes off the Worker", setFewer.hostnames.length === 1 && stFewer.domains.length === 1 && stFewer.domains[0].hostname === "shop.example.com", JSON.stringify(stFewer.domains));
  const badSet = await client.setDomains(inst, "not a host", null).then(() => "set", (e) => (e instanceof Error ? e.message : String(e)));
  check("domains: a malformed hostname is refused before anything is written", /is not a hostname/.test(String(badSet)), String(badSet));
  await client.setDomains(inst, [], null);
  check("domains: with none named, nothing stays attached and the vars come off the Worker", (await domApi.list()).length === 0 && !(((await cfState()).scripts["vb-my-shop"]?.secrets ?? []) as string[]).includes("VOIDBASE_DOMAINS"));

  // ---- secrets: names on the Worker; the ones this site manages are listed and left alone
  const secApi = client.secrets(inst);
  const sec0 = await secApi.list();
  check("secrets: the Worker's secret names, the wired ones marked managed", sec0.some((s) => s.name === "VOIDBASE_GH_TOKEN" && s.managed) && sec0.some((s) => s.name === "VOIDBASE_PROJECT_REPO" && s.managed), JSON.stringify(sec0));
  await secApi.set("MY_API_KEY", "shh");
  const sec1 = await secApi.list();
  const guardSet = await secApi.set("VOIDBASE_GH_TOKEN", "x").then(() => "set", (e) => (e instanceof Error ? e.message : String(e)));
  const guardDel = await secApi.remove("VOIDBASE_SUPERUSER_PASSWORD").then(() => "removed", (e) => (e instanceof Error ? e.message : String(e)));
  const badName = await secApi.set("1bad name", "x").then(() => "set", (e) => (e instanceof Error ? e.message : String(e)));
  const secScript = (await cfState()).scripts["vb-my-shop"];
  check("secrets: a secret is set by name on the Worker; managed names and bad names are refused before any call", sec1.some((s) => s.name === "MY_API_KEY" && !s.managed) && (secScript?.secrets ?? []).includes("MY_API_KEY") && /managed by voidbase.cloud/.test(String(guardSet)) && /managed by voidbase.cloud/.test(String(guardDel)) && /letters, digits and underscores/.test(String(badName)) && (secScript?.secrets ?? []).includes("VOIDBASE_GH_TOKEN"), JSON.stringify({ sec1, guardSet, guardDel, badName }));
  await secApi.remove("MY_API_KEY");
  check("secrets: removed by name, the managed ones still there", !(await secApi.list()).some((s) => s.name === "MY_API_KEY") && ((await cfState()).scripts["vb-my-shop"]?.secrets ?? []).includes("VOIDBASE_PROJECT_BRANCH"));
  const pipeline = await client.pipelineOf(inst);
  // the mock's Builds API takes user tokens only, as the live one does, and the mock's OAuth token is account-shaped: unreadable here, so null
  check("the pipeline check: readable or not, the link goes to the Worker's Builds settings", (pipeline.connected === false || pipeline.connected === null) && pipeline.link === "https://dash.cloudflare.com/acc123/workers/services/view/vb-my-shop/settings", JSON.stringify(pipeline));
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

  // ---- the domains plugin on a project: the knob committed where that instance's deploy reads it, and the push deploys
  const declaration = `// the project's configuration\nimport { defineSecrets, secret, string } from "@voidbase-cloud/voidbase/secrets";\n\nexport default defineSecrets({\n  VOIDBASE_SUPERUSER_EMAIL: secret(string()),\n});\n`;
  await fetch(`${GH}/__files`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "octo-tester/existing", files: { "vb_secrets/main.ts": declaration } }) });
  await fetch(`${GH}/__files`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ full_name: "octo-tester/my-site", files: { "README.md": "# my site\n" } }) });
  const project = { fullName: "octo-tester/existing", branch: "master" };
  const committed = await client.setDomains(inst, "Shop.example.com, www.shop.example.com", project);
  const ghDom = (await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const declared = String(ghDom.files["octo-tester/existing"]?.["vb_secrets/main.ts"] ?? "");
  check("domains with a repository: one commit writes VOIDBASE_DOMAINS into the project's secrets declaration, where its deploy reads it, with server added to the import", committed.via === "repository" && !!committed.commit?.sha && committed.commit?.path === "vb_secrets/main.ts" && declared.includes('VOIDBASE_DOMAINS: server(string().default("shop.example.com,www.shop.example.com")') && /import \{ defineSecrets, secret, string, server \}/.test(declared) && ghDom.commits.at(-1).message === "domains: shop.example.com, www.shop.example.com", JSON.stringify({ commit: committed.commit, declared }).slice(0, 400));
  await client.setDomains(inst, ["shop.example.com"], project);
  const declared2 = String((((await fetch(`${GH}/__state`).then((r) => r.json())) as Record<string, any>).files["octo-tester/existing"]?.["vb_secrets/main.ts"] ?? "")); // eslint-disable-line @typescript-eslint/no-explicit-any
  const declaredAgain = await client.setDomains(inst, ["shop.example.com"], project);
  check("domains with a repository: the declared line is replaced rather than added a second time, and declaring what is already there is no commit", (declared2.match(/VOIDBASE_DOMAINS/g) ?? []).length === 1 && declared2.includes('.default("shop.example.com")') && declaredAgain.commit?.sha === "", JSON.stringify({ declared2, again: declaredAgain.commit }).slice(0, 300));
  const noDeclaration = await client.setDomains(inst, ["shop.example.com"], { fullName: "octo-tester/my-site", branch: "main" }).then(() => "committed", (e) => (e instanceof Error ? e.message : String(e)));
  check("domains with a repository that declares nothing: refused, naming the file it would have written, and nothing is attached from here", /has no vb_secrets\/main\.ts/.test(String(noDeclaration)) && (await cfState()).domains.length === 0, String(noDeclaration));

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
