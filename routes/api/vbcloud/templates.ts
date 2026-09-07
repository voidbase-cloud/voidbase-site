import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { requireAuth, templateJSON, type HookRecord } from "@/shared";

// the GitHub template repositories registered in vb_templates (superusers add more from the panel)
export const GET = defineHandler(requireAuth(), async () => {
  const rows = (await pb.$app.findRecordsByFilter("vb_templates", "", "name", 100, 0)) as HookRecord[];
  return { templates: rows.map(templateJSON) };
});
