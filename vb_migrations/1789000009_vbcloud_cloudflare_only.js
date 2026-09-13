/// <reference path="../.voidbase/pb_data/types.d.ts" />
// Cloudflare is the only way into the site. People sign in with the Cloudflare OAuth2 provider (vb_hooks/
// 01.cloud-bootstrap.ts configures it, 03.cloudflare-login.ts keeps the tokens), and nothing signs a `users` record
// in with a password; the collections snapshot (1774379551) had left password sign-in on anyway, so anyone could try
// addresses and passwords against it. Superusers are their own collection and are not touched. PocketBase keeps the
// setting on `options` in some versions and on the collection itself in others, as the bootstrap hook notes.
const holderOf = (c) => (c.options && typeof c.options === "object" ? c.options : c);
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const holder = holderOf(users);
  holder.passwordAuth = { ...(holder.passwordAuth ?? {}), enabled: false };
  return app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  const holder = holderOf(users);
  holder.passwordAuth = { ...(holder.passwordAuth ?? {}), enabled: true };
  return app.save(users);
});
