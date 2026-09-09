// Instance builds and the nightly proof run as Cloudflare Workers Builds, started from here through the Builds API.
//
// The builder is the `voidbase-builder (instance-build)` trigger, on a Worker of its own in voidbase's account
// (voidbase/docs/ci.md; a Worker takes two triggers at most): a push never starts it, this does, the moment a build
// is queued, and the keeper cron (crons/keeper.ts) does again for a build nobody claimed. A trigger is found by
// the Worker's name and its own, never kept as a uuid: a Worker rename gave the site new triggers once, and a
// stored uuid pointed at nothing.
// VB_BUILDS_TOKEN is a user API token (Workers Builds Configuration: Edit, Workers Scripts: Read); without it nothing
// is started, the dashboard says so, and a maintainer starts builds by hand (`bun scripts/cf-builds.ts build`).
// Never a failure of the request that queued the build.
import { env, pb } from "./pb";
import { cfg } from "./config";

const API = "https://api.cloudflare.com/client/v4";
const uuids = new Map<string, string>();

async function cf<T>(token: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, { method: body === undefined ? "GET" : "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "user-agent": "voidbase-cloud" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { success?: boolean; result?: T; errors?: { message?: string }[] };
  if (!r.ok || j.success === false) throw new Error(`${path}: ${r.status} ${j.errors?.map((e) => e.message).join("; ") || ""}`.trim());
  return j.result as T;
}

/** the trigger's uuid, by the Worker's name and the trigger's, remembered for the life of this isolate */
async function triggerOf(token: string, account: string, worker: string, name: string): Promise<string> {
  const key = `${account}/${worker}/${name}`;
  const known = uuids.get(key); if (known) return known;
  const tag = (await cf<{ id: string; tag?: string }[]>(token, `/accounts/${account}/workers/scripts`)).find((s) => s.id === worker)?.tag;
  if (!tag) throw new Error(`no Worker ${worker} on account ${account}`);
  const t = (await cf<{ trigger_uuid: string; trigger_name: string }[]>(token, `/accounts/${account}/builds/workers/${tag}/triggers`)).find((x) => x.trigger_name === name);
  if (!t) throw new Error(`no trigger "${name}" on ${worker}`);
  uuids.set(key, t.trigger_uuid);
  return t.trigger_uuid;
}

/** start a build of master on a named trigger of a named Worker */
export async function startBuild(worker: string, trigger: string, reason: string): Promise<"started" | "no-token" | "failed"> {
  const token = env("VB_BUILDS_TOKEN"); if (!token) return "no-token";
  const account = env("VB_BUILDS_ACCOUNT") || cfg().account;
  if (!account) { console.warn("vbcloud: build", reason, "no account to start it on (VB_BUILDS_ACCOUNT)"); return "failed"; }
  try {
    const uuid = await triggerOf(token, account, worker, trigger);
    const r = await cf<{ build_uuid?: string; status?: string }>(token, `/accounts/${account}/builds/triggers/${uuid}/builds`, { branch: env("VB_BUILDS_BRANCH", "master") });
    console.log(`vbcloud: build ${r.build_uuid ?? "?"} ${r.status ?? "queued"} on ${worker} "${trigger}": ${reason}`);
    return "started";
  } catch (err) {
    uuids.clear(); // a trigger that was renamed or recreated is looked up again next time
    console.warn("vbcloud: build", reason, err instanceof Error ? err.message : err);
    return "failed";
  }
}

/** the instance builder: claims every queued build (scripts/instance-build.ts in voidbase) */
export const dispatchBuilder = (reason: string) => startBuild(env("VB_BUILDER_WORKER", "voidbase-builder"), env("VB_BUILDER_TRIGGER", "voidbase-builder (instance-build)"), reason);

// ---- the durable run around a build (workflows/instance-build.ts)
type Ctx = { env: unknown };
interface BuildRuns { create(o: { id: string; params: { instanceId: string; reason: string } }): Promise<unknown>; get(id: string): Promise<{ sendEvent(e: { type: string; payload: unknown }): Promise<unknown> }> }
const runsOf = (c: Ctx): BuildRuns | undefined => { const w = (c.env as Record<string, unknown> | undefined)?.WORKFLOW_INSTANCE_BUILD as BuildRuns | undefined; return w && typeof w.create === "function" ? w : undefined; };

/**
 * A build was queued on this row: start its run. With the Workflow bound (Cloudflare), the run starts the builder,
 * waits for the report and fails the build when none comes; without it (Bun, the mocked suite) the builder is
 * started here and nothing watches the clock. Never a failure of the request that queued the build.
 */
export async function startBuildRun(c: Ctx, row: { id: string; set(k: string, v: unknown): void }, reason: string): Promise<"workflow" | "started" | "no-token" | "failed"> {
  const runs = runsOf(c);
  if (!runs) return dispatchBuilder(reason);
  const id = `${row.id}-${Date.now().toString(36)}`;
  try { await runs.create({ id, params: { instanceId: row.id, reason } }); row.set("build_run", id); await pb.$app.save(row as never); return "workflow"; }
  catch (err) { console.warn("vbcloud: build run", reason, err instanceof Error ? err.message : err); return dispatchBuilder(reason); }
}

/** the builder reported: tell the run, which may already be over (a late report is nobody's error) */
export async function reportBuild(c: Ctx, row: { getString(k: string): string }, report: { version?: string; error?: string }): Promise<void> {
  const runs = runsOf(c); const id = row.getString("build_run");
  if (!runs || !id) return;
  try { await (await runs.get(id)).sendEvent({ type: "built", payload: report }); } catch (err) { console.warn("vbcloud: build report", id, err instanceof Error ? err.message : err); }
}
