import { defineHandler } from "void";
import { RELEASES, bucket, currentVersion, requireSuperuser } from "@/shared";

// every release in this instance's storage, with the bytes each one occupies
export const GET = defineHandler(requireSuperuser(), async (c) => {
  const versions = new Map<string, number>();
  for (let cursor: string | undefined; ;) { const page = await bucket(c).list({ prefix: RELEASES, cursor }); for (const o of page.objects) { const v = o.key.slice(RELEASES.length).split("/")[0]!; if (v && v !== "current") versions.set(v, (versions.get(v) ?? 0) + o.size); } if (!page.truncated || !page.cursor) break; cursor = page.cursor; }
  return { current: await currentVersion(c), releases: [...versions.entries()].map(([version, bytes]) => ({ version, bytes })).sort((a, b) => b.version.localeCompare(a.version)) };
});
