// Every environment knob voidbase cloud reads, in one place. Nothing here touches the database.
import { CF_API_BASE } from "@voidbase-cloud/voidbase/cloud";
import { env } from "./pb";

export const CF_TOKEN_URL = "https://dash.cloudflare.com/oauth2/token";
// Resource scopes are Cloudflare API permission ids (GET /oauth/scopes lists them; verified 2026-09-06): identity and
// the accounts granted on the consent screen, then what provisioning needs; `openid` is not one of them and is
// refused. Override with CF_OAUTH_SCOPES="offline_access user-details.read ...".
export const DEFAULT_SCOPES = ["offline_access", "user-details.read", "account-settings.read", "workers-scripts.write", "d1.write", "workers-r2.write", "workers-r2-bucket-item.read", "workers-r2-bucket-item.write", "queues.write"];
// repo: create from a template, set Actions variables, reach private repositories
export const DEFAULT_GH_SCOPES = ["repo", "read:user", "user:email"];

/** "Sign in with Cloudflare", provisioning, and who counts as an admin of this site. */
export const cfg = () => ({
  clientId: env("CF_OAUTH_CLIENT_ID"), clientSecret: env("CF_OAUTH_CLIENT_SECRET"),
  scopes: env("CF_OAUTH_SCOPES", DEFAULT_SCOPES.join(" ")).split(/[\s,]+/).filter(Boolean),
  authURL: env("CF_OAUTH_AUTH_URL"), tokenURL: env("CF_OAUTH_TOKEN_URL", CF_TOKEN_URL), userInfoURL: env("CF_OAUTH_USERINFO_URL"),
  apiBase: env("CLOUDFLARE_API_BASE", CF_API_BASE),
  worker: env("VOIDBASE_WORKER_NAME"), account: env("VOIDBASE_ACCOUNT_ID"),
  admins: env("VB_ADMIN_EMAILS").toLowerCase().split(/[\s,]+/).filter(Boolean),
  prefix: env("VB_INSTANCE_PREFIX", "vb-"), maxPerUser: Math.max(1, Number(env("VB_MAX_INSTANCES_PER_USER", "5")) || 5),
  encryptionKey: env("VOIDBASE_ENCRYPTION_KEY"),
  allowSelfDelete: ["1", "true", "yes"].includes(env("VB_ALLOW_SELF_DELETE").toLowerCase()),
});

/** The template marketplace: the GitHub OAuth app, where the callback sends the browser, and this site's own repo. */
export const ghCfg = () => {
  const worker = env("VOIDBASE_WORKER_NAME");
  return {
    clientId: env("GH_OAUTH_CLIENT_ID"), clientSecret: env("GH_OAUTH_CLIENT_SECRET"),
    scopes: env("GH_OAUTH_SCOPES", DEFAULT_GH_SCOPES.join(" ")).split(/[\s,]+/).filter(Boolean),
    api: env("GITHUB_API_BASE", "https://api.github.com").replace(/\/$/, ""),
    oauth: env("GITHUB_OAUTH_BASE", "https://github.com").replace(/\/$/, ""),
    // where the callback sends the browser back to: the site (production) or the local site dev server
    site: env("VB_SITE_URL", worker ? "https://voidbase.cloud" : "http://127.0.0.1:5173").replace(/\/$/, ""),
    worker, siteRepo: env("VB_SITE_REPO", "voidbase-cloud/voidbase-site").trim().toLowerCase(), // listed as the system row
    // the token that commits to the system repositories (plugin changes on system instances), and the projects this
    // site manages beside its own: "owner/name=worker@https://url" entries, comma separated (the demo)
    token: env("VB_GH_TOKEN"),
    systemProjects: env("VB_SYSTEM_PROJECTS").split(",").map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^([^=]+)=([^@]+)@(.+)$/); return m ? { repo: m[1]!.trim().toLowerCase(), worker: m[2]!.trim(), url: m[3]!.trim().replace(/\/+$/, "") } : null; }).filter((x): x is { repo: string; worker: string; url: string } => !!x),
  };
};
