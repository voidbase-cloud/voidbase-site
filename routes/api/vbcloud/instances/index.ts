// GET /api/vbcloud/instances — the rows this site keeps: the user's own (written by the browser through the
// collection's rules) and, for admins, the system rows. Creating, upgrading and deleting happen in the browser
// (src/lib/cloud.ts) against the user's own Cloudflare account through /api/vbcloud/cf.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { ensureSelf, ensureSystemProjects, instanceJSON, isAdmin, requireAuth, type HookRecord } from "@/shared";

export const GET = defineHandler(requireAuth(), async (c) => {
  const auth = authOf(c)!; const origin = new URL(c.req.raw.url).origin;
  try { await ensureSelf(origin); if (isAdmin(auth)) await ensureSystemProjects(); } catch (err) { console.warn("vbcloud: self registration", err); }
  const own = (auth.isSuperuser() ? [] : await pb.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "-created", 100, 0, { u: auth.id })) as HookRecord[];
  const system = (isAdmin(auth) ? await pb.$app.findRecordsByFilter("vb_instances", "system = true && status != 'deleted'", "-created", 20, 0) : []) as HookRecord[];
  const seen = new Set<string>(); const rows = [...system, ...own].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return { instances: rows.map((r) => instanceJSON(r, auth)) };
});
