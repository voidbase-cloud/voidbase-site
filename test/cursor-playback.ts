// What src/lib/cursorPlayback.ts is for: a remote cursor that moves evenly when the reports about it do not.
//   bun test/cursor-playback.ts
//
// "Smooth" is measured, not judged. A cursor is drawn once a frame, so what an eye reads as choppy is the frame to
// frame distance jumping around: a dart of 6 px, then four frames of nothing, then another dart. So the measure here
// is the spread of that distance (its standard deviation over its mean) and the worst single-frame jump against the
// average. The old code, an ease toward the newest reported position, is run over the same reports for comparison,
// because the point is not that this is smooth in the abstract, it is that it is smoother than what it replaced.
import { advance, record, track, type Point, type Track } from "../src/lib/cursorPlayback";

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`); };

const FRAME = 1000 / 60;
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** the path a hand actually makes: a curve, sampled at the rate a browser would send it */
function handPath(samples: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < samples; i++) {
    const s = i / samples;
    out.push({ x: 10 + 60 * s + 8 * Math.sin(s * 5), y: 40 + 22 * Math.sin(s * 3.2) });
  }
  return out;
}

/**
 * When each of those positions turns up, given a connection of the named quality. They are made every 80 ms whatever
 * the connection is like -- that is the sender's throttle, not the network's business -- so a bad connection delays
 * them rather than slowing them down, and a delayed one does not hold up the next. Which is why a stall here is
 * followed by a burst, and why the average stays 80 ms however bad it gets.
 */
function arrivals(n: number, kind: "steady" | "jittery" | "patchy"): number[] {
  const out: number[] = [];
  let seed = 12345, last = -1;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < n; i++) {
    const late = kind === "steady" ? 0 : kind === "jittery" ? rnd() * 60 : rnd() < 0.2 ? 200 + rnd() * 350 : rnd() * 30;
    const t = Math.max(last + 2, i * 80 + late);
    out.push(t); last = t;
  }
  return out;
}

/** run the real playback over those reports and collect where it was drawn each frame */
function play(path: Point[], when: number[]): { drawn: Point[]; t: Track } {
  const t = track(path[0]!);
  const drawn: Point[] = [];
  let next = 1;
  const end = when[when.length - 1]! + 800;
  for (let now = 0; now <= end; now += FRAME) {
    while (next < path.length && when[next]! <= now) { record(t, path[next]!, when[next]!); next++; }
    advance(t, FRAME);
    drawn.push({ ...t.at });
  }
  return { drawn, t };
}

/** the code this replaced: each frame, move a fixed share of the way to the newest reported position */
function easeToNewest(path: Point[], when: number[]): Point[] {
  const K = 0.24;
  let at = { ...path[0]! }, target = { ...path[0]! }, next = 1;
  const drawn: Point[] = [];
  const end = when[when.length - 1]! + 400;
  for (let now = 0; now <= end; now += FRAME) {
    while (next < path.length && when[next]! <= now) { target = path[next]!; next++; }
    at = { x: at.x + (target.x - at.x) * K, y: at.y + (target.y - at.y) * K };
    drawn.push({ ...at });
  }
  return drawn;
}

/** how uneven the drawn motion is: the spread of per-frame distance, and the worst frame against the average */
function evenness(drawn: Point[]): { spread: number; worst: number; still: number } {
  const steps: number[] = [];
  for (let i = 1; i < drawn.length; i++) steps.push(dist(drawn[i - 1]!, drawn[i]!));
  const moving = steps.filter((s) => s > 1e-9);
  const mean = moving.reduce((a, b) => a + b, 0) / Math.max(1, moving.length);
  const sd = Math.sqrt(moving.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, moving.length));
  return { spread: sd / mean, worst: Math.max(...moving) / mean, still: steps.length - moving.length };
}

const path = handPath(60);

for (const kind of ["steady", "jittery", "patchy"] as const) {
  const when = arrivals(path.length, kind);
  const played = play(path, when);
  const mine = evenness(played.drawn);
  const old = evenness(easeToNewest(path, when));
  console.log(`\n${kind}: playback spread ${mine.spread.toFixed(2)}, worst frame ${mine.worst.toFixed(1)}x, held back ${played.t.depth.toFixed(1)} reports (${(played.t.depth * played.t.interval).toFixed(0)} ms)  |  easing spread ${old.spread.toFixed(2)}, worst frame ${old.worst.toFixed(1)}x`);
  check(`${kind}: motion is more even than easing toward the newest position`, mine.spread < old.spread * 0.75, `${mine.spread.toFixed(3)} vs ${old.spread.toFixed(3)}`);
  check(`${kind}: no frame darts as far as the old code's worst`, mine.worst < old.worst * 0.75, `worst ${mine.worst.toFixed(2)}x vs ${old.worst.toFixed(2)}x`);
  check(`${kind}: the delay it buys is proportionate`, played.t.depth * played.t.interval < (kind === "steady" ? 140 : 400), `${(played.t.depth * played.t.interval).toFixed(0)} ms`);
}

// the sharpest test of all: someone moving at a steady speed must be drawn moving at a steady speed, however
// unevenly their positions turn up. This is what a live measurement caught the first version failing -- the drawn
// cursor sped up and slowed down several times a second while the hand that made it did neither.
{
  const straight: Point[] = [];
  for (let i = 0; i < 60; i++) straight.push({ x: 10 + i, y: 50 }); // constant speed, constant direction
  const when = arrivals(straight.length, "patchy");
  const drawn = play(straight, when).drawn;
  const speeds: number[] = [];
  for (let i = 1; i < drawn.length; i++) { const d = dist(drawn[i - 1]!, drawn[i]!); if (d > 1e-9) speeds.push(d); }
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const sorted = [...speeds].sort((a, b) => a - b);
  const p99 = sorted[Math.floor(0.99 * (sorted.length - 1))]! / mean;
  console.log(`\nsteady hand over a patchy connection: drawn speed p99 ${p99.toFixed(2)}x of its own mean, worst ${(Math.max(...speeds) / mean).toFixed(2)}x`);
  check("a steady hand is drawn moving steadily, however its positions arrive", p99 < 1.6, `p99 ${p99.toFixed(2)}x`);
  check("and never at more than half again its own speed", Math.max(...speeds) / mean < 1.9, `worst ${(Math.max(...speeds) / mean).toFixed(2)}x`);
}

// it must still be honest: playback goes where the reports said, not somewhere near it
{
  const when = arrivals(path.length, "jittery");
  const drawn = play(path, when).drawn;
  const missed = path.slice(1, -1).filter((p) => !drawn.some((d) => dist(d, p) < 0.6));
  check("every reported position is passed through", missed.length === 0, `${missed.length} of ${path.length} never reached`);
  const last = drawn[drawn.length - 1]!;
  check("it ends where the last report put it", dist(last, path[path.length - 1]!) < 0.2, JSON.stringify({ last, want: path[path.length - 1] }));
}

// when the reports stop, what is already queued is played out rather than dropped or dumped in a frame
{
  const t = track({ x: 0, y: 0 });
  for (let i = 1; i <= 4; i++) record(t, { x: i * 2, y: 0 }, i * 80);
  const steps: number[] = [];
  let prev = { ...t.at };
  for (let f = 0; f < 60; f++) { advance(t, FRAME); steps.push(dist(prev, t.at)); prev = { ...t.at }; } // one second, nothing arrives
  const moving = steps.filter((s) => s > 1e-9);
  check("with nothing arriving it plays out what it has, over many frames", moving.length > 12, `moved on ${moving.length} of 60 frames`);
  check("and never lurches to catch up", Math.max(...moving) < 3 * (moving.reduce((a, b) => a + b, 0) / moving.length), `worst ${Math.max(...moving).toFixed(3)}`);
  check("and arrives where the last of them said", Math.abs(t.at.x - 8) < 0.01, `at ${t.at.x.toFixed(3)}`);
}

// the whole point of measuring the connection: an uneven one is held back further than a steady one
{
  const steady = track({ x: 0, y: 0 });
  for (let i = 1; i <= 20; i++) record(steady, { x: i, y: 0 }, i * 80);
  const rough = track({ x: 0, y: 0 });
  let when = 0;
  for (let i = 1; i <= 20; i++) { when += i % 4 === 0 ? 420 : 30; record(rough, { x: i, y: 0 }, when); }
  console.log(`\nheld back: steady ${steady.depth.toFixed(2)} reports, uneven ${rough.depth.toFixed(2)}`);
  check("a steady connection is barely delayed at all", steady.depth < 1.2, `${steady.depth.toFixed(2)} reports`);
  check("an uneven one is held back further, to cover what it misses", rough.depth > steady.depth * 1.8, `${rough.depth.toFixed(2)} vs ${steady.depth.toFixed(2)}`);
}

// a bunch arriving at once is absorbed, not replayed as a blur
{
  const t = track({ x: 0, y: 0 });
  for (let i = 1; i <= 8; i++) record(t, { x: i * 2, y: 0 }, 500 + i); // eight positions in the same instant
  const steps: number[] = [];
  let prev = { ...t.at };
  for (let f = 0; f < 90; f++) { advance(t, FRAME); steps.push(dist(prev, t.at)); prev = { ...t.at }; }
  const moving = steps.filter((s) => s > 1e-9);
  const mean = moving.reduce((a, b) => a + b, 0) / moving.length;
  check("a bunched delivery is played out over many frames", moving.length > 12, `moved on ${moving.length} frames`);
  check("and no one frame swallows the bunch", Math.max(...moving) < 2 * mean, `worst ${Math.max(...moving).toFixed(2)} against mean ${mean.toFixed(2)}`);
  check("and it does catch up: the last of the bunch is reached", Math.abs(t.at.x - 16) < 0.2, `at ${t.at.x.toFixed(2)}`);
}

// a real jump (a scroll, a tab returning) is not a movement: go there, do not sweep across the page
{
  const t = track({ x: 5, y: 5 });
  record(t, { x: 90, y: 80 }, 80);
  advance(t, FRAME);
  check("a jump is taken directly, not curved through", dist(t.at, { x: 90, y: 80 }) < 0.001, JSON.stringify(t.at));
}

// someone who asked for less motion gets the position, not the animation
{
  const t = track({ x: 0, y: 0 });
  record(t, { x: 10, y: 10 }, 80);
  record(t, { x: 20, y: 20 }, 160);
  advance(t, FRAME, true);
  check("reduced motion: straight to the newest report", t.at.x === 20 && t.at.y === 20, JSON.stringify(t.at));
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
