import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import { RELEASES, bucket, releaseSource, requireSuperuser, safe } from "@/shared";

// the release new instances are provisioned from
export const POST = defineHandler(requireSuperuser(), async (c) => {
  const version = c.req.param("version") ?? ""; if (!safe(version)) throw new pb.BadRequestError("invalid version");
  const src = await releaseSource(c, version); // validates the manifest
  await bucket(c).put(`${RELEASES}current`, version, { httpMetadata: { contentType: "text/plain" } });
  return { current: version, modules: src.manifest.modules.length, assets: src.manifest.assets.length };
});
