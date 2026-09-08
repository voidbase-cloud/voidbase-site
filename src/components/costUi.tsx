// The parts every cost calculator on this site is made of.
//
// There are two of them and they answer different questions. A comparison page asks which of two bills is bigger,
// so it shows two cards. The pricing page asks when a bill starts at all, so it shows one and the free-plan
// allowances beside it. What they share is the way you tell them what your app does: the same three presets, the
// same five sliders, the same itemised card. That part is built once here.
import ProductMark from "@/components/ProductMark";
import type { Estimate } from "@/lib/costModel";
import "@/scss/cost.scss";

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n) >= 1000 ? Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }) : Math.abs(n).toFixed(2)}`;

export const big = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));

export const STEPS = {
  reads: [100_000, 1_000_000, 5_000_000, 20_000_000, 100_000_000, 500_000_000],
  writes: [10_000, 100_000, 1_000_000, 10_000_000, 50_000_000],
  storage: [1, 10, 50, 200, 1000, 5000],
  realtime: [0, 100, 1000, 10_000, 100_000],
  mau: [1000, 10_000, 100_000, 1_000_000],
};
export type Index = { reads: number; writes: number; storage: number; realtime: number; mau: number };

// three shapes of app, so the first thing anyone does is not drag five sliders
export const PRESETS: { name: string; at: Index }[] = [
  { name: "Side project", at: { reads: 1, writes: 1, storage: 1, realtime: 1, mau: 1 } },
  { name: "Growing startup", at: { reads: 3, writes: 2, storage: 2, realtime: 2, mau: 2 } },
  { name: "A million users", at: { reads: 4, writes: 3, storage: 4, realtime: 3, mau: 3 } },
];

export const SEGMENTS = ["var(--successColor)", "#6da7ec", "var(--warningColor)", "#c46bf0", "#f06a50", "#22b8cf", "#8b8b9e"];

export function Presets({ index, onPick }: { index: Index; onPick: (at: Index) => void }) {
  const active = PRESETS.findIndex((p) => JSON.stringify(p.at) === JSON.stringify(index));
  return (
    <div className="cost-presets">
      {PRESETS.map((p, n) => (
        <button key={p.name} type="button" className={`cost-preset${n === active ? " active" : ""}`} onClick={() => onPick(p.at)}>
          {p.name}
        </button>
      ))}
    </div>
  );
}

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

export function Sliders({ index, onChange, showMau = true }: { index: Index; onChange: (i: Index) => void; showMau?: boolean }) {
  return (
    <div className="cost-panel">
      <Slider label="Reads / month" steps={STEPS.reads} index={index.reads} onChange={(v) => onChange({ ...index, reads: v })} format={big} />
      <Slider label="Writes / month" steps={STEPS.writes} index={index.writes} onChange={(v) => onChange({ ...index, writes: v })} format={big} />
      <Slider label="Stored files" steps={STEPS.storage} index={index.storage} onChange={(v) => onChange({ ...index, storage: v })} format={(n) => `${big(n)} GB`} />
      <Slider label="Peak realtime connections" steps={STEPS.realtime} index={index.realtime} onChange={(v) => onChange({ ...index, realtime: v })} format={big} />
      {/* the pricing page leaves this out: Cloudflare has no per-user charge, so the slider would move nothing */}
      {showMau && <Slider label="Monthly active users" steps={STEPS.mau} index={index.mau} onChange={(v) => onChange({ ...index, mau: v })} format={big} />}
    </div>
  );
}

export function Card({ title, mark, sub, estimate, compare, stacked }: {
  title: string; mark?: string; sub: string; estimate: Estimate; compare?: number; stacked?: boolean;
}) {
  // a multiple of zero says nothing, so a rival priced against a free voidbase says the plain thing instead
  const ratio = compare && compare > 0 ? estimate.total / compare : null;
  const freeAgainst = compare === 0 && estimate.total > 0;
  const paid = estimate.lines.filter((l) => l.amount > 0);
  const sum = paid.reduce((a, l) => a + l.amount, 0) || 1;
  return (
    <div className="cost-card">
      <p className="cost-card-title">{mark && <ProductMark id={mark} size={18} />}{title}</p>
      <p className="cost-total">{money(estimate.total)}<small>/month</small></p>
      <p className="cost-card-sub">{sub}</p>
      {ratio && ratio > 1.05 && <p className="cost-ratio">{ratio.toFixed(1)}× the voidbase bill</p>}
      {ratio && ratio < 0.95 && <p className="cost-ratio is-cheaper">{(1 / ratio).toFixed(1)}× cheaper than voidbase</p>}
      {freeAgainst && <p className="cost-ratio">voidbase is free at this size</p>}
      {stacked && (
        <div className="cost-stack" aria-hidden="true">
          {paid.map((l, n) => (
            <i key={l.label} style={{ width: `${(l.amount / sum) * 100}%`, background: SEGMENTS[n % SEGMENTS.length] }} />
          ))}
        </div>
      )}
      <dl className="cost-lines">
        {estimate.lines.map((l) => (
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
