// voidbase.cloud's configuration, declared once (twelve-factor III: config in the environment, declared in code).
// Values live in vb_secrets/secrets.json on a maintainer's machine (git-ignored) and, once deployed, on the Worker:
// `.secret()` keys as its encrypted secrets (`voidbase secrets push` stores them, a deploy never replaces one),
// the rest as its vars, set by every deploy from the values here, the build's environment or the defaults.
// `.public()` keys are also inlined into the static site as import.meta.env.KEY; nothing else reaches the browser.
// `voidbase secrets` (from .voidbase/) shows each key, its tier and where its value is.
import { defineSecrets, describe, boolean, number, string, url } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  // ---- secrets: the Worker's encrypted secrets, hooks and routes only
  VOIDBASE_SUPERUSER_EMAIL: describe(string().secret(), "the admin panel's superuser"),
  VOIDBASE_SUPERUSER_PASSWORD: describe(string().secret(), "its password"),
  VOIDBASE_ENCRYPTION_KEY: describe(string().secret(), "seals the settings row and the Cloudflare tokens in cf_connections (32 chars)"),
  CF_OAUTH_CLIENT_ID: describe(string().secret(), "the Cloudflare OAuth client behind Sign in with Cloudflare"),
  CF_OAUTH_CLIENT_SECRET: describe(string().secret(), "its client secret"),
  GH_OAUTH_CLIENT_ID: describe(string().secret(), "the GitHub OAuth app behind the template marketplace"),
  GH_OAUTH_CLIENT_SECRET: describe(string().secret(), "its client secret"),

  // ---- server configuration: plain Worker vars, hooks and routes only (src/shared/config.ts reads them)
  VB_ADMIN_EMAILS: describe(string(), "who counts as an admin of this site (comma separated)"),
  VB_INSTANCE_PREFIX: describe(string().default("vb-"), "prefix of every instance's Worker name"),
  VB_MAX_INSTANCES_PER_USER: number().default(5),
  VB_ALLOW_SELF_DELETE: describe(boolean().default(false), "whether a user may delete their own instances"),
  CF_OAUTH_SCOPES: describe(string().optional(), "overrides the Cloudflare OAuth scopes (space separated)"),
  GH_OAUTH_SCOPES: describe(string().optional(), "overrides the GitHub OAuth scopes"),
  VB_SITE_URL: describe(url().optional(), "where the GitHub callback sends the browser back (defaults per runtime)"),
  VB_SITE_REPO: describe(string().optional(), "this site's own repository, owner/name"),

  // ---- public: the browser's share, inlined into the static site as import.meta.env.PB_* (src/lib/env.ts)
  PB_VB_URL: describe(url().optional().public(), "where the browser reaches the API (same origin when unset)"),
  PB_VERSION: describe(string().optional().public(), "the PocketBase version this build tracks"),
  PB_VB_VERSION: describe(string().optional().public(), "the voidbase version this build tracks"),
  PB_REPO_URL: url().optional().public(),
  PB_DISCUSSIONS_URL: url().optional().public(),
});
