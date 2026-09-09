// POST /api/vbcloud/builds/:id/failed — the builder could not make the release; the instance keeps what it runs.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { instanceJSON, readBody, requireSuperuser } from "@/shared";

export const POST = defineHandler(requireSuperuser(), async (c) => {
  const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? "");
  if (!row) throw new pb.NotFoundError();
  row.set("build", "failed"); row.set("build_error", String((await readBody(c)).error ?? "the build failed").slice(0, 1000));
  await pb.$app.save(row);
  return { instance: instanceJSON(row, null) };
});
