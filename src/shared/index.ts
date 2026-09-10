// voidbase cloud's backend library: what the routes under routes/api/vbcloud/ and the hooks under middleware/ share.
// One import path (`@/shared`) for all of it; import a module directly when you want to see what a file depends on.
//
//   pb.ts          PocketBase through voidbase's adapter, and the environment
//   config.ts      every environment knob, in one place
//   auth.ts        who is asking: the route guards, isAdmin, the request body
//   secrets.ts     OAuth tokens at rest, the signed GitHub state, generated passwords
//   releases.ts    the releases `voidbase bundle --push` uploads, in this instance's own R2 bucket
//   cloudflare.ts  the visitor's Cloudflare connection, and the instances on their account
//   github.ts      the template marketplace
//   builder.ts     the instance builder and the build run
//   project.ts     project instances: plugins as commits to the linked repository
export * from "./pb";
export * from "./config";
export * from "./auth";
export * from "./secrets";
export * from "./releases";
export * from "./cloudflare";
export * from "./github";
export * from "./builder";
export * from "./project";
