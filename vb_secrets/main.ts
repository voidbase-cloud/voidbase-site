// The secrets voidbase.cloud's backend needs, named where the build can read them. Their values live in
// vb_secrets/secrets.json on a maintainer's machine (git-ignored) and, once `voidbase deploy` has stored them, as the
// Worker's own secrets: a CI checkout has no secrets.json and deploys with nothing but the deploy token.
// `voidbase secrets` (from .voidbase/) shows which are where; `voidbase secrets push` stores the local values.
import { defineSecrets } from "@voidbase-cloud/voidbase/adapter";

export default defineSecrets({
  VOIDBASE_SUPERUSER_EMAIL: "the admin panel's superuser",
  VOIDBASE_SUPERUSER_PASSWORD: "its password",
  VOIDBASE_ENCRYPTION_KEY: "seals the settings row and the Cloudflare tokens in cf_connections (32 chars)",
  CF_OAUTH_CLIENT_ID: "the Cloudflare OAuth client behind Sign in with Cloudflare",
  CF_OAUTH_CLIENT_SECRET: "its client secret",
  GH_OAUTH_CLIENT_ID: "the GitHub OAuth app behind the template marketplace",
  GH_OAUTH_CLIENT_SECRET: "its client secret",
});
