# voidbase.cloud

The site at https://voidbase.cloud and its backend, in one repository and one deployment. The layout is PocketBase's:
the backend is the repository root (`main.ts`, `pb_hooks/`, `pb_migrations/`, `pb_data/`), and the site is served from
`pb_public/` by that backend, next to `/api` and the admin panel at `/_/`. `static-site/` holds the site's source
(SvelteKit, prerendered), whose build lands in `pb_public/`.

| path | role |
| --- | --- |
| `main.ts` | voidbase as a library composed with this project's extensions (`register(app)`); `bun main.ts` runs it, `voidbase deploy` composes it into the Worker |
| `cloud/` | the voidbase cloud control plane behind `/cloud`: Cloudflare sign-in, releases, one-click instances, the template marketplace (see below) |
| `webauthn/`, `auditlog/`, `hooks/`, `data/` | passkeys (on), audit log and the `hooks` collection actions (off), email templates |
| `pb_hooks/`, `pb_migrations/` | PocketBase-style JS hooks and migrations |
| `pb_public/` | the built site (git-ignored): `bun run site:build` writes it, voidbase serves it at `/` |
| `pb_data/` | SQLite, storage, `types.d.ts`, `.superuser-credentials` (created on first run, git-ignored) |
| `static-site/` | the site's source: docs, FAQ, the `/cloud` page; `bun run dev` there is a hot-reloading dev server proxying `/api` and `/_` to the backend |
| `test/` | `bun test/cloud.ts`: the control plane end to end against mocks of Cloudflare, its OAuth and GitHub |

## Run it

```bash
bun install && (cd static-site && bun install)
bun link @voidbase-cloud/voidbase   # optional: use the local voidbase checkout instead of the npm release (after `bun link` there)
cp .env.example .env               # fill in the OAuth clients, see Setup below
bun run site:build                 # static-site -> pb_public
bun run dev                        # http://127.0.0.1:8090: the site, /api, /_/ (restarts on changes to main.ts, pb_hooks, pb_migrations)
```

While working on the site itself: `bun run site:dev` (port 5173, hot reload, backend calls proxied to 8090).
`voidbase serve` picks `./pb_public` up automatically, like PocketBase's `--publicDir` default; the panel comes from
the pinned PocketBase release (fetched once into `~/.cache/voidbase`).

## Deploy

```bash
bun run token                      # the dashboard link for the deploy token; put it in .env.local as VOIDBASE_DEPLOY_CF_API_KEY
bun run deploy                     # site:build, then voidbase deploy: D1, R2, queue, hub, the Worker with pb_public as its assets
```

One Worker serves everything: `VOIDBASE_DEPLOY_DOMAIN` lists its hostnames (`voidbase.cloud,www.voidbase.cloud,api.voidbase.cloud`
for the real site; the first is the URL the deploy reports), attached through the Workers Custom Domains API.
`static-site/static/_redirects` gives each hostname its role at the edge: `www` redirects to the apex, and the root of
`api.voidbase.cloud` goes to the admin panel at `/_/` (the API is `/api` on every hostname; the site uses its own origin). The
values in `VOIDBASE_DEPLOY_VARS` are baked into the Worker, `VOIDBASE_DEPLOY_SECRETS` become Worker secrets.
`.github/workflows/deploy.yml` does the same on every push when the repository has the deploy token and the OAuth
secrets; without them it only builds the site. Details and quotas: `voidbase/docs/deploy.md`.

## The /cloud page's backend

`cloud/index.ts` turns this backend into the control plane of the site's **Cloud** page: sign in with Cloudflare,
see your voidbase instances, create or delete one with a click. It is the dogfood loop: this backend is itself an
instance, listed as the `system` row, and an admin can delete it from the page.

| piece | what it does |
| --- | --- |
| `cloudflare` OAuth2 provider on `users` | enabled at bootstrap from `CF_OAUTH_CLIENT_ID` / `CF_OAUTH_CLIENT_SECRET` (voidbase's provider: OIDC on dash.cloudflare.com, identity from the API's `GET /user`, scopes from `CF_OAUTH_SCOPES`) |
| `cf_connections` | per user: access/refresh token (sealed with `VOIDBASE_ENCRYPTION_KEY`; a deployed backend refuses to store them unsealed), expiry, the accounts granted on the consent screen (no API rules: superuser-only) |
| `vb_instances` | the registry: owner, name, account, url, status, release, superuser email, `system` for this backend. The generated password is returned once with the creation and never stored (`GET .../credentials` gives url, email and panel) |
| `__releases__/<version>/` in storage | the generic voidbase Worker + panel built by `voidbase bundle`, uploaded with `voidbase bundle --push` (or `voidbase release push <dir>`); `__releases__/current` points at the active one |
| `/api/vbcloud/*` | `me`, `accounts`, `release`, `instances` (GET/POST), `instances/{id}` (DELETE), `instances/{id}/credentials`, superuser: `releases`, `releases/{v}/files`, `releases/{v}/activate` |

Creating an instance runs entirely over Cloudflare's REST API with the user's OAuth token (`voidbase/cloud`):
`<name>-db` (D1, migrations applied through `/query`), `<name>-storage` (R2), `<name>-jobs` (queue + consumer),
the Worker script with its modules and assets, the realtime hub Durable Object, the hourly cron, the workers.dev
subdomain. Deleting removes the same, worker first, bucket last (emptied before). Names get the `VB_INSTANCE_PREFIX`.

### Template marketplace (GitHub)

`cloud/github.ts`: a visitor connects GitHub (OAuth app, `GH_OAUTH_CLIENT_ID` / `_SECRET`; the token is sealed at rest like
the Cloudflare one), picks a template from `vb_templates` (GitHub template repositories; this site is the first, seeded
at bootstrap; superusers add more from the panel, with a `variables` list of the repository variables to write:
`instance_url`, `instance_panel`, `instance_name`, `input:<form field>` or a literal), and gets a repository created
from it in their account wired to one of their instances: the instance URL is written as the repository's
`PB_VB_URL` Actions variable, which is what "connected" means. `/api/vbcloud/repos` lists those repositories with a
live check (repository still there, `PB_VB_URL` still the instance). Routes: `github` (GET status, DELETE
disconnect + grant revoked), `github/connect` (the authorize URL with an HMAC-signed state), `github/callback`,
`templates`, `repos` (GET, POST), `repos/link` (POST: wire a repository that already exists, given as `owner/name` or
its URL; only `PB_VB_URL` and the instance-derived variables of an optional template are written), `repos/{id}`
(DELETE unlinks only). `test/gh-mock.ts` stands in for GitHub in `bun test/cloud.ts`.

Dogfooding: this site's own repository (`VB_SITE_REPO`, default `voidbase-cloud/voidbase-site`) is registered once as a
`system` row of `vb_repos` wired to the system instance (this backend), listed to admins with a "this site" badge and
never unlinkable; admins may also wire further repositories (from a template or existing ones) to the site's own backend.

### Setup

1. Create the OAuth client: dash.cloudflare.com > Manage Account > OAuth clients > Create client. Authorization
   code grant, `code` response type, `client_secret_basic` (the default; the backend authenticates with HTTP Basic), redirect URL `<backend>/api/oauth2-redirect` (add
   `http://127.0.0.1:8090/api/oauth2-redirect` for local dev). Pick the scopes the control plane needs: User Details Read, Account Settings
   Read, Workers Scripts Write, D1 Write, Workers R2 Storage Write, Workers R2 Storage Bucket Item Read/Write, Queues Write
   (ids `offline_access user-details.read account-settings.read workers-scripts.write d1.write workers-r2.write
   workers-r2-bucket-item.read workers-r2-bucket-item.write queues.write`, the `CF_OAUTH_SCOPES` default; there is no `openid` scope; `GET /oauth/scopes` with an API token lists them). The
   site's client is public (any Cloudflare user can sign in): that needs the client URL verified through the DNS TXT record and
   a logo; the logo is `static/images/favicon/android-chrome-512x512.png`, set through `PATCH .../oauth_clients/<id>` with
   `logo_uri`, then `visibility: public` (Cloudflare re-hosts the image). A private client is enough for members of your own account.
2. `cp .env.example .env`, fill in the client id/secret (and the GitHub OAuth app's for the marketplace), `VOIDBASE_ENCRYPTION_KEY` (32 random chars: `openssl rand -hex 16`), `VB_ADMIN_EMAILS` (who may delete the system instance; that action also needs `VB_ALLOW_SELF_DELETE=1`, off by default).
3. `bun run site:build && bun run dev`, then build and upload a release: `bun run bundle -- --push http://127.0.0.1:8090 --token <superuser token>`
   (`voidbase superuser` / `POST /api/collections/_superusers/auth-with-password` gives the token).
4. Deploy: `bun run deploy` (`VOIDBASE_DEPLOY_CF_API_KEY` in `.env.local`, never in the committed `.env`). The account
   needs R2 enabled once in the dashboard (R2 Object Storage > Enable). `VOIDBASE_DEPLOY_DOMAIN=api.voidbase.cloud` binds the
   Worker to that hostname on the account's zone through the Workers Custom Domains API (workers.dev off; Cloudflare creates the
   DNS record and certificate; needs only Workers Scripts edit, and the account must have a workers.dev subdomain, which
   the deploy registers when missing is not automatic: open Workers & Pages once or PUT /workers/subdomain);
   `VOIDBASE_DEPLOY_VARS` / `VOIDBASE_DEPLOY_SECRETS` carry the OAuth settings into the Worker, the worker name and
   account id are baked automatically (that is how the backend finds itself). Push the release to the deployed URL
   too, and set the site's `PB_VB_URL` (GitHub Actions variable) to that URL.

`bun test/cloud.ts` runs the whole flow on the Bun runtime against voidbase's OIDC and Cloudflare API mocks.

