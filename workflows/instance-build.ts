// The build of a cloud instance's Worker, as a durable run: start the builder, wait for it to report, and say so
// loudly when it never does.
//
// A Cloudflare Workflow rather than a cron that polls: the instance's row says "queued" and "building" the way it
// always did, the builder's Cloudflare build claims the build and makes the release, and the control plane's
// builds/:id/done and builds/:id/failed routes tell this run what happened through one event. A builder that never
// reports is a build that fails with a reason after forty-five minutes, without anyone polling for it; a builder
// that could not be started is retried by the platform before it is given up on. Bun and the mocked suite have no
// Workflow binding, so there the routes fall back to starting the builder directly (src/shared/builder.ts).
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { withApp } from "@voidbase-cloud/voidbase/workflows";
import { dispatchBuilder } from "@/shared";

export type BuildParams = { instanceId: string; reason: string };
/** what the routes report: the release that was deployed, or why there is none */
export type BuildReport = { version?: string; error?: string };

export default class InstanceBuild extends WorkflowEntrypoint<Record<string, unknown>, BuildParams> {
  async run(event: WorkflowEvent<BuildParams>, step: WorkflowStep): Promise<BuildReport> {
    const { instanceId, reason } = event.payload;
    const started = await step.do("start the builder", { retries: { limit: 5, delay: "30 seconds", backoff: "exponential" } }, () =>
      withApp(this.env as never, async () => { const r = await dispatchBuilder(reason); if (r === "failed") throw new Error("the builder's build could not be started"); return r; }));
    let report: BuildReport;
    try {
      report = (await step.waitForEvent<BuildReport>("the builder reports", { type: "built", timeout: "45 minutes" })).payload;
    } catch {
      report = { error: started === "no-token" ? "no build was started: the control plane has no VB_BUILDS_TOKEN to start the builder with" : "the builder did not report back within 45 minutes; try again" };
    }
    if (report.error) {
      await step.do("record the failure", () => withApp(this.env as never, async () => {
        const row = await pb.$app.findRecordById("vb_instances", instanceId);
        // a route may have recorded the outcome already; a finished build is left alone
        if (row && ["queued", "building"].includes(row.getString("build"))) { row.set("build", "failed"); row.set("build_error", report.error); await pb.$app.save(row); }
      }));
    }
    return report;
  }
}
