import { defineHandler } from "void";
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";
import { ghCfg, ghConnectionJSON, open, requireAuth, userId, type HookRecord } from "@/shared";

export const GET = defineHandler(requireAuth(), async (c) => {
  const conf = ghCfg(); let conn: HookRecord | null = null;
  const auth = authOf(c);
  if (auth && !auth.isSuperuser()) { try { conn = await pb.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: auth.id }); } catch { conn = null; } }
  return { configured: !!conf.clientId, connected: !!conn, connection: ghConnectionJSON(conn), scopes: conf.scopes.join(" ") };
});

export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const conf = ghCfg();
  let conn: HookRecord | null = null; try { conn = await pb.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: uid }); } catch { conn = null; }
  if (!conn) return { disconnected: false };
  // revoke the grant on GitHub too (best effort: the OAuth app's own credentials authorize this call)
  try { const token = await open(conn.getString("access_token")); await fetch(`${conf.api}/applications/${conf.clientId}/grant`, { method: "DELETE", headers: { authorization: "Basic " + btoa(`${conf.clientId}:${conf.clientSecret}`), accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "voidbase-cloud" }, body: JSON.stringify({ access_token: token }) }); } catch { /* revocation is a courtesy */ }
  await pb.$app.delete(conn);
  return { disconnected: true };
});
