// The site's voidbase backend: the PocketBase JS SDK against the origin this site is served from (the backend
// serves the built site from pb_public, so "/" is right in production and behind the dev proxy); PB_VB_URL points
// somewhere else when it is set.
import PocketBase from "@voidbase-cloud/sdk";

export const VB_URL = ((import.meta.env as unknown as Record<string, string>).PB_VB_URL ?? "").replace(/\/$/, "");

let client: PocketBase | null = null;
export function vb(): PocketBase {
  if (!client) {
    client = new PocketBase(VB_URL || "/");
    client.autoCancellation(false);
  }
  return client;
}

/** JSON call to /api/vbcloud/* with the current auth token (pb.send adds it and serialises the body) */
export function cloud<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  return vb().send(path, { method, body }) as Promise<T>;
}

export function errorMessage(err: unknown): string {
  const e = err as { response?: { message?: string }; data?: { message?: string }; message?: string };
  return e?.response?.message || e?.data?.message || e?.message || String(err);
}
