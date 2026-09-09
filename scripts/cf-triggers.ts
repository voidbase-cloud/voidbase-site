// This repository's Cloudflare Workers Builds triggers, declared here and applied through the Builds API, so the
// dashboard holds no logic and a rename cannot strand a build (a Worker rename gave the site new triggers once, and
// a stored uuid pointed at nothing: everything here goes by name).
//
//   bun scripts/cf-triggers.ts        ensure the two Workers' three triggers and their variables
//
//   voidbase-site (master)     every push to master: build and check, deploy, then the provisioning smoke on itself
//   voidbase-site (branches)   every other branch: build and check, nothing deployed
//   voidbase-live (nightly)    the nightly proof (test/cloud-live.ts --phase nightly: start, or check an hour later,
//                              decided from the control plane); never on push, the keeper cron starts it twice
//
// A Worker takes two triggers at most (12030) and refuses two with the same branch configuration (12042), so the
// nightly proof is one trigger on a second Worker, voidbase-live, a placeholder script that serves nothing; this
// creates it when it is missing and adopts whatever trigger it already has.
//
// Auth: CLOUDFLARE_BUILDS_TOKEN, a user API token with Workers Builds Configuration: Edit and Workers Scripts: Edit;
// CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) picks the account; WORKER defaults to voidbase-site, LIVE_WORKER to
// voidbase-live. Secrets found in the environment are stored on the triggers whose builds need them:
// VOIDBASE_DEPLOY_CF_API_KEY, VOIDBASE_ENCRYPTION_KEY, VB_LIVE_SUPERUSER_EMAIL and VB_LIVE_SUPERUSER_PASSWORD
// (master, whose deploy runs the smoke, and both live triggers). Variables a trigger already has stay unless named here.
const token = process.env.CLOUDFLARE_BUILDS_TOKEN ?? ""; const account = process.env.CF_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
if (!token || !account) { console.error("CLOUDFLARE_BUILDS_TOKEN and CF_ACCOUNT_ID are required"); process.exit(2); }
const WORKER = process.env.WORKER ?? "voidbase-site"; const LIVE = process.env.LIVE_WORKER ?? "voidbase-live";
const BUN_VERSION = "1.3.14";
const A = `https://api.cloudflare.com/client/v4/accounts/${account}`;

type Trigger = { trigger_uuid: string; trigger_name: string; repo_connection?: { repo_connection_uuid?: string }; build_token_uuid?: string; [k: string]: unknown };
type Vars = Record<string, { value: string; is_secret: boolean }>;
async function cf<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${A}${path}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { success?: boolean; result?: T; errors?: { code?: number; message?: string }[] };
  if (!r.ok || j.success === false) throw new Error(`${method} ${path}: ${r.status} ${j.errors?.map((e) => `${e.code} ${e.message}`).join("; ") || ""}`);
  return j.result as T;
}

const workers = async () => cf<{ id: string; tag: string }[]>("GET", "/workers/scripts");
const tag = (await workers()).find((s) => s.id === WORKER)?.tag;
if (!tag) { console.error(`no Worker ${WORKER} on account ${account}`); process.exit(1); }
const existing = await cf<Trigger[]>("GET", `/builds/workers/${tag}/triggers`);
const connection = existing.map((t) => t.repo_connection?.repo_connection_uuid).find(Boolean);
const buildToken = (await cf<{ build_token_uuid: string }[]>("GET", "/builds/tokens"))[0]?.build_token_uuid;
if (!connection || !buildToken) { console.error("the Worker needs a repository connection and a build token first (the dashboard's Builds setup, or `voidbase sync`)"); process.exit(1); }
// the placeholder Worker the nightly proof's triggers hang off; the first upload is the only one it ever gets
let liveTag = (await workers()).find((s) => s.id === LIVE)?.tag;
if (!liveTag) {
  const form = new FormData();
  form.set("metadata", new Blob([JSON.stringify({ main_module: "index.js", compatibility_date: "2026-01-01" })], { type: "application/json" }));
  form.set("index.js", new File([`export default { fetch: () => new Response("${LIVE}: the nightly proof's builds live here; nothing is served\\n") };`], "index.js", { type: "application/javascript+module" }));
  const r = await fetch(`${A}/workers/scripts/${LIVE}`, { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: form });
  if (!r.ok) { console.error(`creating the Worker ${LIVE}: ${r.status} ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  liveTag = (await workers()).find((s) => s.id === LIVE)?.tag; console.log(`created the Worker ${LIVE} (tag ${liveTag})`);
}
const liveExisting = await cf<Trigger[]>("GET", `/builds/workers/${liveTag}/triggers`);

const secret = (k: string) => (process.env[k] ? { [k]: { value: process.env[k]!, is_secret: true } } : {});
const live = { ...secret("VOIDBASE_DEPLOY_CF_API_KEY"), ...secret("VOIDBASE_ENCRYPTION_KEY"), ...secret("VB_LIVE_SUPERUSER_EMAIL"), ...secret("VB_LIVE_SUPERUSER_PASSWORD") };
const bun: Vars = { BUN_VERSION: { value: BUN_VERSION, is_secret: false } };
const open = { path_includes: ["*"], path_excludes: [] }, never = { path_includes: ["*"], path_excludes: ["*"] };
const nothing = 'echo "nothing to deploy: this build is a check"';
const want: { worker: string; name: string; build: string; deploy: string; includes: string[]; excludes: string[]; paths: typeof open; vars: Vars }[] = [
  { worker: tag, name: `${WORKER} (master)`, build: "bun run build && bun run check", deploy: "bun run deploy", includes: ["master"], excludes: [], paths: open, vars: { ...bun, VOIDBASE_DEPLOY_CRON: { value: "1", is_secret: false }, ...live } },
  { worker: tag, name: `${WORKER} (branches)`, build: "bun run build && bun run check", deploy: 'echo "branch build: built and checked, nothing to deploy"', includes: ["*"], excludes: ["master"], paths: open, vars: bun },
  { worker: liveTag!, name: `${LIVE} (nightly)`, build: "bun test/cloud-live.ts --phase nightly", deploy: nothing, includes: ["master"], excludes: [], paths: never, vars: { ...bun, ...live } },
];
for (const w of want) {
  const body = { trigger_name: w.name, build_command: w.build, deploy_command: w.deploy, branch_includes: w.includes, branch_excludes: w.excludes, root_directory: "/", ...w.paths, build_caching_enabled: false, build_token_uuid: buildToken };
  // by name on the site's Worker; on the live Worker whatever trigger is there, since it may only ever have this one
  const found = w.worker === liveTag ? liveExisting[0] : existing.find((t) => t.trigger_name === w.name);
  const uuid = found ? (await cf("PATCH", `/builds/triggers/${found.trigger_uuid}`, body), found.trigger_uuid) : (await cf<Trigger>("POST", "/builds/triggers", { ...body, external_script_id: w.worker, repo_connection_uuid: connection })).trigger_uuid;
  await cf("PATCH", `/builds/triggers/${uuid}/environment_variables`, w.vars);
  const now = await cf<Vars>("GET", `/builds/triggers/${uuid}/environment_variables`);
  console.log(`${found ? "updated" : "created"} "${w.name}" ${uuid}: build \`${w.build}\`, deploy \`${w.deploy}\`, ${w.paths.path_excludes.length ? "never on push" : `on push to ${w.includes.join(",")}${w.excludes.length ? ` minus ${w.excludes.join(",")}` : ""}`}\n  variables: ${Object.entries(now).map(([k, v]) => `${k}=${v.is_secret ? "(secret)" : v.value}`).join(" ")}`);
}
