// /api/vbcloud/cf/* — Cloudflare's API, for the signed-in user's own connection.
//
// voidbase.cloud does its work in the browser, with voidbase's own REST code (`@voidbase-cloud/voidbase/cloud`):
// creating, upgrading and deleting instances are calls on Cloudflare's API in the user's account. Cloudflare's
// API sends no CORS headers, so those calls come through here: the path after /cf/ is the API path, the body and
// method are the caller's, and the bearer becomes the user's own Cloudflare token, kept sealed on this site and
// never sent to the browser. Nothing is interpreted; Cloudflare's answer is the answer.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { cfg, connectionFor, requireAuth, userId } from "@/shared";

const forward = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c);
  const { cf } = await connectionFor(uid);
  const path = "/" + (c.req.param("path") ?? "").replace(/^\/+/, "");
  if (!/^\/(accounts|zones|user|memberships)(\/|$)/.test(path)) throw new pb.BadRequestError("Only Cloudflare's account, zone and user resources go through here.");
  const url = new URL(c.req.raw.url); const target = `${cfg().apiBase}${path}${url.search}`;
  // an asset upload carries its own session token as the bearer; the client sends it as x-cf-token
  const own = c.req.raw.headers.get("x-cf-token");
  const headers: Record<string, string> = { authorization: `Bearer ${own || cf.token}`, "user-agent": "voidbase-cloud" };
  const ct = c.req.raw.headers.get("content-type"); if (ct) headers["content-type"] = ct;
  const method = c.req.raw.method;
  const r = await fetch(target, { method, headers, body: method === "GET" || method === "HEAD" ? undefined : await c.req.raw.arrayBuffer() });
  return new Response(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
});
export const GET = forward, POST = forward, PUT = forward, PATCH = forward, DELETE = forward;
