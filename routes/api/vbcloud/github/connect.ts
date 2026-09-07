import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { b64url, callbackUrl, ghCfg, hmac, requireAuth, userId } from "@/shared";

// connect: state = user + time, HMAC-signed with the client secret, so no server-side state is kept
export const GET = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c); const conf = ghCfg();
  if (!conf.clientId || !conf.clientSecret) throw new pb.BadRequestError("The backend has no GitHub OAuth app configured (GH_OAUTH_CLIENT_ID / GH_OAUTH_CLIENT_SECRET).");
  const payload = b64url(JSON.stringify({ u: uid, t: Date.now(), n: crypto.randomUUID() }));
  const state = `${payload}.${await hmac(conf.clientSecret, payload)}`;
  const url = new URL(conf.oauth + "/login/oauth/authorize");
  url.searchParams.set("client_id", conf.clientId); url.searchParams.set("redirect_uri", callbackUrl(c)); url.searchParams.set("scope", conf.scopes.join(" ")); url.searchParams.set("state", state);
  return { url: url.toString() };
});
