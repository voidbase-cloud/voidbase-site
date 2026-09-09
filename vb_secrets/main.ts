// voidbase.cloud's configuration, declared once (twelve-factor III: config in the environment, declared in code).
// Every key states who may read it, and whoever edits this file answers for that:
//   secret()    the Worker's encrypted secrets, hooks and routes only; `voidbase secrets push` stores them, a deploy
//               never replaces one
//   server()    plain Worker vars, hooks and routes only, set by every deploy from the values here, the build's
//               environment or the defaults
//   browser()   also inlined into the static site as import.meta.env.KEY: what the browser may know
//   local()     voidbase's own tooling on this machine or in CI: never stored on the Worker, never in a build
// Values live in vb_secrets/secrets.json on a maintainer's machine (git-ignored; the deploy token too) and, once
// deployed, on the Worker. `voidbase secrets` (from .voidbase/) shows each key, its tier and where its value is.
import { browser, defineSecrets, local, secret, server, boolean, number, string, url } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  // ---- local: the deploy itself
  VOIDBASE_DEPLOY_CF_API_KEY: local(string().optional(), "the deploy token (`voidbase token` prints the link that creates it)"),
  VOIDBASE_DEPLOY_NAME: local(string().default("voidbase-site"), "the Worker this project deploys to"),
  VOIDBASE_DEPLOY_DOMAIN: local(string().default("voidbase.cloud,www.voidbase.cloud"), "its hostnames"),
  VOIDBASE_DEPLOY_CRON: local(boolean().default(true), "whether the Worker gets a cron trigger: the keeper (crons/keeper.ts) needs one (Workers Free allows five per account)"),
  CLOUDFLARE_BUILDS_TOKEN: local(string().optional(), "a user API token with Workers Builds Configuration: Edit, for `voidbase sync` to connect this repository's pipeline"),

  // ---- secrets: hooks and routes only
  VOIDBASE_SUPERUSER_EMAIL: secret(string(), "the admin panel's superuser"),
  VOIDBASE_SUPERUSER_PASSWORD: secret(string(), "its password"),
  VOIDBASE_ENCRYPTION_KEY: secret(string(), "seals the settings row and the Cloudflare tokens in cf_connections (32 chars)"),
  CF_OAUTH_CLIENT_ID: secret(string(), "the Cloudflare OAuth client behind Sign in with Cloudflare"),
  CF_OAUTH_CLIENT_SECRET: secret(string(), "its client secret"),
  GH_OAUTH_CLIENT_ID: secret(string(), "the GitHub OAuth app behind the template marketplace"),
  GH_OAUTH_CLIENT_SECRET: secret(string(), "its client secret"),
  // Optional, and declared as such: a deploy goes through without a value for it (voidbase 0.9.0-beta.11 and later).
  // Without it the control plane starts no builds and says so; a maintainer starts them by hand.
  VB_BUILDS_TOKEN: secret(string().optional(), "a user API token with Workers Builds Configuration: Edit and Workers Scripts: Read, so the control plane starts instance builds and the nightly proof on Cloudflare (src/shared/builder.ts)"),

  // ---- server: hooks and routes only (src/shared/config.ts reads them)
  VB_ADMIN_EMAILS: server(string(), "who counts as an admin of this site (comma separated)"),
  VB_INSTANCE_PREFIX: server(string().default("vb-"), "prefix of every instance's Worker name"),
  VB_MAX_INSTANCES_PER_USER: server(number().default(5)),
  VB_ALLOW_SELF_DELETE: server(boolean().default(false), "whether a user may delete their own instances"),
  CF_OAUTH_SCOPES: server(string().optional(), "overrides the Cloudflare OAuth scopes (space separated)"),
  GH_OAUTH_SCOPES: server(string().optional(), "overrides the GitHub OAuth scopes"),
  VB_SITE_URL: server(url().optional(), "where the GitHub callback sends the browser back (defaults per runtime)"),
  VB_SITE_REPO: server(string().optional(), "this site's own repository, owner/name"),
  // the builds the control plane starts (src/shared/builder.ts, crons/keeper.ts): found by name, never kept as uuids
  VB_BUILDS_ACCOUNT: server(string().optional(), "the account the builds run on (defaults to this Worker's own)"),
  VB_BUILDER_WORKER: server(string().default("voidbase-builder"), "the Worker whose trigger builds cloud instances"),
  VB_BUILDER_TRIGGER: server(string().default("voidbase-builder (instance-build)"), "that trigger's name"),
  VB_LIVE_WORKER: server(string().default("voidbase-live"), "the Worker whose trigger is the nightly proof (scripts/cf-triggers.ts)"),
  VB_LIVE_TRIGGER: server(string().default("voidbase-live (nightly)"), "that trigger, started at 03:30 and 04:30 UTC"),
  // the landing page's live cursors (voidbase/docs/deploy.md): the newest three visitors hold a slot and may send
  // their cursor, everyone else watches over the connection they already have. Nothing is written to the database.
  // Set VOIDBASE_PRESENCE to 0 and the page falls back to a canned animation at no cost.
  VOIDBASE_PRESENCE: server(boolean().default(true), "the landing page's live cursors"),
  VOIDBASE_PRESENCE_MAX: server(number().default(3), "how many visitors hold a cursor slot at once"),
  VOIDBASE_PRESENCE_TTL: server(number().default(12), "seconds a slot survives without a beat"),

  // ---- browser: inlined into the static site as import.meta.env.PB_* (src/lib/env.ts)
  PB_VB_URL: browser(url().optional(), "where the browser reaches the API (same origin when unset)"),
  PB_VERSION: browser(string().optional(), "the PocketBase version this build tracks"),
  PB_VB_VERSION: browser(string().optional(), "the voidbase version this build tracks"),
  PB_REPO_URL: browser(url().optional()),
  PB_DISCUSSIONS_URL: browser(url().optional()),
  PB_DISCORD_URL: browser(url().optional()),
  PB_MARKETPLACE_URL: browser(url().optional()),
});
