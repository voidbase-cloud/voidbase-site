// The counterpart of ../pb/auditlog/auditlog.go: audit rows for the collections named in AUDITLOG (e.g.
// AUDITLOG=users,posts), written after every create/update/delete request.
import type { VoidbaseApp } from "voidbase";

const collections = (process.env.AUDITLOG ?? "").split(",").filter(Boolean);

export function register(app: VoidbaseApp) {
  const { onRecordCreateRequest, onRecordUpdateRequest, onRecordDeleteRequest } = app.hooks;
  const after = (event: string) => async (e: RequestEvent) => { await e.next(); await doAudit(app, event, e); };
  onRecordCreateRequest(after("insert"));
  onRecordUpdateRequest(after("update"));
  onRecordDeleteRequest(after("delete"));
}

interface Rec { id: string; collection(): { name: string }; original(): Rec; publicExport(): Record<string, unknown>; isSuperuser(): boolean }
interface RequestEvent { record: Rec | null; auth: Rec | null; next(): Promise<unknown> }

function diff(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length !== b.length || a.some((v, i) => diff(v, b[i]));
  if (Array.isArray(a) || Array.isArray(b)) return true;
  if (a && b && typeof a === "object" && typeof b === "object") return JSON.stringify(a) !== JSON.stringify(b);
  return a !== b;
}

async function doAudit(app: VoidbaseApp, event: string, request: RequestEvent) {
  const record = request.record; const auth = request.auth;
  if (!record) return;
  const collection = record.collection().name;
  // exclude logging "auditlog" and include only what's in AUDITLOG env var
  if (collection === "auditlog" || !collections.includes(collection)) return;
  const user = auth && !auth.isSuperuser() ? auth.id : "";
  const admin = auth?.isSuperuser() ? auth.id : "";
  console.log(`AuditLog:${collection}:${record.id}:${event}:${user}:${admin}`);
  const { $app, Record } = app.hooks;
  const auditlog = new Record($app.findCollectionByNameOrId("auditlog"));
  auditlog.set("collection", collection);
  auditlog.set("record", record.id);
  auditlog.set("event", event);
  auditlog.set("user", user);
  auditlog.set("admin", admin);
  // detect changes
  const original = record.original().publicExport();
  const recordExport = record.publicExport();
  for (const [k, v] of Object.entries(original)) if (!diff(v, recordExport[k])) delete original[k]; // unmodified, then remove
  auditlog.set("data", recordExport);
  auditlog.set("original", original);
  await $app.save(auditlog);
}
