# SvelteKit to Void + React

The site used to be two projects in one repository: a SvelteKit static site in `static-site/`, and a voidbase
backend at the root. It is now one Void app in React, whose build produces the voidbase app that serves it.

```
pages/            the site, in React (Void pages mode, prerendered)
src/              components, styles and helpers the pages share
src/shared/       the backend library the routes and hooks import (@/shared), one module per concern
routes/           Void routes (compiled into .voidbase/pb_hooks)
vb_hooks/         one PocketBase hook per file, registered once when the app mounts
vb_migrations/    PocketBase JS migrations (source; copied into .voidbase/pb_migrations)
public/           static assets, copied as-is
test/             the control-plane suite
.voidbase/        the voidbase app this builds into (generated, git-ignored)
```

`bun run build` runs `vite build`: Void prerenders every page to HTML, and voidbase's adapter generates the whole
voidbase app into `.voidbase/` (PocketBase's minimal layout) with that HTML as its `pb_public`. `bun run serve` then
serves the site, `/api` and the admin panel from one process. The project root stays a plain Void app.

## What moved where

| SvelteKit | Void + React |
| --- | --- |
| `static-site/src/routes/(app)/+layout.svelte` | `pages/layout.tsx` (the root layout) |
| `static-site/src/routes/(blank)/+layout.svelte` | `pages/_layouts/blank.tsx`, selected with `export const layout = "!blank"` |
| `static-site/src/routes/(blank)/+page.svelte` | `pages/index.tsx` |
| `static-site/src/routes/(app)/cloud/+page.svelte` | `pages/cloud.tsx` |
| `static-site/src/routes/(app)/faq/+page.svelte` | `pages/faq.tsx` + `pages/faq.server.ts` (the title) |
| `static-site/src/routes/(blank)/demo/+page.svelte` | `pages/demo.tsx` |
| `static-site/src/lib/components/*.svelte` | `src/components/*.tsx` |
| `static-site/src/lib/scss/*` | `src/scss/*` (unchanged: the class names are the same) |
| `static-site/src/app.html` | the `head` block in `void.json` |
| `static-site/.env` | merged into `.env` (the `PB_*` half), read through `src/lib/env.ts` |
| the backend's 19 HTTP endpoints, registered with `routerAdd` | `routes/api/vbcloud/**`, written with `defineHandler` and compiled into the generated `pb_hooks/` |
| the backend's event hooks (`onBootstrap`, the Cloudflare OAuth handler) | one `defineHook` file each under `vb_hooks/` |
| the helpers both sides share | `src/shared/`, which reaches PocketBase through the adapter's `pb` |
| `pb_migrations/` at the repository root | `vb_migrations/`, copied into the generated app |
| `pb_hooks/main.pb.js`'s 404 catch-all | `routes/api/[...path].ts`, compiled into the generated `pb_hooks/` |
| `adapter-static` + GitHub Pages | `output: "static"` + voidbase's adapter, served from `.voidbase/pb_public` |

Conventions the ported code follows:

- Internal links are `<Link href>` from `@void/react`; programmatic navigation is `useRouter().visit(path)`.
- `onMount` is `useEffect(..., [])`, `$:` is a derived value, `bind:value` is `value` + `onChange`.
- Svelte's `use:tooltip` is the `useTooltip()` hook in `src/lib/useTooltip.ts`, which drives the original DOM helper.
- A component's scoped `<style>` block moved into `src/scss/`, scoped under the component's own class.
- Pages read `PB_*` values through `src/lib/env.ts`, never `import.meta.env` directly.

## Two build details worth knowing

**Build with Bun.** `bunx --bun vite build` (what `bun run build` does). voidbase ships TypeScript sources and Vite
loads its config through the runtime, so the adapter plugin cannot be imported by Node.

**`target: "bun"` in void.json.** It picks Void's Node/Bun prerender runner. The Cloudflare runner drives Miniflare
with the options of Miniflare 4, and wrangler 4.129 resolves Miniflare 5, whose constructor takes `workers: [...]`;
the build fails with `MiniflareCoreError [ERR_VALIDATION]`. The Bun runner imports the built app directly and has no
such coupling. Nothing is lost: the pages are prerendered either way, and the app's server is voidbase, not Void's
worker.

## Not migrated yet

- **`static-site/src/routes/(app)/docs/**`** — the documentation, deferred on purpose. It is the largest part of the
  old site (~140 files) and is still PocketBase's content.
- **The search box.** It indexes the docs with Pagefind, so it comes back with them. The header keeps its centre
  section empty until then, and the stale `public/pagefind` index was dropped rather than shipped: it pointed at doc
  pages this build does not have.
- **`public/jsvm` (75 MB) and `public/old` (68 MB).** The JSVM API reference and the snapshot of the previous site,
  both linked only from the docs. They are still in the old checkout; ship them with the docs pass, and only if the
  Worker's asset budget allows it (143 MB of assets would not upload).
- **`(app)/v023upgrade/go` and `/jsvm`** — 6.5k lines of PocketBase's own v0.23 upgrade guide. Nothing outside those
  two pages links to them, so deferring them breaks no link. They belong with the docs pass.
- **The starter's demo hooks.** `pb_hooks/auditlog.pb.js`, `util.js` and `config.json`, and the TypeScript ports
  of them (`auditlog/`, `hooks/`), came from the pocketbase-sveltekit-starter and this site never switched them on
  (`AUDITLOG` is unset). They were dropped rather than carried, along with the `/api/hello` demo route; the starter
  keeps its own copies. The one piece that mattered, the 404 catch-all for unmatched `/api/*`, is now a Void route.
- **Passkeys.** The site mounted voidbase's WebAuthn routes from its own `register.ts`. voidbase mounts them
  itself now, for every app with a `passkeys` collection, so the site has nothing to mount.
- **Rebranding.** The FAQ and the landing copy are still PocketBase's, carried over verbatim: a migration, not a
  rewrite. Rewriting them for voidbase is its own pass.
