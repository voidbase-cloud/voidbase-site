// The cloud page's client lives in the voidbase package now (`@voidbase-cloud/voidbase/cloud-client`, the same
// code the `voidbase cloud` CLI drives); this module keeps the page's import path, and adds the thin layer the
// page needs before the shared client gains it: what an instance reports on `/api/plugins` beyond the installer
// (mail, ai, translations, domains, payments, observability), the backups plugin's archive kinds, verification and
// per-kind restore, the payments collections read as a superuser, the observability plugin's summary, errors and
// logs, an upgrade onto a named release with the one it left recorded (so it can be undone), and the domains
// plugin's knob set where a deploy reads it. Each override is a
// superset of the shared shape, so the page and the test see one `CloudClient`; when the shared client catches
// up, the overrides go.
//
// What the shared client should gain, so this file shrinks back to the re-export: `plugins().running()` typed
// with the report fields below (`PluginsReport`); `backups().list()` returning `BackupItem` (kind, verified,
// voidbase, verifyError, offsite, restore); `backups().create(name, kind)`; `backups().verify(key)`;
// `backups().restore(key, { createMissing })`; `payments(inst, session)` over the three collections;
// `observability(inst, session)` over the observability plugin's three routes (`summary(window)`, `errors(since)`,
// `logs(o)`), with the 404 an instance older than 0.9.0-beta.37 answers left for the caller to fall back on;
// `upgradeInstance(inst, { release })`, the release to put the instance on rather than always the active one, with
// the release it left recorded on the row, which is what makes an upgrade reversible; and `setDomains(inst,
// hostnames, repo)`, the domains plugin's knob written where that instance's deploy reads it.
import { provisionInstance, workerExists } from "@voidbase-cloud/voidbase/cloud";
import { CloudClient as SharedClient, CloudError, type Backup, type Instance, type LogEntry } from "@voidbase-cloud/voidbase/cloud-client";
export * from "@voidbase-cloud/voidbase/cloud-client";

/** what PocketBase accepts as a backup file name (the shared client's rule, kept here for `create` with a kind) */
const BACKUP_NAME = /^[a-z0-9_-]+\.zip$/;
/** carried over rather than resupplied when an instance's Worker is uploaded again (the shared client's list) */
const INHERITED = ["VOIDBASE_SUPERUSER_EMAIL", "VOIDBASE_SUPERUSER_PASSWORD"];
/** now, in the shape PocketBase stores a date in */
const pbNow = () => new Date().toISOString().replace("T", " ");

// ---- upgrading, and the way back ---------------------------------------------------------------------------------

/** how long after an upgrade the release it left is still offered */
export const ROLLBACK_WINDOW_DAYS = 7;
/** the two fields the row keeps about the last upgrade, as `/api/vbcloud/instances` hands them back */
export interface Upgraded { previousRelease?: string; upgradedAt?: string; status?: string; system?: boolean }
/**
 * The release an instance can be put back on: the one it left, while that upgrade is still inside the window. A
 * rollback clears the pair, so it is never itself rollable, and beyond the window there is nothing to offer.
 */
export function rollbackTarget(inst: Upgraded, now = Date.now()): string | null {
  if (!inst.previousRelease || !inst.upgradedAt || inst.system || (inst.status && inst.status !== "live")) return null;
  const at = Date.parse(inst.upgradedAt.replace(" ", "T"));
  if (!Number.isFinite(at) || now - at > ROLLBACK_WINDOW_DAYS * 24 * 3600 * 1000) return null;
  return inst.previousRelease;
}

// ---- the domains plugin's knobs ----------------------------------------------------------------------------------

/** the hostnames attached, comma separated, the first canonical (src/server/plugins/domains.ts, and the deploy knob) */
export const DOMAINS_VAR = "VOIDBASE_DOMAINS";
/** the canonical hostname, the one every other attached hostname redirects to */
export const CANONICAL_DOMAIN_VAR = "VOIDBASE_CANONICAL_DOMAIN";
/** where a project declares its configuration, and so where its deploy reads a knob from the repository */
export const SECRETS_DECLARATION = "vb_secrets/main.ts";
/** the deploy plugin's own rule for a hostname */
const HOSTNAME = /^[a-z0-9.-]+\.[a-z]{2,}$/;
/** what setting the domains did: one commit on the project's repository, or the vars and the hostnames here */
export interface DomainsChange { via: "repository" | "worker"; hostnames: string[]; canonical: string | null; commit?: { sha: string; url: string; path: string }; attached?: string[] }

/** the hostnames a field or a list names, cleaned the way the deploy plugin cleans them; the first is canonical */
export function hostnamesOf(text: string | string[]): string[] {
  const raw = Array.isArray(text) ? text : String(text).split(",");
  const hosts = [...new Set(raw.map((h) => h.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase()).filter(Boolean))];
  for (const h of hosts) if (!HOSTNAME.test(h)) throw new CloudError(`"${h}" is not a hostname like api.example.com.`);
  return hosts;
}

/** the names a declaration needs from the secrets module, added to its import when they are not already there */
function withImports(source: string, names: string[]): string {
  const im = /import\s*\{([^}]*)\}\s*from\s*(["'])([^"']*\/secrets)\2/.exec(source);
  if (!im) return source;
  const have = im[1]!.split(",").map((n) => n.trim()).filter(Boolean);
  const missing = names.filter((n) => !have.includes(n));
  if (!missing.length) return source;
  return `${source.slice(0, im.index)}import { ${[...have, ...missing].join(", ")} } from ${im[2]}${im[3]}${im[2]}${source.slice(im.index + im[0].length)}`;
}

/**
 * `VOIDBASE_DOMAINS` written into a project's secrets declaration: its line replaced when the file has one, added
 * at the top of the declaration when it has none, with `server` and `string` added to the import if they are
 * missing. A deploy puts every declared value into its environment, which is where the domains plugin reads it.
 */
export function declareDomains(source: string, hostnames: string[]): string {
  const line = (indent: string) => `${indent}${DOMAINS_VAR}: server(string().default(${JSON.stringify(hostnames.join(","))}), "the hostnames the domains plugin attaches, the first canonical"),`;
  const existing = new RegExp(`^([ \\t]*)${DOMAINS_VAR}\\s*:.*$`, "m");
  if (existing.test(source)) return withImports(source.replace(existing, (_m, indent: string) => line(indent)), ["server", "string"]);
  const open = /defineSecrets\(\s*\{/.exec(source);
  if (!open) throw new CloudError(`${SECRETS_DECLARATION} does not call defineSecrets({ … }), so ${DOMAINS_VAR} cannot be declared in it.`);
  const at = open.index + open[0].length;
  return withImports(`${source.slice(0, at)}\n${line("  ")}${source.slice(at)}`, ["server", "string"]);
}

const toBase64Text = (text: string) => { let s = ""; for (const b of new TextEncoder().encode(text)) s += String.fromCharCode(b); return btoa(s); };
const fromBase64Text = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (ch) => ch.charCodeAt(0)));

// ---- what GET /api/plugins reports, beyond the installer ---------------------------------------------------------

/**
 * where this instance's own mail (the settings' sender) goes with its bindings: `plugin` with the `carrier`,
 * `http` or `smtp` with the `host`, or `log` with `refused` saying why nothing else could take it
 */
export interface MailReport { via: "plugin" | "http" | "smtp" | "log" | string; carrier?: string; host?: string; sender?: string; refused?: string }
/** the ai plugin: `none`, or `workers-ai` with the model; `conversations` when the instance reports the persistent half */
export interface AiReport { via: "none" | "workers-ai" | string; model?: string; conversations?: boolean }
/** the translations plugin: the source locale, the locales in fallback order, the declared fields per collection */
export interface TranslationsReport { source?: string; locales?: string[]; collections?: Record<string, string[]> }
/** the domains plugin: the hostnames the deploy attached, and which one the others redirect to */
export interface DomainsReport { hostnames: string[]; canonical: string | null }
/** payments@1: `none`, or the provider whose key these bindings carry, with `also`/`reason` when two keys are set */
export interface PaymentsReport { via: "none" | string; webhook?: string; livemode?: boolean; also?: string[]; reason?: string }
/** the observability plugin: which source its numbers come from, how much of the path it samples, whether the log is kept */
export interface ObservabilityReport { via: ObservabilitySource; sampling: number; logs: boolean }
/** `GET /api/plugins`: what runs, where it lives, and what each shipped plugin reports about itself */
export interface PluginsReport {
  names: string[];
  origins: Record<string, string>;
  disabled: string[];
  installer: { mode: string; repository?: string; branch?: string; hint?: string };
  mail?: MailReport;
  ai?: AiReport;
  translations?: TranslationsReport;
  domains?: DomainsReport;
  payments?: PaymentsReport;
  /** null on an instance that runs the plugin with nothing to report; absent before 0.9.0-beta.37 */
  observability?: ObservabilityReport | null;
}

// ---- the observability plugin: the numbers, the errors and the log -----------------------------------------------

/**
 * Which of the two sources answered. `analytics-engine` is the dataset the Worker samples every request into, so
 * the numbers are about all the traffic; `request-log` is the instance's own `_logs` table, which keeps entries at
 * or above the log level (warnings and errors, by default), so the numbers are about what went wrong. The plugin
 * says which it used rather than pretending they are the same population.
 */
export type ObservabilitySource = "analytics-engine" | "request-log";
/** how far back the plugin looks */
export type ObservabilityWindow = "hour" | "day";
/** one of the five slowest routes over the window, as a route pattern rather than a path */
export interface SlowRoute { route: string; p95: number; count: number }
/** `GET /api/observability/summary`: the window's traffic, its error share, its percentiles and its slowest routes */
export interface ObservabilitySummary {
  source: ObservabilitySource;
  window: ObservabilityWindow;
  requests: number;
  errors: number;
  /** the share of requests that answered 5xx, 0 to 1 */
  rate: number;
  p50: number;
  p95: number;
  p99: number;
  slowest: SlowRoute[];
  /** `2xx`, `4xx`, `5xx` and what else the window saw, to their counts */
  statuses: Record<string, number>;
}
/** `GET /api/observability/errors` and `/logs`: rows of the instance's request log, newest first */
export interface ObservabilityLogs { source: ObservabilitySource; since: string; level?: number | null; items: LogEntry[]; totalItems: number }

/**
 * Whether an instance answered "there is no such route", which is what one older than 0.9.0-beta.37 says to every
 * observability call: the plugin is not on it. A panel reads this as "fall back", not as "something went wrong".
 */
export const routeMissing = (err: unknown): boolean => err instanceof CloudError && err.status === 404;

// ---- the backups plugin: two archive kinds, verified, restored per kind -------------------------------------------

export type BackupKind = "full" | "data";
/** what a restore did, as the listing shows it afterwards */
export interface BackupRestore { at: string; kind: BackupKind | "legacy"; restored: string[]; created: string[]; skipped: { collection: string; reason: string }[]; settings: boolean }
/** one archive as `GET /api/backups` lists it on 0.9.0-beta.31 and later; an older instance answers the three base fields only */
export interface BackupItem extends Backup { kind?: BackupKind | "legacy"; verified?: boolean; voidbase?: string | null; verifyError?: string; offsite?: boolean; offsiteError?: string; restore?: BackupRestore }
/** what `POST /api/backups/:key/verify` answers */
export interface BackupVerify { key: string; kind: BackupKind | "legacy"; verified: boolean; voidbase: string | null; checksum: string | null; entries: number; corrupted: string[]; missing: string[]; error?: string; offsite?: boolean }

// ---- the payments collections ----------------------------------------------------------------------------------

/** one row of the `payments` collection, the fields the panel shows */
export interface PaymentRow { id: string; amount: number; currency: string; status: string; created: string; customer?: string; subscription?: string; providerId?: string }
export interface PaymentsSummary { customers: number; subscriptions: number; payments: number; latest: PaymentRow[] }

export class CloudClient extends SharedClient {
  private readonly fetchOnInstance: (input: string, init?: RequestInit) => Promise<Response>;
  /** the site and the user's session again, because the shared client keeps its own copies private */
  private readonly siteBase: string;
  private readonly siteToken: () => string;
  constructor(base: string, token: () => string, fetchImpl: (input: string, init?: RequestInit) => Promise<Response> = (u, i) => fetch(u, i)) {
    super(base, token, fetchImpl);
    this.fetchOnInstance = fetchImpl;
    this.siteBase = base.replace(/\/$/, "");
    this.siteToken = token;
  }
  /** one field of an instance's row, written through the collection's rules the way the shared client writes them */
  private async instanceRow(id: string, body: Record<string, unknown>): Promise<void> {
    const r = await this.fetchOnInstance(`${this.siteBase}/api/collections/vb_instances/records/${id}`, { method: "PATCH", headers: { "content-type": "application/json", authorization: this.siteToken() }, body: JSON.stringify(body) });
    if (!r.ok) { const j = (await r.json().catch(() => ({}))) as { message?: string }; throw new CloudError(String(j.message ?? `the row of ${id}: ${r.status}`), r.status); }
  }
  /** one call on the instance's own API with the owner's session, as the shared client makes it (private there) */
  private onInstanceHere(inst: Instance, session: string) {
    const base = (inst.url ?? "").replace(/\/+$/, "");
    return async <T>(method: string, path: string, body?: unknown): Promise<T> => {
      const r = await this.fetchOnInstance(`${base}${path}`, { method, headers: { authorization: session, ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (r.status === 204) return {} as T;
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new CloudError(String(j.message ?? `${path}: ${r.status}`), r.status);
      return j as T;
    };
  }

  /**
   * The shared upgrade with the release named: the active one, as before, or a recorded one for a rollback. The row
   * keeps what the instance was on and when it moved (`previous_release`, `upgraded_at`), which is what lets the card
   * offer the way back; a rollback clears the pair instead, so it is not itself rollable. A rollback re-deploys the
   * code and nothing else: the migrations the newer release ran have run, and none of this reverses them.
   */
  override async upgradeInstance(inst: Instance, o: { log?: (l: string) => void; release?: string; rollback?: boolean } = {}): Promise<{ upgraded: boolean; from: string; to: string; log: string[] }> {
    if (inst.system) throw new CloudError("A system instance is deployed from its repository; upgrade it there.");
    const release = await this.release(o.release); const from = inst.release ?? ""; const to = release.version;
    if (from === to) return { upgraded: false, from, to, log: [] };
    const cf = this.cf();
    if (!(await workerExists(cf, inst.account.id, inst.name))) throw new CloudError("The Worker for this instance is not on the account any more.");
    const record = o.rollback ? { previous_release: "", upgraded_at: "" } : { previous_release: from, upgraded_at: pbNow() };
    await this.instanceRow(inst.id, { status: "upgrading", ...record });
    const lines: string[] = []; const log = (l: string) => { lines.push(l); o.log?.(l); };
    try {
      await provisionInstance(cf, { account: inst.account.id, name: inst.name, release, inheritSecrets: INHERITED, applyDoMigrations: false, tags: [`vbcloud-owner:${inst.owner ?? ""}`], log });
      await this.instanceRow(inst.id, { release: to, status: "live", error: "" });
      return { upgraded: true, from, to, log: lines };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.instanceRow(inst.id, { status: inst.status || "live", error: message.slice(0, 1000) }).catch(() => null);
      throw new CloudError(`${o.rollback ? "Rolling back" : "Upgrading"} ${inst.name} failed: ${message}`, 400, lines);
    }
  }

  /**
   * The domains plugin's knob, set where this instance's deploy reads it. An instance deployed from a repository
   * holds its configuration there, so this is one commit on it, the way a plugin install is one commit: the knob
   * goes into the project's secrets declaration, the push deploys, and the plugin attaches the hostnames, waits for
   * the certificate and redirects the others to the canonical one. An instance with no repository has no deploy a
   * browser can run, so the two vars the plugin would bake go on the Worker itself and each hostname is attached
   * here, which is what the plugin's own `after` does; the instance then reports them like any other.
   */
  async setDomains(inst: Instance, hostnames: string[] | string, repo: { fullName: string; branch?: string } | null): Promise<DomainsChange> {
    const hosts = hostnamesOf(hostnames); const canonical = hosts[0] ?? null;
    if (repo?.fullName) {
      const branch = repo.branch || (await this.gh<{ default_branch?: string }>("GET", `/repos/${repo.fullName}`)).data.default_branch || "master";
      return { via: "repository", hostnames: hosts, canonical, commit: await this.commitDomains(repo.fullName, branch, hosts) };
    }
    const worker = this.secrets(inst); const api = this.domains(inst);
    if (hosts.length) { await worker.set(DOMAINS_VAR, hosts.join(",")); await worker.set(CANONICAL_DOMAIN_VAR, canonical!); }
    else for (const name of [DOMAINS_VAR, CANONICAL_DOMAIN_VAR]) await worker.remove(name).catch(() => null);
    for (const h of hosts) await api.attach(h);
    // the plugin's list is the whole list: a hostname it no longer names comes off the Worker, as `--remove` takes it off
    for (const d of await api.list()) if (!hosts.includes(d.hostname)) await api.detach(d.id);
    return { via: "worker", hostnames: hosts, canonical, attached: hosts };
  }

  /** one commit on the project's branch, through GitHub's Git Data API, as src/server/project-sync.ts commits a plugin */
  private async commitDomains(fullName: string, branch: string, hosts: string[]): Promise<{ sha: string; url: string; path: string }> {
    const path = SECRETS_DECLARATION;
    const head = await this.gh<{ object: { sha: string } }>("GET", `/repos/${fullName}/git/ref/heads/${branch}`);
    const headSha = head.data.object.sha;
    const commit = await this.gh<{ tree: { sha: string } }>("GET", `/repos/${fullName}/git/commits/${headSha}`);
    const file = await this.gh<{ content?: string }>("GET", `/repos/${fullName}/contents/${path}?ref=${headSha}`, undefined, [404]);
    if (file.status === 404) throw new CloudError(`${fullName} has no ${path}, so there is nowhere in it to declare ${DOMAINS_VAR}.`);
    const source = fromBase64Text(String(file.data.content ?? ""));
    const next = declareDomains(source, hosts);
    if (next === source) return { sha: "", url: "", path };
    const blob = await this.gh<{ sha: string }>("POST", `/repos/${fullName}/git/blobs`, { content: toBase64Text(next), encoding: "base64" });
    const tree = await this.gh<{ sha: string }>("POST", `/repos/${fullName}/git/trees`, { base_tree: commit.data.tree.sha, tree: [{ path, mode: "100644", type: "blob", sha: blob.data.sha }] });
    const made = await this.gh<{ sha: string; html_url?: string }>("POST", `/repos/${fullName}/git/commits`, { message: `domains: ${hosts.join(", ") || "none"}`, tree: tree.data.sha, parents: [headSha] });
    await this.gh("PATCH", `/repos/${fullName}/git/refs/heads/${branch}`, { sha: made.data.sha, force: false });
    return { sha: made.data.sha, url: made.data.html_url ?? `https://github.com/${fullName}/commit/${made.data.sha}`, path };
  }

  /** the shared calls, with `running()` typed as the whole report */
  override plugins(inst: Instance, session: string) {
    const shared = super.plugins(inst, session);
    return { ...shared, running: () => shared.running() as Promise<PluginsReport> };
  }

  /**
   * The shared backups calls plus what the backups plugin added: the listing's kind and verification, an archive
   * of one kind (`full` by default, `data` for the non-system collections' rows and files), a verification on
   * demand, and a restore that may create the collections a data archive carries and the instance lacks.
   */
  override backups(inst: Instance, session: string) {
    const shared = super.backups(inst, session);
    const call = this.onInstanceHere(inst, session);
    return {
      ...shared,
      list: () => shared.list() as Promise<BackupItem[]>,
      create: async (name?: string, kind: BackupKind = "full"): Promise<{ name: string; kind: BackupKind }> => {
        let n = (name ?? "").trim().toLowerCase();
        if (n && !n.endsWith(".zip")) n += ".zip";
        if (n && !BACKUP_NAME.test(n)) throw new CloudError("A backup name is lowercase letters, digits, dashes and underscores, ending in .zip.");
        // `full` is what the instance writes without a kind, so only `data` travels; an older instance ignores it
        await call("POST", "/api/backups", { ...(kind !== "full" ? { kind } : {}), ...(n ? { name: n } : {}) });
        return { name: n, kind };
      },
      verify: (key: string) => call<BackupVerify>("POST", `/api/backups/${encodeURIComponent(key)}/verify`),
      restore: async (key: string, o: { createMissing?: boolean } = {}) => { await call("POST", `/api/backups/${encodeURIComponent(key)}/restore`, o.createMissing ? { createMissing: true } : undefined); },
    };
  }

  /**
   * The observability plugin's three routes, read with the superuser's session: the window's numbers, the errors
   * in it, and the log itself. An instance older than 0.9.0-beta.37 does not have them and answers 404, which is
   * left as it is: `routeMissing` is how a panel tells that apart from a call that failed, and falls back.
   */
  observability(inst: Instance, session: string) {
    const call = this.onInstanceHere(inst, session);
    const query = (o: Record<string, string | number | undefined>) => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") q.set(k, String(v));
      return q.toString() ? `?${q}` : "";
    };
    return {
      summary: (window: ObservabilityWindow = "hour") => call<ObservabilitySummary>("GET", `/api/observability/summary${query({ window })}`),
      errors: (since?: string, window: ObservabilityWindow = "hour") => call<ObservabilityLogs>("GET", `/api/observability/errors${query({ since, window })}`),
      logs: (o: { since?: string; window?: ObservabilityWindow; level?: number } = {}) => call<ObservabilityLogs>("GET", `/api/observability/logs${query({ since: o.since, window: o.window ?? "hour", level: o.level })}`),
    };
  }

  /**
   * The payments plugin's collections, read with the superuser's session: how many customers, subscriptions and
   * payments the instance holds, and the latest payments. The collections exist once a provider's key is set.
   */
  payments(inst: Instance, session: string) {
    const call = this.onInstanceHere(inst, session);
    const total = async (collection: string) => (await call<{ totalItems?: number }>("GET", `/api/collections/${collection}/records?perPage=1&fields=id`)).totalItems ?? 0;
    return {
      summary: async (latest = 10): Promise<PaymentsSummary> => {
        const [customers, subscriptions, page] = await Promise.all([total("customers"), total("subscriptions"), call<{ totalItems?: number; items?: PaymentRow[] }>("GET", `/api/collections/payments/records?perPage=${latest}&sort=-created&fields=id,amount,currency,status,created,customer,subscription,providerId`)]);
        return { customers, subscriptions, payments: page.totalItems ?? 0, latest: page.items ?? [] };
      },
    };
  }
}
