// Who is asking: the route guards, and the two questions every vbcloud route asks about the visitor.
import { requireAuth as pbRequireAuth, requireSuperuser as pbRequireSuperuser } from "@voidbase-cloud/voidbase/adapter";
import type { Context } from "hono";
import { authOf, pb, type HookRecord } from "./pb";
import { cfg } from "./config";

/** The adapter's auth guards, retyped: it types a middleware as returning `unknown`, and the middleware slot of
 *  `defineHandler` wants Void's `Promise<Response | void>`. Same guards, same errors, same status codes. */
type Guard = (c: Context, next: () => Promise<void>) => Promise<void>;
export const requireAuth = (...collections: string[]): Guard => { const mw = pbRequireAuth(...collections); return async (c, next) => { await mw(c, next); }; };
export const requireSuperuser = (): Guard => { const mw = pbRequireSuperuser(); return async (c, next) => { await mw(c, next); }; };

/** A superuser, or one of VB_ADMIN_EMAILS: allowed to see and delete this site's own backend. */
export const isAdmin = (auth: HookRecord | null) => !!auth && (auth.isSuperuser() || cfg().admins.includes(String(auth.email?.() ?? auth.getString("email")).toLowerCase()));
/** The visitor's own user id. Superusers manage releases, not instances, so they are refused here. */
export const userId = (c: Context) => { const auth = authOf(c); if (!auth || auth.isSuperuser()) throw new pb.ForbiddenError("Sign in with Cloudflare as a user (superusers manage releases, not instances)."); return auth.id; };
/** The request body as JSON, or {} when there is none: every vbcloud route treats a missing body as empty. */
export const readBody = async (c: Context): Promise<Record<string, unknown>> => { try { return (await c.req.raw.clone().json()) as Record<string, unknown>; } catch { return {}; } };
