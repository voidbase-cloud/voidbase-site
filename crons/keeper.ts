// The keeper: every five minutes, what the control plane cannot do inside a request.
//
//   - a queued instance build nobody claimed within three minutes (the dispatch failed, or the builder's build died
//     before it claimed anything) gets the builder started again
//   - a build claimed forty-five minutes ago and never reported is failed with a reason, so the dashboard stops
//     saying "building" and the owner can try again (a build takes about three minutes)
//
// The Worker's cron trigger fires every minute (voidbase runs each job whose expression matches), so this needs
// VOIDBASE_DEPLOY_CRON on, which vb_secrets/main.ts defaults to. Nothing here throws: a tick that fails logs why.
import { defineScheduled } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { dispatchBuilder, pbDate, type HookRecord } from "@/shared";

export const cron = "*/5 * * * *";

const olderThan = (minutes: number) => pbDate(new Date(Date.now() - minutes * 60_000));

export default defineScheduled(async () => {
  try {
    const unclaimed = (await pb.$app.findRecordsByFilter("vb_instances", `build = 'queued' && status = 'live' && updated < '${olderThan(3)}'`, "updated", 50, 0)) as HookRecord[];
    if (unclaimed.length) console.log(`keeper: ${unclaimed.length} queued build(s) unclaimed for three minutes; builder ${await dispatchBuilder(`keeper: ${unclaimed.map((r) => r.getString("name")).join(", ")}`)}`);
  } catch (err) { console.warn("keeper: queued builds", err instanceof Error ? err.message : err); }
  try {
    const silent = (await pb.$app.findRecordsByFilter("vb_instances", `build = 'building' && updated < '${olderThan(45)}'`, "updated", 50, 0)) as HookRecord[];
    for (const row of silent) {
      row.set("build", "failed"); row.set("build_error", "the builder claimed this build and did not report back within 45 minutes; try again");
      await pb.$app.save(row);
      console.warn(`keeper: ${row.getString("name")}: build claimed and never reported; marked failed`);
    }
  } catch (err) { console.warn("keeper: silent builds", err instanceof Error ? err.message : err); }
});
