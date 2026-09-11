// The cloud control plane: sign in with Cloudflare, list the visitor's instances, create and delete them, connect
// GitHub, and create or link the repositories wired to an instance; then the life of one: its plugins, logs,
// metrics, backups, superusers and payments through the instance itself, its domains through the domains plugin
// (a commit on the project's repository, or the plugin's own vars and hostnames on a repositoryless instance) and
// its secrets through the Cloudflare pass-through; and the sign-in's own token as a CLI login, for the same
// session. Ported from the SvelteKit page at src/routes/(app)/cloud/+page.svelte.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import CloudflareSignIn from "@/components/CloudflareSignIn";
import { CopyButton } from "@/components/CodeBlock";
import { cloud, errorMessage, vb, VB_URL } from "@/lib/vb";
import { CloudClient, hostnamesOf, LOG_LEVELS, rollbackTarget, ROLLBACK_WINDOW_DAYS, routeMissing, type BackupItem, type BackupKind, type CustomDomain, type DomainsReport, type LogEntry, type LogPage, type Metrics, type ObservabilityLogs, type ObservabilitySource, type ObservabilitySummary, type ObservabilityWindow, type PaymentsReport, type PaymentsSummary, type PluginsReport, type Superuser, type WorkerSecret, type Zone } from "@/lib/cloud";

// ---- what /api/vbcloud/* hands back -----------------------------------------------------------------------------

interface CfAccount {
  id: string;
  name?: string;
}

interface Me {
  user: { email?: string; name?: string; superuser?: boolean };
  admin?: boolean;
  connected?: boolean;
  connection?: { accounts?: CfAccount[] };
  providerConfigured?: boolean;
  prefix?: string;
  maxInstances?: number;
}

interface Release {
  current?: string;
  voidbase?: string;
}

interface Instance {
  id: string;
  name: string;
  owner?: string;
  system?: boolean;
  plugins?: { name: string; version: string; marketplace: string }[];
  build?: string;
  buildError?: string;
  /** "live" | "creating" | "deleting" | "error" */
  status: string;
  account: CfAccount;
  self?: boolean;
  url?: string;
  release?: string;
  /** the release this instance was on before its last upgrade, and when that was: the way back, for seven days */
  previousRelease?: string;
  upgradedAt?: string;
  error?: string;
  superuserEmail?: string;
  canDelete?: boolean;
  canLink?: boolean;
}

interface Github {
  configured?: boolean;
  connected?: boolean;
  connection?: { login: string };
  scopes?: string;
}

interface Template {
  id: string;
  name: string;
  title: string;
  /** "site" gets the custom-domain field */
  kind: string;
  description: string;
  url: string;
  repo: string;
}

interface Repo {
  id: string;
  /** id of the instance this repository is wired to */
  instance: string;
  fullName: string;
  htmlUrl: string;
  status: string;
  system?: boolean;
  private?: boolean;
  templateTitle?: string;
  templateName?: string;
  canUnlink?: boolean;
  /** what the backend saw when it last looked at the repository itself */
  live?: {
    checked?: boolean;
    exists?: boolean;
    connected?: boolean;
    backendUrl?: string;
    htmlUrl?: string;
    private?: boolean;
  };
}

interface Credentials {
  panel: string;
  superuserEmail: string;
  superuserPassword?: string;
}

type PanelKind = "instance" | "template" | "link";

/** one inline panel at a time: { kind: "instance" } | { kind: "template" | "link", instance } */
interface Panel {
  kind: PanelKind;
  instance: string | null;
  name: string;
}

/** the fields of whichever panel is open; `open()` replaces it wholesale, the way the Svelte page did */
interface CloudForm {
  name?: string;
  account?: string;
  template?: string;
  repoName?: string;
  domain?: string;
  private?: boolean;
  fullName?: string;
}

type WiredState = "unknown" | "gone" | "yes" | "no";

const host = (url?: string) => (url || "").replace(/^https?:\/\//, "");
/** a PocketBase timestamp without its fraction, for a row */
const when = (date: string) => date.replace(/\.\d+Z?$/, "").replace("T", " ");
/** a payment's amount, from the minor unit the row holds, in the currency's own digits (JPY has none, USD two) */
const money = (amount: number, currency: string) => {
  try { const f = new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }); return f.format(amount / 10 ** (f.resolvedOptions().maximumFractionDigits ?? 2)); }
  catch { return `${amount} ${currency}`; }
};
/** a share of 0 to 1 as a percentage, with the digits it needs and no trailing zeroes */
const percent = (share: number) => `${Number((share * 100).toFixed(2))}%`;
/** the windows the observability plugin answers for, in the order the switch offers them */
const WINDOWS: { id: ObservabilityWindow; label: string }[] = [{ id: "hour", label: "Last hour" }, { id: "day", label: "Last day" }];
/** the levels the log filter offers, as the instance numbers them (LOG_LEVELS); "" is every level */
const LEVELS: { value: string; label: string }[] = [{ value: "", label: "every level" }, { value: "-4", label: "debug and up" }, { value: "0", label: "info and up" }, { value: "4", label: "warnings and up" }, { value: "8", label: "errors" }];
/** which of the two sources answered, in one line, because they are not the same population */
const SOURCE_LINE: Record<ObservabilitySource, string> = {
  "analytics-engine": "From the Analytics Engine dataset the Worker samples its requests into.",
  "request-log": "From the instance's own request log, which keeps entries at or above its log level, so this is what went wrong rather than everything that happened.",
};
/** the docs page a knob's hint points at: the plugins page, or the secrets page for the knobs that are secrets */
const DOCS = { plugins: "/docs/plugins", secrets: "/docs/run/stack/secrets" };
const wired = (repo: Repo): WiredState =>
  !repo.live?.checked ? "unknown" : !repo.live.exists ? "gone" : repo.live.connected ? "yes" : "no";
const wiredText: Record<WiredState, string> = {
  unknown: "not checked",
  gone: "repository gone",
  yes: "wired",
  no: "points elsewhere",
};

/** a button in the card's row and, when it is the open one, a body below the row */
function Collapsible({ id, label, open, setOpen, children }: { id: string; label: string; open: string; setOpen: (id: string) => void; children: React.ReactNode }) {
  const on = open === id;
  return (
    <>
      <button type="button" className={`btn btn-xs ${on ? "btn-outline" : "btn-secondary"}`} aria-expanded={on} onClick={() => setOpen(on ? "" : id)}>
        {on ? `Hide ${label.toLowerCase()}` : label}
      </button>
      {on && <div className="tool-panel">{children}</div>}
    </>
  );
}

/** the owner signs in to the instance itself, here in the browser; this site keeps nothing of the session */
function InstanceSignIn({ inst, client, onSession }: { inst: Instance; client: CloudClient; onSession: (token: string) => void }) {
  const [login, setLogin] = useState({ email: inst.superuserEmail || "", password: "" });
  const [error, setError] = useState("");
  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { onSession(await client.instanceSession(inst, login.email, login.password)); }
    catch (err) { setError(errorMessage(err)); }
  }
  return (
    <form className="tool-login" onSubmit={signIn}>
      {error && <p className="node-error">{error}</p>}
      <p className="txt-hint">Sign in to the instance as its superuser: this page talks to the instance itself, and this site keeps nothing of it.</p>
      <input type="email" placeholder="superuser email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} required />
      <input type="password" placeholder="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
      <button type="submit" className="btn btn-xs btn-secondary">Sign in to {inst.name}</button>
    </form>
  );
}

/** a value with a copy button beside it: a URL the owner registers somewhere else */
function Copyable({ text }: { text: string }) {
  const from = useRef<HTMLDivElement>(null);
  return <span className="copyable"><code>{text}</code> <CopyButton text={text} from={from} /></span>;
}

/** the knob that sets one of the things an instance reports, and the docs page that covers it */
function Knob({ children, href = DOCS.plugins }: { children: React.ReactNode; href?: string }) {
  return <span className="txt-hint">{children} <a href={href}>docs</a></span>;
}

/**
 * What the instance reports about its shipped plugins on /api/plugins, beyond the installer: where its mail goes,
 * the AI binding, the translations it serves, the payments provider, the hostnames the deploy attached and where
 * the observability plugin's numbers come from. Each line ends with the knob that sets it; seo's knobs are not
 * reported, so they are not here.
 */
function RunsBlock({ inst, report }: { inst: Instance; report: PluginsReport }) {
  const { mail, ai, translations, payments, domains, observability } = report;
  const tr = translations && translations.source && translations.locales?.length ? translations : null;
  const declared = Object.entries(tr?.collections ?? {}).map(([c, f]) => `${c}: ${f.join(", ")}`).join("; ");
  if (!mail && !ai && !translations && !payments && !domains && !observability) return null;
  return (
    <>
      <h4>What this instance runs</h4>
      <ul className="plugins-runs">
        {mail && (
          <li>
            <strong>Mail</strong>
            {mail.via === "plugin" ? <span>{mail.carrier}{mail.sender && <>, sender <code>{mail.sender}</code></>}</span>
              : mail.via === "log" ? <span>logged, not sent{mail.refused && <>: {mail.refused}</>}</span>
              : <span>{mail.via === "http" ? "an HTTP mail API" : mail.via === "smtp" ? "SMTP" : mail.via} at <code>{mail.host}</code>{mail.sender && <>, sender <code>{mail.sender}</code></>}</span>}
            <Knob>Set <code>VOIDBASE_MAIL_DOMAIN</code> to a domain of the account and redeploy; the sender in the settings has to be on it.</Knob>
          </li>
        )}
        {ai && (
          <li>
            <strong>AI</strong>
            {ai.via === "workers-ai" ? <span>Workers AI, model <code>{ai.model}</code>{ai.conversations !== undefined && <>, conversations {ai.conversations ? "on" : "off"}</>}</span> : <span>not bound</span>}
            <Knob>Set <code>VOIDBASE_AI=1</code>, or a model name, and redeploy.</Knob>
          </li>
        )}
        {translations && (
          <li>
            <strong>Translations</strong>
            {tr ? <span>source <code>{tr.source}</code>, locales {tr.locales!.join(", ")}; {declared || "no collection declared"}</span> : <span>idle: no locales or no fields declared</span>}
            <Knob>Set <code>VOIDBASE_LOCALES</code> (the first is the source) and <code>VOIDBASE_TRANSLATABLE</code> (<code>posts:title,body</code>).</Knob>
          </li>
        )}
        {payments && (
          <li>
            <strong>Payments</strong>
            {payments.via === "none" ? <span>no provider key set</span> : (
              <span>
                {payments.via}, {payments.livemode ? "live" : "test"} mode; webhook <Copyable text={`${inst.url}${payments.webhook}`} />
                {payments.also?.length ? <> Also set: {payments.also.join(", ")}{payments.reason && <> ({payments.reason})</>}.</> : null}
              </span>
            )}
            <Knob href={DOCS.secrets}>One key as a secret: <code>STRIPE_SECRET_KEY</code>, <code>POLAR_ACCESS_TOKEN</code> or <code>LEMONSQUEEZY_API_KEY</code>, with its webhook secret.</Knob>
          </li>
        )}
        {domains && (
          <li>
            <strong>Domains</strong>
            {domains.hostnames.length ? (
              <span>{domains.hostnames.map((h) => <Fragment key={h}><code>{h}</code>{h === domains.canonical && <> <span className="label label-sm">canonical</span></>}{" "}</Fragment>)}</span>
            ) : <span>none attached by the deploy; the Worker answers on {host(inst.url)}</span>}
            <Knob>Set <code>VOIDBASE_DOMAINS</code>, comma separated, the first canonical, and redeploy.</Knob>
          </li>
        )}
        {observability && (
          <li>
            <strong>Observability</strong>
            <span>
              {observability.via === "analytics-engine" ? "the Analytics Engine dataset" : "the instance's own request log"};{" "}
              {observability.sampling >= 1 ? "every request sampled" : observability.sampling > 0 ? `${percent(observability.sampling)} of requests sampled` : "nothing sampled"}; request log{" "}
              {observability.logs ? "kept" : "off, so the fallback has nothing to read"}
            </span>
            <Knob>Deploy with <code>--analytics</code> and set <code>VOIDBASE_OBSERVABILITY_TOKEN</code> to read the dataset; <code>VOIDBASE_OBSERVABILITY_SAMPLE</code> lowers how much of the path is sampled, <code>VOIDBASE_OBSERVABILITY=0</code> turns it off.</Knob>
          </li>
        )}
      </ul>
    </>
  );
}

/**
 * The plugins of one instance, through the instance's own installer (voidbase's `installer` plugin). On a
 * project instance a change is a commit its repository's build deploys; on one built without a repository the
 * instance says so. Below the installed list, what the instance reports about its shipped plugins.
 */
function PluginsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [running, setRunning] = useState<PluginsReport | null>(null);
  const [available, setAvailable] = useState<Awaited<ReturnType<ReturnType<CloudClient["plugins"]>["available"]>>["available"]>([]);
  const [marketplace, setMarketplace] = useState("");
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const api = client.plugins(inst, session);

  async function refresh(extra = marketplace) {
    const [r, a] = await Promise.all([api.running(), api.available(extra.trim() || undefined)]);
    setRunning(r); setAvailable(a.available);
  }
  useEffect(() => { refresh().catch((err) => setError(errorMessage(err))); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<Record<string, unknown>>) {
    setWorking(step); setError(""); setNotice("");
    try { const r = await fn(); setNotice(String(r.message ?? "Done.")); await refresh(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setWorking(""); }
  }

  const installer = running?.installer;
  const installed = new Set(running ? running.names.filter((n) => running.origins[n] !== "shipped") : []);
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {installer && (
        <p className="txt-hint">
          {installer.mode === "repository" ? <>Deployed from <code>{installer.repository}</code>: a change here is a commit there, and its build deploys it.</> : installer.mode === "filesystem" ? "Changed on disk; the instance loads the change when it restarts." : installer.hint}
        </p>
      )}
      {notice && <p className="txt-hint">{notice}</p>}
      <ul className="plugins-installed">
        {running?.names.map((n) => (
          <li key={n}>
            <code>{n}</code> <span className="txt-hint">{running.origins[n]}</span>{" "}
            {running.origins[n] !== "shipped" && installer?.mode !== "fixed" && (
              <>
                <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => act("update:" + n, () => api.update(n))}>{working === "update:" + n ? "Updating…" : "Update"}</button>{" "}
                <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => act("remove:" + n, () => api.remove(n))}>{working === "remove:" + n ? "Removing…" : "Remove"}</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {running && <RunsBlock inst={inst} report={running} />}
      {available.map((m) => (
        <div key={m.marketplace} className="plugins-available">
          <h4><a href={m.marketplace} target="_blank" rel="noopener noreferrer">{m.marketplace.replace(/^https?:\/\//, "")}</a></h4>
          {m.error && <p className="node-error">{m.error}</p>}
          <ul>
            {m.plugins.map((p) => (
              <li key={p.name}>
                <code>{p.name}</code> {p.latest} <span className="txt-hint">{p.summary}</span>{" "}
                {installed.has(p.name) ? <span className="label label-sm">installed</span> : installer?.mode !== "fixed" ? (
                  <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => act("add:" + p.name, () => api.install(p.name, { marketplace: m.marketplace }))}>{working === "add:" + p.name ? "Installing…" : "Install"}</button>
                ) : null}
              </li>
            ))}
            {!m.plugins.length && !m.error && <li className="txt-hint">nothing served yet</li>}
          </ul>
        </div>
      ))}
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); refresh().catch((err) => setError(errorMessage(err))); }}>
        <input type="url" placeholder="another marketplace: https://…" value={marketplace} onChange={(e) => setMarketplace(e.target.value)} />
        <button type="submit" className="btn btn-xs btn-secondary">Read it</button>
      </form>
    </>
  );
}

/**
 * The instance's own log entries, newest first. On 0.9.0-beta.37 and later they come from the observability
 * plugin's `/api/observability/logs`, with a level and a window, and from `/api/observability/errors` when the
 * toggle asks for the errors alone (5xx answers plus anything the instance recorded an error for, which a level
 * filter would miss). An instance without the plugin answers 404, and the panel falls back to what it read
 * before: PocketBase's own logs API with a filter in its syntax.
 */
function LogsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [win, setWin] = useState<ObservabilityWindow>("hour");
  const [level, setLevel] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [rows, setRows] = useState<ObservabilityLogs | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState<LogPage | null>(null);
  const [stats, setStats] = useState<{ total: number; date: string }[]>([]);
  /** the instance has no observability route, so this panel is the older one */
  const [older, setOlder] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** what the panel read before the plugin, and what it falls back to: the logs API with a filter */
  async function fromLogs(f: string) {
    const api = client.logs(inst, session);
    const [p, s] = await Promise.all([api.list({ filter: f, perPage: 50 }), api.stats(f)]);
    setPage(p); setStats(s); setRows(null);
  }
  async function refresh(o: { win?: ObservabilityWindow; level?: string; errorsOnly?: boolean; filter?: string } = {}) {
    const w = o.win ?? win, lvl = o.level ?? level, only = o.errorsOnly ?? errorsOnly, f = o.filter ?? filter;
    setLoading(true); setError("");
    try {
      if (older) { await fromLogs(f); return; }
      const api = client.observability(inst, session);
      setRows(only ? await api.errors(undefined, w) : await api.logs({ window: w, level: lvl === "" ? undefined : Number(lvl) }));
      setPage(null); setStats([]);
    } catch (err) {
      if (!routeMissing(err)) { setError(errorMessage(err)); return; }
      setOlder(true);
      try { await fromLogs(f); } catch (fallback) { setError(errorMessage(fallback)); }
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = stats.reduce((n, s) => n + (s.total || 0), 0);
  const items: LogEntry[] = rows?.items ?? page?.items ?? [];
  const read = rows || page;
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {older ? (
        <form className="tool-row" onSubmit={(e) => { e.preventDefault(); refresh(); }}>
          <input type="text" placeholder={'filter, e.g. level >= 4 || data.status >= 500'} value={filter} onChange={(e) => setFilter(e.target.value)} />
          <button type="submit" className="btn btn-xs btn-secondary" disabled={loading}>{loading ? "Reading…" : "Filter"}</button>
          <button type="button" className="btn btn-xs btn-outline" disabled={loading} onClick={() => refresh()}>Refresh</button>
        </form>
      ) : (
        <div className="tool-row tool-filters">
          <label className="tool-field">
            <span>Level</span>
            <select value={level} disabled={errorsOnly || loading} onChange={(e) => { setLevel(e.target.value); refresh({ level: e.target.value }); }}>
              {LEVELS.map((l) => <option key={l.value || "all"} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <label className="tool-field">
            <span>Since</span>
            <select value={win} disabled={loading} onChange={(e) => { const w = e.target.value as ObservabilityWindow; setWin(w); refresh({ win: w }); }}>
              {WINDOWS.map((w) => <option key={w.id} value={w.id}>{w.id === "hour" ? "an hour ago" : "a day ago"}</option>)}
            </select>
          </label>
          <label className="tool-check">
            <input type="checkbox" checked={errorsOnly} disabled={loading} onChange={(e) => { setErrorsOnly(e.target.checked); refresh({ errorsOnly: e.target.checked }); }} />
            <span>Errors only</span>
          </label>
          <button type="button" className="btn btn-xs btn-outline" disabled={loading} onClick={() => refresh()}>{loading ? "Reading…" : "Refresh"}</button>
        </div>
      )}
      {rows && (
        <p className="txt-hint">
          {rows.totalItems} {rows.totalItems === 1 ? "entry" : "entries"} since {when(rows.since)}{errorsOnly ? ", errors only" : level ? `, ${LEVELS.find((l) => l.value === level)?.label}` : ""}. {SOURCE_LINE[rows.source]}
        </p>
      )}
      {page && (
        <p className="txt-hint">
          {page.totalItems} {page.totalItems === 1 ? "entry" : "entries"}{stats.length ? <> over {stats.length} {stats.length === 1 ? "hour" : "hours"} ({total} in the stats)</> : null}; showing the last {page.items.length}. This instance has no observability plugin, which arrived in 0.9.0-beta.37, so this is its logs API with a filter.
        </p>
      )}
      <ul className="tool-logs">
        {items.map((l) => (
          <li key={l.id} className={`log-level-${LOG_LEVELS[l.level] ?? "other"}`}>
            <span className="log-when">{l.created.replace(/\.\d+Z?$/, "").replace("T", " ")}</span>
            <span className="label label-sm">{LOG_LEVELS[l.level] ?? l.level}</span>
            <span className="log-message" title={l.data ? JSON.stringify(l.data) : undefined}>{l.message}</span>
          </li>
        ))}
        {read && !items.length && <li className="txt-hint">nothing logged{older ? (filter ? " for that filter" : " yet") : errorsOnly ? " went wrong in that window" : " in that window"}</li>}
      </ul>
    </>
  );
}

/** the hour a stats bucket stands for, as "HH:00" UTC */
const hourOf = (date: string) => `${date.slice(11, 13)}:00`;
const sizeOf = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`);

/**
 * What the instance is doing, from the observability plugin's summary: the window's requests and errors, the
 * error rate, the three percentiles, the status split and the five slowest routes, over an hour or a day. The
 * summary carries no time series, so there is nothing here to draw as a curve; the numbers are the answer.
 *
 * An instance older than 0.9.0-beta.37 has no such route and answers 404, and the panel falls back to what it
 * did before: requests and errors per hour over the last 24 hours, counted from the instance's own logs, one bar
 * each with the errors drawn over them in the second colour. Inline SVG; no library.
 */
function MetricsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [win, setWin] = useState<ObservabilityWindow>("hour");
  const [summary, setSummary] = useState<ObservabilitySummary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  /** the instance has no observability route, so the panel does not ask for it again */
  const [older, setOlder] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function refresh(w = win) {
    setLoading(true); setError("");
    try {
      if (older) { setMetrics(await client.metrics(inst, session)); return; }
      setSummary(await client.observability(inst, session).summary(w)); setMetrics(null);
    }
    catch (err) {
      if (!routeMissing(err)) { setError(errorMessage(err)); return; }
      setOlder(true); setSummary(null);
      try { setMetrics(await client.metrics(inst, session)); }
      catch (fallback) { setError(errorMessage(fallback)); }
    }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  const statuses = Object.entries(summary?.statuses ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const hours = metrics?.hours ?? [];
  const max = Math.max(1, ...hours.map((h) => h.total));
  const BAR = 10, GAP = 3, H = 48, TOP = 4, BASE = H - 12;
  const width = Math.max(1, hours.length) * (BAR + GAP) - GAP;
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {summary && (
        <>
          <div className="tool-row tool-windows">
            {WINDOWS.map((w) => (
              <button key={w.id} type="button" className={`btn btn-xs ${w.id === win ? "btn-outline" : "btn-secondary"}`} aria-pressed={w.id === win} disabled={loading} onClick={() => { setWin(w.id); refresh(w.id); }}>{w.label}</button>
            ))}
          </div>
          <ul className="tool-figures">
            <li><span className="figure">{summary.requests}</span> <span className="txt-hint">{summary.requests === 1 ? "request" : "requests"}</span></li>
            <li><span className="figure">{summary.errors}</span> <span className="txt-hint">{summary.errors === 1 ? "error" : "errors"}</span></li>
            <li><span className={`figure${summary.rate ? " figure-bad" : ""}`}>{percent(summary.rate)}</span> <span className="txt-hint">error rate</span></li>
            <li><span className="figure">{summary.p50}</span> <span className="txt-hint">p50 ms</span></li>
            <li><span className="figure">{summary.p95}</span> <span className="txt-hint">p95 ms</span></li>
            <li><span className="figure">{summary.p99}</span> <span className="txt-hint">p99 ms</span></li>
          </ul>
          <p className="txt-hint">
            {statuses.length ? <>Answers: {statuses.map(([k, n]) => `${k} ${n}`).join(", ")}. </> : null}
            {summary.requests ? null : <>Nothing recorded in {win === "hour" ? "the last hour" : "the last day"}. </>}
            {SOURCE_LINE[summary.source]}
          </p>
          {summary.slowest.length > 0 && (
            <>
              <h4>Slowest routes</h4>
              <table className="tool-table">
                <thead><tr><th>Route</th><th>p95</th><th>Requests</th></tr></thead>
                <tbody>
                  {summary.slowest.map((s) => (
                    <tr key={s.route}><td><code>{s.route}</code></td><td>{s.p95} ms</td><td>{s.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
      {metrics && (
        <p className="txt-hint">
          <strong>{metrics.totals.requests}</strong> {metrics.totals.requests === 1 ? "request" : "requests"} and <strong>{metrics.totals.errors}</strong> {metrics.totals.errors === 1 ? "error" : "errors"} in the last 24 hours{hours.length ? <>, over {hours.length} {hours.length === 1 ? "hour" : "hours"} with traffic (UTC)</> : null}. This instance has no observability plugin, which arrived in 0.9.0-beta.37, so these are its own logs by the hour.
        </p>
      )}
      {hours.length > 0 && (
        <svg className="tool-metrics" viewBox={`0 0 ${width} ${H}`} width={width} height={H} role="img" aria-label={`Requests per hour on ${inst.name}, errors marked`}>
          {hours.map((h, i) => {
            const x = i * (BAR + GAP);
            const rh = Math.max(1, Math.round(((BASE - TOP) * h.total) / max));
            const eh = h.errors ? Math.max(1, Math.round(((BASE - TOP) * h.errors) / max)) : 0;
            return (
              <g key={h.date}>
                <title>{`${hourOf(h.date)} UTC: ${h.total} ${h.total === 1 ? "request" : "requests"}, ${h.errors} ${h.errors === 1 ? "error" : "errors"}`}</title>
                <rect className="metrics-requests" x={x} y={BASE - rh} width={BAR} height={rh} rx={1} />
                {eh > 0 && <rect className="metrics-errors" x={x} y={BASE - eh} width={BAR} height={eh} rx={1} />}
                {(i === 0 || i === hours.length - 1) && <text className="metrics-hour" x={x + BAR / 2} y={H - 2} textAnchor={i === 0 ? "start" : "end"}>{hourOf(h.date)}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {metrics && !hours.length && <p className="txt-hint">Nothing logged in the last 24 hours.</p>}
      <div className="tool-row">
        <button type="button" className="btn btn-xs btn-outline" disabled={loading} onClick={() => refresh()}>{loading ? "Reading…" : "Refresh"}</button>
      </div>
    </>
  );
}

/** what the listing says about an archive's verification, and about its restore if one ran */
function BackupState({ b }: { b: BackupItem }) {
  return (
    <>
      {b.verified === true ? <span className="backup-ok" title="Read back after the write; every entry matches its manifest"><i className="ri-check-line" aria-hidden="true" /> verified</span>
        : b.verified === false ? <span className="backup-bad" title={b.verifyError}>{b.kind === "legacy" ? "not verifiable: no manifest" : b.verifyError ?? "not verified"}</span>
        : null}
      {b.offsite === true ? <span className="label label-sm" title="Copied to the off-site bucket">off-site</span> : b.offsite === false ? <span className="backup-bad" title={b.offsiteError}>off-site copy failed</span> : null}
      {b.restore && (
        <span className="txt-hint" title={b.restore.skipped.map((s) => `${s.collection}: ${s.reason}`).join("\n") || undefined}>
          restored {when(b.restore.at)}: {b.restore.restored.length} {b.restore.restored.length === 1 ? "collection" : "collections"}{b.restore.created.length ? `, ${b.restore.created.length} created` : ""}{b.restore.skipped.length ? `, ${b.restore.skipped.length} skipped` : ""}{b.restore.settings ? ", settings" : ""}
        </span>
      )}
    </>
  );
}

/**
 * The instance's backups: the archives in its storage, one taken on demand as a full archive or a data one,
 * verified after the write and again on demand, downloaded through a file token in a new tab, deleted, or
 * restored: a full archive replaces the instance's data and restarts it, a data archive lands on the existing
 * collections and may create the ones the instance lacks.
 */
function BackupsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [list, setList] = useState<BackupItem[] | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<BackupKind>("full");
  /** per data archive: create the collections the instance lacks on restore */
  const [createMissing, setCreateMissing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const api = client.backups(inst, session);
  const refresh = () => api.list().then(setList).catch((err) => setError(errorMessage(err)));
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<string | void>) {
    setWorking(step); setError(""); setNotice("");
    try { const said = await fn(); if (said) setNotice(said); await refresh(); } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  async function download(key: string) {
    // the tab opens on the click itself, so the browser allows it; the URL arrives once the instance mints the token
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try { const url = await api.downloadUrl(key); if (tab) tab.location.href = url; else window.open(url, "_blank", "noopener,noreferrer"); }
    catch (err) { tab?.close(); setError(errorMessage(err)); }
  }
  const verify = (b: BackupItem) => act("verify:" + b.key, async () => {
    const v = await api.verify(b.key);
    if (v.verified) return `${b.key} verified: ${v.entries} ${v.entries === 1 ? "entry" : "entries"}${v.voidbase ? `, written by voidbase ${v.voidbase}` : ""}.`;
    return `${b.key} did not verify: ${v.error ?? (v.corrupted.length ? `corrupted: ${v.corrupted.join(", ")}` : v.missing.length ? `missing: ${v.missing.join(", ")}` : "checksum mismatch")}`;
  });
  function restore(b: BackupItem) {
    const data = b.kind === "data";
    const missing = data && !!createMissing[b.key];
    const text = data
      ? `Restore ${b.key} on ${inst.name}?\n\nA data archive replaces the rows and files of every collection it holds that the instance has${missing ? ", and creates the ones the instance lacks from the archive's definitions" : "; one the instance lacks is skipped"}. The settings and the superusers stay. What those collections hold now is lost unless it is in another backup.`
      : `Restore ${b.key} on ${inst.name}?\n\nEverything on the instance is replaced by what the archive holds (collections, rows and files), and the instance restarts. What is on it now is lost unless it is in another backup.`;
    if (!confirm(text)) return;
    act("restore:" + b.key, async () => { await api.restore(b.key, { createMissing: missing }); return `Restoring ${b.key}; ${data ? "its collections take the archive's rows" : "the instance restarts with it"}.`; });
  }
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {notice && <p className="txt-hint">{notice}</p>}
      <p className="txt-hint">Archives in the instance's own storage, each read back and verified after it is written. A full archive is everything: collections, rows, files, settings and schema; a restore replaces all of it and restarts the instance. A data archive is the rows and files of the non-system collections, for moving content between instances; a restore lands on the collections the instance has.</p>
      <ul>
        {list?.map((b) => (
          <li key={b.key}>
            <code>{b.key}</code>
            {b.kind && <span className="label label-sm">{b.kind}</span>}
            <span className="txt-hint">{sizeOf(b.size)} · {b.modified.replace(/\.\d+Z?$/, "")}{b.voidbase ? ` · voidbase ${b.voidbase}` : ""}</span>
            <BackupState b={b} />
            <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => download(b.key)}>Download</button>{" "}
            <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => verify(b)}>{working === "verify:" + b.key ? "Verifying…" : "Verify"}</button>{" "}
            <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => restore(b)}>{working === "restore:" + b.key ? "Restoring…" : "Restore"}</button>{" "}
            {b.kind === "data" && (
              <label className="txt-hint">
                <input type="checkbox" checked={!!createMissing[b.key]} onChange={(e) => setCreateMissing((m) => ({ ...m, [b.key]: e.target.checked }))} /> create the collections the instance lacks
              </label>
            )}
            <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => { if (confirm(`Delete the backup ${b.key}?`)) act("remove:" + b.key, () => api.remove(b.key)); }}>{working === "remove:" + b.key ? "Deleting…" : "Delete"}</button>
          </li>
        ))}
        {list && !list.length && <li className="txt-hint">no backups yet</li>}
      </ul>
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); act("create", async () => { const r = await api.create(name, kind); setName(""); return r.name ? `Backup ${r.name} taken (${r.kind}).` : `Backup taken (${r.kind}).`; }); }}>
        <input type="text" placeholder="name (optional): nightly.zip" value={name} onChange={(e) => setName(e.target.value)} pattern="[A-Za-z0-9_-]+(\.zip)?" />
        <select value={kind} onChange={(e) => setKind(e.target.value as BackupKind)} aria-label="Archive kind">
          <option value="full">full: everything</option>
          <option value="data">data: the collections' rows and files</option>
        </select>
        <button type="submit" className="btn btn-xs btn-secondary" disabled={!!working}>{working === "create" ? "Taking…" : "Take a backup"}</button>
      </form>
    </>
  );
}

/**
 * The sign-in's own token as a CLI login: the same session this page uses, against this site. Nothing is minted
 * and nothing is stored; when this sign-in expires, so does the command.
 */
function CliToken() {
  const body = useRef<HTMLDivElement>(null);
  const origin = typeof location !== "undefined" ? location.origin : "";
  const command = `voidbase cloud login --token ${vb().authStore.token} --url ${origin}`;
  return (
    <section className="cli" aria-label="CLI">
      <p className="eyebrow">CLI</p>
      <figure className="code-block cli-command">
        <div className="code-tools"><CopyButton text={command} from={body} /></div>
        <div ref={body} className="code-body"><pre className="plain"><code>{command}</code></pre></div>
      </figure>
      <p className="txt-hint">The same session this page uses; it expires when this sign-in does.</p>
    </section>
  );
}

/** the instance's superusers: who can open its panel; the last one cannot be removed */
function SuperusersPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [list, setList] = useState<Superuser[]>([]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const api = client.superusers(inst, session);
  const refresh = () => api.list().then(setList).catch((err) => setError(errorMessage(err)));
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<unknown>) {
    setWorking(step); setError("");
    try { await fn(); await refresh(); } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      <ul>
        {list.map((s) => (
          <li key={s.id}>
            <code>{s.email}</code>{" "}
            <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working || list.length <= 1} title={list.length <= 1 ? "The last superuser stays" : undefined} onClick={() => { if (confirm(`Remove ${s.email} from ${inst.name}'s superusers?`)) act("remove:" + s.id, () => api.remove(s.id)); }}>{working === "remove:" + s.id ? "Removing…" : "Remove"}</button>
          </li>
        ))}
      </ul>
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); act("add", async () => { await api.add(form.email, form.password); setForm({ email: "", password: "" }); }); }}>
        <input type="email" placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <button type="submit" className="btn btn-xs btn-secondary" disabled={!!working}>{working === "add" ? "Adding…" : "Add superuser"}</button>
      </form>
    </>
  );
}

/**
 * The instance's domains, through the domains plugin. What the plugin reports from the instance is the truth here:
 * the hostnames its deploy attached and the canonical one, read with the owner's session. Setting them is the
 * plugin's knob, written where this instance's deploy reads it: a commit on the project's repository, which the
 * push deploys, or, on an instance with no repository, the plugin's own two vars on the Worker with the hostnames
 * attached here. The account's Workers Custom Domains stay below as what the account has attached, so a hostname
 * on one side and not the other is visible rather than hidden.
 */
function DomainsPanel({ inst, client, session, repo, onSession }: { inst: Instance; client: CloudClient; session: string; repo: Repo | null; onSession: (token: string) => void }) {
  const [report, setReport] = useState<DomainsReport | null>(null);
  const [reportError, setReportError] = useState("");
  const [list, setList] = useState<CustomDomain[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [field, setField] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const api = useMemo(() => client.domains(inst), [client, inst]);
  const refresh = () => Promise.all([api.list(), api.zones()]).then(([d, z]) => { setList(d); setZones(z); }).catch((err) => setError(errorMessage(err)));
  const readReport = () => client.plugins(inst, session).running().then((r) => { const d = r.domains ?? { hostnames: [], canonical: null }; setReport(d); setField(d.hostnames.join(", ")); }).catch((err) => setReportError(errorMessage(err)));
  useEffect(() => { refresh(); }, [inst.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setReport(null); setReportError("");
    if (session) readReport();
  }, [session, inst.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<unknown>) {
    setWorking(step); setError("");
    try { await fn(); await refresh(); } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  async function save() {
    setWorking("save"); setError(""); setNotice("");
    try {
      const r = await client.setDomains(inst, hostnamesOf(field), repo ? { fullName: repo.fullName } : null);
      const named = r.hostnames.join(", ") || "no hostname";
      setNotice(r.via === "repository"
        ? r.commit?.sha
          ? `Committed to ${repo!.fullName} (${r.commit.sha.slice(0, 7)}): ${r.commit.path} now declares ${named}. The change lands on the next deploy, which attaches them.`
          : `${repo!.fullName} already declares ${named}; nothing to commit.`
        : `${named} set on the Worker and attached here; the instance reports them itself.`);
      await refresh();
      if (session) await readReport();
    } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const unreported = report ? report.hostnames.filter((h) => !list.some((d) => d.hostname === h)) : [];
  return (
    <>
      <h4>What the domains plugin reports</h4>
      {session ? (
        <>
          {reportError && <p className="node-error">{reportError}</p>}
          {report && (report.hostnames.length ? (
            <ul>
              {report.hostnames.map((h) => (
                <li key={h}>
                  <a href={`https://${h}`} target="_blank" rel="noopener noreferrer">{h}</a>
                  {h === report.canonical && <span className="label label-sm" title="The hostname the others redirect to, and the URL the deploy reports">canonical</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="txt-hint">The deploy attached no hostname; the Worker answers on {host(inst.url)}.</p>
          ))}
          {error && <p className="node-error">{error}</p>}
          {notice && <p className="txt-hint">{notice}</p>}
          <form className="tool-row" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <input type="text" placeholder="shop.example.com, www.shop.example.com" value={field} onChange={(e) => setField(e.target.value)} aria-label="Hostnames, comma separated, the first canonical" />
            <button type="submit" className="btn btn-xs btn-secondary" disabled={!!working}>{working === "save" ? "Saving…" : "Set domains"}</button>
          </form>
          <p className="txt-hint">
            Comma separated, the first canonical. {repo
              ? <>Setting them is one commit to <code>{repo.fullName}</code>, in <code>vb_secrets/main.ts</code> where the deploy reads its knobs: the push deploys, the plugin attaches each hostname, waits for its certificate and redirects the others to the canonical one, and the change lands on the next deploy.</>
              : <>This instance has no repository, so its domains are attached here and the plugin reports them. The redirects to the canonical hostname are the deploy's, so they are not set; wire a repository to get them.</>} <a href={DOCS.plugins}>docs</a>
          </p>
        </>
      ) : <InstanceSignIn inst={inst} client={client} onSession={onSession} />}
      <h4>What the account has attached</h4>
      {!session && error && <p className="node-error">{error}</p>}
      <p className="txt-hint">The Workers Custom Domains on the account's zones pointing at this Worker: Cloudflare's own DNS record and certificate for each.</p>
      <ul>
        {list.map((d) => (
          <li key={d.id}>
            <a href={`https://${d.hostname}`} target="_blank" rel="noopener noreferrer">{d.hostname}</a> <span className="txt-hint">{zoneName(d.zone_id)}</span>{" "}
            {report && !report.hostnames.includes(d.hostname) && <span className="label label-sm" title="Attached on the account, but not among the hostnames the instance reports">not in the report</span>}{" "}
            <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => { if (confirm(`Detach ${d.hostname} from ${inst.name}?`)) act("detach:" + d.id, () => api.detach(d.id)); }}>{working === "detach:" + d.id ? "Detaching…" : "Detach"}</button>
          </li>
        ))}
        {unreported.map((h) => <li key={h} className="txt-hint">{h}: reported by the instance, not attached on this account</li>)}
        {!list.length && !unreported.length && <li className="txt-hint">no custom domain; the Worker answers on {host(inst.url)}</li>}
      </ul>
      {!zones.length && <p className="txt-hint">The account has no zones this token can read; add the domain to Cloudflare first.</p>}
    </>
  );
}

/** the Worker's secrets by name: a value is written and never shown again; the managed ones are listed only */
function SecretsPanel({ inst, client }: { inst: Instance; client: CloudClient }) {
  const [list, setList] = useState<WorkerSecret[]>([]);
  const [form, setForm] = useState({ name: "", text: "" });
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const api = useMemo(() => client.secrets(inst), [client, inst]);
  const refresh = () => api.list().then(setList).catch((err) => setError(errorMessage(err)));
  useEffect(() => { refresh(); }, [inst.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<unknown>) {
    setWorking(step); setError("");
    try { await fn(); await refresh(); } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      <p className="txt-hint">Names only: a value goes to the Worker and is never read back. Setting a name that exists replaces its value.</p>
      <ul>
        {list.map((s) => (
          <li key={s.name}>
            <code>{s.name}</code>{" "}
            {s.managed ? <span className="label label-sm" title="Set by voidbase.cloud when the instance was created or wired">managed</span> : (
              <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => { if (confirm(`Remove the secret ${s.name} from ${inst.name}?`)) act("remove:" + s.name, () => api.remove(s.name)); }}>{working === "remove:" + s.name ? "Removing…" : "Remove"}</button>
            )}
          </li>
        ))}
        {!list.length && <li className="txt-hint">no secrets on the Worker</li>}
      </ul>
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); act("set", async () => { await api.set(form.name, form.text); setForm({ name: "", text: "" }); }); }}>
        <input type="text" placeholder="NAME" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required pattern="[A-Za-z_][A-Za-z0-9_]*" />
        <input type="password" placeholder="value" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required autoComplete="off" />
        <button type="submit" className="btn btn-xs btn-secondary" disabled={!!working}>{working === "set" ? "Setting…" : "Set secret"}</button>
      </form>
    </>
  );
}

/**
 * The payments plugin, as the instance reports it: with a provider's key set, the webhook URL to register at the
 * provider and the three collections the plugin owns, read with the superuser's session (counts, and the latest
 * payments); without one, the knobs that would set a provider.
 */
function PaymentsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [report, setReport] = useState<PaymentsReport | null>(null);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true); setError("");
    try {
      const r = (await client.plugins(inst, session).running()).payments ?? { via: "none" };
      setReport(r);
      setSummary(r.via === "none" ? null : await client.payments(inst, session).summary());
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {report?.via === "none" && (
        <>
          <p className="txt-hint">No provider key is set, so the payments interface is idle: its routes answer 503 and the customers, subscriptions and payments collections are not created. Set one provider's key and its webhook secret as secrets on the Worker (the Secrets panel here, or the app's own secrets on a project), then redeploy:</p>
          <ul>
            <li><code>STRIPE_SECRET_KEY</code> <span className="txt-hint">with <code>STRIPE_WEBHOOK_SECRET</code></span></li>
            <li><code>POLAR_ACCESS_TOKEN</code> <span className="txt-hint">with <code>POLAR_WEBHOOK_SECRET</code>; <code>POLAR_SANDBOX=1</code> for the sandbox</span></li>
            <li><code>LEMONSQUEEZY_API_KEY</code> <span className="txt-hint">with <code>LEMONSQUEEZY_STORE_ID</code> and <code>LEMONSQUEEZY_WEBHOOK_SECRET</code></span></li>
          </ul>
          <p className="txt-hint">One key means that provider; with two, the first in the shipped order answers and the instance says so. <a href={DOCS.secrets}>docs</a></p>
        </>
      )}
      {report && report.via !== "none" && (
        <>
          <p className="txt-hint">
            <strong>{report.via}</strong>, {report.livemode ? "live" : "test"} mode. Register the webhook at the provider: <Copyable text={`${inst.url}${report.webhook}`} />
            {report.also?.length ? <> Also set: {report.also.join(", ")}{report.reason && <> ({report.reason})</>}.</> : null}
          </p>
          {summary && (
            <>
              <p className="txt-hint"><strong>{summary.customers}</strong> {summary.customers === 1 ? "customer" : "customers"}, <strong>{summary.subscriptions}</strong> {summary.subscriptions === 1 ? "subscription" : "subscriptions"}, <strong>{summary.payments}</strong> {summary.payments === 1 ? "payment" : "payments"}{summary.latest.length ? <>; the latest {summary.latest.length}:</> : "."}</p>
              <ul className="tool-payments">
                {summary.latest.map((p) => (
                  <li key={p.id}>
                    <span>{money(p.amount, p.currency)}</span>
                    <span className={`label label-sm payment-${p.status}`}>{p.status}</span>
                    <span className="txt-hint">{when(p.created)}{p.subscription ? " · subscription" : ""}</span>
                  </li>
                ))}
                {!summary.latest.length && <li className="txt-hint">no payment yet</li>}
              </ul>
            </>
          )}
        </>
      )}
      <div className="tool-row">
        <button type="button" className="btn btn-xs btn-outline" disabled={loading} onClick={() => refresh()}>{loading ? "Reading…" : "Refresh"}</button>
      </div>
    </>
  );
}

/**
 * The summary each card shows, asked for once per instance and kept for the page's life: the panels below it
 * refresh on demand, the card's line does not. An instance whose call fails, 404 or otherwise, is remembered as
 * having nothing to show, so the card asks once and stays quiet.
 */
const cardNumbers = new Map<string, ObservabilitySummary | null>();

/**
 * What the owner does to an instance after it exists: plugins, logs, metrics, backups, superusers and payments
 * through the instance itself, with one session minted on it and shared by those panels; domains through the
 * domains plugin, which on a project is a commit to its repository; secrets on its Worker through the Cloudflare
 * pass-through, with the user's own token. This site holds nothing of any of it.
 *
 * Above them, once the session exists, the last hour as three numbers. Not a sparkline: the summary answers with
 * totals and percentiles and no time series, and a curve drawn from those would be one this page made up.
 */
function InstancePanels({ inst, client, repo }: { inst: Instance; client: CloudClient; repo: Repo | null }) {
  const [open, setOpen] = useState("");
  const [session, setSession] = useState("");
  const [numbers, setNumbers] = useState<ObservabilitySummary | null>(() => cardNumbers.get(inst.id) ?? null);
  useEffect(() => {
    if (!session) return;
    if (cardNumbers.has(inst.id)) { setNumbers(cardNumbers.get(inst.id) ?? null); return; }
    let live = true;
    client.observability(inst, session).summary("hour")
      .then((s) => { cardNumbers.set(inst.id, s); if (live) setNumbers(s); })
      .catch(() => { cardNumbers.set(inst.id, null); if (live) setNumbers(null); });
    return () => { live = false; };
  }, [session, inst.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const onInstance = (body: (s: string) => React.ReactNode) => (session ? body(session) : <InstanceSignIn inst={inst} client={client} onSession={setSession} />);
  return (
    <div className="node-tools">
      {numbers && (
        <p className="node-numbers txt-hint">
          Last hour: <strong>{numbers.requests}</strong> {numbers.requests === 1 ? "request" : "requests"}, <strong>{percent(numbers.rate)}</strong> errors, p95 <strong>{numbers.p95} ms</strong>.
        </p>
      )}
      <Collapsible id="plugins" label="Plugins" open={open} setOpen={setOpen}>{onInstance((s) => <PluginsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="logs" label="Logs" open={open} setOpen={setOpen}>{onInstance((s) => <LogsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="metrics" label="Metrics" open={open} setOpen={setOpen}>{onInstance((s) => <MetricsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="backups" label="Backups" open={open} setOpen={setOpen}>{onInstance((s) => <BackupsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="superusers" label="Superusers" open={open} setOpen={setOpen}>{onInstance((s) => <SuperusersPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="payments" label="Payments" open={open} setOpen={setOpen}>{onInstance((s) => <PaymentsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      {!inst.system && (
        <>
          <Collapsible id="domains" label="Domains" open={open} setOpen={setOpen}><DomainsPanel inst={inst} client={client} session={session} repo={repo} onSession={setSession} /></Collapsible>
          <Collapsible id="secrets" label="Secrets" open={open} setOpen={setOpen}><SecretsPanel inst={inst} client={client} /></Collapsible>
        </>
      )}
    </div>
  );
}

const client = new CloudClient(VB_URL || "", () => vb().authStore.token);
const meId = () => String((vb().authStore.record as { id?: string } | null)?.id ?? "");

export default function Cloud() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [github, setGithub] = useState<Github | null>(null);
  const [pipelines, setPipelines] = useState<Record<string, { connected: boolean | null; link: string }>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  /** credentials of the instance just created, shown once */
  const [created, setCreated] = useState<Credentials | null>(null);
  const [busy, setBusy] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  /** instance id -> credentials shown inline */
  const [creds, setCreds] = useState<Record<string, Credentials>>({});
  const [panel, setPanel] = useState<Panel | null>(null);
  const [form, setForm] = useState<CloudForm>({});

  // repositories hang off the instance they are wired to; ones whose instance is gone are listed last
  const byInstance = useMemo(
    () =>
      repos.reduce<Record<string, Repo[]>>((m, r) => {
        (m[r.instance] ||= []).push(r);
        return m;
      }, {}),
    [repos],
  );
  const orphans = useMemo(() => repos.filter((r) => !instances.some((i) => i.id === r.instance)), [repos, instances]);
  const canWire = (inst: Instance) =>
    !!github?.connected && inst.status === "live" && !!inst.canLink && !me?.user?.superuser;
  const pickedTemplate = useMemo(() => templates.find((t) => t.name === form.template) || null, [templates, form.template]);

  const patchForm = (patch: CloudForm) => setForm((f) => ({ ...f, ...patch }));

  async function load() {
    setError("");
    try {
      const meData = await cloud<Me>("GET", "/api/vbcloud/me");
      setMe(meData);
      if (meData?.connection?.accounts?.length) {
        const first = meData.connection.accounts[0].id;
        setForm((f) => (f.account ? f : { ...f, account: first }));
      }
      const [releaseData, instanceList, githubData, templateList] = await Promise.all([
        cloud<Release>("GET", "/api/vbcloud/release").catch(() => null),
        cloud<{ instances: Instance[] }>("GET", "/api/vbcloud/instances").then((r) => r.instances),
        cloud<Github>("GET", "/api/vbcloud/github").catch(() => null),
        cloud<{ templates: Template[] }>("GET", "/api/vbcloud/templates")
          .then((r) => r.templates)
          .catch(() => [] as Template[]),
      ]);
      setRelease(releaseData);
      setInstances(instanceList);
      setGithub(githubData);
      setTemplates(templateList);
      const repoRows = meData?.user?.superuser ? [] : await cloud<{ repos: Repo[] }>("GET", "/api/vbcloud/repos").then((r) => r.repos).catch(() => [] as Repo[]);
      setRepos(repoRows);
      // what GitHub says about each linked repository, and whether its instance deploys on push, asked from here
      for (const repo of repoRows.filter((r) => !r.system)) {
        const owner = instanceList.find((i) => i.id === repo.instance);
        if (owner && !owner.system) client.pipelineOf(owner).then((p) => setPipelines((m) => ({ ...m, [repo.instance]: p }))).catch(() => undefined);
        client.checkRepo(repo, instanceList.find((i) => i.id === repo.instance) ?? null)
          .then((live) => setRepos((list) => list.map((r) => (r.id === repo.id ? { ...r, live: { checked: true, ...live, htmlUrl: r.htmlUrl } } : r))))
          .catch((err) => setRepos((list) => list.map((r) => (r.id === repo.id ? { ...r, live: { checked: false, error: errorMessage(err) } } : r))));
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        vb().authStore.clear();
        setSignedIn(false);
      }
      setError(errorMessage(err));
    }
  }

  function open(kind: PanelKind, inst: Instance | null = null) {
    setError("");
    if (panel && panel.kind === kind && panel.instance === inst?.id) {
      setPanel(null);
      return;
    }
    setPanel({ kind, instance: inst?.id || null, name: inst?.name || "" });
    if (kind === "instance") setForm({ name: "", account: form.account || me?.connection?.accounts?.[0]?.id || "", template: github?.connected && templates.length ? templates[0]!.name : "", repoName: "", private: false });
    if (kind === "template") setForm({ template: templates[0]?.name || "", name: "", domain: "", private: false });
    if (kind === "link") setForm({ fullName: "" });
  }
  const close = () => setPanel(null);

  async function run(step: string, fn: () => Promise<void>) {
    setError("");
    setNotice("");
    setBusy(step);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
      const log = (err as { response?: { data?: { log?: string[] } } })?.response?.data?.log;
      setLogs((prev) => log || prev);
    } finally {
      setBusy("");
    }
  }

  const connectGithub = () =>
    run("github", async () => {
      const r = await cloud<{ url: string }>("GET", "/api/vbcloud/github/connect");
      location.href = r.url; // GitHub, then back here through the backend's callback
    });

  async function disconnectGithub() {
    if (!confirm("Disconnect GitHub? Wired repositories stay in your account; this site only forgets the token.")) return;
    await run("github", async () => {
      await cloud("DELETE", "/api/vbcloud/github");
      await load();
    });
  }

  const createInstance = () =>
    run("create", async () => {
      setLogs([]);
      const account = me?.connection?.accounts?.find((a) => a.id === form.account) ?? { id: form.account || "", name: "" };
      const r = await client.createInstance({ name: form.name || "", account, owner: meId(), superuserEmail: me?.user.email || "admin@example.com", prefix: me?.prefix, log: (l) => setLogs((ls) => [...ls, l]) });
      let notice = `${r.instance.name} is live at ${r.instance.url}`;
      // a project by default: the repository is made in the same click, from the template, and wired to the instance
      const tpl = form.template ? templates.find((t) => t.name === form.template) : undefined;
      if (tpl && github?.connected) {
        try {
          const repo = await client.createRepo({ template: tpl as unknown as Parameters<CloudClient["createRepo"]>[0]["template"], name: form.repoName || form.name || "", private: !!form.private, instance: r.instance, user: meId(), inputs: form as Record<string, unknown> });
          const pipeline = await client.pipelineOf(r.instance);
          notice += `; ${repo.repo.fullName} created from ${tpl.title} and wired to it${pipeline.connected ? "; a push deploys it" : `. One step left, in Cloudflare's dashboard: connect the repository under Builds so a push deploys it (${pipeline.link})`}`;
        } catch (err) { notice += `; the repository was not created: ${errorMessage(err)}`; }
      }
      setNotice(notice);
      setCreated(r.credentials); // shown once: the password is not stored anywhere but the new instance
      setPanel(null);
      await load();
    });

  const createRepo = () =>
    run("repo", async () => {
      const inst = instances.find((i) => i.id === panel?.instance); if (!inst) throw new Error("Pick the instance the repository should use.");
      if (!pickedTemplate) throw new Error("Pick a template.");
      const r = await client.createRepo({ template: pickedTemplate as unknown as Parameters<CloudClient["createRepo"]>[0]["template"], name: form.name || "", private: !!form.private, instance: inst, user: meId(), inputs: form as Record<string, unknown> });
      setNotice(`${r.repo.fullName} created from ${pickedTemplate.title} and wired to ${inst.name}${r.wired.length ? "; the instance commits there from now on" : ""}.`);
      setPanel(null);
      await load();
    });

  const linkRepo = () =>
    run("link", async () => {
      const inst = instances.find((i) => i.id === panel?.instance); if (!inst) throw new Error("Pick the instance the repository should use.");
      const r = await client.linkRepo({ fullName: form.fullName || "", instance: inst, user: meId(), inputs: form as Record<string, unknown> });
      setNotice(`${r.repo.fullName} wired to ${inst.name}: its PB_VB_URL is now ${r.variables.PB_VB_URL ?? inst.url}.`);
      setPanel(null);
      await load();
    });

  async function unlinkRepo(repo: Repo) {
    if (!confirm(`Unlink ${repo.fullName}?\n\nThe repository stays in your GitHub account; this site just stops listing it, and the instance forgets it.`))
      return;
    await run("unlink:" + repo.id, async () => {
      await client.unlinkRepo(repo, instances.find((i) => i.id === repo.instance) ?? null);
      await load();
    });
  }

  async function remove(inst: Instance) {
    if (inst.self || inst.system) { setNotice("A system instance is deployed from its repository and is not deleted from here."); return; }
    if (!confirm(`Delete ${inst.name}\n\nThe Worker, its D1 database, R2 bucket and queue are removed. This cannot be undone.`))
      return;
    await run("delete:" + inst.id, async () => {
      setLogs([]);
      const r = await client.deleteInstance(inst, { log: (l) => setLogs((ls) => [...ls, l]) });
      setNotice(`${inst.name} deleted (${r.deleted.length} resources removed${r.skipped.length ? `, ${r.skipped.length} already gone` : ""}).`);
      await load();
    });
  }

  async function upgrade(inst: Instance) {
    await run("upgrade:" + inst.id, async () => {
      setLogs([]);
      const r = await client.upgradeInstance(inst, { log: (l) => setLogs((ls) => [...ls, l]) });
      setNotice(r.upgraded ? `${inst.name}: ${r.from} → ${r.to}` : `${inst.name} is already on ${r.to}.`);
      await load();
    });
  }

  /** the last upgrade undone: the same provisioning, on the release the row recorded */
  async function rollback(inst: Instance) {
    const to = rollbackTarget(inst);
    if (!to) return;
    if (!confirm(`Roll ${inst.name} back to ${to}?\n\nThe Worker is provisioned again from ${to}, in place: the database, the files, the secrets and the domains stay.\n\nWhat this does not undo is migrations. The ones the newer release ran have run, and nothing reverses them, so a rollback can leave the database ahead of the code reading it.\n\nThe recorded release is cleared afterwards, so a rollback is not itself rollable.`))
      return;
    await run("rollback:" + inst.id, async () => {
      setLogs([]);
      const r = await client.upgradeInstance(inst, { release: to, rollback: true, log: (l) => setLogs((ls) => [...ls, l]) });
      setNotice(`${inst.name} rolled back: ${r.from} → ${r.to}. Migrations the newer release ran are not reversed.`);
      await load();
    });
  }

  async function toggleCredentials(inst: Instance) {
    if (creds[inst.id]) { const next = { ...creds }; delete next[inst.id]; setCreds(next); return; }
    setCreds((prev) => ({ ...prev, [inst.id]: client.credentials(inst) }));
  }

  function signOut() {
    vb().authStore.clear();
    setMe(null);
    setInstances([]);
    setRepos([]);
    setRelease(null);
    setPanel(null);
  }

  // the mount effect runs once, but the auth subscription it opens has to reach the current `me` and `load` the way
  // Svelte's closures reached the live values; this ref, refreshed after every render, stands in for that
  const latest = useRef({ me, load });
  useEffect(() => {
    latest.current = { me, load };
  });

  useEffect(() => {
    const pb = vb();
    setSignedIn(pb.authStore.isValid);
    // back from GitHub's consent screen (the backend's callback sends the browser here)
    const q = new URLSearchParams(location.search);
    if (q.get("github") === "connected") setNotice("GitHub connected.");
    else if (q.get("github") === "error") setError("GitHub: " + (q.get("message") || "sign-in failed"));
    if (q.has("github")) history.replaceState(null, "", location.pathname);
    const unsub = pb.authStore.onChange(() => {
      setSignedIn(pb.authStore.isValid);
      if (pb.authStore.isValid && !latest.current.me) latest.current.load();
    });
    if (pb.authStore.isValid) latest.current.load();
    setReady(true);
    return unsub;
  }, []);

  return (
    <div className="page-content cloud">
      {!ready ? (
        <div className="loader" />
      ) : !signedIn ? (
        <>
          <header className="cloud-head">
            <div>
              <p className="eyebrow">Cloud</p>
              <h1>Your instances, in your Cloudflare account</h1>
              <p className="lede">
                One click creates a voidbase instance: a Worker with the admin panel, a D1 database, an R2 bucket and a
                queue. Repositories you build from a template or link afterwards read the instance URL from a variable.
                The backend of this page is itself such an instance.
              </p>
            </div>
          </header>
          <div className="signin">
            <CloudflareSignIn className="btn btn-lg btn-primary" />
            <p className="txt-hint">
              Cloudflare shows which accounts and permissions this site asks for. Nothing is created until you click
              create. Backend: <code>{VB_URL ? host(VB_URL) : "this site"}</code>
            </p>
          </div>
        </>
      ) : (
        <>
          <header className="cloud-head">
            <div>
              <p className="eyebrow">Cloud</p>
              <h1>
                Instances <span className="count">{instances.length}</span>
              </h1>
              <p className="lede">
                Each instance is a Worker in your Cloudflare account with its own database, bucket and queue. The
                repositories wired to it read its URL from their <code>PB_VB_URL</code> variable.
              </p>
            </div>
            {me && !me.user.superuser && (
              <button
                type="button"
                className="btn btn-primary"
                aria-expanded={panel?.kind === "instance"}
                disabled={!me.connected || !release?.current}
                onClick={() => open("instance")}
              >
                <i className="ri-add-line" />
                <span className="txt">New instance</span>
              </button>
            )}
          </header>

          {me && (
            <div className="accounts" aria-label="Connected accounts">
              <div className="account">
                <span className="dot on" />
                <span className="who">
                  <strong>{me.user.email || me.user.name}</strong>
                  {me.admin && (
                    <>
                      {" "}
                      <span className="label label-sm">admin</span>
                    </>
                  )}
                </span>
                <span className="via">
                  {me.connected
                    ? `Cloudflare · ${(me.connection?.accounts || []).map((a) => a.name || a.id).join(", ") || "no account granted"}`
                    : "Cloudflare not connected"}
                </span>
                <button type="button" className="btn btn-xs btn-secondary" onClick={load}>
                  Refresh
                </button>
                <button type="button" className="btn btn-xs btn-secondary" onClick={signOut}>
                  Sign out
                </button>
              </div>
              {!me.user.superuser && github && (
                <div className="account">
                  <span className={`dot${github.connected ? " on" : ""}`} />
                  {!github.configured ? (
                    <>
                      <span className="who">GitHub</span>
                      <span className="via">no OAuth app configured on this backend (GH_OAUTH_CLIENT_ID)</span>
                    </>
                  ) : github.connected ? (
                    <>
                      <span className="who"><i className="ri-github-fill" /> <strong>@{github.connection?.login}</strong></span>
                      <span className="via">GitHub · {github.scopes}</span>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary"
                        disabled={busy === "github"}
                        onClick={disconnectGithub}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="who">GitHub</span>
                      <span className="via">connect it to create repositories from templates and wire them to an instance</span>
                      <button
                        type="button"
                        className="btn btn-xs btn-secondary"
                        disabled={busy === "github"}
                        onClick={connectGithub}
                      >
                        <i className="ri-github-fill" />
                        <span className="txt">{busy === "github" ? "Going to GitHub…" : "Connect GitHub"}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {me && <CliToken />}

          {me && !me.providerConfigured && (
            <div className="alert alert-warning">
              <div className="content">
                The backend has no Cloudflare OAuth client configured (CF_OAUTH_CLIENT_ID). See vb/.env.example.
              </div>
            </div>
          )}
          {error && (
            <div className="alert alert-danger">
              <div className="content">{error}</div>
            </div>
          )}
          {notice && (
            <div className="alert alert-success">
              <div className="content">{notice}</div>
            </div>
          )}
          {created && (
            <div className="alert alert-warning">
              <div className="content">
                <p>
                  <strong>Save these now.</strong> The superuser password is shown only once; this site does not keep it
                  (reset it from the instance's own dashboard if you lose it).
                </p>
                <p>
                  Dashboard <a href={created.panel} target="_blank" rel="noopener noreferrer">{created.panel}</a>
                  {" · email "}<code>{created.superuserEmail}</code>
                  {" · password "}<code>{created.superuserPassword}</code>
                </p>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setCreated(null)}>
                  I saved them
                </button>
              </div>
            </div>
          )}

          {panel?.kind === "instance" && (
            <form
              className="sheet"
              onSubmit={(e) => {
                e.preventDefault();
                createInstance();
              }}
            >
              <div className="sheet-head">
                <h3>New instance</h3>
                {release?.current && (
                  <span className="txt-hint">
                    release <code>{release.current}</code> · voidbase {release.voidbase}
                  </span>
                )}
              </div>
              <div className="flds">
                <label className="fld">
                  <span>Name</span>
                  <span className="prefixed">
                    <span className="pre">{me?.prefix}</span>
                    <input
                      type="text"
                      value={form.name ?? ""}
                      onChange={(e) => patchForm({ name: e.target.value })}
                      placeholder="my-app"
                      required
                      pattern="[a-zA-Z0-9\- ]+"
                    />
                  </span>
                </label>
                <label className="fld">
                  <span>Cloudflare account</span>
                  <select value={form.account ?? ""} onChange={(e) => patchForm({ account: e.target.value })} required>
                    {(me?.connection?.accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fld">
                  <span>Start from</span>
                  {github?.connected ? (
                    <select value={form.template ?? ""} onChange={(e) => patchForm({ template: e.target.value })}>
                      <option value="">nothing: a bare instance</option>
                      {templates.map((t) => (
                        <option key={t.name} value={t.name}>{t.title} (a repository in your GitHub, wired to the instance)</option>
                      ))}
                    </select>
                  ) : (
                    <span className="txt-hint">Connect GitHub to start from a template: the instance then deploys from a repository of your own, and its plugins are commits.</span>
                  )}
                </label>
                {github?.connected && form.template && (
                  <label className="fld">
                    <span>Repository name</span>
                    <input type="text" value={form.repoName ?? ""} onChange={(e) => patchForm({ repoName: e.target.value })} placeholder={form.name || "my-app"} />
                    <span className="txt-hint">
                      <input type="checkbox" checked={!!form.private} onChange={(e) => patchForm({ private: e.target.checked })} /> private
                    </span>
                  </label>
                )}
              </div>
              <div className="sheet-foot">
                <button type="submit" className="btn btn-primary" disabled={busy === "create"}>
                  {busy === "create" ? "Creating… about a minute" : "Create instance"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={close}>
                  Cancel
                </button>
                <span className="txt-hint">
                  Up to {me?.maxInstances} instances per account here; the Workers Free plan allows 10 D1 databases.
                </span>
              </div>
            </form>
          )}

          {!instances.length && (
            <div className="empty">
              <p>
                <strong>No instances yet.</strong>
              </p>
              {!release?.current ? (
                <p className="txt-hint">
                  No voidbase release has been uploaded to this backend yet (<code>voidbase bundle --push</code>), so
                  nothing can be created.
                </p>
              ) : me?.user?.superuser ? (
                <p className="txt-hint">
                  Superusers manage releases here; sign in with Cloudflare as a user to create instances.
                </p>
              ) : (
                <p className="txt-hint">Create one and it is live in about a minute.</p>
              )}
            </div>
          )}

          <ul className="nodes">
            {instances.map((inst) => {
              const list = byInstance[inst.id] || [];
              return (
                <li key={inst.id} className={`node status-${inst.status}${inst.self ? " self" : ""}`}>
                  <div className="node-head">
                    <span className="dot" title={inst.status} />
                    <div className="node-title">
                      <span className="name">{inst.name}</span>
                      {inst.self && (
                        <span className="label label-sm" title="The backend serving this very page">
                          this site's backend
                        </span>
                      )}
                      <span className="label label-sm status">{inst.status}</span>
                    </div>
                    <div className="node-meta">
                      <span>{inst.account.name || inst.account.id}</span>
                      {inst.release && (
                        <span>
                          release <code>{inst.release}</code>
                        </span>
                      )}
                      {inst.url && (
                        <a className="url" href={inst.url} target="_blank" rel="noopener noreferrer">
                          {host(inst.url)}
                        </a>
                      )}
                    </div>
                    <div className="node-actions">
                      {inst.url && (
                        <>
                          <a
                            href={`${inst.url}/_/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline"
                          >
                            Dashboard
                          </a>
                          <a
                            href={`${inst.url}/api/health`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-secondary"
                          >
                            API
                          </a>
                        </>
                      )}
                      {inst.superuserEmail && (
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          aria-expanded={!!creds[inst.id]}
                          onClick={() => toggleCredentials(inst)}
                        >
                          {creds[inst.id] ? "Hide credentials" : "Credentials"}
                        </button>
                      )}
                      {!inst.system && inst.status === "live" && release?.current && inst.release !== release.current && (
                        <button type="button" className="btn btn-xs btn-outline" disabled={busy === "upgrade:" + inst.id} onClick={() => upgrade(inst)}>
                          {busy === "upgrade:" + inst.id ? "Upgrading…" : `Upgrade to ${release.current}`}
                        </button>
                      )}
                      {rollbackTarget(inst) && (
                        <button type="button" className="btn btn-xs btn-outline" disabled={busy === "rollback:" + inst.id} onClick={() => rollback(inst)}>
                          {busy === "rollback:" + inst.id ? "Rolling back…" : `Roll back to ${rollbackTarget(inst)}`}
                        </button>
                      )}
                      {inst.canDelete && !inst.system && (
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary btn-danger"
                          disabled={busy === "delete:" + inst.id || inst.status === "deleting"}
                          onClick={() => remove(inst)}
                        >
                          {busy === "delete:" + inst.id ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                  {inst.error && <p className="node-error">{inst.error}</p>}
                  {rollbackTarget(inst) && (
                    <p className="txt-hint">
                      Rolling back provisions {inst.name} from {inst.previousRelease} again, the release it left on{" "}
                      {when(inst.upgradedAt!)}: it does not undo the migrations the newer release ran, and it clears the
                      recorded release, so a rollback is not itself rollable. Offered for {ROLLBACK_WINDOW_DAYS} days
                      after an upgrade; after that the card says the release it is on.
                    </p>
                  )}
                  {!me?.user?.superuser && inst.status === "live" && (
                    <InstancePanels inst={inst} client={client} repo={list.find((r) => !r.system) ?? null} />
                  )}
                  {creds[inst.id] && (
                    <p className="node-creds">
                      Superuser <code>{creds[inst.id].superuserEmail}</code> at{" "}
                      <a href={creds[inst.id].panel} target="_blank" rel="noopener noreferrer">
                        {creds[inst.id].panel}
                      </a>
                      ; the password was shown once at creation (reset it from that dashboard).
                    </p>
                  )}

                  {!me?.user?.superuser && (
                    <>
                      <ul className="branches">
                        {list.map((repo) => {
                          const w = wired(repo);
                          return (
                            <li key={repo.id} className={`branch wired-${w}`}>
                              <span className="joint" title={`PB_VB_URL: ${repo.live?.backendUrl || "not read"}`} />
                              <div className="branch-title">
                                <a
                                  className="name"
                                  href={repo.live?.htmlUrl || repo.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {repo.fullName}
                                </a>
                                {repo.system && (
                                  <span className="label label-sm" title="The repository this page is built from">
                                    this site
                                  </span>
                                )}
                                {(repo.private || repo.live?.private) && <span className="label label-sm">private</span>}
                                {repo.status !== "ready" && (
                                  <span className={`label label-sm status-${repo.status}`}>{repo.status}</span>
                                )}
                              </div>
                              <div className="branch-meta">
                                {(repo.templateTitle || repo.templateName) && (
                                  <span>from {repo.templateTitle || repo.templateName}</span>
                                )}
                                <span className="wired">{wiredText[w]}</span>
                                {!repo.system && pipelines[repo.instance] && (
                                  pipelines[repo.instance]!.connected === true ? <span className="wired">deploys on push</span>
                                  : pipelines[repo.instance]!.connected === false ? <a className="wired" href={pipelines[repo.instance]!.link} target="_blank" rel="noopener noreferrer">connect it under Builds so a push deploys it</a>
                                  : <span className="txt-hint">pipeline: not readable with this token</span>
                                )}
                              </div>
                              <div className="branch-actions">
                                <a
                                  href={`${repo.live?.htmlUrl || repo.htmlUrl}/actions`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-xs btn-secondary"
                                >
                                  Actions
                                </a>
                                {repo.canUnlink && (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-secondary"
                                    disabled={busy === "unlink:" + repo.id}
                                    onClick={() => unlinkRepo(repo)}
                                  >
                                    Unlink
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                        <li className="branch add">
                          <span className="joint" />
                          <div className="branch-title">
                            {canWire(inst) ? (
                              <>
                                {templates.length > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-secondary"
                                    aria-expanded={panel?.kind === "template" && panel?.instance === inst.id}
                                    onClick={() => open("template", inst)}
                                  >
                                    <i className="ri-add-line" />
                                    <span className="txt">New repository from a template</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-xs btn-secondary"
                                  aria-expanded={panel?.kind === "link" && panel?.instance === inst.id}
                                  onClick={() => open("link", inst)}
                                >
                                  <i className="ri-git-repository-line" />
                                  <span className="txt">Link a repository</span>
                                </button>
                              </>
                            ) : !github?.connected ? (
                              <span className="txt-hint">
                                {list.length
                                  ? "Connect GitHub to wire more repositories."
                                  : "Connect GitHub to wire a repository to this instance."}
                              </span>
                            ) : inst.status !== "live" ? (
                              <span className="txt-hint">Repositories can be wired once the instance is live.</span>
                            ) : (
                              <span className="txt-hint">Only the owner can wire repositories to this instance.</span>
                            )}
                          </div>
                        </li>
                      </ul>

                      {panel && panel.instance === inst.id && panel.kind === "template" ? (
                        <form
                          className="sheet nested"
                          onSubmit={(e) => {
                            e.preventDefault();
                            createRepo();
                          }}
                        >
                          <div className="sheet-head">
                            <h3>New repository for {inst.name}</h3>
                            <span className="txt-hint">created in your GitHub account, its variables set to this instance</span>
                          </div>
                          <div className="templates" role="radiogroup" aria-label="Template">
                            {templates.map((tpl) => (
                              <label key={tpl.id} className={`template${form.template === tpl.name ? " picked" : ""}`}>
                                <input
                                  type="radio"
                                  name="template"
                                  value={tpl.name}
                                  checked={form.template === tpl.name}
                                  onChange={() => patchForm({ template: tpl.name })}
                                />
                                <span className="template-title">{tpl.title} <span className="label label-sm">{tpl.kind}</span></span>
                                <span className="template-desc">{tpl.description}</span>
                                <a className="template-repo" href={tpl.url} target="_blank" rel="noopener noreferrer">
                                  {tpl.repo}
                                </a>
                              </label>
                            ))}
                          </div>
                          <div className="flds">
                            <label className="fld">
                              <span>Repository name</span>
                              <span className="prefixed">
                                <span className="pre">{github?.connection?.login}/</span>
                                <input
                                  type="text"
                                  value={form.name ?? ""}
                                  onChange={(e) => patchForm({ name: e.target.value })}
                                  placeholder="my-site"
                                  required
                                />
                              </span>
                            </label>
                            {pickedTemplate?.kind === "site" && (
                              <label className="fld">
                                <span>
                                  Custom domain for GitHub Pages <em>optional</em>
                                </span>
                                <input
                                  type="text"
                                  value={form.domain ?? ""}
                                  onChange={(e) => patchForm({ domain: e.target.value })}
                                  placeholder="www.example.com"
                                />
                              </label>
                            )}
                            <label className="fld check">
                              <input
                                type="checkbox"
                                checked={!!form.private}
                                onChange={(e) => patchForm({ private: e.target.checked })}
                              />
                              <span>Private repository</span>
                            </label>
                          </div>
                          <div className="sheet-foot">
                            <button
                              type="submit"
                              className="btn btn-primary btn-sm"
                              disabled={busy === "repo" || !form.template}
                            >
                              {busy === "repo" ? "Creating…" : "Create repository"}
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={close}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : panel && panel.instance === inst.id && panel.kind === "link" ? (
                        <form
                          className="sheet nested"
                          onSubmit={(e) => {
                            e.preventDefault();
                            linkRepo();
                          }}
                        >
                          <div className="sheet-head">
                            <h3>Link a repository to {inst.name}</h3>
                            <span className="txt-hint">
                              its <code>PB_VB_URL</code> Actions variable is set to <code>{host(inst.url)}</code>; nothing
                              else changes
                            </span>
                          </div>
                          <div className="flds">
                            <label className="fld wide">
                              <span>Repository</span>
                              <input
                                type="text"
                                value={form.fullName ?? ""}
                                onChange={(e) => patchForm({ fullName: e.target.value })}
                                placeholder="owner/name or https://github.com/owner/name"
                                required
                              />
                            </label>
                          </div>
                          <div className="sheet-foot">
                            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === "link"}>
                              {busy === "link" ? "Linking…" : "Link repository"}
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={close}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </>
                  )}
                </li>
              );
            })}

            {orphans.length > 0 && (
              <li className="node orphan">
                <div className="node-head">
                  <span className="dot" />
                  <div className="node-title">
                    <span className="name">Instance no longer here</span>
                  </div>
                  <div className="node-meta">
                    <span>these repositories point at an instance that was deleted</span>
                  </div>
                </div>
                <ul className="branches">
                  {orphans.map((repo) => (
                    <li key={repo.id} className="branch wired-gone">
                      <span className="joint" />
                      <div className="branch-title">
                        <a className="name" href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
                          {repo.fullName}
                        </a>
                      </div>
                      <div className="branch-meta">
                        <span className="wired">PB_VB_URL still {repo.live?.backendUrl || "unknown"}</span>
                      </div>
                      <div className="branch-actions">
                        {repo.canUnlink && (
                          <button type="button" className="btn btn-xs btn-secondary" onClick={() => unlinkRepo(repo)}>
                            Unlink
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>

          {logs.length > 0 && (
            <details className="cloud-log" open>
              <summary>Log</summary>
              <pre>{logs.join("\n")}</pre>
            </details>
          )}
        </>
      )}
    </div>
  );
}
