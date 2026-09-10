// voidbase.cloud, for real, the way the page does it: the browser client against the deployed site, creating,
// upgrading and deleting a throwaway instance in the real account through the site's pass-through.
//   bun test/cloud-provision.ts [--cloud https://voidbase.cloud] [--keep]      (bun run provision)
// Run it when the provisioning path changed; the routine proof is `bun run live`, the demo's installer. A throwaway
// user with a Cloudflare connection is made the way the sign-in would make one (the deploy key, sealed with the
// site's encryption key), a `users` session is minted for it through PocketBase's impersonation endpoint, and the
// client runs with that session. Credentials come from this checkout (.voidbase/pb_data/.superuser-credentials,
// vb_secrets/secrets.json) or the environment (VB_LIVE_SUPERUSER_EMAIL, VB_LIVE_SUPERUSER_PASSWORD,
// VOIDBASE_DEPLOY_CF_API_KEY, VOIDBASE_ENCRYPTION_KEY).
import { sealSecret } from "@voidbase-cloud/voidbase/cloud";
import { CloudClient, CloudError } from "../src/lib/cloud";

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const CP = (flag("cloud") ?? "https://voidbase.cloud").replace(/\/+$/, "");
const KEEP = args.includes("--keep");
const NAME = "provision-test";
const ua = { "user-agent": "voidbase-cloud-provision/1" };
const readJson = async (path: string) => ((await Bun.file(path).exists()) ? (JSON.parse(await Bun.file(path).text()) as Record<string, string>) : {});
const secretsFile = await readJson("vb_secrets/secrets.json");
const secrets = { VOIDBASE_DEPLOY_CF_API_KEY: process.env.VOIDBASE_DEPLOY_CF_API_KEY || secretsFile.VOIDBASE_DEPLOY_CF_API_KEY || "", VOIDBASE_ENCRYPTION_KEY: process.env.VOIDBASE_ENCRYPTION_KEY || secretsFile.VOIDBASE_ENCRYPTION_KEY || "" };
const suFile = await readJson(".voidbase/pb_data/.superuser-credentials");
const su = { email: process.env.VB_LIVE_SUPERUSER_EMAIL || suFile.email || "", password: process.env.VB_LIVE_SUPERUSER_PASSWORD || suFile.password || "" };
for (const [k, v] of Object.entries({ VOIDBASE_DEPLOY_CF_API_KEY: secrets.VOIDBASE_DEPLOY_CF_API_KEY, VOIDBASE_ENCRYPTION_KEY: secrets.VOIDBASE_ENCRYPTION_KEY, superuser: su.email && su.password })) if (!v) { console.error(`${k}: not in this checkout's files nor in the environment`); process.exit(2); }
let pass = 0, fail = 0; const t0 = Date.now();
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${Math.round((Date.now() - t0) / 1000)}s] ${label}${ok ? "" : "  " + detail}`); };
const api = async (method: string, path: string, body?: unknown, token?: string) => { const r = await fetch(CP + path, { method, headers: { "content-type": "application/json", ...ua, ...(token ? { authorization: token } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined }); let json: any = {}; try { json = await r.json(); } catch { /* no body */ } return { status: r.status, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
async function accountOf(key: string): Promise<string> { const r = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers: { authorization: `Bearer ${key}` } }); const j = (await r.json()) as { result?: { id: string }[] }; return j.result?.[0]?.id ?? ""; }
const account = await accountOf(secrets.VOIDBASE_DEPLOY_CF_API_KEY);

const SU = (await api("POST", "/api/collections/_superusers/auth-with-password", { identity: su.email, password: su.password })).json.token as string | undefined;
if (!SU) { console.error(`cannot sign in to ${CP} as ${su.email}`); process.exit(2); }
const email = `${NAME}@voidbase.cloud`;
const findUser = async () => (await api("GET", `/api/collections/users/records?filter=${encodeURIComponent(`email='${email}'`)}&fields=id`, undefined, SU)).json.items?.[0];
let user = await findUser();
if (!user) { const password = crypto.randomUUID() + crypto.randomUUID(); user = (await api("POST", "/api/collections/users/records", { email, password, passwordConfirm: password, name: NAME, verified: true }, SU)).json; }
const connectionOf = async () => (await api("GET", `/api/collections/cf_connections/records?filter=${encodeURIComponent(`user='${user.id}'`)}&fields=id`, undefined, SU)).json.items?.[0];
const existing = await connectionOf();
const conn = { user: user.id, cf_user_id: NAME, email, name: NAME, access_token: await sealSecret(secrets.VOIDBASE_DEPLOY_CF_API_KEY, secrets.VOIDBASE_ENCRYPTION_KEY), refresh_token: "", expiry: "2030-01-01 00:00:00.000Z", scopes: "deploy key", accounts: [{ id: account, name: "voidbase" }] };
const stored = existing ? await api("PATCH", `/api/collections/cf_connections/records/${existing.id}`, conn, SU) : await api("POST", "/api/collections/cf_connections/records", conn, SU);
check("a user with a Cloudflare connection exists, the way the sign-in would have made it", stored.status === 200 && !!user.id, JSON.stringify(stored.json).slice(0, 200));
const U = (await api("POST", `/api/collections/users/impersonate/${user.id}`, { duration: 3600 }, SU)).json.token as string;
const me = await api("GET", "/api/vbcloud/me", undefined, U);
check("impersonated session sees the connection", me.status === 200 && me.json.connected === true, JSON.stringify(me.json).slice(0, 200));
const client = new CloudClient(CP, () => U);
const accounts = await client.cf().json<{ id: string; name: string }[]>("GET", "/accounts");
check("the browser client reaches Cloudflare through the site's pass-through, in the user's account", accounts.result?.[0]?.id === account, JSON.stringify(accounts).slice(0, 200));

let inst: Awaited<ReturnType<CloudClient["createInstance"]>>["instance"] | null = null;
async function cleanup() {
  if (inst && !KEEP) { const del = await client.deleteInstance(inst).catch((e) => ({ deleted: [], skipped: [], errors: [e instanceof Error ? e.message : String(e)], log: [] })); check("delete, from the client: the Worker, its D1, bucket and queue are removed from the account", del.errors.length === 0 && del.deleted.length >= 3, JSON.stringify(del).slice(0, 300)); }
  if (!KEEP) { const row = await connectionOf(); if (row) await api("DELETE", `/api/collections/cf_connections/records/${row.id}`, undefined, SU); await api("DELETE", `/api/collections/users/records/${user.id}`, undefined, SU); }
}
try {
  const stale = ((await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances ?? []).find((i: { name: string }) => i.name === `vb-${NAME}`);
  if (stale) { await client.deleteInstance(stale).catch(() => null); console.log("removed a stale instance from an earlier run"); }
  let created: Awaited<ReturnType<CloudClient["createInstance"]>>;
  try { created = await client.createInstance({ name: NAME, account: { id: account, name: "voidbase" }, owner: user.id, superuserEmail: email, prefix: String(me.json.prefix ?? "vb-") }); }
  catch (e) { check("one click, from the client: an instance is created on the real account", false, `${e instanceof Error ? e.message : e} ${e instanceof CloudError ? e.log.slice(-3).join(" | ") : ""}`); throw e; }
  inst = created.instance;
  check("one click, from the client: an instance is created on the real account, live, on the active release", inst.status === "live" && !!inst.url && !!inst.release && String(created.credentials.superuserPassword).length === 24, JSON.stringify(inst).slice(0, 300));
  let healthy = 0; for (let i = 0; i < 12 && healthy !== 200; i++) { healthy = await fetch(`${inst.url}/api/health`, { headers: ua }).then((r) => r.status).catch(() => 0); if (healthy !== 200) await Bun.sleep(5000); }
  check("the instance answers", healthy === 200, String(healthy));
  const session = await client.instanceSession(inst, email, created.credentials.superuserPassword!);
  const running = await client.plugins(inst, session).running();
  check("the owner signs in to the instance from the client; the instance says its plugins are fixed (no repository yet)", !!session && running.installer?.mode === "fixed" && running.names.includes("installer"), JSON.stringify(running).slice(0, 300));
  const up = await client.upgradeInstance(inst);
  check("upgrade to the active release: already on it", up.upgraded === false && up.from === up.to, JSON.stringify(up));
  const listed = ((await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances ?? []).find((i: { id: string }) => i.id === inst!.id);
  check("the site lists the row the client wrote", !!listed && listed.name === inst.name && listed.canDelete === true, JSON.stringify(listed).slice(0, 200));
} finally {
  await cleanup();
  console.log(`\n${pass} passed, ${fail} failed${KEEP ? " (kept: the instance and the test user)" : ""}`);
  process.exit(fail ? 1 : 0);
}
