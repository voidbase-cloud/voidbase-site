import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { cfg, connectionJSON, isAdmin, requireAuth, type HookRecord } from "@/shared";

// who am I on the cloud page
export const GET = defineHandler(requireAuth(), async (c) => {
  const auth = authOf(c)!; let conn: HookRecord | null = null;
  if (!auth.isSuperuser()) { try { conn = await pb.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: auth.id }); } catch { conn = null; } }
  const conf = cfg();
  return { user: { id: auth.id, email: auth.email?.() ?? auth.getString("email"), name: auth.getString("name"), superuser: auth.isSuperuser() }, admin: isAdmin(auth), connected: !!conn, connection: connectionJSON(conn), self: { worker: conf.worker || null, account: conf.account || null }, prefix: conf.prefix, maxInstances: conf.maxPerUser, providerConfigured: !!conf.clientId };
});
