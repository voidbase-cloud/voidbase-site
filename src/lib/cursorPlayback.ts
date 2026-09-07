// Playing back someone else's cursor from positions that arrive over a network.
//
// Positions arrive about twelve times a second when the connection is kind and in bunches when it is not, and
// drawing each one as it lands is what makes a remote cursor look choppy: it darts to the new spot, waits, darts
// again. Easing toward the newest position does not fix that, it only rounds each dart; the stutter underneath is
// the same, because the thing being smoothed is still a series of steps arriving at uneven times.
//
// So nothing is drawn as it arrives. Positions go into a queue and are played back in order, one segment at a time,
// at a speed chosen to keep a few of them still waiting. A late delivery drains the queue, playback stretches, and
// the cursor keeps moving through what it already has; a bunched delivery fills it, playback hurries a little and the
// excess is absorbed. Within a segment the cursor moves at a constant rate, so there is no pulsing, and across
// segments it follows a curve through the reported points, so there are no corners. It is always somewhere its owner
// really was, and always moving at a believable speed.
//
// How many it holds back is not fixed, because the right answer is different on a good connection and a bad one.
// Each cursor measures how unevenly its own positions arrive and holds back roughly that much: on a steady
// connection about one report, a twelfth of a second, and the cursor is nearly live; on a patchy one up to four,
// which is a third of a second of delay bought to stop it running out of path mid-stroke. The delay follows the
// connection down again as it recovers. Coordinates are percentages of the page; nothing here knows about pixels.
//
// test/cursor-playback.ts measures what this is for: how evenly a cursor moves when the reports do not.

export interface Point { x: number; y: number }

export const NOMINAL_MS = 80; // the rate positions are sent at while someone is moving, until measured
const DEPTH_MIN = 1, DEPTH_MAX = 4; // positions held back before drawing, from a steady connection to a patchy one
const SPEED_MIN = 0.55, SPEED_MAX = 2; // how far playback may stretch or hurry to get back to that depth
const STEADY_MS = 400; // arrivals further apart than this are a pause, not the rate someone is moving at
const LATE_MS = 800; // and further apart than this tells us nothing more about the connection than this does
const JUMP = 40; // a change this big is a jump, not a movement: go straight there
const KEEP = 16; // queued positions to hold at most, so a sleeping tab does not replay minutes of path

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const far = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) > JUMP;
/** the point one step back the other way, so a curve with no neighbour on that side comes out straight */
const mirror = (a: Point, b: Point): Point => ({ x: 2 * a.x - b.x, y: 2 * a.y - b.y });

/**
 * Catmull-Rom through four points, drawn between the middle two. It passes through every point it is given, so a
 * cursor still goes exactly where it was reported to be; what the outer two buy is a tangent, which rounds the
 * corner between one report and the next instead of turning it on a hinge. With both neighbours mirrored, which is
 * what happens at the ends of what we know, it is exactly a straight line.
 */
export function curve(p0: Point, p1: Point, p2: Point, p3: Point, u: number): Point {
  const u2 = u * u, u3 = u2 * u;
  const on = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (3 * b - a - 3 * c + d) * u3);
  return { x: on(p0.x, p1.x, p2.x, p3.x), y: on(p0.y, p1.y, p2.y, p3.y) };
}

export interface Track {
  queue: Point[];
  at: Point;          // where it is drawn now
  from: Point;        // this segment's start
  to: Point | null;   // this segment's end
  prev: Point | null; // the segment before, for the curve's tangent
  u: number;          // 0..1 along this segment
  interval: number;   // smoothed ms between arrivals: how long a segment takes at normal speed
  jitter: number;     // smoothed ms that arrivals miss that interval by: how uneven this connection is
  depth: number;      // positions to keep waiting, which is what that unevenness costs to absorb
  seen: number;       // when the last position arrived
}

/** a cursor that has just appeared, drawn where it was first reported */
export const track = (p: Point): Track =>
  ({ queue: [], at: { ...p }, from: { ...p }, to: null, prev: null, u: 0, interval: NOMINAL_MS, jitter: 0, depth: DEPTH_MIN, seen: 0 });

/** a newly reported position joins the queue; the gap since the last one is the rate this person is being sent at */
export function record(t: Track, p: Point, now: number): void {
  const gap = now - t.seen;
  if (t.seen && gap > 0) {
    // a long gap is someone who stopped and started again, not the rate they move at, so it sets no rate
    if (gap < STEADY_MS) t.interval = t.interval * 0.75 + gap * 0.25;
    // but it is still the connection being late, which is exactly what the queue is held back to cover
    t.jitter = t.jitter * 0.8 + Math.abs(Math.min(gap, LATE_MS) - t.interval) * 0.2;
    t.depth = clamp(1 + t.jitter / Math.max(40, t.interval), DEPTH_MIN, DEPTH_MAX);
  }
  t.seen = now;
  t.queue.push(p);
  if (t.queue.length > KEEP) t.queue.splice(0, t.queue.length - KEEP);
}

/** walk the playback on by `ms`, taking as many queued positions as that covers */
export function advance(t: Track, ms: number, reduce = false): void {
  if (reduce) { // no animation asked for: be where the newest report says, and nowhere in between
    const last = t.queue.length ? t.queue[t.queue.length - 1]! : t.to;
    if (last) { t.at = { ...last }; t.from = { ...last }; }
    t.queue.length = 0; t.to = null; t.u = 0; t.prev = null;
    return;
  }
  for (let guard = 0; guard < 8 && ms > 0; guard++) {
    if (!t.to) {
      const next = t.queue.shift();
      if (!next) break;
      if (far(t.at, next)) { t.at = { ...next }; t.from = { ...next }; t.prev = null; continue; } // a jump, not a path
      t.prev = t.from; t.from = { ...t.at }; t.to = next; t.u = 0;
    }
    // the further behind the queue falls the slower this plays, so it runs out of positions as late as it can
    const speed = clamp(1 + 0.35 * (t.queue.length - t.depth), SPEED_MIN, SPEED_MAX);
    const span = Math.max(40, t.interval) / speed;
    const step = Math.min(ms, (1 - t.u) * span);
    t.u += step / span;
    ms -= step;
    if (t.u < 1) break;
    t.at = { ...t.to }; t.to = null; t.u = 0;
  }
  if (t.to) {
    const ahead = t.queue[0];
    const p0 = t.prev ?? mirror(t.from, t.to);
    const p3 = ahead && !far(t.to, ahead) ? ahead : mirror(t.to, t.from);
    const c = curve(p0, t.from, t.to, p3, t.u);
    t.at = { x: clamp(c.x, -5, 105), y: clamp(c.y, -5, 105) };
  }
}
