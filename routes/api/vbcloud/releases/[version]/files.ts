import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { RELEASES, bucket, requireAuth, requireSuperuser, safe, safePath } from "@/shared";

// one file of a release, as pushed by `voidbase bundle --push`
export const POST = defineHandler(requireSuperuser(), async (c) => {
  const version = c.req.param("version") ?? "", path = c.req.query("path");
  if (!safe(version) || !path || !safePath(path)) throw new pb.BadRequestError("invalid version or path");
  const bytes = await c.req.raw.arrayBuffer();
  await bucket(c).put(`${RELEASES}${version}/${path}`, bytes, { httpMetadata: { contentType: c.req.raw.headers.get("content-type") ?? "application/octet-stream" } });
  return { version, path, size: bytes.byteLength };
});

// one file of a release, for the browser that provisions an instance from it (anyone signed in)
export const GET = defineHandler(requireAuth(), async (c) => {
  const version = c.req.param("version") ?? "", path = c.req.query("path");
  if (!safe(version) || !path || !safePath(path)) throw new pb.BadRequestError("invalid version or path");
  const o = await bucket(c).get(`${RELEASES}${version}/${path}`); if (!o) throw new pb.NotFoundError();
  return new Response(await o.arrayBuffer(), { headers: { "content-type": path.endsWith(".json") ? "application/json" : path.endsWith(".js") ? "text/javascript" : "application/octet-stream", "cache-control": "private, max-age=3600" } });
});
