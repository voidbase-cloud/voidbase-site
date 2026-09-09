// The cloud control plane, for real, on the deployed site: this is what voidbase.cloud is for.
//
//   bun test/cloud-live.ts [--cloud https://voidbase.cloud] [--keep]      (bun run live)
//
// A throwaway user with a Cloudflare connection is made the way the sign-in would make one (the deploy key, sealed
// with the site's encryption key), a `users` session is minted for it through PocketBase's impersonation endpoint,
// and the whole loop runs against real Cloudflare: an instance is created in the account, `echo` is installed from
// the throwaway marketplace, the control plane starts the builder's Cloudflare build, the instance is watched until
// that release is deployed, the plugin is asked to answer on the instance itself, and everything is deleted again.
// Nothing here is a mock; a failure is a real one. Run it by hand from a maintainer's machine after a change to
// anything cloud-shaped; the credentials come from this checkout's files (.voidbase/pb_data/.superuser-credentials,
// which a deploy from here writes, and vb_secrets/secrets.json) or from the environment (VB_LIVE_SUPERUSER_EMAIL,
// VB_LIVE_SUPERUSER_PASSWORD, VOIDBASE_DEPLOY_CF_API_KEY, VOIDBASE_ENCRYPTION_KEY).
import { sealSecret } from "@voidbase-cloud/voidbase/cloud";

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const CP = (flag("cloud") ?? "https://voidbase.cloud").replace(/\/+$/, "");
const KEEP = args.includes("--keep");
const MARKET = "https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace/master";
const NAME = "plugin-test";
const ua = { "user-agent": "voidbase-cloud-live/2" };
const readJson = async (path: string) => ((await Bun.file(path).exists()) ? (JSON.parse(await Bun.file(path).text()) as Record<string, string>) : {});
const secretsFile = await readJson("vb_secrets/secrets.json");
const secrets = { VOIDBASE_DEPLOY_CF_API_KEY: process.env.VOIDBASE_DEPLOY_CF_API_KEY || secretsFile.VOIDBASE_DEPLOY_CF_API_KEY || "", VOIDBASE_ENCRYPTION_KEY: process.env.VOIDBASE_ENCRYPTION_KEY || secretsFile.VOIDBASE_ENCRYPTION_KEY || "", VOIDBASE_ACCOUNT_ID: process.env.VOIDBASE_ACCOUNT_ID || secretsFile.VOIDBASE_ACCOUNT_ID || "" };
const suFile = await readJson(".voidbase/pb_data/.superuser-credentials");
const su = { email: process.env.VB_LIVE_SUPERUSER_EMAIL || suFile.email || "", password: process.env.VB_LIVE_SUPERUSER_PASSWORD || suFile.password || "" };
for (const [k, v] of Object.entries({ VOIDBASE_DEPLOY_CF_API_KEY: secrets.VOIDBASE_DEPLOY_CF_API_KEY, VOIDBASE_ENCRYPTION_KEY: secrets.VOIDBASE_ENCRYPTION_KEY, superuser: su.email && su.password })) if (!v) { console.error(`${k}: not in this checkout's files and not in the environment`); process.exit(2); }
let pass = 0, fail = 0; const t0 = Date.now();
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${Math.round((Date.now() - t0) / 1000)}s] ${label}${ok ? "" : "  " + detail}`); };
const api = async (method: string, path: string, body?: unknown, token?: string) => { const r = await fetch(CP + path, { method, headers: { "content-type": "application/json", ...ua, ...(token ? { authorization: token } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined }); const t = await r.text(); let json: any = {}; try { json = JSON.parse(t); } catch { json = { raw: t.slice(0, 200) }; } return { status: r.status, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
async function accountOf(key: string): Promise<string> { const r = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers: { authorization: `Bearer ${key}` } }); const j = (await r.json()) as { result?: { id: string }[] }; return j.result?.[0]?.id ?? ""; }
const account = secrets.VOIDBASE_ACCOUNT_ID || (await accountOf(secrets.VOIDBASE_DEPLOY_CF_API_KEY));

const SU = (await api("POST", "/api/collections/_superusers/auth-with-password", { identity: su.email, password: su.password })).json.token as string | undefined;
if (!SU) { console.error(`cannot sign in to ${CP} as ${su.email}`); process.exit(2); }
const email = `${NAME}@voidbase.cloud`;
const findUser = async () => (await api("GET", `/api/collections/users/records?filter=${encodeURIComponent(`email='${email}'`)}&fields=id`, undefined, SU)).json.items?.[0];
let user = await findUser();
if (!user) { const password = crypto.randomUUID() + crypto.randomUUID(); user = (await api("POST", "/api/collections/users/records", { email, password, passwordConfirm: password, name: NAME, verified: true }, SU)).json; }
const connectionOf = async () => (await api("GET", `/api/collections/cf_connections/records?filter=${encodeURIComponent(`user='${user.id}'`)}&fields=id`, undefined, SU)).json.items?.[0];
const existing = await connectionOf();
const conn = { user: user.id, cf_user_id: NAME, email, name: NAME, access_token: await sealSecret(secrets.VOIDBASE_DEPLOY_CF_API_KEY, secrets.VOIDBASE_ENCRYPTION_KEY), refresh_token: "", expiry: "2030-01-01 00:00:00.000Z", scopes: "deploy key", accounts: [{ id: account, name: "deploy key" }] };
const stored = existing ? await api("PATCH", `/api/collections/cf_connections/records/${existing.id}`, conn, SU) : await api("POST", "/api/collections/cf_connections/records", conn, SU);
check("a user with a Cloudflare connection exists, the way the sign-in would have made it", stored.status === 200 && !!user.id, JSON.stringify(stored.json).slice(0, 200));
const U = (await api("POST", `/api/collections/users/impersonate/${user.id}`, { duration: 3600 }, SU)).json.token as string;
const me = await api("GET", "/api/vbcloud/me", undefined, U);
check("impersonated session sees the connection", me.status === 200 && me.json.connected === true, JSON.stringify(me.json).slice(0, 200));

const instances = async () => ((await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
let inst: any = null; let instSu: { email: string; password: string } | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any

async function create() {
  const stale = (await instances()).find((i) => i.name === `vb-${NAME}`);
  if (stale) { await api("DELETE", `/api/vbcloud/instances/${stale.id}`, undefined, U); console.log("removed a stale instance from an earlier run"); }
  const created = await api("POST", "/api/vbcloud/instances", { name: NAME, account }, U);
  inst = created.json.instance; instSu = created.json.credentials ? { email: created.json.credentials.superuserEmail, password: created.json.credentials.superuserPassword } : null;
  check("one click: an instance is created on the real account, live, on the active release", created.status === 200 && inst?.status === "live" && !!inst?.url && !!inst?.release, JSON.stringify(created.json).slice(0, 400));
  if (!inst?.url) throw new Error("no instance");
  // a new workers.dev hostname can take a little while to answer after the upload; the instance is live before its name is
  let healthy = 0; for (let i = 0; i < 12 && healthy !== 200; i++) { healthy = (await fetch(`${inst.url}/api/health`, { headers: ua }).then((r) => r.status).catch(() => 0)); if (healthy !== 200) await Bun.sleep(5000); }
  check("the instance answers", healthy === 200, String(healthy));
  check("its /api/echo is a 404 before the plugin", (await fetch(`${inst.url}/api/echo`, { headers: ua })).status === 404);
  const added = await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { add: [{ name: "echo", marketplace: MARKET }] }, U);
  check("installing echo from a marketplace that is not ours records it and queues a build", added.status === 200 && added.json.build === "queued" && added.json.plugins?.[0]?.name === "echo", JSON.stringify(added.json).slice(0, 300));
  check("the control plane started the builder's Cloudflare build itself", added.json.builderStarted === true, JSON.stringify(added.json).slice(0, 200));
}

/** the build's outcome: the instance's build state and release, polled until the builder has spoken */
async function outcome(tries: number) {
  let final: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 0; i < tries && !final; i++) {
    const v = await api("GET", `/api/vbcloud/instances/${inst.id}/plugins`, undefined, U);
    const state = v.json.build ?? "";
    if (state === "failed" || (!state && /-vb-plugin-test\.[a-z0-9]+$/.test(String(v.json.instance?.release ?? "")))) { final = v.json; break; }
    await Bun.sleep(20000);
  }
  return final;
}

async function verify(final: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  check("the builder built a release for this instance and the control plane deployed it", !!final && final.build === "" && /-vb-plugin-test\.[a-z0-9]+$/.test(String(final.instance?.release)), JSON.stringify(final).slice(0, 300));
  const echo = await fetch(`${inst.url}/api/echo`, { headers: ua });
  check("the plugin answers on the instance", echo.status === 200 && (await echo.text()) === "echo", String(echo.status));
  if (instSu) {
    const login = await fetch(`${inst.url}/api/collections/_superusers/auth-with-password`, { method: "POST", headers: { "content-type": "application/json", ...ua }, body: JSON.stringify({ identity: instSu.email, password: instSu.password }) });
    const tok = ((await login.json()) as { token?: string }).token ?? "";
    const plugins = (await (await fetch(`${inst.url}/api/plugins`, { headers: { ...ua, authorization: tok } })).json()) as { names?: string[]; origins?: Record<string, string> };
    check("the instance says where echo came from", plugins.names?.includes("echo") === true && String(plugins.origins?.echo).startsWith(MARKET), JSON.stringify(plugins).slice(0, 300));
    // echo 0.2.0 owns the echoes collection and creates it at bootstrap: the built instance has the table, made by the plugin
    const owned = await fetch(`${inst.url}/api/collections/echoes`, { headers: { ...ua, authorization: tok } });
    check("the collection the plugin owns exists on the instance, created by the plugin", owned.status === 200 && ((await owned.json()) as { name?: string }).name === "echoes", String(owned.status));
  }
  const up = await api("POST", `/api/vbcloud/instances/${inst.id}/upgrade`, undefined, U);
  check("an upgrade of an instance with plugins is a rebuild, not a bare re-provision", up.status === 200 && up.json.upgraded === false && (up.json.queued === true || /Already built/.test(up.json.message ?? "")), JSON.stringify(up.json).slice(0, 200));
  if (up.json.queued) await api("POST", `/api/vbcloud/builds/${inst.id}/failed`, { error: "cancelled by test/cloud-live.ts before the cleanup" }, SU);
}

async function cleanup() {
  if (inst && !KEEP) {
    const del = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
    check("delete: the Worker, its D1, bucket and queue are removed from the account", del.status === 200 && (del.json.errors ?? []).length === 0, JSON.stringify(del.json).slice(0, 300));
  }
  if (!KEEP) {
    const row = await connectionOf();
    if (row) await api("DELETE", `/api/collections/cf_connections/records/${row.id}`, undefined, SU);
    await api("DELETE", `/api/collections/users/records/${user.id}`, undefined, SU);
  }
}

try {
  await create();
  await verify(await outcome(90));
} finally {
  await cleanup();
  console.log(`\n${pass} passed, ${fail} failed${KEEP ? " (kept: the instance and the test user)" : ""}`);
}
process.exit(fail ? 1 : 0);
