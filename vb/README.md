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
