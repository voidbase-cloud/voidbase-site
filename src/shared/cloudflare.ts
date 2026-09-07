// The visitor's Cloudflare side: the connection kept for them after "Sign in with Cloudflare", and the instances
// provisioned on their account. Provisioning itself is `@voidbase-cloud/voidbase/cloud`, called from the routes.
import { CfApi, refreshOAuthToken, type CfAccount } from "@voidbase-cloud/voidbase/cloud";
import type { Context } from "hono";
import { authOf, pb, pbDate, type HookRecord } from "./pb";
import { cfg } from "./config";
import { open, seal } from "./secrets";
import { isAdmin } from "./auth";

/** A usable Cloudflare API client for a signed-in user, refreshing the token when it is about to expire. */
export async function connectionFor(uid: string): Promise<{ conn: HookRecord; cf: CfApi; accounts: CfAccount[] }> {
  let conn: HookRecord; try { conn = await pb.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: uid }); } catch { throw new pb.BadRequestError("Connect your Cloudflare account first: sign in with Cloudflare."); }
  let token = await open(conn.getString("access_token")); const exp = conn.getString("expiry"); const c = cfg();
  if (exp && Date.parse(exp) < Date.now() + 60_000 && conn.getString("refresh_token")) {
    const t = await refreshOAuthToken({ tokenURL: c.tokenURL, clientId: c.clientId, clientSecret: c.clientSecret, refreshToken: await open(conn.getString("refresh_token")) });
    conn.set("access_token", await seal(t.access_token)); if (t.refresh_token) conn.set("refresh_token", await seal(t.refresh_token)); if (t.expires_in) conn.set("expiry", pbDate(new Date(Date.now() + t.expires_in * 1000)));
    await pb.$app.save(conn); token = t.access_token;
  }
  if (!token) throw new pb.BadRequestError("Your Cloudflare connection has no token: sign in with Cloudflare again.");
  const raw = conn.get("accounts"); const accounts = (Array.isArray(raw) ? raw : typeof raw === "string" ? (JSON.parse(raw || "[]") as CfAccount[]) : []) as CfAccount[];
  return { conn, cf: new CfApi(token, c.apiBase), accounts };
}
export const connectionJSON = (conn: HookRecord | null) => conn ? { email: conn.getString("email"), name: conn.getString("name"), cfUserId: conn.getString("cf_user_id"), scopes: conn.getString("scopes"), expiry: conn.getString("expiry"), accounts: (() => { const a = conn.get("accounts"); return Array.isArray(a) ? a : typeof a === "string" ? JSON.parse(a || "[]") : []; })() } : null;

// ---- this backend's own row in vb_instances ------------------------------------------------------------------
// VOIDBASE_WORKER_NAME and VOIDBASE_ACCOUNT_ID are baked in by `voidbase deploy`, so a deployed site knows which
// Worker it is and lists itself as the `system` instance: an admin can delete the site's own backend from the site.
async function selfRow(): Promise<HookRecord | null> { const c = cfg(); if (!c.worker) return null; try { return (await pb.$app.findFirstRecordByFilter("vb_instances", "name = {:n}", { n: c.worker })) as HookRecord; } catch { return null; } }
export async function ensureSelf(origin?: string) {
  const c = cfg(); if (!c.worker) return;
  const existing = await selfRow();
  const row: HookRecord = existing ?? (() => { const r = new pb.Record(pb.$app.findCollectionByNameOrId("vb_instances")) as HookRecord; r.set("name", c.worker); r.set("account_id", c.account || "unknown"); r.set("status", "live"); r.set("system", true); return r; })();
  let changed = !existing;
  if (origin && !row.getString("url")) { row.set("url", origin); changed = true; }
  if (changed) await pb.$app.save(row);
}

/** One instance as the /cloud page is shown it. */
export const instanceJSON = (r: HookRecord, viewer: HookRecord | null) => ({ id: r.id, name: r.getString("name"), url: r.getString("url"), status: r.getString("status"), error: r.getString("error"), release: r.getString("release"), account: { id: r.getString("account_id"), name: r.getString("account_name") }, owner: r.getString("owner"), system: r.getBool("system"), superuserEmail: r.getString("superuser_email"), created: String(r.get("created") ?? ""), updated: String(r.get("updated") ?? ""), canDelete: !!viewer && (r.getString("owner") === viewer.id || (r.getBool("system") && isAdmin(viewer))), canLink: !!viewer && (r.getString("owner") === viewer.id || (r.getBool("system") && isAdmin(viewer))), self: !!cfg().worker && r.getString("name") === cfg().worker });

/** The instance a repository may be wired to: the visitor's own, or this site's backend for admins (dogfooding). */
export async function linkableInstance(c: Context, uid: string, instId: string): Promise<HookRecord> {
  if (!instId) throw new pb.BadRequestError("Pick the voidbase instance the repository should use.");
  let inst: HookRecord; try { inst = (await pb.$app.findRecordById("vb_instances", instId)) as HookRecord; } catch { throw new pb.BadRequestError("Unknown instance."); }
  if (!(inst.getString("owner") === uid || (inst.getBool("system") && isAdmin(authOf(c))))) throw new pb.ForbiddenError("That instance is not yours.");
  if (inst.getString("status") !== "live" || !inst.getString("url")) throw new pb.BadRequestError("The instance is not live yet.");
  return inst;
}
