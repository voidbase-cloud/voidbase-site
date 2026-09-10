// GET /api/vbcloud/repos — the repositories this site keeps rows for: the user's own (written by the browser through
// the collection's rules when it creates or links one) and, for admins, the system rows. Creating, linking, checking
// and unlinking happen in the browser (src/lib/cloud.ts) against GitHub through /api/vbcloud/gh.
import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { ensureSiteRepo, ensureSystemProjects, isAdmin, repoJSON, requireAuth, userId, type HookRecord } from "@/shared";

export const GET = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c);
  const own = (await pb.$app.findRecordsByFilter("vb_repos", "user = {:u}", "-created", 100, 0, { u: uid })) as HookRecord[];
  let system: HookRecord[] = [];
  if (isAdmin(authOf(c))) { try { await ensureSiteRepo(); await ensureSystemProjects(); } catch (err) { console.warn("vbcloud: site repository", err); } system = (await pb.$app.findRecordsByFilter("vb_repos", "system = true", "-created", 20, 0)) as HookRecord[]; }
  const rows = [...own, ...system.filter((r) => !own.some((o) => o.id === r.id))];
  const out = [];
  for (const r of rows) {
    let inst: HookRecord | null = null; try { inst = r.getString("instance") ? await pb.$app.findRecordById("vb_instances", r.getString("instance")) : null; } catch { inst = null; }
    let tpl: HookRecord | null = null; try { tpl = r.getString("template") ? await pb.$app.findRecordById("vb_templates", r.getString("template")) : null; } catch { tpl = null; }
    out.push(repoJSON(r, { instanceName: inst?.getString("name") ?? "", instanceUrl: inst?.getString("url") ?? "", templateName: tpl?.getString("name") ?? "", templateTitle: tpl?.getString("title") ?? "" }));
  }
  return { repos: out };
});
