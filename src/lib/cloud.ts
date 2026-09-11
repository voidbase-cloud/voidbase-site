// The cloud page's client lives in the voidbase package now (`@voidbase-cloud/voidbase/cloud-client`, the same
// code the `voidbase cloud` CLI drives); this module keeps the page's import path, and adds the thin layer the
// page needs before the shared client gains it: what an instance reports on `/api/plugins` beyond the installer
// (mail, ai, translations, domains, payments), the backups plugin's archive kinds, verification and per-kind
// restore, and the payments collections read as a superuser. Each override is a superset of the shared shape,
// so the page and the test see one `CloudClient`; when the shared client catches up, the overrides go.
//
// What the shared client should gain, so this file shrinks back to the re-export: `plugins().running()` typed
// with the report fields below (`PluginsReport`); `backups().list()` returning `BackupItem` (kind, verified,
// voidbase, verifyError, offsite, restore); `backups().create(name, kind)`; `backups().verify(key)`;
// `backups().restore(key, { createMissing })`; and `payments(inst, session)` over the three collections.
import { CloudClient as SharedClient, CloudError, type Backup, type Instance } from "@voidbase-cloud/voidbase/cloud-client";
export * from "@voidbase-cloud/voidbase/cloud-client";

/** what PocketBase accepts as a backup file name (the shared client's rule, kept here for `create` with a kind) */
const BACKUP_NAME = /^[a-z0-9_-]+\.zip$/;

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
}

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
  constructor(base: string, token: () => string, fetchImpl: (input: string, init?: RequestInit) => Promise<Response> = (u, i) => fetch(u, i)) {
    super(base, token, fetchImpl);
    this.fetchOnInstance = fetchImpl;
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
