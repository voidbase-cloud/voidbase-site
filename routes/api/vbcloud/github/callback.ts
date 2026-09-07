import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { callbackUrl, gh, ghCfg, hmac, seal, unb64url, type HookRecord } from "@/shared";

// where GitHub sends the browser back: no auth guard, the signed `state` is what identifies the visitor
export const GET = defineHandler(async (c) => {
  const conf = ghCfg(); const back = (q: string) => c.redirect(`${conf.site}/cloud?${q}`, 302);
  const query = (name: string) => c.req.query(name) ?? "";
  const code = query("code"), state = query("state"), denied = query("error");
  if (denied) return back(`github=error&message=${encodeURIComponent(query("error_description") || denied)}`);
  const [payload, sig] = state.split(".");
  if (!payload || !sig || sig !== (await hmac(conf.clientSecret, payload))) return back("github=error&message=" + encodeURIComponent("invalid state"));
  const st = JSON.parse(unb64url(payload)) as { u: string; t: number };
  if (Date.now() - st.t > 10 * 60_000) return back("github=error&message=" + encodeURIComponent("the sign-in link expired, try again"));
  const tokenRes = await fetch(conf.oauth + "/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: conf.clientId, client_secret: conf.clientSecret, code, redirect_uri: callbackUrl(c) }) });
  const tok = (await tokenRes.json().catch(() => ({}))) as { access_token?: string; scope?: string; error?: string; error_description?: string };
  if (!tok.access_token) return back("github=error&message=" + encodeURIComponent(tok.error_description || tok.error || "GitHub returned no token"));
  const { data: me } = await gh<{ id: number; login: string; name: string | null; avatar_url: string }>(tok.access_token, "GET", "/user");
  let conn: HookRecord; try { conn = await pb.$app.findFirstRecordByFilter("gh_connections", "user = {:u}", { u: st.u }); } catch { conn = new pb.Record(pb.$app.findCollectionByNameOrId("gh_connections")); conn.set("user", st.u); }
  conn.set("gh_user_id", String(me.id)); conn.set("login", me.login); conn.set("name", me.name ?? ""); conn.set("avatar_url", me.avatar_url ?? ""); conn.set("scopes", tok.scope ?? conf.scopes.join(" ")); conn.set("access_token", await seal(tok.access_token));
  await pb.$app.save(conn);
  return back("github=connected");
});
