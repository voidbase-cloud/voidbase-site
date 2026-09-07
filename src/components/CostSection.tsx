// "What it costs", the section every comparison page ends with. One component, one product id: the page says which
// rival to price against and this does the rest, so the interface is built once rather than six times.
import { useMemo, useState } from "react";
import ProductMark from "@/components/ProductMark";
import { ASSUME, OUR_SOURCES, RIVALS, voidbaseCost, type Estimate, type Usage } from "@/lib/costModel";

const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n) >= 1000 ? Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }) : Math.abs(n).toFixed(2)}`;

const big = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));

const STEPS = {
  reads: [100_000, 1_000_000, 5_000_000, 20_000_000, 100_000_000, 500_000_000],
  writes: [10_000, 100_000, 1_000_000, 10_000_000, 50_000_000],
  storage: [1, 10, 50, 200, 1000, 5000],
  realtime: [0, 100, 1000, 10_000, 100_000],
  mau: [1000, 10_000, 100_000, 1_000_000],
};
type Index = { reads: number; writes: number; storage: number; realtime: number; mau: number };

// three shapes of app, so the first thing anyone does is not drag five sliders
const PRESETS: { name: string; at: Index }[] = [
  { name: "Side project", at: { reads: 1, writes: 1, storage: 1, realtime: 1, mau: 1 } },
  { name: "Growing startup", at: { reads: 3, writes: 2, storage: 2, realtime: 2, mau: 2 } },
  { name: "A million users", at: { reads: 4, writes: 3, storage: 4, realtime: 3, mau: 3 } },
];

const SEGMENTS = ["var(--successColor)", "#6da7ec", "var(--warningColor)", "#c46bf0", "#f06a50", "#22b8cf", "#8b8b9e"];

function Slider({ label, steps, index, onChange, format }: {
  label: string; steps: number[]; index: number; onChange: (i: number) => void; format: (n: number) => string;
}) {
  return (
    <label className="cost-slider">
      <span className="cost-slider-label">
        {label}
        <b>{format(steps[index]!)}</b>
      </span>
      <input type="range" min={0} max={steps.length - 1} step={1} value={index} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Card({ title, mark, sub, estimate, compare, stacked }: {
  title: string; mark?: string; sub: string; estimate: Estimate; compare?: number; stacked?: boolean;
}) {
  const ratio = compare && compare > 0 ? estimate.total / compare : null;
  const paid = estimate.lines.filter((l) => l.amount > 0);
  const sum = paid.reduce((a, l) => a + l.amount, 0) || 1;
  return (
    <div className="cost-card">
      <p className="cost-card-title">{mark && <ProductMark id={mark} size={18} />}{title}</p>
      <p className="cost-total">{money(estimate.total)}<small>/month</small></p>
      <p className="cost-card-sub">{sub}</p>
      {ratio && ratio > 1.05 && <p className="cost-ratio">{ratio.toFixed(1)}× the voidbase bill</p>}
      {ratio && ratio < 0.95 && <p className="cost-ratio is-cheaper">{(1 / ratio).toFixed(1)}× cheaper than voidbase</p>}
      {stacked && (
        <div className="cost-stack" aria-hidden="true">
          {paid.map((l, n) => (
            <i key={l.label} style={{ width: `${(l.amount / sum) * 100}%`, background: SEGMENTS[n % SEGMENTS.length] }} />
          ))}
        </div>
      )}
      <dl className="cost-lines">
        {estimate.lines.map((l, n) => (
          <div key={l.label}>
            <dt>
              {stacked && l.amount > 0 && (
                <span className="cost-dot" style={{ background: SEGMENTS[paid.indexOf(l) % SEGMENTS.length] }} />
              )}
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

export default function CostSection({ product }: { product: string }) {
  const rival = RIVALS[product];
  const [i, setI] = useState<Index>(PRESETS[1]!.at);
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
  const ours = useMemo(() => voidbaseCost(usage), [usage]);
  const theirs = useMemo(() => (rival?.estimate ? rival.estimate(usage) : null), [rival, usage]);
  if (!rival) return null;
  const activePreset = PRESETS.findIndex((p) => JSON.stringify(p.at) === JSON.stringify(i));

  return (
    <>
      <h2 id="cost">What it costs</h2>
      <p>
        Move the sliders to your own traffic. Both columns are computed from published list prices, and every
        assumption behind them is in the panel at the bottom of this section.
      </p>

      <div className="cost-presets">
        {PRESETS.map((p, n) => (
          <button key={p.name} type="button" className={`cost-preset${n === activePreset ? " active" : ""}`} onClick={() => setI(p.at)}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="cost-panel">
        <Slider label="Reads / month" steps={STEPS.reads} index={i.reads} onChange={(v) => setI({ ...i, reads: v })} format={big} />
        <Slider label="Writes / month" steps={STEPS.writes} index={i.writes} onChange={(v) => setI({ ...i, writes: v })} format={big} />
        <Slider label="Stored files" steps={STEPS.storage} index={i.storage} onChange={(v) => setI({ ...i, storage: v })} format={(n) => `${big(n)} GB`} />
        <Slider label="Peak realtime connections" steps={STEPS.realtime} index={i.realtime} onChange={(v) => setI({ ...i, realtime: v })} format={big} />
        <Slider label="Monthly active users" steps={STEPS.mau} index={i.mau} onChange={(v) => setI({ ...i, mau: v })} format={big} />
      </div>

      <div className="cost-cards">
        <Card title="voidbase, on your own Cloudflare account" mark="voidbase" sub="Workers Paid, D1, R2, Durable Objects" estimate={ours} stacked />
        {theirs ? (
          <Card title={`The same app on ${rival.name}`} mark={product} sub={rival.plan} estimate={theirs} compare={ours.total} />
        ) : (
          <div className="cost-card is-unpriced">
            <p className="cost-card-title"><ProductMark id={product} size={18} />The same app on {rival.name}</p>
            <p className="cost-total">not priced <small>on this page</small></p>
            <p className="cost-caveat">{rival.why}</p>
          </div>
        )}
      </div>

      <details className="cost-assumptions">
        <summary>Model assumptions and sources</summary>
        <p>
          An estimate whose assumptions are hidden is an advertisement. This one assumes each API read or write is
          one Worker request; a read touches about {ASSUME.rowsPerRead} SQLite rows with a relation expanded and a
          write about {ASSUME.rowsPerWrite}; a request costs about {ASSUME.cpuMsPerRequest}ms of CPU, measured on
          this site's own instance; each realtime connection receives about {ASSUME.pushesPerConnectionPerDay} pushed
          updates a day; and a response is about {ASSUME.kbPerResponse}KB where a plan bills bandwidth. A WebSocket
          connection is billed as one request and the messages over it are not, and a hibernating connection bills no
          compute. Monthly active users are an authentication headcount: voidbase has no per-user charge at all,
          because signing in is an ordinary request.
        </p>
        <p>
          Rates as of 8 September 2026, from{" "}
          {OUR_SOURCES.map((s, n) => (
            <span key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a>
              {n < OUR_SOURCES.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          and <a href={rival.source.href} target="_blank" rel="noreferrer noopener">{rival.source.label}</a>. Both
          columns are estimates. Measure before you commit either way, and tell us if a number here is wrong.
        </p>
      </details>
    </>
  );
}
