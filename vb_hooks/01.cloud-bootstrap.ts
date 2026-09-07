// onBootstrap: enable "Sign in with Cloudflare" on `users`, and register this backend as the `system` instance.
//
// The `cloudflare` OAuth2 provider is configured from CF_OAUTH_CLIENT_ID / CF_OAUTH_CLIENT_SECRET (an OAuth client
// from dash.cloudflare.com > Manage Account > OAuth clients, redirect URL <this backend>/api/oauth2-redirect, the
// scopes in CF_OAUTH_SCOPES). Registering the backend in `vb_instances` is what lets an admin (VB_ADMIN_EMAILS)
// delete the site's own backend from the site; the instances route fills in its URL later, from the first request
// that reaches it.
import { defineHook } from "@voidbase-cloud/voidbase/adapter";
import { CF_TOKEN_URL, cfg, ensureSelf, pb } from "@/shared";

// PocketBase keeps `oauth2` on `options` in some versions and on the collection itself in others, so the provider
// is written through whichever holder is there.
type CollectionShape = { options?: Record<string, unknown> } & Record<string, unknown>;

async function ensureProvider() {
  const c = cfg(); if (!c.clientId) return;
  const users = pb.$app.findCollectionByNameOrId("users");
  const shape = users as unknown as CollectionShape;
  const holder = (shape.options && typeof shape.options === "object" ? shape.options : shape) as Record<string, unknown>;
  const current = (holder.oauth2 ?? {}) as { enabled?: boolean; providers?: Record<string, unknown>[]; mappedFields?: Record<string, string> };
  const provider = { name: "cloudflare", displayName: "Cloudflare", clientId: c.clientId, clientSecret: c.clientSecret, pkce: true, ...(c.authURL ? { authURL: c.authURL } : {}), ...(c.tokenURL !== CF_TOKEN_URL ? { tokenURL: c.tokenURL } : {}), ...(c.userInfoURL ? { userInfoURL: c.userInfoURL } : {}), extra: { scopes: c.scopes, apiBase: c.apiBase } };
  const providers = [...(current.providers ?? []).filter((p) => p.name !== "cloudflare"), provider];
  const mf = current.mappedFields ?? {};
  const desired = { ...current, enabled: true, providers, mappedFields: { id: mf.id ?? "", username: mf.username ?? "", avatarURL: mf.avatarURL ?? "", name: mf.name || "name" } };
  if (JSON.stringify(desired) === JSON.stringify(current)) return;
  holder.oauth2 = desired;
  await pb.$app.save(users);
  console.log("vbcloud: cloudflare OAuth2 provider configured on users");
}

export default defineHook("onBootstrap", async (e) => {
  await e.next();
  try { await ensureProvider(); } catch (err) { console.warn("vbcloud: provider setup", err); }
  try { await ensureSelf(); } catch (err) { console.warn("vbcloud: self registration", err); }
});
