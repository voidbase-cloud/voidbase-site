// "And what about speed", the section under the cost one. Same deal: one component, one product id.
//
// Everything it renders is guesswork and it says so first, in the loudest box on the page. It exists to give a
// rough shape of the trade and to provoke someone who benchmarks for a living into correcting us.
import { useMemo, useState } from "react";
import { BELIEF, edgeGuess, machineGuess, regionGuess, type Guess, type Shape } from "@/lib/perfModel";
import { RIVALS } from "@/lib/costModel";

const DISTANCES = [
  { label: "Same city", ms: 10 },
  { label: "Same country", ms: 40 },
  { label: "Across an ocean", ms: 120 },
  { label: "Other side of the world", ms: 250 },
];
const RPS = [10, 100, 800, 3000, 10_000];
const SUBSCRIBERS = [0, 1000, 10_000, 100_000, 1_000_000];

// the same three shapes the cost section uses, so the two sections answer for the same app
const SIZES: { name: string; at: Shape }[] = [
  { name: "Side project", at: { distanceMs: 120, queries: 2, rps: 10, subscribers: 0, cold: true } },
  { name: "Growing startup", at: { distanceMs: 120, queries: 2, rps: 100, subscribers: 1000, cold: false } },
  { name: "A million users", at: { distanceMs: 120, queries: 3, rps: 3000, subscribers: 100_000, cold: false } },
];

const big = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));

function Bar({ guess, worst }: { guess: Guess; worst: number }) {
  return (
    <div className="perf-row">
      <div className="perf-head">
        <span>{guess.label}</span>
        <b>~{guess.total} ms</b>
      </div>
      <div className="perf-bar" role="img" aria-label={`about ${guess.total} milliseconds`}>
        {guess.parts.map((p) => (
          <i key={p.label} style={{ width: `${(p.ms / worst) * 100}%` }} title={`${p.label}: ~${p.ms} ms`} />
        ))}
      </div>
      <dl className="perf-parts">
        {guess.parts.map((p) => (
          <div key={p.label}>
            <dt>{p.label}</dt>
            <dd>~{p.ms} ms</dd>
          </div>
        ))}
      </dl>
      <p className="perf-note">{guess.note}</p>
      <dl className="perf-scale">
        <div>
          <dt>A change reaches every subscriber in</dt>
          <dd>~{guess.fanoutMs} ms</dd>
        </div>
        <div>
          <dt>As the load grows</dt>
          <dd>{guess.underLoad}</dd>
        </div>
        <div>
          <dt>What gives way first</dt>
          <dd>{guess.ceiling}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function SpeedSection({ product }: { product: string }) {
  const rival = RIVALS[product];
  const [shape, setShape] = useState<Shape>(SIZES[1]!.at);
  const guesses = useMemo(() => {
    const ours = edgeGuess(shape);
    const theirs = rival?.shape === "machine" ? machineGuess(shape, rival.name) : regionGuess(shape, rival?.name ?? "them");
    return [ours, theirs];
  }, [shape, rival]);
  if (!rival) return null;
  const worst = Math.max(...guesses.map((g) => g.total));
  const distanceIndex = DISTANCES.findIndex((d) => d.ms === shape.distanceMs);
  const machine = rival.shape === "machine";
  const realtimeTransport = rival.realtime ?? (machine ? "Held in the process itself, pushed straight from memory" : "Websockets from the one instance");

  return (
    <>
      <h2 id="speed">And what about speed?</h2>

      <div className="perf-warning">
        <p>
          <strong>Everything below this line is guesswork.</strong> We have not benchmarked these systems against
          each other, and we are not qualified to do it well. Doing it properly means controlled hardware,
          representative workloads, warm and cold paths measured separately, percentiles rather than averages, and
          somebody who has done it before checking the method. None of that happened here.
        </p>
        <p>
          What follows is arithmetic over round numbers we believe are roughly right. It is here to give a rough
          shape of the trade to someone who wants one, and to annoy someone who knows better into correcting us. The
          numbers being multiplied are listed underneath so you can argue with a specific one.{" "}
          <strong>Do not choose a backend on this section.</strong>
        </p>
      </div>

      <div className="cost-presets">
        {SIZES.map((z) => (
          <button
            key={z.name}
            type="button"
            className={`cost-preset${JSON.stringify(z.at) === JSON.stringify(shape) ? " active" : ""}`}
            onClick={() => setShape(z.at)}
          >
            {z.name}
          </button>
        ))}
      </div>

      <div className="cost-panel">
        <label className="cost-slider">
          <span className="cost-slider-label">
            How far the user is from {rival.name}
            <b>{DISTANCES[distanceIndex]?.label}</b>
          </span>
          <input
            type="range"
            min={0}
            max={DISTANCES.length - 1}
            step={1}
            value={distanceIndex}
            onChange={(e) => setShape({ ...shape, distanceMs: DISTANCES[Number(e.target.value)]!.ms })}
          />
        </label>
        <label className="cost-slider">
          <span className="cost-slider-label">
            Database round trips a request makes
            <b>{shape.queries}</b>
          </span>
          <input type="range" min={1} max={6} step={1} value={shape.queries} onChange={(e) => setShape({ ...shape, queries: Number(e.target.value) })} />
        </label>
        <label className="cost-slider">
          <span className="cost-slider-label">
            Requests a second, at the busy moment
            <b>{big(shape.rps)}</b>
          </span>
          <input
            type="range"
            min={0}
            max={RPS.length - 1}
            step={1}
            value={RPS.indexOf(shape.rps) === -1 ? 1 : RPS.indexOf(shape.rps)}
            onChange={(e) => setShape({ ...shape, rps: RPS[Number(e.target.value)]! })}
          />
        </label>
        <label className="cost-slider">
          <span className="cost-slider-label">
            Clients subscribed at once
            <b>{big(shape.subscribers)}</b>
          </span>
          <input
            type="range"
            min={0}
            max={SUBSCRIBERS.length - 1}
            step={1}
            value={SUBSCRIBERS.indexOf(shape.subscribers) === -1 ? 1 : SUBSCRIBERS.indexOf(shape.subscribers)}
            onChange={(e) => setShape({ ...shape, subscribers: SUBSCRIBERS[Number(e.target.value)]! })}
          />
        </label>
        <label className="cost-slider perf-cold">
          <span className="cost-slider-label">
            After a quiet period, cold
            <b>{shape.cold ? "yes" : "no"}</b>
          </span>
          <input type="checkbox" checked={shape.cold} onChange={(e) => setShape({ ...shape, cold: e.target.checked })} />
        </label>
      </div>

      <div className="perf-bars">
        {guesses.map((g) => <Bar key={g.label} guess={g} worst={worst} />)}
      </div>

      <h3>What we think the trade is</h3>
      <div className="why-table-wrap">
        <table className="why-table">
          <thead>
            <tr>
              <th />
              <th>voidbase</th>
              <th>{rival.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Where the code runs</th>
              <td>Every Cloudflare location, so near the user by construction</td>
              <td>{machine ? "The one machine, wherever you put it" : "The one region you chose"}</td>
            </tr>
            <tr>
              <th scope="row">Where the database is</th>
              <td>A network hop from the code, which is the slow part above</td>
              <td>{machine ? "The same disk. Nothing is faster" : "Beside the code, so queries are quick"}</td>
            </tr>
            <tr>
              <th scope="row">A user far away</th>
              <td>Pays about the same as one nearby</td>
              <td>Pays the full round trip, on every call the page makes</td>
            </tr>
            <tr>
              <th scope="row">Cold start</th>
              <td>Milliseconds: an isolate, not a container</td>
              <td>{machine ? "None. It is always running" : "Hundreds of milliseconds if it scaled to zero"}</td>
            </tr>
            <tr>
              <th scope="row">Ten times the traffic</th>
              <td>Same latency, more instances. Nothing to do</td>
              <td>{machine ? "A bigger machine, and a restart" : "A bigger instance, and somebody to notice"}</td>
            </tr>
            <tr>
              <th scope="row">A hundred times the traffic</th>
              <td>Same again. The limit is your database, not the runtime</td>
              <td>{machine ? "Beyond one machine. The architecture changes" : "Read replicas, connection pooling, sharding"}</td>
            </tr>
            <tr>
              <th scope="row">Realtime transport</th>
              <td>One hibernating socket per client, held by a durable object</td>
              <td>{realtimeTransport}</td>
            </tr>
            <tr>
              <th scope="row">Realtime fanout</th>
              <td>~{guesses[0]!.fanoutMs} ms to {big(shape.subscribers)} subscribers</td>
              <td>~{guesses[1]!.fanoutMs} ms to the same</td>
            </tr>
            <tr>
              <th scope="row">Subscribers before it hurts</th>
              <td>Per instance, and the object hibernates when quiet</td>
              <td>{machine ? `Bounded by one process, around ${(BELIEF.onePlaceSubscribers / 1000).toFixed(0)}k sockets` : `Bounded by the instance, and usually billed as well`}</td>
            </tr>
            <tr>
              <th scope="row">Idle</th>
              <td>Costs nothing and runs nothing</td>
              <td>{machine ? "The machine runs anyway" : "The instance runs anyway"}</td>
            </tr>
            <tr>
              <th scope="row">What gives way first</th>
              <td>Database throughput, or one instance's own durable object</td>
              <td>{machine ? "The machine, and there is no second one" : "The instance, and then the database behind it"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="perf-note">{rival.shapeNote}</p>

      <h3>The numbers being multiplied</h3>
      <p>
        Correct one of these and the bars move. Reaching a Cloudflare edge location, {BELIEF.edgeReachMs}ms. A Worker
        starting cold, {BELIEF.workerColdMs}ms, because an isolate is not a container. A container waking,{" "}
        {BELIEF.containerColdMs}ms. One D1 query from a Worker, {BELIEF.d1QueryMs}ms. One query to a database beside
        the code, {BELIEF.colocatedQueryMs}ms. One query to SQLite on the same disk, {BELIEF.localQueryMs}ms. The
        handler itself, {BELIEF.handlerMs}ms.
      </p>
      <p>
        The one we are least sure of is the D1 number, and it is the one that decides whether the first bar beats the
        second. It is also the one most likely to change: putting an instance's data in a durable object beside its
        own code would replace that network hop with a local read.
      </p>

      <div className="perf-ask">
        <h3>Please prove us wrong</h3>
        <p>
          If you benchmark backends for a living, we would rather publish your method and your results than our
          arithmetic. Open an issue on{" "}
          <a href="https://github.com/voidbase-cloud/voidbase" target="_blank" rel="noreferrer noopener">the repository</a>{" "}
          with what you would measure and how, and we will run it, publish whatever it says, and replace this section
          with it.
        </p>
      </div>
    </>
  );
}
