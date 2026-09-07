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
    </div>
  );
}

export default function SpeedSection({ product }: { product: string }) {
  const rival = RIVALS[product];
  const [shape, setShape] = useState<Shape>({ distanceMs: 120, queries: 2, cold: false });
  const guesses = useMemo(() => {
    const ours = edgeGuess(shape);
    const theirs = rival?.shape === "machine" ? machineGuess(shape, rival.name) : regionGuess(shape, rival?.name ?? "them");
    return [ours, theirs];
  }, [shape, rival]);
  if (!rival) return null;
  const worst = Math.max(...guesses.map((g) => g.total));
  const distanceIndex = DISTANCES.findIndex((d) => d.ms === shape.distanceMs);

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
      <table className="why-table">
        <thead>
          <tr>
            <th />
            <th>Near the user</th>
            <th>Near the database</th>
            <th>Cold start</th>
            <th>Under sudden load</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">voidbase</th>
            <td>Always</td>
            <td>No: a network hop away</td>
            <td>Milliseconds</td>
            <td>Capacity per request</td>
          </tr>
          <tr>
            <th scope="row">{rival.name}</th>
            <td>Only if they are near it</td>
            <td>Yes</td>
            <td>{rival.shape === "machine" ? "None: always running" : "Depends what scaled to zero"}</td>
            <td>{rival.shape === "machine" ? "One machine, until it is not enough" : "A bigger instance, when you notice"}</td>
          </tr>
        </tbody>
      </table>
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
