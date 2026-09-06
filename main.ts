// The counterpart of ../pb/main.go: voidbase as a library, composed with this project's own extensions.
//   bun main.ts serve --http 0.0.0.0:8090 --publicDir ../sk/build      (or: bunx voidbase serve --entry main.ts ...)
import type { VoidbaseApp } from "@voidbase-cloud/voidbase";
import * as webauthn from "./webauthn/webauthn";
import * as cloud from "./cloud";
// import * as auditlog from "./auditlog/auditlog";
// import * as hooks from "./hooks/hooks";

// Everything registered here runs both in `bun main.ts` and, through `voidbase deploy`, on Cloudflare Workers.
export function register(app: VoidbaseApp) {
  /*
   * Use this only if you want to do audit logging of tables named in AUDITLOG
   * env var (e.g. AUDITLOG=users,posts) implemented in TypeScript.
   * Keep in mind that there is already a JS hooks implementation of this feature in ./pb_hooks dir.
   */
  // auditlog.register(app);

  /*
   * Use this only if you want to use the "hooks" implemented in TypeScript (the `hooks` collection:
   * command / post / email actions). It's probably better to use hooks in ./pb_hooks though.
   */
  // hooks.register(app);

  // register the webauthn (passkeys) plugin
  webauthn.register(app);

  // voidbase cloud: Cloudflare sign-in, releases, one-click instances (see ./cloud/index.ts)
  cloud.register(app);

  app.hooks.routerAdd("GET", "/api/ts-hello", (e: { json: (status: number, data: unknown) => unknown }) => e.json(200, { message: "Hello world from TypeScript!" }));
}

if (import.meta.main) {
  // `bun main.ts`: the Bun runtime. Imported dynamically (and hidden from the bundler) because `voidbase deploy` composes
  // this file into the Worker for register() only, and the runtime entry pulls in bun:sqlite and the filesystem shims.
  const runtime = "@voidbase-cloud/voidbase";
  const { voidbase, parseServeArgs } = (await import(/* @vite-ignore */ runtime)) as typeof import("@voidbase-cloud/voidbase");
  const app = await voidbase(parseServeArgs(process.argv.slice(2).filter((a) => a !== "serve")));
  register(app);
  await app.start();
}
