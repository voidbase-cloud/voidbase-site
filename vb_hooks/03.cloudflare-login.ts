// onRecordAuthWithOAuth2Request: after every Cloudflare login, keep the tokens (sealed with
// VOIDBASE_ENCRYPTION_KEY) and the accounts the user granted, in `cf_connections` (superuser-only).
import { defineHook } from "@voidbase-cloud/voidbase/adapter";
import { CfApi, listAccounts, type CfAccount } from "@voidbase-cloud/voidbase/cloud";
import { cfg, pb, seal, type HookRecord } from "@/shared";

type OAuth2User = { id: string; email: string; name: string; username: string; accessToken: string; refreshToken: string; expiry: string };
type AuthEvent = { next: () => Promise<unknown>; record?: HookRecord | null; providerName?: string; oAuth2User?: OAuth2User };

export default defineHook<AuthEvent>("onRecordAuthWithOAuth2Request", async (e) => {
  await e.next();
  if (e.providerName !== "cloudflare" || !e.oAuth2User) return;
  const u = e.oAuth2User;
  let record = e.record ?? null;
  if (!record) { const ext = await pb.$app.findFirstRecordByFilter("_externalAuths", "provider = 'cloudflare' && providerId = {:pid}", { pid: u.id }); record = await pb.$app.findRecordById("users", ext.getString("recordRef")); }
  if (!record) return;
  let accounts: CfAccount[] = []; try { accounts = await listAccounts(new CfApi(u.accessToken, cfg().apiBase)); } catch (err) { console.warn("vbcloud: listing accounts after login", err); }
  let conn: HookRecord; try { conn = await pb.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: record.id }); } catch { conn = new pb.Record(pb.$app.findCollectionByNameOrId("cf_connections")); conn.set("user", record.id); }
  conn.set("cf_user_id", u.id); conn.set("email", u.email); conn.set("name", u.name); conn.set("access_token", await seal(u.accessToken));
  if (u.refreshToken) conn.set("refresh_token", await seal(u.refreshToken));
  conn.set("expiry", u.expiry || ""); conn.set("scopes", cfg().scopes.join(" ")); conn.set("accounts", accounts);
  await pb.$app.save(conn);
});
