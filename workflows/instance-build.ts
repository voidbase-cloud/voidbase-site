// The build of a cloud instance's Worker, as a durable run: start the builder, watch its build while waiting for
// its report, start it again once when the build dies, and say so loudly when nothing comes of it.
//
// A Cloudflare Workflow rather than a cron that polls: the instance's row says "queued" and "building" the way it
// always did, the builder's Cloudflare build claims the build and makes the release, and the control plane's
// builds/:id/done and builds/:id/failed routes tell this run what happened through one event. The wait is in short
// rounds; between rounds the run reads the build from the Builds API, so a build that Cloudflare could not even
// start ("unable to verify Worker", a terminated container) fails the instance's build within minutes, not after
// the whole wait, and is tried once more first. A builder that could not be started is retried by the platform
// before it is given up on. Bun and the mocked suite have no Workflow binding, so there the routes fall back to
// starting the builder directly (src/shared/builder.ts).
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { withApp } from "@voidbase-cloud/voidbase/workflows";
import { buildState, dispatchBuilder, type BuildStart } from "@/shared";

export type BuildParams = { instanceId: string; reason: string };
/** what the routes report: the release that was deployed, or why there is none */
export type BuildReport = { version?: string; error?: string };

const ROUND = "2 minutes", ROUNDS = 15;  // 30 minutes per attempt: a build takes about two
const ATTEMPTS = 2;                      // the build is started again once when Cloudflare lost it

export default class InstanceBuild extends WorkflowEntrypoint<Record<string, unknown>, BuildParams> {
  async run(event: WorkflowEvent<BuildParams>, step: WorkflowStep): Promise<BuildReport> {
    const { instanceId, reason } = event.payload;
    const app = <T>(fn: () => Promise<T>) => withApp(this.env as never, fn);
    let report: BuildReport | undefined;
    for (let attempt = 1; attempt <= ATTEMPTS && !report; attempt++) {
      const started = await step.do(`start the builder (${attempt})`, { retries: { limit: 5, delay: "30 seconds", backoff: "exponential" } }, () =>
        app(async (): Promise<BuildStart> => { const r = await dispatchBuilder(reason); if (r.status === "failed") throw new Error("the builder's build could not be started"); return r; }));
      if (started.status === "no-token") { report = { error: "no build was started: the control plane has no VB_BUILDS_TOKEN to start the builder with" }; break; }
      let dead = "";
      for (let round = 1; round <= ROUNDS && !report && !dead; round++) {
        try {
          report = (await step.waitForEvent<BuildReport>(`the builder reports (${attempt}.${round})`, { type: "built", timeout: ROUND })).payload;
        } catch {
          // no report this round: is the build still alive?
          const state = started.build ? await step.do(`check the build (${attempt}.${round})`, () => app(() => buildState(started.build!))) : "unknown";
          if (state !== "running" && state !== "unknown") dead = state;
        }
      }
      if (dead && attempt === ATTEMPTS) report = { error: `the builder's build ${started.build} ended "${dead}" without reporting, twice; try again` };
      else if (!dead && !report) report = { error: `the builder did not report back within 30 minutes (build ${started.build ?? "?"}); try again` };
      // a build that died on the first attempt is started again
    }
    if (report!.error) {
      await step.do("record the failure", () => app(async () => {
        const row = await pb.$app.findRecordById("vb_instances", instanceId);
        // a route may have recorded the outcome already; a finished build is left alone
        if (row && ["queued", "building"].includes(row.getString("build"))) { row.set("build", "failed"); row.set("build_error", report!.error); await pb.$app.save(row); }
      }));
    }
    return report!;
  }
}
