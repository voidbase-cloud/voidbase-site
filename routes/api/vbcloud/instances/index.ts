// GET /api/vbcloud/instances — the rows this site keeps: the ones the visitor is on (their own, and the ones a
// team put them on) and, for admins, the system rows. Creating, upgrading and deleting happen in the browser
// (src/lib/cloud.ts) against the user's own Cloudflare account through /api/vbcloud/cf.
//
// Each row comes back with the visitor's role on it, which is what the card's buttons are made of. A row the
// visitor owns and has no member row for is healed here (ensureOwnerMember): the migration backfilled what existed
// when teams arrived, and this catches whatever it could not.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { ensureOwnerMember, ensureSelf, ensureSystemProjects, instanceJSON, isAdmin, requireAuth, rolesOf, type HookRecord, type Role } from "@/shared";

export const GET = defineHandler(requireAuth(), async (c) => {
  const auth = authOf(c)!; const origin = new URL(c.req.raw.url).origin;
  try { await ensureSelf(origin); if (isAdmin(auth)) await ensureSystemProjects(); } catch (err) { console.warn("vbcloud: self registration", err); }
  const own = (auth.isSuperuser() ? [] : await pb.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "-created", 100, 0, { u: auth.id })) as HookRecord[];
  for (const r of own) { try { await ensureOwnerMember(r); } catch (err) { console.warn("vbcloud: owner member", err); } }
  const roles = auth.isSuperuser() ? new Map<string, Role>() : await rolesOf(auth.id);
  // the instances a team put the visitor on: the member rows name them, and a row they own is already above
  const joined: HookRecord[] = [];
  for (const id of roles.keys()) {
    if (own.some((r) => r.id === id)) continue;
    let row: HookRecord | null = null;
    try { row = (await pb.$app.findRecordById("vb_instances", id)) as HookRecord | null; } catch { row = null; }
    if (row && row.getString("status") !== "deleted") joined.push(row);
  }
  const system = (isAdmin(auth) ? await pb.$app.findRecordsByFilter("vb_instances", "system = true && status != 'deleted'", "-created", 20, 0) : []) as HookRecord[];
  const seen = new Set<string>(); const rows = [...system, ...own, ...joined].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return { instances: rows.map((r) => instanceJSON(r, auth, roles.get(r.id) ?? null)) };
});
