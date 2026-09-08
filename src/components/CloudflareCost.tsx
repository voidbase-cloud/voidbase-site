// "So what would Cloudflare charge you?", on the pricing page.
//
// The comparison pages ask which of two bills is bigger. This page has already said the price is nothing, so the
// only honest follow-up is the one it raises and used to leave hanging: you might still get a bill, and it will not
// be ours. When does that bill start, and what starts it?
//
// So the answer here leads with the free plan rather than the rate card. Every allowance Cloudflare gives away is
// drawn as how much of it this app uses, which makes the moment of crossing visible before it happens and names the
// thing that crosses first. The itemised bill underneath is what happens after.
import { useMemo, useState } from "react";
import { Card, PRESETS, Presets, Sliders, STEPS, type Index } from "@/components/costUi";
import { ASSUME, CF_FREE, freePlan, OUR_SOURCES, voidbaseCost, type Usage } from "@/lib/costModel";

const num = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  : n >= 10 ? n.toFixed(0)
  : n.toFixed(1);

export default function CloudflareCost() {
  const [i, setI] = useState<Index>(PRESETS[0]!.at);
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
  const bill = useMemo(() => voidbaseCost(usage), [usage]);
  const { fits, allowances } = useMemo(() => freePlan(usage), [usage]);
  // whichever allowance is nearest its limit is the one that decides, so it is the one worth naming
  const tightest = allowances.reduce((a, b) => (b.used / b.allowed > a.used / a.allowed ? b : a));

  return (
    <>
      <h2 id="calculator">So what would Cloudflare charge you?</h2>
      <p className="pricing-lead">
        Their rates, not ours, on an app the size you say. Nothing on this page is billed by us at any setting.
      </p>

      <Presets index={i} onPick={setI} />
      {/* no monthly-active-users slider here: Cloudflare has no per-user charge, so it would move nothing */}
      <Sliders index={i} onChange={setI} showMau={false} />

      <div className={`cf-verdict${fits ? " is-free" : ""}`}>
        <p className="cf-verdict-total">
          {`$${bill.total.toFixed(2).replace(/\.00$/, "")}`}
          <small>/month</small>
        </p>
        <p className="cf-verdict-say">
          {fits ? (
            <>
              An app this size fits inside Cloudflare's free plan, so it costs nothing.{" "}
              {tightest.used / tightest.allowed >= 0.9 ? (
                <>
                  It is on the edge of one, though: <strong>{tightest.label.toLowerCase()}</strong>, at{" "}
                  {Math.round((tightest.used / tightest.allowed) * 100)}% of the allowance.
                </>
              ) : (
                <>
                  The allowance with least room left is <strong>{tightest.label.toLowerCase()}</strong>, at{" "}
                  {Math.round((tightest.used / tightest.allowed) * 100)}% of it.
                </>
              )}
            </>
          ) : (
            <>
              This app is past the free plan, so the account is on Workers Paid: a $5 minimum and the lines below.
              voidbase's share of it is <strong>$0</strong>.
            </>
          )}
        </p>
      </div>

      <h3>What Cloudflare gives away</h3>
      <ul className="cf-allowances">
        {allowances.map((a) => {
          const share = Math.min(1, a.used / a.allowed);
          const over = a.used > a.allowed;
          return (
            <li key={a.label} className={over ? "is-over" : ""}>
              <span className="cf-allowance-label">{a.label}</span>
              <span className="cf-allowance-bar" role="img" aria-label={`${Math.round((a.used / a.allowed) * 100)} percent of the allowance`}>
                <i style={{ width: `${share * 100}%` }} />
              </span>
              <span className="cf-allowance-num">
                {num(a.used)}{a.unit} <em>of {num(a.allowed)}{a.unit} {a.per}</em>
              </span>
            </li>
          );
        })}
      </ul>

      <h3>{fits ? "What it would be itemised as" : "The bill, once you are past it"}</h3>
      <div className="cost-cards is-single">
        <Card
          title="Your Cloudflare account"
          mark="cloudflare"
          sub="Workers Paid, D1, R2, Durable Objects"
          estimate={bill}
          stacked
        />
      </div>

      <details className="cost-assumptions">
        <summary>Model assumptions and sources</summary>
        <p>
          An estimate whose assumptions are hidden is an advertisement. This one assumes each API read or write is
          one Worker request; a read touches about {ASSUME.rowsPerRead} SQLite rows with a relation expanded and a
          write about {ASSUME.rowsPerWrite}; a request costs about {ASSUME.cpuMsPerRequest}ms of CPU, measured on
          this site's own instance; and each realtime connection receives about{" "}
          {ASSUME.pushesPerConnectionPerDay} pushed updates a day. A WebSocket connection is billed as one request
          and the messages over it are not, and a hibernating connection bills no compute.
        </p>
        <p>
          The free allowances are daily where Cloudflare resets them daily, which is why a monthly figure is divided
          by thirty before it is compared: {CF_FREE.requestsPerDay.toLocaleString("en-US")} Worker requests a day,{" "}
          {(CF_FREE.d1RowsReadPerDay / 1_000_000).toFixed(0)}M rows read and{" "}
          {CF_FREE.d1RowsWrittenPerDay.toLocaleString("en-US")} written,{" "}
          {CF_FREE.doRequestsPerDay.toLocaleString("en-US")} durable object requests,{" "}
          {CF_FREE.d1StorageGb}GB of database and {CF_FREE.r2StorageGb}GB of files. Crossing one of them moves the
          account to Workers Paid, not just that one service.
        </p>
        <p>
          Rates and allowances as of 8 September 2026, from{" "}
          {OUR_SOURCES.map((s, n) => (
            <span key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a>
              {n < OUR_SOURCES.length - 1 ? ", " : ""}
            </span>
          ))}
          . It is an estimate. Measure before you commit, and tell us if a number here is wrong.
        </p>
      </details>
    </>
  );
}
