// POST /api/vbcloud/invitations/:token/accept — the other end of an invitation.
//
// The token is the whole of it: it names one pending row of vb_members, and accepting binds the signed-in user to
// that row and clears the token, so a link works once and an accepted invitation cannot be replayed. The address
// has to match: an invitation is to a person, not to whoever holds the link, and being signed in as somebody else
// is refused with the address it was sent to rather than a bare 403.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { memberJSON, pbDate, requireAuth, userId, type HookRecord } from "@/shared";

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const auth = authOf(c)!;
  const token = c.req.param("token") ?? "";
  if (!token) throw new pb.BadRequestError("That link carries no invitation.");
  const rows = (await pb.$app.findRecordsByFilter("vb_members", "token = {:t}", "", 1, 0, { t: token })) as HookRecord[];
  const row = rows[0];
  // an accepted invitation has no token any more, so this covers "already accepted" and "withdrawn" alike
  if (!row) throw new pb.NotFoundError("That invitation is not open any more: it was accepted already, or withdrawn.");
  const mine = String(auth.email?.() ?? auth.getString("email")).trim().toLowerCase();
  const invited = row.getString("email");
  if (mine !== invited) throw new pb.ForbiddenError(`This invitation was sent to ${invited}, and you are signed in as ${mine || "somebody else"}. Sign in with ${invited} and open the link again.`);
  row.set("user", uid); row.set("accepted_at", pbDate(new Date())); row.set("token", "");
  await pb.$app.save(row);
  let inst: HookRecord | null = null;
  try { inst = (await pb.$app.findRecordById("vb_instances", row.getString("instance"))) as HookRecord | null; } catch { inst = null; }
  return { accepted: true, member: memberJSON(row), instance: inst ? { id: inst.id, name: inst.getString("name"), url: inst.getString("url") } : null };
});
