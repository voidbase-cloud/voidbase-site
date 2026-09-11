// DELETE /api/vbcloud/instances/:id/members/:memberId — somebody off the instance, an owner's alone.
//
// A route rather than a write through the collection (vb_members has no delete rule) because of the one rule the
// record API cannot state: the last owner stays. Without it an instance could be left with nobody who may delete
// it or change who is on it, and nothing short of a superuser could put that right. Demoting the last owner is the
// same hole from the other side, and vb_hooks/05.last-owner.ts closes that one.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { instanceFor, ownerCount, requireAuth, type HookRecord } from "@/shared";

export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const { inst } = await instanceFor(c, "owner");
  let row: HookRecord | null = null;
  try { row = (await pb.$app.findRecordById("vb_members", c.req.param("memberId") ?? "")) as HookRecord | null; } catch { row = null; }
  if (!row || row.getString("instance") !== inst.id) throw new pb.NotFoundError("Nobody by that id is on this instance.");
  if (row.getString("role") === "owner" && (await ownerCount(inst.id, row.id)) === 0) throw new pb.BadRequestError(`${row.getString("email")} is the last owner of ${inst.getString("name")}: make somebody else an owner first.`);
  const email = row.getString("email");
  await pb.$app.delete(row);
  return { removed: row.id, email, instance: inst.id };
});
