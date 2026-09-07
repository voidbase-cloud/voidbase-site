// Secrets: the OAuth tokens this backend keeps for a visitor, and the signed state parameter it hands GitHub.
import { openSecret, sealSecret } from "@voidbase-cloud/voidbase/cloud";
import { pb } from "./pb";
import { cfg } from "./config";

// Tokens at rest are sealed with VOIDBASE_ENCRYPTION_KEY. A deployed backend refuses to keep them unsealed; local
// dev without a key keeps them readable and says so once.
let warnedPlain = false;
export const seal = async (plain: string): Promise<string> => {
  const c = cfg();
  if (c.encryptionKey) return sealSecret(plain, c.encryptionKey);
  if (c.worker) throw new pb.InternalServerError("VOIDBASE_ENCRYPTION_KEY is not set: refusing to store Cloudflare tokens unencrypted.");
  if (!warnedPlain) { warnedPlain = true; console.warn("vbcloud: VOIDBASE_ENCRYPTION_KEY is not set, Cloudflare tokens are stored unencrypted (local dev only)"); }
  return plain;
};
export const open = (stored: string): Promise<string> => openSecret(stored, cfg().encryptionKey);

// base64url and an HMAC over it: what the GitHub connect flow signs its state with, so the callback can trust it.
export const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
export async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)))));
}

/** The superuser password of a new instance: shown to its owner once, never stored here. */
export const randomPassword = (n = 24) => { const a = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const b = crypto.getRandomValues(new Uint8Array(n)); return [...b].map((x) => a[x % a.length]).join(""); };
