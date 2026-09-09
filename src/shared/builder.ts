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
import { env } from "./pb";
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
