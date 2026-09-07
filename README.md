# voidbase.cloud

The site at https://voidbase.cloud and the backend behind it, as one app. The site is a [Void](https://void.cloud)
app in React, prerendered at build time. The build produces a whole
[voidbase](https://github.com/voidbase-cloud/voidbase) app under `.voidbase/`, which serves the site at `/` next to
its API at `/api` and PocketBase's admin panel at `/_/`. One process locally, one Cloudflare Worker in production.

| path | what it is |
| --- | --- |
| `pages/` | the site: React pages, Void's file-based routing, prerendered by `output: "static"` |
| `src/components/`, `src/scss/`, `src/lib/` | the components, styles and helpers the pages share |
| `src/shared/` | the backend library the routes and hooks import, one module per concern |
| `routes/` | the API: `defineHandler` routes, compiled into the generated app's `pb_hooks/` |
| `vb_hooks/` | one PocketBase hook per file, registered once when the app mounts |
| `vb_migrations/` | PocketBase JS migrations, the voidbase counterpart of Void's `db/` |
| `public/` | static assets served as-is (fonts, images, favicons) |
| `test/` | `bun test/cloud.ts`: the control plane end to end against mocks of Cloudflare, its OAuth and GitHub |
| `.voidbase/` | the voidbase app this project builds into (generated, git-ignored) |

The project root is a plain Void app. `bun run build` runs Vite: Void prerenders the pages, and voidbase's adapter
writes the whole voidbase app into `.voidbase/` in PocketBase's layout — `main.ts`, `package.json`, `pb_hooks/`,
`pb_migrations/`, `pb_public/`, `pb_data/`. Nothing is generated outside that directory.

## Run it

```bash
bun install
cp .env.example .env          # fill in the OAuth clients; see "Setup" below
bun run build                 # the project -> .voidbase/
bun run serve                 # http://127.0.0.1:8090: the site, /api, /_/
```

Run the build once after a fresh clone before anything else: `tsconfig.json` extends `.voidbase/tsconfig.json`, which
the build generates, the same way Void's own `.void/tsconfig.json` needs `void prepare`. `bunx voidbase adapt`
generates it without building the site.

While working on the site itself, `bun run dev` gives Vite's dev server with hot reload; run `bun run serve` beside
it for the API. `bun run check` typechecks both halves (`tsconfig.json` for the site, `tsconfig.server.json` for the
backend), and `bun test` runs the control-plane suite.

## Deploy

```bash
bun run token                 # the dashboard link that creates VOIDBASE_DEPLOY_CF_API_KEY
bun run deploy                # build, then voidbase deploy from .voidbase/: D1, R2, queue, hub, the Worker
```

One Worker serves everything. `VOIDBASE_DEPLOY_DOMAIN` lists its hostnames (`voidbase.cloud,www.voidbase.cloud,api.voidbase.cloud`),
and `public/_redirects` gives each one its role: `www` redirects to the apex, and the root of the API hostname opens
the admin panel. Writing those host rules needs `Zone > Single Redirect > Edit` on the deploy token. Details:
`voidbase/docs/deploy.md` and `voidbase/docs/adapter.md`.

CI is Cloudflare Workers Builds, started from GitHub: every push runs `bun run build` and then `bun run check` on the
`voidbase-site-backend` project (the build generates `.voidbase/`, which the typecheck extends; the build step is
wrapped in a five-minute watchdog with one retry, because a cold build has hung on rare occasions), and a push to
master then runs `bun run deploy:ci`. The app's configuration is
declared in `vb_secrets/main.ts` with Void's validators, every key wrapped in who may read it: `secret()` keys are
the Worker's encrypted secrets, stored once from a maintainer's machine (`bun run deploy`, or `voidbase secrets
push` from `.voidbase/`) and never replaced by a deploy; `server()` keys are Worker vars, set by every deploy from
the declared defaults and the build's environment; `browser()` keys are also inlined into the static site as
`import.meta.env.PB_*`. Local values live in
the git-ignored `vb_secrets/secrets.json`, and so do the `local()` keys, voidbase's own: the deploy token and the
deploy target, read by the tooling here or from the build's environment in CI and never deployed. There is no `.env`
file of any kind. So the master trigger holds only `VOIDBASE_DEPLOY_CF_API_KEY` and `VB_ADMIN_EMAILS` (the deploy
target has defaults in the declaration); `.github/workflows/cloudflare.yml` only starts the build and holds
nothing but the account id, the two trigger ids and the Builds token.

## Set up your own copy

Four steps, and the instance then follows the repository:

1. A Cloudflare account and a GitHub account.
2. Fork or clone this repository and push it to GitHub. That push deploys nothing: the repository is not connected yet.
3. Fill in `vb_secrets/secrets.json`: the secrets `vb_secrets/main.ts` declares, plus the deploy token
   (`bunx voidbase token` prints the link that creates `VOIDBASE_DEPLOY_CF_API_KEY`) and `CLOUDFLARE_BUILDS_TOKEN`, a
   user API token with "Workers Builds Configuration: Edit" and "Workers Scripts: Edit". Then `bunx voidbase sync`:
   it builds, creates the instance (D1, R2, queue, the Worker) or updates it, stores the secrets on the Worker, and
   connects the repository to Cloudflare Workers Builds. The first run stops at the one step the API cannot do and
   prints the dashboard page where you connect the repository (installs the GitHub App, creates the build token);
   run it again and the triggers exist.
4. Push. The production branch builds and deploys on Cloudflare; every other branch builds and typechecks.

`bunx voidbase secrets` shows every declared key, its tier and where its value is; `bunx voidbase sync --dry-run`
shows the plan. Details: `voidbase/docs/deploy.md`.

## How the two halves meet

`vite build` runs Void's build, which prerenders every page, and then voidbase's adapter
(`@voidbase-cloud/voidbase/adapter/plugin`) generates `.voidbase/` from the project: the client build becomes
`pb_public`, `routes/` and `vb_hooks/` are compiled into `pb_hooks/void-app.js`, and `vb_migrations/` becomes
`pb_migrations/`. Those two `vb_` directories are the only ones the adapter adds to an otherwise plain Void app; `src/` is
library code the routes and the hooks import, reached as `@/shared`. See `voidbase/docs/adapter.md`.

The migration from SvelteKit, and what has not been carried over yet (the docs, the search box, the v0.23 upgrade
guide), is written up in [docs/migration.md](docs/migration.md).
