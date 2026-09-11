// onRecordAfterCreateSuccess on vb_instances: the creator becomes the instance's owner member.
//
// The row itself is written by the browser through the collection's rules (src/lib/cloud.ts), so this is the one
// place that sees every new instance however it arrives -- the page, `voidbase cloud instances create`, or a hook
// here. Nothing is created for a row owned by nobody: the site's own backend and the system projects are reached
// through VB_ADMIN_EMAILS, not through a membership.
import { defineHook } from "@voidbase-cloud/voidbase/adapter";
import { ensureOwnerMember, type HookRecord } from "@/shared";

export default defineHook<{ record: HookRecord; next(): Promise<unknown> }>("onRecordAfterCreateSuccess", async (e) => {
  await e.next();
  try { await ensureOwnerMember(e.record); } catch (err) { console.warn("vbcloud: owner member", err); }
}, "vb_instances");
