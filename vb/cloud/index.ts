// voidbase cloud: the control plane behind the site's /cloud page.
//   - "Sign in with Cloudflare": the `cloudflare` OAuth2 provider is enabled on `users` at bootstrap from
//     CF_OAUTH_CLIENT_ID / CF_OAUTH_CLIENT_SECRET (an OAuth client from dash.cloudflare.com > Manage Account > OAuth
//     clients with redirect URL <this backend>/api/oauth2-redirect and the scopes in CF_OAUTH_SCOPES)
//   - after every Cloudflare login the tokens (sealed with VOIDBASE_ENCRYPTION_KEY) and the granted accounts are kept in
//     `cf_connections` (superuser-only); the generated superuser password of an instance is shown once and never stored
//   - releases built by `voidbase bundle` are stored under __releases__/<version>/ in this instance's own storage
//   - instances are provisioned and destroyed on the user's Cloudflare account through `voidbase/cloud` (REST only)
//   - this backend registers itself in `vb_instances` as the `system` row (VOIDBASE_WORKER_NAME / VOIDBASE_ACCOUNT_ID,
//     baked by `voidbase deploy`), so an admin (VB_ADMIN_EMAILS) can delete the site's own backend from the site.
import type { VoidbaseApp, RequestEvent, HookRecord, CollectionRef } from "@voidbase-cloud/voidbase";
import { registerGithub } from "./github";
import { CfApi, CF_API_BASE, destroyInstance, listAccounts, openSecret, provisionInstance, refreshOAuthToken, sealSecret, workerExists, type CfAccount, type ReleaseManifest, type ReleaseSource } from "@voidbase-cloud/voidbase/cloud";

const RELEASES = "__releases__/";
const CF_TOKEN_URL = "https://dash.cloudflare.com/oauth2/token";
// Resource scopes are Cloudflare API permission ids (GET /oauth/scopes lists them; verified 2026-09-06): identity and the
// accounts granted on the consent screen, then what provisioning needs; `openid` is not one of them and is refused.
// Override with CF_OAUTH_SCOPES="offline_access user-details.read ...".
export const DEFAULT_SCOPES = ["offline_access", "user-details.read", "account-settings.read", "workers-scripts.write", "d1.write", "workers-r2.write", "workers-r2-bucket-item.read", "workers-r2-bucket-item.write", "queues.write"];

type Hooks = VoidbaseApp["hooks"];
type Ev = RequestEvent & { auth: HookRecord | null; record?: HookRecord | null; providerName?: string; oAuth2User?: { id: string; email: string; name: string; username: string; accessToken: string; refreshToken: string; expiry: string } };
interface Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array | string, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; text(): Promise<string> } | null>;
  list(opts: { prefix?: string; cursor?: string; limit?: number }): Promise<{ objects: { key: string; size: number }[]; truncated: boolean; cursor?: string }>;
  delete(keys: string | string[]): Promise<void>;
}
const pbDate = (d: Date) => d.toISOString().replace("T", " ");
const randomPassword = (n = 24) => { const a = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const b = crypto.getRandomValues(new Uint8Array(n)); return [...b].map((x) => a[x % a.length]).join(""); };

export function register(app: VoidbaseApp) {
  const H: Hooks = app.hooks;
  const env = (k: string, d = ""): string => { let v = ""; try { v = String(H.$os.getenv(k) ?? ""); } catch { /* outside a request */ } if (!v && typeof process !== "undefined") v = String(process.env?.[k] ?? ""); return v || d; };
  const cfg = () => ({
    clientId: env("CF_OAUTH_CLIENT_ID"), clientSecret: env("CF_OAUTH_CLIENT_SECRET"),
    scopes: env("CF_OAUTH_SCOPES", DEFAULT_SCOPES.join(" ")).split(/[\s,]+/).filter(Boolean),
    authURL: env("CF_OAUTH_AUTH_URL"), tokenURL: env("CF_OAUTH_TOKEN_URL", CF_TOKEN_URL), userInfoURL: env("CF_OAUTH_USERINFO_URL"),
    apiBase: env("CLOUDFLARE_API_BASE", CF_API_BASE),
    worker: env("VOIDBASE_WORKER_NAME"), account: env("VOIDBASE_ACCOUNT_ID"),
    admins: env("VB_ADMIN_EMAILS").toLowerCase().split(/[\s,]+/).filter(Boolean),
    prefix: env("VB_INSTANCE_PREFIX", "vb-"), maxPerUser: Math.max(1, Number(env("VB_MAX_INSTANCES_PER_USER", "5")) || 5),
    encryptionKey: env("VOIDBASE_ENCRYPTION_KEY"),
    allowSelfDelete: ["1", "true", "yes"].includes(env("VB_ALLOW_SELF_DELETE").toLowerCase()),
  });
  // Cloudflare tokens at rest: sealed with VOIDBASE_ENCRYPTION_KEY. A deployed backend refuses to keep them unsealed;
  // local dev without a key keeps them readable and says so once.
  let warnedPlain = false;
  const seal = async (plain: string): Promise<string> => {
    const c = cfg();
    if (c.encryptionKey) return sealSecret(plain, c.encryptionKey);
    if (c.worker) throw new H.InternalServerError("VOIDBASE_ENCRYPTION_KEY is not set: refusing to store Cloudflare tokens unencrypted.");
    if (!warnedPlain) { warnedPlain = true; console.warn("vbcloud: VOIDBASE_ENCRYPTION_KEY is not set, Cloudflare tokens are stored unencrypted (local dev only)"); }
    return plain;
  };
  const open = (stored: string): Promise<string> => openSecret(stored, cfg().encryptionKey);
  const bucket = (e: Ev) => (e.c.env as unknown as { STORAGE: Bucket }).STORAGE;
  const isAdmin = (auth: HookRecord | null) => !!auth && (auth.isSuperuser() || cfg().admins.includes(String(auth.email?.() ?? auth.getString("email")).toLowerCase()));
  const userId = (e: Ev) => { if (!e.auth || e.auth.isSuperuser()) throw new H.ForbiddenError("Sign in with Cloudflare as a user (superusers manage releases, not instances)."); return e.auth.id; };
  const readBody = async (e: Ev): Promise<Record<string, unknown>> => { try { return (await e.request.clone().json()) as Record<string, unknown>; } catch { return {}; } };

  // ---- bootstrap: enable the provider on `users`, register this backend as the system instance -------------------
  async function ensureProvider() {
    const c = cfg(); if (!c.clientId) return;
    const users = H.$app.findCollectionByNameOrId("users") as CollectionRef & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const holder = (users.options && typeof users.options === "object" ? users.options : users) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const current = (holder.oauth2 ?? {}) as { enabled?: boolean; providers?: Record<string, unknown>[]; mappedFields?: Record<string, string> };
    const provider = { name: "cloudflare", displayName: "Cloudflare", clientId: c.clientId, clientSecret: c.clientSecret, pkce: true, ...(c.authURL ? { authURL: c.authURL } : {}), ...(c.tokenURL !== CF_TOKEN_URL ? { tokenURL: c.tokenURL } : {}), ...(c.userInfoURL ? { userInfoURL: c.userInfoURL } : {}), extra: { scopes: c.scopes, apiBase: c.apiBase } };
    const providers = [...(current.providers ?? []).filter((p) => p.name !== "cloudflare"), provider];
    const mf = current.mappedFields ?? {};
    const desired = { ...current, enabled: true, providers, mappedFields: { id: mf.id ?? "", username: mf.username ?? "", avatarURL: mf.avatarURL ?? "", name: mf.name || "name" } };
    if (JSON.stringify(desired) === JSON.stringify(current)) return;
    holder.oauth2 = desired;
    await H.$app.save(users);
    console.log("vbcloud: cloudflare OAuth2 provider configured on users");
  }
  async function selfRow(): Promise<HookRecord | null> { const c = cfg(); if (!c.worker) return null; try { return (await H.$app.findFirstRecordByFilter("vb_instances", "name = {:n}", { n: c.worker })) as HookRecord; } catch { return null; } }
  async function ensureSelf(origin?: string) {
    const c = cfg(); if (!c.worker) return;
    const existing = await selfRow();
    const row: HookRecord = existing ?? (() => { const r = new H.Record(H.$app.findCollectionByNameOrId("vb_instances")) as HookRecord; r.set("name", c.worker); r.set("account_id", c.account || "unknown"); r.set("status", "live"); r.set("system", true); return r; })();
    let changed = !existing;
    if (origin && !row.getString("url")) { row.set("url", origin); changed = true; }
    if (changed) await H.$app.save(row);
  }
  // one-time setup at bootstrap (voidbase runs onBootstrap inside a hook store, so $app works here); the instances
  // route fills in this backend's URL later, from the first request that reaches it
  H.onBootstrap(async (e: { next: () => Promise<unknown> }) => {
    await e.next();
    try { await ensureProvider(); } catch (err) { console.warn("vbcloud: provider setup", err); }
    try { await ensureSelf(); } catch (err) { console.warn("vbcloud: self registration", err); }
  });

  // ---- after a Cloudflare login: keep the tokens and the granted accounts ----------------------------------------
  H.onRecordAuthWithOAuth2Request(async (e: Ev & { next: () => Promise<unknown> }) => {
    await e.next();
    if (e.providerName !== "cloudflare" || !e.oAuth2User) return;
    const u = e.oAuth2User;
    let record = e.record ?? null;
    if (!record) { const ext = await H.$app.findFirstRecordByFilter("_externalAuths", "provider = 'cloudflare' && providerId = {:pid}", { pid: u.id }); record = await H.$app.findRecordById("users", ext.getString("recordRef")); }
    if (!record) return;
    let accounts: CfAccount[] = []; try { accounts = await listAccounts(new CfApi(u.accessToken, cfg().apiBase)); } catch (err) { console.warn("vbcloud: listing accounts after login", err); }
    let conn: HookRecord; try { conn = await H.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: record.id }); } catch { conn = new H.Record(H.$app.findCollectionByNameOrId("cf_connections")); conn.set("user", record.id); }
    conn.set("cf_user_id", u.id); conn.set("email", u.email); conn.set("name", u.name); conn.set("access_token", await seal(u.accessToken));
    if (u.refreshToken) conn.set("refresh_token", await seal(u.refreshToken));
    conn.set("expiry", u.expiry || ""); conn.set("scopes", cfg().scopes.join(" ")); conn.set("accounts", accounts);
    await H.$app.save(conn);
  });

  // ---- a usable Cloudflare API client for the signed-in user (refreshing the token when it is about to expire) --------
  async function connectionFor(uid: string): Promise<{ conn: HookRecord; cf: CfApi; accounts: CfAccount[] }> {
    let conn: HookRecord; try { conn = await H.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: uid }); } catch { throw new H.BadRequestError("Connect your Cloudflare account first: sign in with Cloudflare."); }
    let token = await open(conn.getString("access_token")); const exp = conn.getString("expiry"); const c = cfg();
    if (exp && Date.parse(exp) < Date.now() + 60_000 && conn.getString("refresh_token")) {
      const t = await refreshOAuthToken({ tokenURL: c.tokenURL, clientId: c.clientId, clientSecret: c.clientSecret, refreshToken: await open(conn.getString("refresh_token")) });
      conn.set("access_token", await seal(t.access_token)); if (t.refresh_token) conn.set("refresh_token", await seal(t.refresh_token)); if (t.expires_in) conn.set("expiry", pbDate(new Date(Date.now() + t.expires_in * 1000)));
      await H.$app.save(conn); token = t.access_token;
    }
    if (!token) throw new H.BadRequestError("Your Cloudflare connection has no token: sign in with Cloudflare again.");
    const raw = conn.get("accounts"); const accounts = (Array.isArray(raw) ? raw : typeof raw === "string" ? (JSON.parse(raw || "[]") as CfAccount[]) : []) as CfAccount[];
    return { conn, cf: new CfApi(token, c.apiBase), accounts };
  }

  // ---- releases: files pushed by `voidbase bundle --push` live in this instance's storage --------------------------
  const safe = (s: string) => /^[A-Za-z0-9._-]{1,80}$/.test(s) && !s.startsWith(".");
  const safePath = (p: string) => p.split("/").every((seg) => seg && seg !== "." && seg !== ".." && /^[A-Za-z0-9._\[\]()-]+$/.test(seg));
  async function currentVersion(e: Ev): Promise<string | null> { const o = await bucket(e).get(`${RELEASES}current`); return o ? (await o.text()).trim() || null : null; }
  async function releaseSource(e: Ev, version?: string): Promise<ReleaseSource> {
    const v = version ?? (await currentVersion(e));
    if (!v) throw new H.BadRequestError("No voidbase release is available yet: run `voidbase bundle --push <this backend> --token <superuser token>` first.");
    const m = await bucket(e).get(`${RELEASES}${v}/manifest.json`); if (!m) throw new H.BadRequestError(`release ${v} has no manifest`);
    const manifest = JSON.parse(await m.text()) as ReleaseManifest;
    return { manifest, read: async (path) => { const o = await bucket(e).get(`${RELEASES}${v}/${path}`); if (!o) throw new Error(`release ${v}: missing ${path}`); return new Uint8Array(await o.arrayBuffer()); } };
  }
  H.routerAdd("POST", "/api/vbcloud/releases/{version}/files", async (e: Ev) => {
    const version = e.pathParam("version"), path = e.queryParam("path");
    if (!safe(version) || !path || !safePath(path)) throw new H.BadRequestError("invalid version or path");
    const bytes = await e.request.arrayBuffer();
    await bucket(e).put(`${RELEASES}${version}/${path}`, bytes, { httpMetadata: { contentType: e.request.headers.get("content-type") ?? "application/octet-stream" } });
    return e.json(200, { version, path, size: bytes.byteLength });
  }, H.$apis.requireSuperuserAuth());
  H.routerAdd("POST", "/api/vbcloud/releases/{version}/activate", async (e: Ev) => {
    const version = e.pathParam("version"); if (!safe(version)) throw new H.BadRequestError("invalid version");
    const src = await releaseSource(e, version); // validates the manifest
    await bucket(e).put(`${RELEASES}current`, version, { httpMetadata: { contentType: "text/plain" } });
    return e.json(200, { current: version, modules: src.manifest.modules.length, assets: src.manifest.assets.length });
  }, H.$apis.requireSuperuserAuth());
  H.routerAdd("GET", "/api/vbcloud/releases", async (e: Ev) => {
    const versions = new Map<string, number>();
    for (let cursor: string | undefined; ;) { const page = await bucket(e).list({ prefix: RELEASES, cursor }); for (const o of page.objects) { const v = o.key.slice(RELEASES.length).split("/")[0]!; if (v && v !== "current") versions.set(v, (versions.get(v) ?? 0) + o.size); } if (!page.truncated || !page.cursor) break; cursor = page.cursor; }
    return e.json(200, { current: await currentVersion(e), releases: [...versions.entries()].map(([version, bytes]) => ({ version, bytes })).sort((a, b) => b.version.localeCompare(a.version)) });
  }, H.$apis.requireSuperuserAuth());
  H.routerAdd("GET", "/api/vbcloud/release", async (e: Ev) => {
    const v = await currentVersion(e); if (!v) return e.json(200, { current: null });
    const { manifest: m } = await releaseSource(e, v);
    return e.json(200, { current: v, voidbase: m.voidbase, builtAt: m.builtAt, modules: m.modules.length, assets: m.assets.length, migrations: m.migrations.length, hub: m.durableObjects.length > 0, queue: !!m.queueBinding });
  }, H.$apis.requireAuth());

  // ---- who am I on the cloud page -----------------------------------------------------------------------------------
  const connectionJSON = (conn: HookRecord | null) => conn ? { email: conn.getString("email"), name: conn.getString("name"), cfUserId: conn.getString("cf_user_id"), scopes: conn.getString("scopes"), expiry: conn.getString("expiry"), accounts: (() => { const a = conn.get("accounts"); return Array.isArray(a) ? a : typeof a === "string" ? JSON.parse(a || "[]") : []; })() } : null;
  H.routerAdd("GET", "/api/vbcloud/me", async (e: Ev) => {
    const auth = e.auth!; let conn: HookRecord | null = null;
    if (!auth.isSuperuser()) { try { conn = await H.$app.findFirstRecordByFilter("cf_connections", "user = {:u}", { u: auth.id }); } catch { conn = null; } }
    const c = cfg();
    return e.json(200, { user: { id: auth.id, email: auth.email?.() ?? auth.getString("email"), name: auth.getString("name"), superuser: auth.isSuperuser() }, admin: isAdmin(auth), connected: !!conn, connection: connectionJSON(conn), self: { worker: c.worker || null, account: c.account || null }, prefix: c.prefix, maxInstances: c.maxPerUser, providerConfigured: !!c.clientId });
  }, H.$apis.requireAuth());
  H.routerAdd("GET", "/api/vbcloud/accounts", async (e: Ev) => {
    const { conn, cf } = await connectionFor(userId(e));
    const accounts = await listAccounts(cf); conn.set("accounts", accounts); await H.$app.save(conn);
    return e.json(200, { accounts });
  }, H.$apis.requireAuth("users"));

  // ---- instances ---------------------------------------------------------------------------------------------------
  const instanceJSON = (r: HookRecord, viewer: HookRecord | null) => ({ id: r.id, name: r.getString("name"), url: r.getString("url"), status: r.getString("status"), error: r.getString("error"), release: r.getString("release"), account: { id: r.getString("account_id"), name: r.getString("account_name") }, owner: r.getString("owner"), system: r.getBool("system"), superuserEmail: r.getString("superuser_email"), created: String(r.get("created") ?? ""), updated: String(r.get("updated") ?? ""), canDelete: !!viewer && (r.getString("owner") === viewer.id || (r.getBool("system") && isAdmin(viewer))), canLink: !!viewer && (r.getString("owner") === viewer.id || (r.getBool("system") && isAdmin(viewer))), self: !!cfg().worker && r.getString("name") === cfg().worker });
  H.routerAdd("GET", "/api/vbcloud/instances", async (e: Ev) => {
    const auth = e.auth!; const origin = new URL(e.request.url).origin;
    try { await ensureSelf(origin); } catch (err) { console.warn("vbcloud: self registration", err); }
    const own = (auth.isSuperuser() ? [] : await H.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "-created", 100, 0, { u: auth.id })) as HookRecord[];
    const system = (isAdmin(auth) ? await H.$app.findRecordsByFilter("vb_instances", "system = true && status != 'deleted'", "-created", 20, 0) : []) as HookRecord[];
    const seen = new Set<string>(); const rows = [...system, ...own].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
    return e.json(200, { instances: rows.map((r) => instanceJSON(r, auth)) });
  }, H.$apis.requireAuth());
  H.routerAdd("POST", "/api/vbcloud/instances", async (e: Ev) => {
    const uid = userId(e); const body = await readBody(e); const c = cfg();
    const { cf, accounts } = await connectionFor(uid);
    const wanted = String(body.name ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!wanted) throw new H.BadRequestError("Give the instance a name (letters, digits, dashes).");
    const name = wanted.startsWith(c.prefix) ? wanted : `${c.prefix}${wanted}`;
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name)) throw new H.BadRequestError(`"${name}" is not a valid worker name (lowercase letters, digits and dashes, 63 chars max).`);
    const accountId = String(body.account ?? accounts[0]?.id ?? "");
    if (!accountId) throw new H.BadRequestError("Pick the Cloudflare account to create the instance in.");
    const account = accounts.find((a) => a.id === accountId) ?? (accounts.length ? null : { id: accountId, name: "" });
    if (!account) throw new H.BadRequestError("That Cloudflare account was not granted to this site: sign in with Cloudflare again and select it.");
    const mine = (await H.$app.findRecordsByFilter("vb_instances", "owner = {:u} && status != 'deleted'", "", 200, 0, { u: uid })) as HookRecord[];
    if (mine.length >= c.maxPerUser) throw new H.BadRequestError(`You already have ${mine.length} instances (limit ${c.maxPerUser}). Delete one first.`);
    if (mine.some((r) => r.getString("name") === name)) throw new H.BadRequestError(`You already have an instance named ${name}.`);
    if (await H.$app.findRecordsByFilter("vb_instances", "name = {:n} && status != 'deleted'", "", 1, 0, { n: name }).then((r: HookRecord[]) => r.length)) throw new H.BadRequestError(`The name ${name} is taken.`);
    if (await workerExists(cf, account.id, name)) throw new H.BadRequestError(`A Worker named ${name} already exists on that account.`);
    const release = await releaseSource(e);
    const email = String(body.superuserEmail ?? e.auth!.email?.() ?? e.auth!.getString("email") ?? "admin@example.com");
    const password = randomPassword();
    const row = new H.Record(H.$app.findCollectionByNameOrId("vb_instances"));
    row.set("owner", uid); row.set("name", name); row.set("account_id", account.id); row.set("account_name", account.name); row.set("status", "creating"); row.set("release", release.manifest.version); row.set("superuser_email", email); row.set("system", false);
    await H.$app.save(row);
    const lines: string[] = [];
    try {
      const r = await provisionInstance(cf, { account: account.id, name, release, superuser: { email, password }, applyDoMigrations: true, tags: [`vbcloud-owner:${uid}`], log: (l) => lines.push(l) });
      row.set("status", "live"); row.set("url", r.url ?? ""); row.set("d1_id", r.d1.uuid); row.set("queue_id", r.queue?.id ?? ""); row.set("error", "");
      await H.$app.save(row);
      // the superuser password travels to the new Worker as a secret and to the owner once, here; it is not kept
      return e.json(200, { instance: instanceJSON(row, e.auth), credentials: { url: r.url ?? "", superuserEmail: email, superuserPassword: password, panel: r.url ? `${r.url}/_/` : "" }, log: lines });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      row.set("status", "error"); row.set("error", message.slice(0, 1000)); await H.$app.save(row);
      console.error("vbcloud: provisioning", name, err);
      throw new H.BadRequestError(`Creating ${name} failed: ${message}`, { log: lines });
    }
  }, H.$apis.requireAuth("users"));
  H.routerAdd("GET", "/api/vbcloud/instances/{id}/credentials", async (e: Ev) => {
    const row = await H.$app.findRecordById("vb_instances", e.pathParam("id")); if (!row) throw new H.NotFoundError();
    if (!(row.getString("owner") === e.auth!.id || (row.getBool("system") && isAdmin(e.auth)))) throw new H.ForbiddenError();
    // the password was shown once at creation (reset it from the instance's own panel if it is lost)
    return e.json(200, { url: row.getString("url"), superuserEmail: row.getString("superuser_email"), panel: row.getString("url") ? `${row.getString("url")}/_/` : "" });
  }, H.$apis.requireAuth());
  H.routerAdd("DELETE", "/api/vbcloud/instances/{id}", async (e: Ev) => {
    const uid = userId(e); const row = await H.$app.findRecordById("vb_instances", e.pathParam("id")); if (!row) throw new H.NotFoundError();
    const system = row.getBool("system");
    if (!(row.getString("owner") === uid || (system && isAdmin(e.auth)))) throw new H.ForbiddenError("Only the owner can delete this instance.");
    if (row.getString("status") === "deleting") throw new H.BadRequestError("This instance is already being deleted.");
    if (system && !cfg().allowSelfDelete) throw new H.ForbiddenError("Deleting the site's own backend is disabled (VB_ALLOW_SELF_DELETE=1 enables it).");
    const { cf, accounts } = await connectionFor(uid);
    const accountId = row.getString("account_id");
    if (accounts.length && !accounts.some((a) => a.id === accountId)) throw new H.BadRequestError(`Your Cloudflare connection does not reach account ${accountId}: sign in with Cloudflare again and grant it.`);
    row.set("status", "deleting"); await H.$app.save(row);
    const name = row.getString("name"); const self = !!cfg().worker && name === cfg().worker;
    const lines: string[] = [];
    // for the site's own backend the script goes first (that is this Worker), the data after; the response still
    // leaves this isolate, later requests hit a deleted Worker. Anything else: same order, nothing special.
    const report = await destroyInstance(cf, { account: accountId, name, log: (l) => lines.push(l) });
    if (self) return e.json(200, { deleted: report.deleted, skipped: report.skipped, errors: report.errors, self: true, log: lines });
    if (report.errors.length) { row.set("status", "error"); row.set("error", report.errors.join("; ").slice(0, 1000)); await H.$app.save(row); throw new H.BadRequestError(`Deleting ${name} left errors: ${report.errors.join("; ")}`, { report }); }
    await H.$app.delete(row);
    return e.json(200, { deleted: report.deleted, skipped: report.skipped, errors: report.errors, self: false, log: lines });
  }, H.$apis.requireAuth("users"));

  // the template marketplace: GitHub connection, templates, repositories wired to instances (see ./github.ts)
  registerGithub(app, { env, seal, open, userId, readBody, isAdmin });
}
