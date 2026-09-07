// The releases `voidbase bundle --push` uploads: they live under __releases__/<version>/ in this instance's own R2
// bucket, and provisioning reads a new instance's Worker out of them.
import type { ReleaseManifest, ReleaseSource } from "@voidbase-cloud/voidbase/cloud";
import type { Context } from "hono";
import { pb } from "./pb";

export const RELEASES = "__releases__/";

export interface Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array | string, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; text(): Promise<string> } | null>;
  list(opts: { prefix?: string; cursor?: string; limit?: number }): Promise<{ objects: { key: string; size: number }[]; truncated: boolean; cursor?: string }>;
  delete(keys: string | string[]): Promise<void>;
}
export const bucket = (c: Context) => (c.env as unknown as { STORAGE: Bucket }).STORAGE;

/** A version name, and a path inside a release: both come from the URL, so both are checked before they reach R2. */
export const safe = (s: string) => /^[A-Za-z0-9._-]{1,80}$/.test(s) && !s.startsWith(".");
export const safePath = (p: string) => p.split("/").every((seg) => seg && seg !== "." && seg !== ".." && /^[A-Za-z0-9._\[\]()-]+$/.test(seg));

export async function currentVersion(c: Context): Promise<string | null> { const o = await bucket(c).get(`${RELEASES}current`); return o ? (await o.text()).trim() || null : null; }
export async function releaseSource(c: Context, version?: string): Promise<ReleaseSource> {
  const v = version ?? (await currentVersion(c));
  if (!v) throw new pb.BadRequestError("No voidbase release is available yet: run `voidbase bundle --push <this backend> --token <superuser token>` first.");
  const m = await bucket(c).get(`${RELEASES}${v}/manifest.json`); if (!m) throw new pb.BadRequestError(`release ${v} has no manifest`);
  const manifest = JSON.parse(await m.text()) as ReleaseManifest;
  return { manifest, read: async (path) => { const o = await bucket(c).get(`${RELEASES}${v}/${path}`); if (!o) throw new Error(`release ${v}: missing ${path}`); return new Uint8Array(await o.arrayBuffer()); } };
}
