// /api/vbcloud/gh/* — GitHub's API, for the signed-in user's own connection (the OAuth token stays here).
//
// A GitHub path names a repository, not an instance, so most of what comes through here is the caller's own
// account and GitHub answers for it. The one place a team matters is a repository this site knows is wired to an
// instance: its `PB_VB_URL` variable is what points the repository's deploys at that instance, so changing it is a
// change to the instance and belongs to an owner or an admin. A viewer of that instance is refused here.
import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { atLeast, ghCfg, ghConnectionFor, requireAuth, roleOf, userId, type HookRecord } from "@/shared";

const forward = defineHandler(requireAuth("users"), async (c) => {
  const uid = userId(c);
  const path = "/" + (c.req.param("path") ?? "").replace(/^\/+/, "");
  if (!/^\/(repos|user|users|orgs)(\/|$)/.test(path)) throw new pb.BadRequestError("Only repositories, users and organisations go through here.");
  const method = c.req.raw.method;
  const fullName = /^\/repos\/([^/]+\/[^/]+)/.exec(path)?.[1]?.toLowerCase() ?? "";
  if (fullName && !["GET", "HEAD"].includes(method)) {
    const rows = (await pb.$app.findRecordsByFilter("vb_repos", "full_name = {:f}", "", 1, 0, { f: fullName })) as HookRecord[];
    const instanceId = rows[0]?.getString("instance") ?? "";
    if (instanceId) {
      let inst: HookRecord | null = null;
      try { inst = (await pb.$app.findRecordById("vb_instances", instanceId)) as HookRecord | null; } catch { inst = null; }
      const role = inst ? await roleOf(uid, inst) : null;
      if (role && !atLeast(role, "admin")) throw new pb.ForbiddenError(`${fullName} is wired to ${inst!.getString("name")}, and you are a viewer of it: a viewer reads and changes nothing.`);
    }
  }
  const { token } = await ghConnectionFor(uid);
  const url = new URL(c.req.raw.url); const target = `${ghCfg().api}${path}${url.search}`;
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, accept: c.req.raw.headers.get("accept") ?? "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "voidbase-cloud" };
  const ct = c.req.raw.headers.get("content-type"); if (ct) headers["content-type"] = ct;
  const r = await fetch(target, { method, headers, body: method === "GET" || method === "HEAD" ? undefined : await c.req.raw.arrayBuffer() });
  return new Response(r.body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
});
export const GET = forward, POST = forward, PUT = forward, PATCH = forward, DELETE = forward;
