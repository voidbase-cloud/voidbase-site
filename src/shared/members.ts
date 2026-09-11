// Who is on an instance, and what that lets them do. An instance belongs to a team: `vb_members` holds one row per
// person (see vb_migrations/1789000007_vbcloud_members.js), and everything that used to ask "is this the owner"
// asks here instead -- the routes, the two pass-throughs, `instanceJSON`'s `canDelete`, and the collections' own
// rules, which say the same thing in PocketBase's syntax.
//
// The three roles, and nothing between them:
//   owner   everything, including deleting the instance and changing who is on it
//   admin   everything to the instance (upgrade, roll back, domains, secrets, plugins, backups), but not deleting
//           it and not membership
//   viewer  reads what the instance reports (logs, metrics, plugins, the backups list) and changes nothing
//
// What a member does NOT get from this site is somebody else's Cloudflare account: every call still travels on the
// caller's own connection (routes/api/vbcloud/cf/[...path].ts), so an admin of an instance works in the account it
// lives in with their own Cloudflare sign-in. This site never lends one person's token to another.
import type { Context } from "hono";
import { authOf, pb, pbDate, type HookRecord } from "./pb";
import { isAdmin, userId } from "./auth";

export type Role = "owner" | "admin" | "viewer";
export const ROLES: Role[] = ["owner", "admin", "viewer"];
const RANK: Record<Role, number> = { viewer: 1, admin: 2, owner: 3 };
export const isRole = (s: string): s is Role => (ROLES as string[]).includes(s);
/** whether a role reaches at least as far as `min`; a non-member reaches nothing */
export const atLeast = (role: Role | null, min: Role) => !!role && RANK[role] >= RANK[min];
/** what each role may do, in one line each: the page prints these under the member list, and the docs repeat them */
export const ROLE_REACH: Record<Role, string> = {
  owner: "Everything, including deleting the instance and changing who is on it.",
  admin: "Everything to the instance: upgrade, roll back, domains, secrets, plugins, backups. Not deleting it, and not who is on it.",
  viewer: "Reads what the instance reports: logs, metrics, plugins, the backups list. Changes nothing.",
};

/** one member row as the card shows it; the token never leaves this backend */
export const memberJSON = (m: HookRecord) => ({
  id: m.id, instance: m.getString("instance"), email: m.getString("email"), role: m.getString("role") as Role,
  user: m.getString("user"), invitedBy: m.getString("invited_by"),
  pending: !m.getString("user"), acceptedAt: String(m.get("accepted_at") ?? ""), created: String(m.get("created") ?? ""),
});

/** every member row of an instance, owners first */
export const membersOf = (instanceId: string) =>
  pb.$app.findRecordsByFilter("vb_members", "instance = {:i}", "email", 200, 0, { i: instanceId }) as Promise<HookRecord[]>;
/** how many owners an instance has: the last one stays, on a removal and on a role change alike */
export async function ownerCount(instanceId: string, except = ""): Promise<number> {
  const rows = (await pb.$app.findRecordsByFilter("vb_members", "instance = {:i} && role = 'owner'", "", 200, 0, { i: instanceId })) as HookRecord[];
  return rows.filter((r) => r.id !== except).length;
}

/** the member rows a user holds, by instance id: one query for the whole listing */
export async function rolesOf(uid: string): Promise<Map<string, Role>> {
  const out = new Map<string, Role>();
  if (!uid) return out;
  const rows = (await pb.$app.findRecordsByFilter("vb_members", "user = {:u}", "-created", 500, 0, { u: uid })) as HookRecord[];
  for (const r of rows) { const role = r.getString("role"); if (isRole(role)) out.set(r.getString("instance"), role); }
  return out;
}

/**
 * What a user may do to one instance. The member row is the answer; a row written before the team existed and
 * never healed falls back to its `owner` field, so nothing anyone has stops working while the backfill catches up.
 */
export async function roleOf(uid: string, inst: HookRecord): Promise<Role | null> {
  if (!uid) return null;
  const rows = (await pb.$app.findRecordsByFilter("vb_members", "instance = {:i} && user = {:u}", "", 1, 0, { i: inst.id, u: uid })) as HookRecord[];
  const role = rows[0]?.getString("role") ?? "";
  if (isRole(role)) return role;
  return inst.getString("owner") === uid ? "owner" : null;
}

/** the furthest a user reaches on any instance of a Cloudflare account: what the pass-through asks before a write */
export async function accountReach(uid: string, accountId: string): Promise<Role | null> {
  if (!uid || !accountId) return null;
  const rows = (await pb.$app.findRecordsByFilter("vb_members", "user = {:u}", "", 500, 0, { u: uid })) as HookRecord[];
  let best: Role | null = null;
  for (const m of rows) {
    const role = m.getString("role"); if (!isRole(role)) continue;
    let inst: HookRecord | null = null;
    try { inst = (await pb.$app.findRecordById("vb_instances", m.getString("instance"))) as HookRecord | null; } catch { inst = null; }
    if (!inst || inst.getString("account_id") !== accountId) continue;
    if (!best || RANK[role] > RANK[best]) best = role;
  }
  return best;
}

/**
 * The creator is the instance's first owner. Called from vb_hooks/04.instance-owner.ts when a row is created, and
 * again from the listing for a row that predates the team (the migration backfills, this heals whatever it missed).
 * Idempotent, and silent about a row owned by nobody: the site's own backend and the system projects are reached
 * through VB_ADMIN_EMAILS, not through a membership.
 */
export async function ensureOwnerMember(inst: HookRecord): Promise<HookRecord | null> {
  const owner = inst.getString("owner");
  if (!owner) return null;
  const existing = (await pb.$app.findRecordsByFilter("vb_members", "instance = {:i} && user = {:u}", "", 1, 0, { i: inst.id, u: owner })) as HookRecord[];
  if (existing[0]) return existing[0];
  let email = "";
  try { email = String((await pb.$app.findRecordById("users", owner))?.getString("email") ?? "").toLowerCase(); } catch { email = ""; }
  if (!email) return null;
  const row = new pb.Record(pb.$app.findCollectionByNameOrId("vb_members")) as HookRecord;
  row.set("instance", inst.id); row.set("user", owner); row.set("email", email); row.set("role", "owner"); row.set("accepted_at", pbDate(new Date()));
  await pb.$app.save(row);
  return row;
}

/**
 * The instance named in the URL, and the caller's reach over it, refused when it does not go far enough. The one
 * guard every instance route starts with; a system row is still the admins' as it always was.
 */
export async function instanceFor(c: Context, min: Role): Promise<{ uid: string; inst: HookRecord; role: Role | null }> {
  const uid = userId(c);
  let inst: HookRecord;
  try { inst = (await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? "")) as HookRecord; } catch { throw new pb.NotFoundError("No such instance."); }
  if (!inst) throw new pb.NotFoundError("No such instance.");
  const role = await roleOf(uid, inst);
  if (inst.getBool("system") && isAdmin(authOf(c))) return { uid, inst, role };
  if (!role) throw new pb.ForbiddenError("You are not on this instance.");
  if (!atLeast(role, min)) throw new pb.ForbiddenError(`A ${role} may not do that: ${ROLE_REACH[role]}`);
  return { uid, inst, role };
}
