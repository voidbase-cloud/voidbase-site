// The cloud control plane: sign in with Cloudflare, list the visitor's instances, create and delete them, connect
// GitHub, and create or link the repositories wired to an instance; then the life of one: its plugins, logs,
// metrics, backups and superusers through the instance itself, its domains and secrets through the Cloudflare
// pass-through; and the sign-in's own token as a CLI login, for the same session. Ported from the SvelteKit page
// at src/routes/(app)/cloud/+page.svelte.
import { useEffect, useMemo, useRef, useState } from "react";
import CloudflareSignIn from "@/components/CloudflareSignIn";
import { CopyButton } from "@/components/CodeBlock";
import { cloud, errorMessage, vb, VB_URL } from "@/lib/vb";
import { CloudClient, LOG_LEVELS, type Backup, type CustomDomain, type LogPage, type Metrics, type Superuser, type WorkerSecret, type Zone } from "@/lib/cloud";

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

/**
 * The plugins of one instance, through the instance's own installer (voidbase's `installer` plugin). On a
 * project instance a change is a commit its repository's build deploys; on one built without a repository the
 * instance says so.
 */
function PluginsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [running, setRunning] = useState<Awaited<ReturnType<ReturnType<CloudClient["plugins"]>["running"]>> | null>(null);
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

/** the instance's own logs: the last entries, newest first, and a filter in PocketBase's syntax */
function LogsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState<LogPage | null>(null);
  const [stats, setStats] = useState<{ total: number; date: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const api = client.logs(inst, session);
  async function refresh(f = filter) {
    setLoading(true); setError("");
    try { const [p, s] = await Promise.all([api.list({ filter: f, perPage: 50 }), api.stats(f)]); setPage(p); setStats(s); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = stats.reduce((n, s) => n + (s.total || 0), 0);
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); refresh(); }}>
        <input type="text" placeholder={'filter, e.g. level >= 4 || data.status >= 500'} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button type="submit" className="btn btn-xs btn-secondary" disabled={loading}>{loading ? "Reading…" : "Filter"}</button>
        <button type="button" className="btn btn-xs btn-outline" disabled={loading} onClick={() => refresh()}>Refresh</button>
      </form>
      {page && (
        <p className="txt-hint">
          {page.totalItems} {page.totalItems === 1 ? "entry" : "entries"}{stats.length ? <> over {stats.length} {stats.length === 1 ? "hour" : "hours"} ({total} in the stats)</> : null}; showing the last {page.items.length}.
        </p>
      )}
      <ul className="tool-logs">
        {page?.items.map((l) => (
          <li key={l.id} className={`log-level-${LOG_LEVELS[l.level] ?? "other"}`}>
            <span className="log-when">{l.created.replace(/\.\d+Z?$/, "").replace("T", " ")}</span>
            <span className="label label-sm">{LOG_LEVELS[l.level] ?? l.level}</span>
            <span className="log-message" title={l.data ? JSON.stringify(l.data) : undefined}>{l.message}</span>
          </li>
        ))}
        {page && !page.items.length && <li className="txt-hint">nothing logged{filter ? " for that filter" : " yet"}</li>}
      </ul>
    </>
  );
}

/** the hour a stats bucket stands for, as "HH:00" UTC */
const hourOf = (date: string) => `${date.slice(11, 13)}:00`;
const sizeOf = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`);

/**
 * Requests and errors over the last 24 hours, from the instance's own logs: one bar per hour with traffic,
 * the errors drawn over the requests in the second colour, and the totals as text. Inline SVG; no library.
 */
function MetricsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true); setError("");
    try { setMetrics(await client.metrics(inst, session)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  const hours = metrics?.hours ?? [];
  const max = Math.max(1, ...hours.map((h) => h.total));
  const BAR = 10, GAP = 3, H = 48, TOP = 4, BASE = H - 12;
  const width = Math.max(1, hours.length) * (BAR + GAP) - GAP;
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {metrics && (
        <p className="txt-hint">
          <strong>{metrics.totals.requests}</strong> {metrics.totals.requests === 1 ? "request" : "requests"} and <strong>{metrics.totals.errors}</strong> {metrics.totals.errors === 1 ? "error" : "errors"} in the last 24 hours{hours.length ? <>, over {hours.length} {hours.length === 1 ? "hour" : "hours"} with traffic (UTC)</> : null}.
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

/**
 * The instance's backups: the archives in its storage, one taken on demand, downloaded through a file token in a
 * new tab, deleted, or restored, which replaces the instance's data and restarts it.
 */
function BackupsPanel({ inst, client, session }: { inst: Instance; client: CloudClient; session: string }) {
  const [list, setList] = useState<Backup[] | null>(null);
  const [name, setName] = useState("");
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
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      {notice && <p className="txt-hint">{notice}</p>}
      <p className="txt-hint">Archives in the instance's own storage: its collections, rows and files. A restore replaces all of them with the archive's and restarts the instance.</p>
      <ul>
        {list?.map((b) => (
          <li key={b.key}>
            <code>{b.key}</code> <span className="txt-hint">{sizeOf(b.size)} · {b.modified.replace(/\.\d+Z?$/, "")}</span>{" "}
            <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => download(b.key)}>Download</button>{" "}
            <button type="button" className="btn btn-xs btn-outline" disabled={!!working} onClick={() => { if (confirm(`Restore ${b.key} on ${inst.name}?\n\nEverything on the instance is replaced by what the archive holds (collections, rows and files), and the instance restarts. What is on it now is lost unless it is in another backup.`)) act("restore:" + b.key, async () => { await api.restore(b.key); return `Restoring ${b.key}; the instance restarts with it.`; }); }}>{working === "restore:" + b.key ? "Restoring…" : "Restore"}</button>{" "}
            <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => { if (confirm(`Delete the backup ${b.key}?`)) act("remove:" + b.key, () => api.remove(b.key)); }}>{working === "remove:" + b.key ? "Deleting…" : "Delete"}</button>
          </li>
        ))}
        {list && !list.length && <li className="txt-hint">no backups yet</li>}
      </ul>
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); act("create", async () => { const r = await api.create(name); setName(""); return r.name ? `Backup ${r.name} taken.` : "Backup taken."; }); }}>
        <input type="text" placeholder="name (optional): nightly.zip" value={name} onChange={(e) => setName(e.target.value)} pattern="[A-Za-z0-9_-]+(\.zip)?" />
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

/** the instance's custom domains: hostnames on the account's zones, put on the Worker through Cloudflare */
function DomainsPanel({ inst, client }: { inst: Instance; client: CloudClient }) {
  const [list, setList] = useState<CustomDomain[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({ hostname: "", zone: "" });
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const api = useMemo(() => client.domains(inst), [client, inst]);
  const refresh = () => Promise.all([api.list(), api.zones()]).then(([d, z]) => { setList(d); setZones(z); }).catch((err) => setError(errorMessage(err)));
  useEffect(() => { refresh(); }, [inst.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(step: string, fn: () => Promise<unknown>) {
    setWorking(step); setError("");
    try { await fn(); await refresh(); } catch (err) { setError(errorMessage(err)); } finally { setWorking(""); }
  }
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  return (
    <>
      {error && <p className="node-error">{error}</p>}
      <p className="txt-hint">A hostname on one of the account's zones, pointed at the Worker: Cloudflare adds the DNS record and the certificate.</p>
      <ul>
        {list.map((d) => (
          <li key={d.id}>
            <a href={`https://${d.hostname}`} target="_blank" rel="noopener noreferrer">{d.hostname}</a> <span className="txt-hint">{zoneName(d.zone_id)}</span>{" "}
            <button type="button" className="btn btn-xs btn-secondary btn-danger" disabled={!!working} onClick={() => { if (confirm(`Detach ${d.hostname} from ${inst.name}?`)) act("detach:" + d.id, () => api.detach(d.id)); }}>{working === "detach:" + d.id ? "Detaching…" : "Detach"}</button>
          </li>
        ))}
        {!list.length && <li className="txt-hint">no custom domain; the Worker answers on {host(inst.url)}</li>}
      </ul>
      <form className="tool-row" onSubmit={(e) => { e.preventDefault(); act("attach", async () => { await api.attach(form.hostname, form.zone); setForm({ hostname: "", zone: "" }); }); }}>
        <input type="text" placeholder="api.example.com" value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} required />
        <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
          <option value="">zone: from the hostname</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <button type="submit" className="btn btn-xs btn-secondary" disabled={!!working}>{working === "attach" ? "Attaching…" : "Attach"}</button>
      </form>
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
 * What the owner does to an instance after it exists: plugins, logs, metrics, backups and superusers through the
 * instance itself, with one session minted on it and shared by those panels; domains and secrets on its Worker
 * through the Cloudflare pass-through, with the user's own token. This site holds nothing of any of it.
 */
function InstancePanels({ inst, client }: { inst: Instance; client: CloudClient }) {
  const [open, setOpen] = useState("");
  const [session, setSession] = useState("");
  const onInstance = (body: (s: string) => React.ReactNode) => (session ? body(session) : <InstanceSignIn inst={inst} client={client} onSession={setSession} />);
  return (
    <div className="node-tools">
      <Collapsible id="plugins" label="Plugins" open={open} setOpen={setOpen}>{onInstance((s) => <PluginsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="logs" label="Logs" open={open} setOpen={setOpen}>{onInstance((s) => <LogsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="metrics" label="Metrics" open={open} setOpen={setOpen}>{onInstance((s) => <MetricsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="backups" label="Backups" open={open} setOpen={setOpen}>{onInstance((s) => <BackupsPanel inst={inst} client={client} session={s} />)}</Collapsible>
      <Collapsible id="superusers" label="Superusers" open={open} setOpen={setOpen}>{onInstance((s) => <SuperusersPanel inst={inst} client={client} session={s} />)}</Collapsible>
      {!inst.system && (
        <>
          <Collapsible id="domains" label="Domains" open={open} setOpen={setOpen}><DomainsPanel inst={inst} client={client} /></Collapsible>
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
                  {!me?.user?.superuser && inst.status === "live" && (
                    <InstancePanels inst={inst} client={client} />
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
