// The cost comparison, with the sliders that produce it and the assumptions that produce those.
import { useMemo, useState } from "react";
import { cloudflareCost, supabaseCost, SOURCES, ASSUME, type Estimate, type Usage } from "@/lib/costModel";
import "@/scss/why.scss";

const money = (n: number) =>
  n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$${n.toFixed(2)}`;

const STEPS = {
  reads: [100_000, 1_000_000, 5_000_000, 20_000_000, 100_000_000, 500_000_000],
  writes: [10_000, 100_000, 1_000_000, 10_000_000, 50_000_000],
  storage: [1, 10, 50, 200, 1000, 5000],
  realtime: [0, 100, 1000, 10_000, 100_000],
  mau: [1000, 10_000, 100_000, 1_000_000],
};

const big = (n: number) =>
  n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n);

function Slider({
  label,
  steps,
  index,
  onChange,
  format,
}: {
  label: string;
  steps: number[];
  index: number;
  onChange: (i: number) => void;
  format: (n: number) => string;
}) {
  return (
    <label className="cost-slider">
      <span className="cost-slider-label">
        {label}
        <b>{format(steps[index]!)}</b>
      </span>
      <input
        type="range"
        min={0}
        max={steps.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Card({ title, sub, estimate, compare }: { title: string; sub: string; estimate: Estimate; compare?: number }) {
  const ratio = compare && compare > 0 ? estimate.total / compare : null;
  return (
    <div className="cost-card">
      <p className="cost-card-title">{title}</p>
      <p className="cost-total">
        {money(estimate.total)}
        <small>/month</small>
      </p>
      <p className="cost-card-sub">{sub}</p>
      {ratio && ratio > 1.05 && <p className="cost-ratio">{ratio.toFixed(1)}× the Cloudflare bill</p>}
      <dl className="cost-lines">
        {estimate.lines.map((l) => (
          <div key={l.label}>
            <dt>
              {l.label}
              {l.detail && <span>{l.detail}</span>}
            </dt>
            <dd>{money(l.amount)}</dd>
          </div>
        ))}
      </dl>
      <p className="cost-caveat">{estimate.caveat}</p>
    </div>
  );
}

export default function DocsCost() {
  const [i, setI] = useState({ reads: 3, writes: 3, storage: 3, realtime: 2, mau: 2 });
  const usage: Usage = useMemo(
    () => ({
      reads: STEPS.reads[i.reads]!,
      writes: STEPS.writes[i.writes]!,
      storage: STEPS.storage[i.storage]!,
      realtime: STEPS.realtime[i.realtime]!,
      mau: STEPS.mau[i.mau]!,
    }),
    [i],
  );
  const cf = useMemo(() => cloudflareCost(usage), [usage]);
  const sb = useMemo(() => supabaseCost(usage), [usage]);

  return (
    <article className="why">
      <span className="why-eyebrow">The bill</span>
      <h1>What it costs, against the alternative</h1>
      <p className="docs-lead">
        Move the sliders to your own traffic. Both columns are computed from published list prices, and every
        assumption that turns "an app" into "this many billable operations" is written underneath.
      </p>

      <div className="cost-panel">
        <Slider label="Reads / month" steps={STEPS.reads} index={i.reads} onChange={(v) => setI({ ...i, reads: v })} format={big} />
        <Slider label="Writes / month" steps={STEPS.writes} index={i.writes} onChange={(v) => setI({ ...i, writes: v })} format={big} />
        <Slider label="Stored files" steps={STEPS.storage} index={i.storage} onChange={(v) => setI({ ...i, storage: v })} format={(n) => `${big(n)} GB`} />
        <Slider label="Peak realtime connections" steps={STEPS.realtime} index={i.realtime} onChange={(v) => setI({ ...i, realtime: v })} format={big} />
        <Slider label="Monthly active users" steps={STEPS.mau} index={i.mau} onChange={(v) => setI({ ...i, mau: v })} format={big} />
      </div>

      <div className="cost-cards">
        <Card title="voidbase, on your own Cloudflare account" sub="Workers Paid, D1, R2, Durable Objects" estimate={cf} />
        <Card title="The same app on Supabase Pro" sub="one project, hosted" estimate={sb} compare={cf.total} />
      </div>

      <h2>Where the difference comes from</h2>
      <p>
        Two structural things, and neither is a discount. Cloudflare bills per request and per millisecond of CPU,
        so an idle instance bills the account minimum and nothing else, while a hosted database bills for the
        instance whether or not anyone visits. And there is no charge per user: signing in is an ordinary request, so
        a million monthly actives cost the same as a thousand doing the same amount of work.
      </p>
      <p>
        Reading files back out is free on R2, which is the line that surprises people migrating something
        media-heavy. Egress is usually the bill nobody modelled.
      </p>

      <h2>What the model assumes</h2>
      <p>
        An estimate whose assumptions are hidden is an advertisement, so here they are. Each API read or write is one
        Worker request. A read touches about {ASSUME.rowsPerRead} SQLite rows with a relation expanded, a write about{" "}
        {ASSUME.rowsPerWrite}. A request costs about {ASSUME.cpuMsPerRequest}ms of CPU, measured on this site's own
        instance. Each realtime connection receives about {ASSUME.pushesPerConnectionPerDay} pushed updates a day. A
        WebSocket connection is billed as one request and the messages over it are not, and a hibernating connection
        bills no compute.
      </p>
      <p>
        On the Supabase side the model is deliberately generous: reads and writes are not billed per operation there,
        so all that API traffic costs nothing in the column above. What it really costs is compute, and sustained
        load means a bigger instance than the Pro base includes. That upgrade is not modelled, so a busy app's real
        Supabase bill is higher than the number shown.
      </p>

      <h2>Why Firebase is not here</h2>
      <p>
        Because we could not read Firestore's per-operation rates off Google's own pricing page when this was built,
        and putting a competitor's prices on a public page from memory is not a thing worth doing. The free tier is
        documented and generous, 50,000 reads and 20,000 writes a day. The paid rates are the ones that decide a
        comparison, and they will appear here when they can be quoted from the source rather than recalled.
      </p>

      <h2>Sources</h2>
      <p>
        List prices as of 8 September 2026, from{" "}
        {SOURCES.map((s, n) => (
          <span key={s.href}>
            <a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a>
            {n < SOURCES.length - 1 ? ", " : ""}
          </span>
        ))}
        . Both columns are estimates. Measure before you commit either way, and tell us if a number here is wrong.
      </p>
    </article>
  );
}
