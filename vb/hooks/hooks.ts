// The counterpart of ../pb/hooks/hooks.go: rows of the `hooks` collection (collection, event, action_type, action,
// action_params, expands, disabled) run an action after insert/update/delete of any collection's records:
// "command" (a local program receives the record as JSON on stdin), "post" (HTTP POST of the record as JSON)
// or "email" (a template from ../data/email_templates rendered for the record). See email.ts.
import type { VoidbaseApp } from "@voidbase-cloud/voidbase";
import { doEmail } from "./email";

interface Rec { id: string; collection(): { name: string }; publicExport(): Record<string, unknown>; getString(k: string): string; getBool(k: string): boolean; ignoreEmailVisibility(v?: boolean): unknown }
interface ModelEvent { record?: Rec | null; model?: Rec | null; next(): Promise<unknown> }
export interface HookRow { collection: string; event: string; action_type: string; action: string; action_params: string; expands: string }

export function register(app: VoidbaseApp) {
  const handler = (event: string) => async (e: ModelEvent) => {
    const record = e.record ?? e.model;
    if (record && typeof record.collection === "function") {
      const table = record.collection().name;
      if (table === "hooks") { console.log("'hooks' collection changed. Unloading."); hookRows = null; } // re-loaded the next time it is needed
      else await executeEventActions(app, event, table, record);
    }
    await e.next();
  };
  // watch insert/update/delete of rows of all collections
  app.hooks.onModelAfterCreateSuccess(handler("insert"));
  app.hooks.onModelAfterUpdateSuccess(handler("update"));
  app.hooks.onModelAfterDeleteSuccess(handler("delete"));
}

// cache of "hooks" table rows (all where disabled=false), key=collection:event
let hookRows: Map<string, HookRow[]> | null = null;
async function getHookRows(app: VoidbaseApp, collection: string, event: string): Promise<HookRow[]> {
  if (!hookRows) {
    hookRows = new Map();
    const rows = (await app.hooks.$app.findRecordsByFilter("hooks", "disabled = false", "", 0, 0)) as Rec[];
    for (const r of rows) {
      const row: HookRow = { collection: r.getString("collection"), event: r.getString("event"), action_type: r.getString("action_type"), action: r.getString("action"), action_params: r.getString("action_params"), expands: r.getString("expands") };
      const key = `${row.collection}:${row.event}`;
      hookRows.set(key, [...(hookRows.get(key) ?? []), row]);
    }
  }
  return hookRows.get(`${collection}:${event}`) ?? [];
}

async function executeEventActions(app: VoidbaseApp, event: string, table: string, record: Rec) {
  for (const row of await getHookRows(app, table, event)) {
    const expands = row.expands.split(",").map((s) => s.trim()).filter(Boolean);
    if (expands.length) await app.hooks.$app.expandRecord(record, expands);
    try { await executeEventAction(app, event, table, row, record); } catch (err) { console.log("ERROR", err); }
  }
}

async function executeEventAction(app: VoidbaseApp, event: string, table: string, row: HookRow, record: Rec) {
  console.log(`event:${event}, table: ${table}, action: ${row.action}`);
  switch (row.action_type) {
    case "command": return doCommand(row.action, row.action_params, record);
    case "post": return doPost(row.action, record);
    case "email": return doEmail(app, row.action, row.action_params, record);
    default: throw new Error(`Unknown action_type: ${row.action_type}`);
  }
}

async function doCommand(action: string, action_params: string, record: Rec) {
  console.log("-------------------------------");
  const proc = Bun.spawn([action, action_params], { stdin: new TextEncoder().encode(JSON.stringify(record.publicExport()) + "\n"), stdout: "inherit", stderr: "inherit" });
  const code = await proc.exited;
  console.log("-------------------------------");
  if (code !== 0) console.log(`command failed: ${action} exit ${code}`);
}

async function doPost(action: string, record: Rec) {
  const res = await fetch(action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record.publicExport()) }).catch((err) => { console.log("POST failed", action, err); return null; });
  if (res) console.log(await res.text());
}
