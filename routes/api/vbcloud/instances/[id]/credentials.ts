import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { isAdmin, requireAuth } from "@/shared";

export const GET = defineHandler(requireAuth(), async (c) => {
  const row = await pb.$app.findRecordById("vb_instances", c.req.param("id") ?? ""); if (!row) throw new pb.NotFoundError();
  const auth = authOf(c);
  if (!(row.getString("owner") === auth!.id || (row.getBool("system") && isAdmin(auth)))) throw new pb.ForbiddenError();
  // the password was shown once at creation (reset it from the instance's own panel if it is lost)
  return { url: row.getString("url"), superuserEmail: row.getString("superuser_email"), panel: row.getString("url") ? `${row.getString("url")}/_/` : "" };
});
