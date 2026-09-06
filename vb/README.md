# Backend with voidbase (`vb`)

The backend of this starter on [voidbase](../../voidbase): PocketBase's HTTP API, admin panel, JS hooks and
migrations, as a single Bun process locally and on Cloudflare Workers (D1, R2, cron) in production. The frontend in
`../sk` talks to `/api` and `/_` on port 8090. This directory keeps the layout of a PocketBase project (it is the
`pb/` of [pocketbase-sveltekit-starter](https://github.com/spinspire/pocketbase-sveltekit-starter), in TypeScript):

| file | role |
| --- | --- |
| `main.ts` | composes voidbase (as a library) with the extensions below and exports `register(app)`; the counterpart of a custom `main.go` |
| `auditlog/auditlog.ts` | audit rows for the collections named in `AUDITLOG` |
| `hooks/hooks.ts`, `hooks/email.ts` | the `hooks` collection actions (command, HTTP post, email templates) |
| `webauthn/webauthn.ts` | passkeys (`/api/webauthn/*`) over `voidbase/passkeys` |
| `data/email_templates/` | templates for the email action |
| `pb_hooks/`, `pb_migrations/` | PocketBase-style JS hooks and migrations |
| `pb_data/` | SQLite, storage, `types.d.ts`, `.superuser-credentials` (created on first run, git-ignored) |

There are two flavours of the backend:

1. **standard** (`bun run dev` / `bun run start`): the stock `voidbase serve`, extended only by `./pb_hooks` and
   `./pb_migrations`.
2. **custom** (`bun run dev:custom` / `bun run start:custom`): `main.ts`, where voidbase is a library and this
   project's TypeScript extensions are registered (passkeys by default; audit log and the `hooks` collection actions
   are ready to switch on). Everything registered in `register(app)` also runs on Cloudflare: `voidbase deploy`
   composes `main.ts` into the Worker.

## Run it

```bash
bun install             # once, at the repository root (workspaces: sk and vb)
bun run dev             # from the root: sk on 5173 (proxying /api and /_) and vb on 8090, both with hot reload
```

Or per package: `cd vb && bun run dev` (stock server) / `bun run dev:custom` (`main.ts`), `cd sk && bun run dev`.
The scripts are plain `voidbase serve` invocations with PocketBase's flags (`--http`, `--dir`, `--hooksDir`,
`--migrationsDir`, `--publicDir`; `--dev` restarts on changes to `pb_hooks/`, `pb_migrations/` or `main.ts`);
append your own after `--`, e.g. `bun run dev -- --http 127.0.0.1:8091`.

There is no `.env` here: voidbase reads `../.env` as well, where `PB_SUPERUSER_*` (upserted at start),
`PB_USER_*` (a test user, created once) and `AUDITLOG` live. The admin panel (PocketBase's own build) is fetched
once from the pinned release into `~/.cache/voidbase`.

## Deploy to Cloudflare

1. Create the deploy token (permissions pre-selected): `bun run token` prints the dashboard link.
2. Put it in `../.env` as `VOIDBASE_DEPLOY_CF_API_KEY=...` (next to the `PB_*` variables), then:

```bash
cd sk && bun run build && cd ../vb
bun run deploy            # voidbase deploy --public-dir ../sk/build
```

It creates the D1 database and R2 bucket on your account, generates the Void project inside the voidbase package
(`node_modules/voidbase/.cloud/<name>`, nothing new in this directory) with `main.ts` composed in, stores the
superuser as worker secrets (`PB_SUPERUSER_*` from `../.env` if set, otherwise a generated password saved in
`pb_data/.superuser-credentials`) and uploads the Worker. The URL and a health check are printed at the end.
Details, quotas and the other paths are in `voidbase/docs/deploy.md`.

## Notes

- `/api/config`, `/api/hello`, `/api/generate` come from `pb_hooks`; `/api/ts-hello` from `main.ts`.
- `sk`'s `typegen` reads a SQLite `data.db`: `pb_data/data.db` here has PocketBase's table layout, so
  `pocketbase-typegen --db ../vb/pb_data/data.db` works too.
- Platform differences on Cloudflare (D1 batches instead of transactions, per-isolate rate limits, polling
  realtime, backup format) are in `voidbase/docs/differences.md`; none apply to the local Bun process.

## voidbase cloud (the /cloud page's backend)

`cloud/index.ts` turns this backend into the control plane of the site's **Cloud** page: sign in with Cloudflare,
see your voidbase instances, create or delete one with a click. It is the dogfood loop: this backend is itself an
instance, listed as the `system` row, and an admin can delete it from the page.

| piece | what it does |
| --- | --- |
| `cloudflare` OAuth2 provider on `users` | enabled on the first request from `CF_OAUTH_CLIENT_ID` / `CF_OAUTH_CLIENT_SECRET` (voidbase's provider: OIDC on dash.cloudflare.com, identity from the API's `GET /user`, scopes from `CF_OAUTH_SCOPES`) |
| `cf_connections` | per user: access/refresh token (sealed with `VOIDBASE_ENCRYPTION_KEY`; a deployed backend refuses to store them unsealed), expiry, the accounts granted on the consent screen (no API rules: superuser-only) |
| `vb_instances` | the registry: owner, name, account, url, status, release, superuser email, `system` for this backend. The generated password is returned once with the creation and never stored (`GET .../credentials` gives url, email and panel) |
| `__releases__/<version>/` in storage | the generic voidbase Worker + panel built by `voidbase bundle`, uploaded with `voidbase bundle --push` (or `voidbase release push <dir>`); `__releases__/current` points at the active one |
| `/api/vbcloud/*` | `me`, `accounts`, `release`, `instances` (GET/POST), `instances/{id}` (DELETE), `instances/{id}/credentials`, superuser: `releases`, `releases/{v}/files`, `releases/{v}/activate` |

Creating an instance runs entirely over Cloudflare's REST API with the user's OAuth token (`voidbase/cloud`):
`<name>-db` (D1, migrations applied through `/query`), `<name>-storage` (R2), `<name>-jobs` (queue + consumer),
the Worker script with its modules and assets, the realtime hub Durable Object, the hourly cron, the workers.dev
subdomain. Deleting removes the same, worker first, bucket last (emptied before). Names get the `VB_INSTANCE_PREFIX`.

### Setup

1. Create the OAuth client: dash.cloudflare.com > Manage Account > OAuth clients > Create client. Authorization
   code grant, `code` response type, `client_secret_basic` (the default; the backend authenticates with HTTP Basic), redirect URL `<backend>/api/oauth2-redirect` (add
   `http://127.0.0.1:8090/api/oauth2-redirect` for local dev). Pick the scopes the control plane needs: User Details Read, Account Settings
   Read, Workers Scripts Write, D1 Write, Workers R2 Storage Write, Workers R2 Storage Bucket Item Read/Write, Queues Write
   (ids `offline_access user-details.read account-settings.read workers-scripts.write d1.write workers-r2.write
   workers-r2-bucket-item.read workers-r2-bucket-item.write queues.write`, the `CF_OAUTH_SCOPES` default; there is no `openid` scope; `GET /oauth/scopes` with an API token lists them). A
   private client is enough for members of your account; making it public requires domain verification of the client URL.
2. `cp .env.example .env`, fill in the client id/secret, `VOIDBASE_ENCRYPTION_KEY` (32 random chars: `openssl rand -hex 16`), `VB_ADMIN_EMAILS` (who may delete the system instance; that action also needs `VB_ALLOW_SELF_DELETE=1`, off by default).
3. `bun run dev`, then build and upload a release: `bun run bundle -- --push http://127.0.0.1:8090 --token <superuser token>`
   (`voidbase superuser` / `POST /api/collections/_superusers/auth-with-password` gives the token).
4. Deploy: `bun run deploy` (`VOIDBASE_DEPLOY_CF_API_KEY` in `../.env.local`, never in the committed `.env`). The account
   needs R2 enabled once in the dashboard (R2 Object Storage > Enable). `VOIDBASE_DEPLOY_DOMAIN=api.voidbase.cloud` binds the
   Worker to that hostname on the account's zone through the Workers Custom Domains API (workers.dev off; Cloudflare creates the
   DNS record and certificate; needs only Workers Scripts edit, and the account must have a workers.dev subdomain, which
   the deploy registers when missing is not automatic: open Workers & Pages once or PUT /workers/subdomain);
   `VOIDBASE_DEPLOY_VARS` / `VOIDBASE_DEPLOY_SECRETS` carry the OAuth settings into the Worker, the worker name and
   account id are baked automatically (that is how the backend finds itself). Push the release to the deployed URL
   too, and set the site's `PB_VB_URL` (GitHub Actions variable) to that URL.

`bun test/cloud.ts` runs the whole flow on the Bun runtime against voidbase's OIDC and Cloudflare API mocks.

