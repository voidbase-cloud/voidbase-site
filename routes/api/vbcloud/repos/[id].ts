import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { requireAuth, userId } from "@/shared";

export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const row = await pb.$app.findRecordById("vb_repos", c.req.param("id") ?? ""); if (!row) throw new pb.NotFoundError();
  if (row.getBool("system")) throw new pb.ForbiddenError("This site's own repository stays linked to its backend.");
  if (row.getString("owner") !== uid && row.getString("user") !== uid) throw new pb.ForbiddenError();
  await pb.$app.delete(row); // unlinks only: the repository stays in the visitor's GitHub account
  return { unlinked: true };
});
