// PocketBase, as this backend's own code sees it.
//
// Everything under src/shared/ is compiled into pb_hooks/void-app.js by voidbase's adapter -- one bundle whose
// `require` reaches only its sibling hook files. So none of it may import voidbase itself, not even for a type: it
// reaches PocketBase through `pb` from the adapter instead. `@voidbase-cloud/voidbase/cloud` is dependency-free
// REST code and bundles fine.
import { authOf, pb } from "@voidbase-cloud/voidbase/adapter";

export { authOf, pb };

/** PocketBase's record type, taken from the adapter rather than from voidbase: importing the package root would pull
 *  its Bun entry (bun:sqlite, Bun.file) into the type-check of every route that touches this module. */
export type HookRecord = NonNullable<ReturnType<typeof authOf>>;

/**
 * One environment value. `$os.getenv` reads the bindings of the request running now; outside one (bootstrap on Bun)
 * it throws, and the process environment is the answer. `process` is reached through globalThis because a route is
 * type-checked without node's globals.
 */
export const env = (k: string, d = ""): string => {
  let v = "";
  try { v = String(pb.$os.getenv(k) ?? ""); } catch { /* outside a request */ }
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (!v && proc !== undefined) v = String(proc.env?.[k] ?? "");
  return v || d;
};

/** PocketBase writes datetimes with a space where ISO has its `T`. */
export const pbDate = (d: Date) => d.toISOString().replace("T", " ");
