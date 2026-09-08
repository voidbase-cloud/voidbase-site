// The public PB_* values the pages read, declared once so the pages do not each reach into import.meta.env.
// They come from .env / .env.example through Vite's envPrefix: "PB" (see vite.config.mts).
const env = import.meta.env as unknown as Record<string, string | undefined>;

export const SITE = {
  // PB_VB_VERSION is set by the deploy; the fallback is here so a dev server and a fork show something true rather
  // than a number nobody updated. A version with a prerelease part ("0.9.0-beta") is what puts the beta mark in the
  // header and the banner on every page, so going stable is a version bump and nothing else.
  vbVersion: env.PB_VB_VERSION ?? "0.9.0-beta",
  pbVersion: env.PB_VERSION ?? "",
  repoUrl: env.PB_REPO_URL ?? "https://github.com/voidbase-cloud/voidbase",
  discussionsUrl: env.PB_DISCUSSIONS_URL ?? "https://github.com/voidbase-cloud/voidbase/discussions",
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
