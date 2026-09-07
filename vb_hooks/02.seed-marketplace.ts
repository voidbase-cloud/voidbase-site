// onBootstrap: seed the first template (this site) and the site's own repository row, once their collections exist.
// A migration cannot see a collection it just created, so this waits for bootstrap instead.
//
// A hook body after `e.next()` unwinds in reverse registration order, so this file, registered after
// 01.cloud-bootstrap.ts, runs before it. On a fresh database `ensureSiteRepo` therefore finds no system instance
// yet, gives up quietly, and /api/vbcloud/repos seeds the row on the admin's first visit.
import { defineHook } from "@voidbase-cloud/voidbase/adapter";
import { ensureSiteRepo, seedTemplate } from "@/shared";

export default defineHook("onBootstrap", async (e) => {
  await e.next();
  try { await seedTemplate(); } catch (err) { console.warn("vbcloud: template seeding", err); }
  try { await ensureSiteRepo(); } catch (err) { console.warn("vbcloud: site repository", err); }
});
