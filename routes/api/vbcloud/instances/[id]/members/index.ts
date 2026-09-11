// GET / POST /api/vbcloud/instances/:id/members — who is on an instance, and inviting somebody to it.
//
// Reading is any member's: the card's Members panel lists the team, pending invitations included, so everybody on
// an instance can see who else is. Inviting is an owner's alone, and it is a route rather than a write through the
// collection because it mints the invitation's token, which the record API never hands out (vb_members has no
// create rule). The invitation travels by mail through this site's own instance; when nothing on this site can
// carry mail the row is still written and the link comes back in the answer, so the inviter can send it themselves.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { ghCfg, instanceFor, isRole, mail, memberJSON, membersOf, randomPassword, readBody, requireAuth, ROLE_REACH, ROLES, type HookRecord, type Role } from "@/shared";

/** where the invited person opens it: the site, which hands the token to POST /api/vbcloud/invitations/:token/accept */
export const invitationLink = (token: string) => `${ghCfg().site}/cloud?invitation=${encodeURIComponent(token)}`;

export const GET = defineHandler(requireAuth("users"), async (c) => {
  const { inst, role } = await instanceFor(c, "viewer");
  const rows = await membersOf(inst.id);
  return { instance: inst.id, role, reach: ROLE_REACH, members: rows.map(memberJSON) };
});

export const POST = defineHandler(requireAuth("users"), async (c) => {
  const { uid, inst } = await instanceFor(c, "owner");
  const body = await readBody(c);
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "viewer");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new pb.BadRequestError("Give the person's email address.");
  if (!isRole(role)) throw new pb.BadRequestError(`A role is one of ${ROLES.join(", ")}.`);
  if ((await pb.$app.findRecordsByFilter("vb_members", "instance = {:i} && email = {:e}", "", 1, 0, { i: inst.id, e: email })).length) throw new pb.BadRequestError(`${email} is already on ${inst.getString("name")}.`);
  const token = randomPassword(40);
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_members")) as HookRecord;
  row.set("instance", inst.id); row.set("user", ""); row.set("email", email); row.set("role", role); row.set("invited_by", uid); row.set("token", token);
  await pb.$app.save(row);

  const link = invitationLink(token);
  let by = ""; try { by = String((await pb.$app.findRecordById("users", uid))?.getString("email") ?? ""); } catch { by = ""; }
  const letter = mail.invitation({ instance: inst.getString("name"), role, link, by, reach: ROLE_REACH[role as Role] });
  const sent = await mail.send(c, { to: email, subject: letter.subject, html: letter.html, text: letter.text });
  return {
    member: memberJSON(row), invitation: link, mailed: sent.sent, via: sent.via,
    // when nothing here can carry mail the row stands and the link is the answer: send it however you like
    note: sent.sent
      ? `Invitation sent to ${email} (${sent.detail}).`
      : sent.error
        ? `${email} could not be written to: ${sent.error}. Send them the invitation link yourself; it is the only way in.`
        : `Nothing on this site can send mail (${sent.detail}), so ${email} was not written to. Send them the invitation link yourself; it is the only way in.`,
  };
});
