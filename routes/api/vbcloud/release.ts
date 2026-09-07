import { defineHandler } from "void";
import { currentVersion, releaseSource, requireAuth } from "@/shared";

// what the active release is, for anyone signed in (the cloud page shows it before offering an instance)
export const GET = defineHandler(requireAuth(), async (c) => {
  const v = await currentVersion(c); if (!v) return { current: null };
  const { manifest: m } = await releaseSource(c, v);
  return { current: v, voidbase: m.voidbase, builtAt: m.builtAt, modules: m.modules.length, assets: m.assets.length, migrations: m.migrations.length, hub: m.durableObjects.length > 0, queue: !!m.queueBinding };
});
