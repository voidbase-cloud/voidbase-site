// "What it costs", the section every comparison page ends with. One component, one product id: the page says which
// rival to price against and this does the rest, so the interface is built once rather than six times. The presets,
// the sliders and the card are shared with the pricing page's calculator and live in costUi.tsx.
import { useMemo, useState } from "react";
import { Link } from "@void/react";
import ProductMark from "@/components/ProductMark";
import { Card, PRESETS, Presets, Sliders, STEPS, type Index } from "@/components/costUi";
import { ASSUME, CF_FREE, OUR_SOURCES, RIVALS, voidbaseCost, type Usage } from "@/lib/costModel";

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
  return (
    <>
      <h2 id="cost">What it costs</h2>
      <p>
        Move the sliders to your own traffic. Both columns are computed from published list prices, and every
        assumption behind them is in the panel at the bottom of this section.
      </p>

      <Presets index={i} onPick={setI} />
      <Sliders index={i} onChange={setI} />

      <div className="cost-cards">
        <Card
          title="voidbase, on your own Cloudflare account"
          mark="voidbase"
          sub={`${ours.total === 0 ? "Workers Free" : "Workers Paid"}, D1, R2, Durable Objects`}
          estimate={ours}
          stacked
        />
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
          The $5 Workers Paid minimum is not a floor. An app inside Cloudflare's free allowances costs nothing at
          all, and the column says $0 when it is: {CF_FREE.requestsPerDay.toLocaleString("en-US")} Worker requests a
          day, {(CF_FREE.d1RowsReadPerDay / 1_000_000).toFixed(0)}M rows read and{" "}
          {CF_FREE.d1RowsWrittenPerDay.toLocaleString("en-US")} written,{" "}
          {CF_FREE.doRequestsPerDay.toLocaleString("en-US")} durable object requests, {CF_FREE.d1StorageGb}GB of
          database and {CF_FREE.r2StorageGb}GB of files. The first of those to run out moves the account to Workers
          Paid, and the whole bill starts there.{" "}
          <Link href="/docs/pricing#calculator">The pricing page</Link> draws how much room is left in each.
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
