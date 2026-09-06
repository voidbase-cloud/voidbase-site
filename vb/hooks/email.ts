// The counterpart of ../pb/hooks/email.go: the "email" action renders ../data/email_templates/<action>.html with
// {{ .record.* }} / {{ .meta.* }} / {{ .params.* }} placeholders (the subset of Go templates the starter uses) and
// sends it through the app's mailer. action_params is a JSON template, e.g.
//   {"to": "{{ .record.expand.creator.email }}", "subject": "ticket updated - {{ .record.title }}"}
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { VoidbaseApp } from "@voidbase-cloud/voidbase";

const templatesDir = resolve(import.meta.dir, "../data/email_templates");
const templates = new Map<string, string>();
for (const f of readdirSync(templatesDir)) templates.set(f, readFileSync(resolve(templatesDir, f), "utf8"));

interface Rec { publicExport(): Record<string, unknown>; ignoreEmailVisibility(v?: boolean): unknown }

// {{ .a.b.c }} lookups; unknown paths render empty, like Go's missing map keys
export function render(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*\.([\w.]*)\s*\}\}/g, (_m, path: string) => {
    let v: unknown = data;
    for (const key of path.split(".").filter(Boolean)) { if (v && typeof v === "object") v = (v as Record<string, unknown>)[key] ?? (v as Record<string, unknown>)[key.charAt(0).toLowerCase() + key.slice(1)]; else return ""; }
    return v == null ? "" : String(v);
  });
}

export async function doEmail(app: VoidbaseApp, action: string, action_params: string, record: Rec) {
  // include email fields of the record and its expanded relations in the exported JSON
  record.ignoreEmailVisibility(true);
  const exported = JSON.parse(JSON.stringify(record.publicExport())) as Record<string, unknown>;
  const settings = app.hooks.$app.settings() as { meta: Record<string, unknown> };
  const data: Record<string, unknown> = { record: exported, meta: { ...settings.meta, AppUrl: settings.meta.appURL, AppName: settings.meta.appName, SenderName: settings.meta.senderName, SenderAddress: settings.meta.senderAddress } };
  const params = JSON.parse(render(action_params, data)) as Record<string, unknown>;
  data.params = params;
  params.from ??= settings.meta.senderName;
  if (!params.to) throw new Error("action_params must provide 'to' key/value");
  if (!params.subject) throw new Error("action_params must provide 'subject' key/value");
  const tpl = templates.get(action); if (!tpl) throw new Error(`template ${action} not found in ${templatesDir}`);
  const { MailerMessage, $app } = app.hooks;
  await $app.newMailClient().send(new MailerMessage({ from: { address: String(settings.meta.senderAddress), name: String(params.from) }, to: [{ address: String(params.to) }], subject: String(params.subject), html: render(tpl, data) }));
}
