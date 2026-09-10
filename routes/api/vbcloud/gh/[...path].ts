// /api/vbcloud/gh/* — GitHub's API, for the signed-in user's own connection (the OAuth token stays here).
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { ghCfg, ghConnectionFor, requireAuth, userId } from "@/shared";

const forward = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c);
  const { token } = await ghConnectionFor(uid);
  const path = "/" + (c.req.param("path") ?? "").replace(/^\/+/, "");
  if (!/^\/(repos|user|users|orgs)(\/|$)/.test(path)) throw new pb.BadRequestError("Only repositories, users and organisations go through here.");
  const url = new URL(c.req.raw.url); const target = `${ghCfg().api}${path}${url.search}`;
  const method = c.req.raw.method;
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, accept: c.req.raw.headers.get("accept") ?? "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "voidbase-cloud" };
  const ct = c.req.raw.headers.get("content-type"); if (ct) headers["content-type"] = ct;
  const r = await fetch(target, { method, headers, body: method === "GET" || method === "HEAD" ? undefined : await c.req.raw.arrayBuffer() });
  return new Response(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
});
export const GET = forward, POST = forward, PUT = forward, PATCH = forward, DELETE = forward;
