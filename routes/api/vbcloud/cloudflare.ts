import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { cfg, open, requireAuth, userId, type HookRecord } from "@/shared";

// Revoking the site's access to the visitor's Cloudflare account. The sealed tokens in `cf_connections` are the only
// way the site acts there (src/shared/cloudflare.ts connectionFor), so deleting the row is what takes the access away;
// the grant is revoked at Cloudflare too, best effort, through the OAuth2 revocation endpoint beside the token
// endpoint. Instances already provisioned are Workers in the visitor's own account and keep running. Signing in with
// Cloudflare again asks for the grant again.
export const DELETE = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const conf = cfg();
  let conn: HookRecord | null = null; try { conn = await pb.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: uid }); } catch { conn = null; }
  if (!conn) return { revoked: false };
  const revokeURL = conf.tokenURL.replace(/\/token$/, "/revoke");
  for (const field of ["refresh_token", "access_token"]) {
    try {
      const token = conn.getString(field) ? await open(conn.getString(field)) : "";
      if (token) await fetch(revokeURL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", authorization: "Basic " + btoa(`${conf.clientId}:${conf.clientSecret}`) }, body: new URLSearchParams({ token, token_type_hint: field }) });
    } catch (err) { console.warn(`vbcloud: revoking the Cloudflare ${field} failed; the site forgets it anyway`, err); }
  }
  await pb.$app.delete(conn);
  return { revoked: true };
});
