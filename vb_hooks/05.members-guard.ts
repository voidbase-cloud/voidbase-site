// onRecordUpdateRequest on vb_members: what an owner may change about somebody, and the last owner.
//
// The collection's update rule lets an owner through; this says what they may do once they are. Two things a rule
// cannot say on its own:
//
//   * Only the role changes here. The email is who was invited, `user` is who accepted, `token` is the invitation's
//     secret and `accepted_at` is when it was taken -- all of them the routes' (members/, invitations/), and none
//     of them a thing to edit afterwards. The rule states it too, in `@request.body.<field>:isset` form, but on
//     voidbase 0.9.0-beta.38 an update rule is evaluated before the request body reaches the filter's context, so
//     those clauses are true whatever the body holds and this is what actually holds the shape of the write.
//   * The last owner stays. An instance left with no owner would have nobody who may delete it or change who is on
//     it, and nothing short of a superuser could put that right. The other half of the same hole -- removing the
//     last owner -- is closed in the route, which is the only thing that deletes a member row (the collection has
//     no delete rule).
//
// This fires on API requests only; the routes write through $app, which carries no request event, so the site's own
// code is not held by it.
import { defineHook, pb } from "@voidbase-cloud/voidbase/adapter";
import { isRole, ownerCount, type HookRecord } from "@/shared";

/** everything about a member row except the role: written once, by a route, and never edited afterwards */
const FIXED = ["instance", "user", "email", "token", "invited_by", "accepted_at"] as const;

export default defineHook<{ record: HookRecord; next(): Promise<unknown> }>("onRecordUpdateRequest", async (e) => {
  const was = e.record.original();
  for (const name of FIXED) {
    if (e.record.getString(name) !== was.getString(name)) throw new pb.BadRequestError(`A member's ${name.replace("_", " ")} is written when they are invited and when they accept, and is not changed afterwards. Only the role is.`);
  }
  const role = e.record.getString("role");
  if (!isRole(role)) throw new pb.BadRequestError("A role is one of owner, admin, viewer.");
  if (was.getString("role") === "owner" && role !== "owner" && (await ownerCount(e.record.getString("instance"), e.record.id)) === 0) {
    throw new pb.BadRequestError(`${e.record.getString("email")} is the last owner of this instance: make somebody else an owner first.`);
  }
  await e.next();
}, "vb_members");
