// The latency guesses behind the speed section at the end of every comparison page.
//
// Read the warning on those pages first. None of this is measured. It is arithmetic over round numbers we believe
// are roughly right, kept here so anyone who disagrees can see exactly which number to argue with rather than
// arguing with a bar chart.
//
// The shape of the guess: a request costs the time to reach a server, plus the time that server spends talking to
// its database, plus the work itself, plus whatever queueing the load adds. The interesting differences between an
// edge runtime, a single region and one machine are which of those terms the user's distance multiplies, and which
// of them grows when the app does.

export interface Shape {
  /** round trip to the region or machine a single-place backend lives in, milliseconds */
  distanceMs: number;
  /** database round trips a request makes */
  queries: number;
  /** requests a second at the busy moment */
  rps: number;
  /** clients holding a realtime connection */
  subscribers: number;
  /** is it cold, after a quiet period */
  cold: boolean;
}

export interface Part {
  label: string;
  ms: number;
  note?: string;
}

export interface Guess {
  label: string;
  parts: Part[];
  total: number;
  /** how a change reaches every subscriber, milliseconds */
  fanoutMs: number;
  /** what gives way first as the app grows */
  ceiling: string;
  /** how the request time above changes as load grows */
  underLoad: string;
  note: string;
}

// ---- the round numbers ----------------------------------------------------------------------------------------
// Every one is a belief, not a measurement. These are the things to correct first.
export const BELIEF = {
  /** reaching a Cloudflare edge location: they are close to almost everyone */
  edgeReachMs: 15,
  /** a Worker starting from cold, which is the point of an isolate */
  workerColdMs: 5,
  /** a container or virtual machine waking up */
  containerColdMs: 900,
  /** one D1 query from a Worker, across the network */
  d1QueryMs: 25,
  /** one query to a database sitting beside the code */
  colocatedQueryMs: 3,
  /** one query to SQLite on the same disk */
  localQueryMs: 1,
  /** the handler itself: validation, rules, serialising */
  handlerMs: 4,
  /** requests a second one modest instance or machine serves before queueing starts */
  onePlaceCapacityRps: 800,
  /** subscribers one process can hold sockets for and still push promptly */
  onePlaceSubscribers: 20_000,
  /** pushing one change out to a thousand subscribers from a durable object */
  fanoutPerThousandMs: 8,
};

const sum = (parts: Part[]) => Math.round(parts.reduce((a, p) => a + p.ms, 0));

/**
 * What queueing does to a single place as it fills up. Below capacity, nothing. Approaching it, latency climbs the
 * way a queue does, which is slowly and then all at once. This is the crudest guess on the page and the one most
 * worth replacing with a measurement.
 */
function queueingMs(rps: number, capacity: number): number {
  const load = rps / capacity;
  if (load < 0.5) return 0;
  if (load >= 1) return Math.round(BELIEF.handlerMs * 40 * Math.min(load, 4)); // saturated: it is a queue now
  return Math.round(BELIEF.handlerMs * (load / (1 - load)));
}

/** voidbase on Cloudflare: the code is near the user, the database is a hop away, capacity is per request */
export function edgeGuess(s: Shape): Guess {
  const parts: Part[] = [
    { label: "Reaching the edge", ms: BELIEF.edgeReachMs, note: "close to the user wherever they are" },
    ...(s.cold ? [{ label: "Cold start", ms: BELIEF.workerColdMs, note: "an isolate, not a container" }] : []),
    { label: "Database", ms: s.queries * BELIEF.d1QueryMs, note: `${s.queries} across the network` },
    { label: "The handler", ms: BELIEF.handlerMs },
  ];
  return {
    label: "voidbase on Cloudflare",
    parts,
    total: sum(parts),
    fanoutMs: Math.round(BELIEF.fanoutPerThousandMs * Math.max(1, s.subscribers / 1000)),
    ceiling:
      "Nothing here scales by being bigger. Requests spread across every location, and each instance's sockets are held by one durable object, so the first real limit is that object's own throughput rather than a machine size.",
    underLoad:
      "Flat. Capacity is added per request, so the number above does not change between ten requests a second and ten thousand.",
    note: "The code runs near the user, so distance barely enters. The database is the slow part, because a Worker reaches D1 over the network rather than a socket on the same box.",
  };
}

/** a hosted backend in one region: the database is next door, the user may not be, and capacity is an instance size */
export function regionGuess(s: Shape, name = "A hosted backend in one region"): Guess {
  const queue = queueingMs(s.rps, BELIEF.onePlaceCapacityRps);
  const parts: Part[] = [
    { label: "Reaching the region", ms: s.distanceMs, note: "one round trip to wherever the project lives" },
    ...(s.cold ? [{ label: "Cold start", ms: BELIEF.containerColdMs, note: "if it had scaled to zero" }] : []),
    { label: "Database", ms: s.queries * BELIEF.colocatedQueryMs, note: "next to the code" },
    { label: "The handler", ms: BELIEF.handlerMs },
    ...(queue ? [{ label: "Queueing", ms: queue, note: "the instance is filling up" }] : []),
  ];
  return {
    label: name,
    parts,
    total: sum(parts),
    fanoutMs: Math.round(
      BELIEF.fanoutPerThousandMs * Math.max(1, s.subscribers / 1000) * (s.subscribers > BELIEF.onePlaceSubscribers ? 3 : 1),
    ),
    ceiling: `One instance holds the sockets and serves the requests. Past about ${BELIEF.onePlaceCapacityRps.toLocaleString()} requests a second or ${(BELIEF.onePlaceSubscribers / 1000).toFixed(0)}k subscribers, the answer is a bigger instance, read replicas, or both, and somebody has to notice and do it.`,
    underLoad:
      "Flat until the instance is about half full, then it climbs the way a queue climbs: slowly, and then all at once.",
    note: "The database is right there, which is the advantage. What it pays is distance: everyone far from that region pays the full round trip, and a page that makes several calls pays it several times.",
  };
}

/** one machine you run: everything is local, including the distance to it, and there is exactly one of it */
export function machineGuess(s: Shape, name = "One machine you run"): Guess {
  const queue = queueingMs(s.rps, BELIEF.onePlaceCapacityRps);
  const parts: Part[] = [
    { label: "Reaching the machine", ms: s.distanceMs, note: "one round trip to your server" },
    { label: "Database", ms: s.queries * BELIEF.localQueryMs, note: "SQLite on the same disk" },
    { label: "The handler", ms: BELIEF.handlerMs },
    ...(queue ? [{ label: "Queueing", ms: queue, note: "the machine is filling up" }] : []),
  ];
  return {
    label: name,
    parts,
    total: sum(parts),
    fanoutMs: Math.round(
      2 * Math.max(1, s.subscribers / 1000) * (s.subscribers > BELIEF.onePlaceSubscribers ? 4 : 1),
    ),
    ceiling: `One process, one disk, one network card. Past about ${BELIEF.onePlaceCapacityRps.toLocaleString()} requests a second or ${(BELIEF.onePlaceSubscribers / 1000).toFixed(0)}k open sockets the only move is a bigger machine, and while you are making it there is nowhere else for the traffic to go.`,
    underLoad:
      "Flat while there is headroom, then the same queue, and with no second machine to spill into it is also the failure mode.",
    note: "The fastest backend in the world once the request arrives, and nothing to warm up. Getting there is the whole cost, and it is the same cost for every request.",
  };
}
