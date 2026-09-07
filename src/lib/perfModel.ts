// The latency guesses behind the performance section of /docs/why/cost.
//
// Read the warning on that page first. These are not measurements. They are arithmetic over round numbers we
// believe are roughly right, kept here so that anyone who disagrees can see exactly which number to argue with
// rather than arguing with a bar chart.
//
// The shape of the guess: a request costs the time to reach a server, plus the time that server spends talking to
// its database, plus the time it spends on the work itself. The interesting difference between an edge runtime and
// a single-region host is which of those terms the user's distance multiplies.

export interface Shape {
  /** how far the user is from the region a single-region backend lives in, in milliseconds of round trip */
  distanceMs: number;
  /** database round trips a request makes: one simple read, or several for an expanded relation */
  queries: number;
  /** is the instance cold */
  cold: boolean;
}

export interface Guess {
  label: string;
  /** the parts, so the number can be argued with piece by piece */
  parts: { label: string; ms: number; note?: string }[];
  total: number;
  note: string;
}

// ---- the round numbers ------------------------------------------------------------------------------------------
// Every one of these is a belief, not a measurement. They are the things to correct first.
export const BELIEF = {
  /** reaching a Cloudflare edge location: they are close to almost everyone */
  edgeReachMs: 15,
  /** a Worker starting from cold. Isolates start in about this, which is the whole point of them */
  workerColdMs: 5,
  /** a container or VM waking up, which is the number that makes people talk about cold starts */
  containerColdMs: 900,
  /** one D1 query from a Worker, when the database is not in the same place as the request */
  d1QueryMs: 25,
  /** one query to a Postgres instance from a function beside it */
  colocatedQueryMs: 3,
  /** one query to SQLite on the same machine */
  localQueryMs: 1,
  /** the work itself: validation, rules, serialising */
  handlerMs: 4,
};

const sum = (parts: { ms: number }[]) => Math.round(parts.reduce((a, p) => a + p.ms, 0));

/** voidbase on Cloudflare: the code is near the user, the database is not */
export function edgeGuess(s: Shape): Guess {
  const parts = [
    { label: "Reaching the edge", ms: BELIEF.edgeReachMs, note: "close to the user wherever they are" },
    ...(s.cold ? [{ label: "Cold start", ms: BELIEF.workerColdMs, note: "an isolate, not a container" }] : []),
    { label: "Database", ms: s.queries * BELIEF.d1QueryMs, note: `${s.queries} query${s.queries > 1 ? "ies" : ""} across the network` },
    { label: "The handler", ms: BELIEF.handlerMs },
  ];
  return {
    label: "voidbase on Cloudflare",
    parts,
    total: sum(parts),
    note: "The code runs near the user, so distance barely enters. The database is the slow part, because a Worker reaches D1 over the network rather than over a socket on the same box.",
  };
}

/** a hosted backend in one region: the database is next door, the user may not be */
export function regionGuess(s: Shape, name = "A hosted backend in one region"): Guess {
  const parts = [
    { label: "Reaching the region", ms: s.distanceMs, note: "one round trip to wherever the project lives" },
    ...(s.cold ? [{ label: "Cold start", ms: BELIEF.containerColdMs, note: "if the function had scaled to zero" }] : []),
    { label: "Database", ms: s.queries * BELIEF.colocatedQueryMs, note: "next to the code, so fast" },
    { label: "The handler", ms: BELIEF.handlerMs },
  ];
  return {
    label: name,
    parts,
    total: sum(parts),
    note: "The database is right there, which is the advantage. What it pays is distance: everyone not near that region pays the full round trip, and a page that makes several calls pays it several times.",
  };
}

/** one machine you run: everything is local, including the distance to it */
export function machineGuess(s: Shape, name = "One machine you run"): Guess {
  const parts = [
    { label: "Reaching the machine", ms: s.distanceMs, note: "one round trip to your server" },
    { label: "Database", ms: s.queries * BELIEF.localQueryMs, note: "SQLite on the same disk" },
    { label: "The handler", ms: BELIEF.handlerMs },
  ];
  return {
    label: name,
    parts,
    total: sum(parts),
    note: "The fastest backend in the world once the request arrives, and there is nothing to warm up. Getting there is the whole cost, and it is the same cost for every request.",
  };
}
