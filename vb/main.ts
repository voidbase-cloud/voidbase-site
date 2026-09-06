// The counterpart of ../pb/main.go: voidbase as a library, composed with this project's own extensions.
//   bun main.ts serve --http 0.0.0.0:8090 --publicDir ../sk/build      (or: bunx voidbase serve --entry main.ts ...)
import { voidbase, parseServeArgs, type VoidbaseApp } from "voidbase";
import * as webauthn from "./webauthn/webauthn";
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

  app.hooks.routerAdd("GET", "/api/ts-hello", (e: { json: (status: number, data: unknown) => unknown }) => e.json(200, { message: "Hello world from TypeScript!" }));
}

if (import.meta.main) {
  const app = await voidbase(parseServeArgs(process.argv.slice(2).filter((a) => a !== "serve")));
  register(app);
  await app.start();
}
