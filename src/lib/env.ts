// The public PB_* values the pages read, declared once so the pages do not each reach into import.meta.env.
// They come from .env / .env.example through Vite's envPrefix: "PB" (see vite.config.mts).
import site from "../../package.json";

const env = import.meta.env as unknown as Record<string, string | undefined>;

// the voidbase this site is built against, as package.json pins it: scripts/testbeds.ts in voidbase moves that pin with
// every release, so the header and the footer follow it without a variable anyone has to remember to set
const pinned = String((site as { dependencies?: Record<string, string> }).dependencies?.["@voidbase-cloud/voidbase"] ?? "").replace(/^[\^~]/, "");

export const SITE = {
  // PB_VB_VERSION overrides it; otherwise the version is the one package.json pins. Nothing set it before 1.0.0, so the
  // site kept the old "0.9.0-beta" fallback and its beta mark and banner after the release. A version with a
  // prerelease part is still what would bring both back.
  vbVersion: env.PB_VB_VERSION ?? (pinned || "1.0.0"),
  pbVersion: env.PB_VERSION ?? "",
  repoUrl: env.PB_REPO_URL ?? "https://github.com/voidbase-cloud/voidbase",
  discussionsUrl: env.PB_DISCUSSIONS_URL ?? "https://github.com/voidbase-cloud/voidbase/discussions",
  discordUrl: env.PB_DISCORD_URL ?? "https://discord.gg/zYujFvVYgq",
  marketplaceUrl: env.PB_MARKETPLACE_URL ?? "https://marketplace.voidbase.cloud",
  npmUrl: env.PB_NPM_URL ?? "https://www.npmjs.com/package/@voidbase-cloud/voidbase",
  jsSdkUrl: env.PB_JS_SDK_URL ?? "https://github.com/pocketbase/js-sdk",
  dartSdkUrl: env.PB_DART_SDK_URL ?? "https://github.com/pocketbase/dart-sdk",
  benchmarksUrl: env.PB_BENCHMARKS_URL ?? "",
  releasesUrl: env.PB_GITHUB_RELEASES_URL ?? "",
  godocUrl: env.PB_GODOC_URL ?? "",
} as const;

/** "0.9.0-beta" split into the number and the channel; channel is empty once a release has no prerelease part. */
export const RELEASE = (() => {
  const [number, ...rest] = SITE.vbVersion.split("-");
  return { number: number ?? SITE.vbVersion, channel: rest.join("-").replace(/\.\d+$/, "") };
})();

/** the release downloads the landing page links to */
export const DOWNLOADS = {
  linuxAmd: { url: env.PB_LINUX_AMD_URL ?? "", size: env.PB_LINUX_AMD_SIZE ?? "" },
  linuxArm: { url: env.PB_LINUX_ARM_URL ?? "", size: env.PB_LINUX_ARM_SIZE ?? "" },
  windowsAmd: { url: env.PB_WINDOWS_AMD_URL ?? "", size: env.PB_WINDOWS_AMD_SIZE ?? "" },
  windowsArm: { url: env.PB_WINDOWS_ARM_URL ?? "", size: env.PB_WINDOWS_ARM_SIZE ?? "" },
  macAmd: { url: env.PB_MAC_AMD_URL ?? "", size: env.PB_MAC_AMD_SIZE ?? "" },
  macArm: { url: env.PB_MAC_ARM_URL ?? "", size: env.PB_MAC_ARM_SIZE ?? "" },
} as const;
