// The cloud control plane, for real, on the deployed site: this is what voidbase.cloud is for.
//
//   bun test/cloud-live.ts [--cloud https://voidbase.cloud] [--keep]
//
// A throwaway user with a Cloudflare connection is made the way the sign-in would make one (the deploy key from
// vb_secrets/secrets.json, sealed with the site's encryption key), a `users` session is minted for it through
// PocketBase's impersonation endpoint, and then the whole loop runs against real Cloudflare: an instance is created
// in the account, `echo` is installed from the throwaway marketplace, the builder workflow is run now rather than on
// its schedule, the instance is watched until the builder's release is deployed, the plugin is asked to answer on the
// instance itself, and everything is deleted again. Needs the site's superuser credentials
// (.voidbase/pb_data/.superuser-credentials, which a deploy from this checkout writes), vb_secrets/secrets.json, and
// `gh` signed in with access to voidbase-cloud/voidbase. Nothing here is a mock; a failure is a real one.
import { sealSecret } from "@voidbase-cloud/voidbase/cloud";

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const CP = (flag("cloud") ?? "https://voidbase.cloud").replace(/\/+$/, "");
const KEEP = args.includes("--keep");
const MARKET = "https://raw.githubusercontent.com/voidbase-cloud/voidbase-throwaway-marketplace/master";
const NAME = "plugin-test";
const ua = { "user-agent": "voidbase-cloud-live/1" };
const secrets = JSON.parse(await Bun.file("vb_secrets/secrets.json").text()) as Record<string, string>;
const su = JSON.parse(await Bun.file(".voidbase/pb_data/.superuser-credentials").text()) as { email: string; password: string };
const account = secrets.VOIDBASE_ACCOUNT_ID || (await accountOf(secrets.VOIDBASE_DEPLOY_CF_API_KEY));
let pass = 0, fail = 0; const t0 = Date.now();
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  [${Math.round((Date.now() - t0) / 1000)}s] ${label}${ok ? "" : "  " + detail}`); };
const api = async (method: string, path: string, body?: unknown, token?: string) => { const r = await fetch(CP + path, { method, headers: { "content-type": "application/json", ...ua, ...(token ? { authorization: token } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined }); const t = await r.text(); let json: any = {}; try { json = JSON.parse(t); } catch { json = { raw: t.slice(0, 200) }; } return { status: r.status, json }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
const sh = (cmd: string[]) => { const p = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" }); return { code: p.exitCode, out: (p.stdout.toString() + p.stderr.toString()).trim() }; };
async function accountOf(key: string): Promise<string> { const r = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers: { authorization: `Bearer ${key}` } }); const j = (await r.json()) as { result?: { id: string }[] }; return j.result?.[0]?.id ?? ""; }

const SU = (await api("POST", "/api/collections/_superusers/auth-with-password", { identity: su.email, password: su.password })).json.token as string | undefined;
if (!SU) { console.error(`cannot sign in to ${CP} as ${su.email}`); process.exit(2); }
const email = `${NAME}@voidbase.cloud`;
let user = (await api("GET", `/api/collections/users/records?filter=${encodeURIComponent(`email='${email}'`)}&fields=id`, undefined, SU)).json.items?.[0];
if (!user) { const password = crypto.randomUUID() + crypto.randomUUID(); user = (await api("POST", "/api/collections/users/records", { email, password, passwordConfirm: password, name: NAME, verified: true }, SU)).json; }
const existing = (await api("GET", `/api/collections/cf_connections/records?filter=${encodeURIComponent(`user='${user.id}'`)}&fields=id`, undefined, SU)).json.items?.[0];
const conn = { user: user.id, cf_user_id: NAME, email, name: NAME, access_token: await sealSecret(secrets.VOIDBASE_DEPLOY_CF_API_KEY, secrets.VOIDBASE_ENCRYPTION_KEY), refresh_token: "", expiry: "2030-01-01 00:00:00.000Z", scopes: "deploy key", accounts: [{ id: account, name: "deploy key" }] };
const stored = existing ? await api("PATCH", `/api/collections/cf_connections/records/${existing.id}`, conn, SU) : await api("POST", "/api/collections/cf_connections/records", conn, SU);
check("a user with a Cloudflare connection exists, the way the sign-in would have made it", stored.status === 200 && !!user.id, JSON.stringify(stored.json).slice(0, 200));
const U = (await api("POST", `/api/collections/users/impersonate/${user.id}`, { duration: 3600 }, SU)).json.token as string;
const me = await api("GET", "/api/vbcloud/me", undefined, U);
check("impersonated session sees the connection", me.status === 200 && me.json.connected === true, JSON.stringify(me.json).slice(0, 200));

let inst: any = null; let instSu: { email: string; password: string } | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let runId = "";
try {
  const stale = ((await api("GET", "/api/vbcloud/instances", undefined, U)).json.instances ?? []).find((i: any) => i.name === `vb-${NAME}`); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (stale) { await api("DELETE", `/api/vbcloud/instances/${stale.id}`, undefined, U); console.log("removed a stale instance from an earlier run"); }
  const created = await api("POST", "/api/vbcloud/instances", { name: NAME, account }, U);
  inst = created.json.instance; instSu = created.json.credentials ? { email: created.json.credentials.superuserEmail, password: created.json.credentials.superuserPassword } : null;
  check("one click: an instance is created on the real account, live, on the active release", created.status === 200 && inst?.status === "live" && !!inst?.url && !!inst?.release, JSON.stringify(created.json).slice(0, 400));
  if (!inst?.url) throw new Error("no instance");
  check("the instance answers", (await fetch(`${inst.url}/api/health`, { headers: ua })).status === 200);
  check("its /api/echo is a 404 before the plugin", (await fetch(`${inst.url}/api/echo`, { headers: ua })).status === 404);
  const added = await api("POST", `/api/vbcloud/instances/${inst.id}/plugins`, { add: [{ name: "echo", marketplace: MARKET }] }, U);
  check("installing echo from a marketplace that is not ours records it and queues a build", added.status === 200 && added.json.build === "queued" && added.json.plugins?.[0]?.name === "echo", JSON.stringify(added.json).slice(0, 300));
  const run = sh(["gh", "workflow", "run", "instance-build.yml", "-R", "voidbase-cloud/voidbase"]);
  check("the builder workflow can be started now rather than on its schedule", run.code === 0, run.out);
  await Bun.sleep(15000);
  runId = sh(["gh", "run", "list", "-R", "voidbase-cloud/voidbase", "--workflow", "instance-build", "--limit", "1", "--json", "databaseId", "-q", ".[0].databaseId"]).out;
  let final: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 0; i < 90 && !final; i++) {
    await Bun.sleep(20000);
    const v = await api("GET", `/api/vbcloud/instances/${inst.id}/plugins`, undefined, U);
    const state = v.json.build ?? ""; const rel = v.json.instance?.release ?? "";
    if (state === "failed") { final = v.json; break; }
    if (!state && rel !== inst.release) final = v.json;
  }
  check("the builder built a release for this instance and the control plane deployed it", !!final && final.build === "" && String(final.instance?.release).startsWith(`${inst.release}-vb-${NAME}.`), JSON.stringify(final).slice(0, 300));
  // the instance is deployed before the job that deployed it finishes its last steps, so wait for the run itself
  sh(["timeout", "300", "gh", "run", "watch", runId, "-R", "voidbase-cloud/voidbase", "--interval", "10"]);
  const wf = sh(["gh", "run", "view", runId, "-R", "voidbase-cloud/voidbase", "--json", "conclusion", "-q", ".conclusion"]).out;
  check("the workflow run succeeded", wf === "success", wf || "(still running)");
  const echo = await fetch(`${inst.url}/api/echo`, { headers: ua });
  check("the plugin answers on the instance", echo.status === 200 && (await echo.text()) === "echo", String(echo.status));
  if (instSu) {
    const login = await fetch(`${inst.url}/api/collections/_superusers/auth-with-password`, { method: "POST", headers: { "content-type": "application/json", ...ua }, body: JSON.stringify({ identity: instSu.email, password: instSu.password }) });
    const tok = ((await login.json()) as { token?: string }).token ?? "";
    const plugins = (await (await fetch(`${inst.url}/api/plugins`, { headers: { ...ua, authorization: tok } })).json()) as { names?: string[]; origins?: Record<string, string> };
    check("the instance says where echo came from", plugins.names?.includes("echo") === true && String(plugins.origins?.echo).startsWith(MARKET), JSON.stringify(plugins).slice(0, 300));
  }
  const up = await api("POST", `/api/vbcloud/instances/${inst.id}/upgrade`, undefined, U);
  check("an upgrade of an instance with plugins is a rebuild, not a bare re-provision", up.status === 200 && up.json.upgraded === false && (up.json.queued === true || /Already built/.test(up.json.message ?? "")), JSON.stringify(up.json).slice(0, 200));
  if (up.json.queued) { await api("POST", `/api/vbcloud/builds/${inst.id}/failed`, { error: "cancelled by test/cloud-live.ts before the cleanup" }, SU); }
} finally {
  if (inst && !KEEP) {
    const del = await api("DELETE", `/api/vbcloud/instances/${inst.id}`, undefined, U);
    check("delete: the Worker, its D1, bucket and queue are removed from the account", del.status === 200 && (del.json.errors ?? []).length === 0, JSON.stringify(del.json).slice(0, 300));
  }
  if (!KEEP) {
    const row = (await api("GET", `/api/collections/cf_connections/records?filter=${encodeURIComponent(`user='${user.id}'`)}&fields=id`, undefined, SU)).json.items?.[0];
    if (row) await api("DELETE", `/api/collections/cf_connections/records/${row.id}`, undefined, SU);
    await api("DELETE", `/api/collections/users/records/${user.id}`, undefined, SU);
  }
  console.log(`\n${pass} passed, ${fail} failed${KEEP ? " (kept: the instance and the test user)" : ""}`);
}
process.exit(fail ? 1 : 0);
