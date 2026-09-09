// GET /api/vbcloud/builds/next — the builder claims the next queued instance build (a superuser, from CI).
//
// 204 when nothing is queued. A claim marks the instance `building`, so two builders do not build it twice, and
// hands back everything the build needs: the base release to build on and the plugin set as recorded.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { currentVersion, pluginsOf, requireSuperuser, type HookRecord } from "@/shared";

export const GET = defineHandler(requireSuperuser(), async (c) => {
  const rows = (await pb.$app.findRecordsByFilter("vb_instances", "build = 'queued' && status = 'live'", "updated", 1, 0)) as HookRecord[];
  const row = rows[0];
  if (!row) return new Response(null, { status: 204 });
  const base = await currentVersion(c);
  if (!base) throw new pb.BadRequestError("No release is active on this control plane, so there is nothing to build on.");
  row.set("build", "building"); await pb.$app.save(row);
  return { id: row.id, name: row.getString("name"), base, plugins: pluginsOf(row) };
});
