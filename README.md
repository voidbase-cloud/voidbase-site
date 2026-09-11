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
| `src/lib/cloud.ts` | the cloud page's client: the work of voidbase.cloud, done in the browser |
| `test/` | `bun test/cloud.ts`: the browser client and the site end to end against mocks of Cloudflare, its OAuth, GitHub and an instance |
| `.voidbase/` | the voidbase app this project builds into (generated, git-ignored) |

The project root is a plain Void app. `bun run build` runs Vite: Void prerenders the pages, and voidbase's adapter
writes the whole voidbase app into `.voidbase/` in PocketBase's layout — `main.ts`, `package.json`, `pb_hooks/`,
`pb_migrations/`, `pb_public/`, `pb_data/`. Nothing is generated outside that directory.

## What the site does, and what the browser does

voidbase.cloud wraps voidbase and the user's own accounts. The site keeps four things: the sign-in (Cloudflare
OAuth), the user's Cloudflare and GitHub tokens sealed at rest, the rows about their instances, repositories and
teams (`vb_instances`, `vb_repos`, `vb_members`, written by the browser through the collections' rules), and two
pass-throughs, `/api/vbcloud/cf/*` and `/api/vbcloud/gh/*`, which forward a call to Cloudflare's or GitHub's API
with the user's token (Cloudflare's API sends no CORS headers, and neither token ever reaches the browser). An
instance belongs to a team rather than to whoever clicked first: `vb_members` says who is on it and as what
(owner, admin, viewer), and every place that used to ask "is this the owner" asks that. Everything else is the
page's own work, in `src/lib/cloud.ts`: an instance is created, upgraded and deleted with voidbase's REST code
in the user's account; a repository is created from a template or linked, its variables set, and the instance's
Worker wired to it (the one server action left, `instances/:id/wire`, because it puts the user's GitHub token on
their Worker); an instance's plugins are changed through the instance's own installer, with a session the owner
mints on the instance from the page. Nothing is built for anyone's instance by anyone but its own pipeline.

## Testing against production

voidbase.cloud and demo.voidbase.cloud are the testbeds: they run the newest voidbase release on purpose (the
release build in voidbase pins it here and pushes), and they are meant to be exercised for real. `bun run live`
(`test/cloud-live.ts`) is the plugin lifecycle on the demo through the demo's own installer: remove, install an
older version, update, each a commit to voidbase-cloud/voidbase-demo made by the demo, each build watched, the
demo answering afterwards. `bun run provision` (`test/cloud-provision.ts`) drives the browser client against
voidbase.cloud for real, creating and deleting a throwaway instance through the pass-through; run it when the
provisioning path changed. The credentials come from this checkout's files (`.voidbase/pb_data/.superuser-credentials`,
`vb_secrets/secrets.json`) or the environment. `bun run test` is the mocked suite. Nothing runs in CI: a push
builds and syncs, and that is all.

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
bunx voidbase token           # the dashboard link that creates VOIDBASE_DEPLOY_CF_API_KEY
bun run build                 # the project -> .voidbase/
bun run deploy                # voidbase sync: D1, R2, queue, hub, the Worker, its hostnames
```

One Worker serves everything. `VOIDBASE_DEPLOY_DOMAIN` lists its hostnames (`voidbase.cloud,www.voidbase.cloud`),
and `public/_redirects` gives each one its role: `www` redirects to the apex, and the root of the API hostname opens
the admin panel. Writing those host rules needs `Zone > Single Redirect > Edit` on the deploy token. Details:
`voidbase/docs/deploy.md` and `voidbase/docs/adapter.md`.

CI is Cloudflare Workers Builds through the repository connection, and it is deliberately nothing more than the two
lines above: a push to master runs `bun run build` and then `bun run deploy`, root directory `/`. No typecheck, no
tests, no branch builds; `bun run check` and `bun run test` are for a machine. The app's secrets are declared in
`vb_secrets/main.ts` and valued in the git-ignored `vb_secrets/secrets.json`; the master trigger holds the deploy
token, `VB_ADMIN_EMAILS` and `VOIDBASE_DEPLOY_CRON=1` for the keeper cron.

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

## The demo

[demo.voidbase.cloud](https://demo.voidbase.cloud) is a voidbase instance of its own, and it lives in its own
repository: [voidbase-cloud/voidbase-demo](https://github.com/voidbase-cloud/voidbase-demo). PocketBase's own layout
(`pb_hooks/`, `pb_secrets/`, `pb_public/`), the unmodified admin panel, and a database restored every hour by a hook
cron. The landing page's "Live demo" button and `/demo` both point at it. It builds and deploys itself from its own
Cloudflare Workers Builds trigger, which is why it is a repository of its own: a build may deploy only the Worker
its trigger belongs to, and keeping the two apart means a change to the site can never reach the demo's Worker or
the other way round.

## How the two halves meet

`vite build` runs Void's build, which prerenders every page, and then voidbase's adapter
(`@voidbase-cloud/voidbase/adapter/plugin`) generates `.voidbase/` from the project: the client build becomes
`pb_public`, `routes/` and `vb_hooks/` are compiled into `pb_hooks/void-app.js`, and `vb_migrations/` becomes
`pb_migrations/`. Those two `vb_` directories are the only ones the adapter adds to an otherwise plain Void app; `src/` is
library code the routes and the hooks import, reached as `@/shared`. See `voidbase/docs/adapter.md`.

The migration from SvelteKit, and what has not been carried over yet (the docs, the search box, the v0.23 upgrade
guide), is written up in [docs/migration.md](docs/migration.md).
