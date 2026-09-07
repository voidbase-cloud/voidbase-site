// The cost model behind /docs/why/cost.
//
// An estimate whose assumptions are hidden is an advertisement. Every rate here is a published list price with the
// page it came from, every assumption that turns "an app" into "this many billable operations" is a named constant,
// and the page prints both. If a number here is wrong, it is wrong in one visible place.
//
// Firebase is deliberately absent. Firestore's per-operation rates live on a Google Cloud page that would not load
// in full when this was written, and putting a competitor's prices on a public page from memory is not something
// worth doing. The free-tier thresholds are documented; the paid rates are the ones that matter, and they are not
// quoted here until they can be quoted from the source.

export interface Usage {
  /** API reads a month */
  reads: number;
  /** API writes a month */
  writes: number;
  /** stored files, GB */
  storage: number;
  /** peak concurrent realtime connections */
  realtime: number;
  /** monthly active users */
  mau: number;
}

export interface Line {
  label: string;
  detail?: string;
  amount: number;
}

export interface Estimate {
  total: number;
  lines: Line[];
  /** what this model leaves out, in the other side's favour or ours */
  caveat: string;
}

// ---- rates -------------------------------------------------------------------------------------------------------
// Cloudflare, from developers.cloudflare.com, Workers Paid.
export const CF = {
  base: 5, // the account minimum
  requestsIncluded: 10_000_000,
  perMillionRequests: 0.3,
  cpuMsIncluded: 30_000_000,
  perMillionCpuMs: 0.02,
  d1RowsReadIncluded: 25_000_000_000,
  perMillionRowsRead: 0.001,
  d1RowsWrittenIncluded: 50_000_000,
  perMillionRowsWritten: 1.0,
  d1StorageIncludedGb: 5,
  perGbD1: 0.75,
  r2PerGb: 0.015,
  doRequestsIncluded: 1_000_000,
  perMillionDoRequests: 0.15,
};

// Supabase, from supabase.com/pricing, Pro.
export const SB = {
  base: 25,
  mauIncluded: 100_000,
  perMau: 0.00325,
  diskIncludedGb: 8,
  perGbDisk: 0.125,
  fileStorageIncludedGb: 100,
  perGbFiles: 0.0213,
  realtimeIncluded: 500,
  per1000Realtime: 10,
  messagesIncluded: 5_000_000,
  perMillionMessages: 2.5,
};

// ---- what an app does, per operation --------------------------------------------------------------------------
// These are the assumptions. They are the difference between a model and a guess, so the page prints them.
export const ASSUME = {
  /** SQLite rows a typical read touches, with a relation expanded */
  rowsPerRead: 4,
  /** rows a write touches, counting the record and its indexes */
  rowsPerWrite: 3,
  /** CPU milliseconds a request costs, measured on this site's own instance */
  cpuMsPerRequest: 3,
  /** realtime updates pushed to each connected client a day */
  pushesPerConnectionPerDay: 50,
  /** how full a stored file makes the database look: files live in R2, rows in D1 */
  dbGbPerMillionRows: 0.5,
};

const over = (used: number, included: number) => Math.max(0, used - included);
const round = (n: number) => Math.round(n * 100) / 100;

/** voidbase on your own Cloudflare account */
export function cloudflareCost(u: Usage): Estimate {
  const apiRequests = u.reads + u.writes;
  // a websocket connection is billed as one request; the messages over it are not
  const requests = apiRequests + u.realtime;
  const cpuMs = apiRequests * ASSUME.cpuMsPerRequest;
  const rowsRead = u.reads * ASSUME.rowsPerRead;
  const rowsWritten = u.writes * ASSUME.rowsPerWrite;
  const dbGb = (rowsWritten / 1_000_000) * ASSUME.dbGbPerMillionRows; // rows written are what accumulate
  // the hub fans out: one durable object request per push
  const doRequests = u.realtime * ASSUME.pushesPerConnectionPerDay * 30;

  const lines: Line[] = [
    { label: "Workers Paid base", detail: "the account minimum", amount: CF.base },
    {
      label: "Requests",
      detail: `${(requests / 1_000_000).toFixed(1)}M, ${CF.requestsIncluded / 1_000_000}M included`,
      amount: round((over(requests, CF.requestsIncluded) / 1_000_000) * CF.perMillionRequests),
    },
    {
      label: "CPU time",
      detail: `${ASSUME.cpuMsPerRequest}ms per request, ${CF.cpuMsIncluded / 1_000_000}M ms included`,
      amount: round((over(cpuMs, CF.cpuMsIncluded) / 1_000_000) * CF.perMillionCpuMs),
    },
    {
      label: "Database rows",
      detail: `${(rowsRead / 1_000_000).toFixed(0)}M read, ${(rowsWritten / 1_000_000).toFixed(1)}M written`,
      amount: round(
        (over(rowsRead, CF.d1RowsReadIncluded) / 1_000_000) * CF.perMillionRowsRead +
          (over(rowsWritten, CF.d1RowsWrittenIncluded) / 1_000_000) * CF.perMillionRowsWritten,
      ),
    },
    {
      label: "Database storage",
      detail: `${dbGb.toFixed(1)} GB, ${CF.d1StorageIncludedGb} GB included`,
      amount: round(over(dbGb, CF.d1StorageIncludedGb) * CF.perGbD1),
    },
    { label: "File storage", detail: `${u.storage} GB in R2, egress free`, amount: round(u.storage * CF.r2PerGb) },
    {
      label: "Realtime fanout",
      detail: `${(doRequests / 1_000_000).toFixed(1)}M durable object requests`,
      amount: round((over(doRequests, CF.doRequestsIncluded) / 1_000_000) * CF.perMillionDoRequests),
    },
  ];
  return {
    total: round(lines.reduce((a, l) => a + l.amount, 0)),
    lines,
    caveat:
      "No per-user charge: signing in is an ordinary request, so monthly active users do not appear. Durable object compute time is left out, because a hibernating connection bills none.",
  };
}

/** the same app on Supabase Pro */
export function supabaseCost(u: Usage): Estimate {
  const messages = u.realtime * ASSUME.pushesPerConnectionPerDay * 30;
  const dbGb = (u.writes * ASSUME.rowsPerWrite) / 1_000_000 * ASSUME.dbGbPerMillionRows;
  const lines: Line[] = [
    { label: "Pro base", detail: "one project, one instance", amount: SB.base },
    {
      label: "Monthly active users",
      detail: `${(u.mau / 1000).toFixed(0)}k, ${SB.mauIncluded / 1000}k included`,
      amount: round(over(u.mau, SB.mauIncluded) * SB.perMau),
    },
    {
      label: "Database disk",
      detail: `${dbGb.toFixed(1)} GB, ${SB.diskIncludedGb} GB included`,
      amount: round(over(dbGb, SB.diskIncludedGb) * SB.perGbDisk),
    },
    {
      label: "File storage",
      detail: `${u.storage} GB, ${SB.fileStorageIncludedGb} GB included`,
      amount: round(over(u.storage, SB.fileStorageIncludedGb) * SB.perGbFiles),
    },
    {
      label: "Realtime connections",
      detail: `${u.realtime.toLocaleString()} peak, ${SB.realtimeIncluded} included`,
      amount: round((over(u.realtime, SB.realtimeIncluded) / 1000) * SB.per1000Realtime),
    },
    {
      label: "Realtime messages",
      detail: `${(messages / 1_000_000).toFixed(0)}M, ${SB.messagesIncluded / 1_000_000}M included`,
      amount: round((over(messages, SB.messagesIncluded) / 1_000_000) * SB.perMillionMessages),
    },
  ];
  return {
    total: round(lines.reduce((a, l) => a + l.amount, 0)),
    lines,
    caveat:
      "In Supabase's favour: reads and writes are not billed per operation, so the API traffic above costs nothing here. What it does cost is compute, and sustained load means a larger instance than the one the Pro base includes. That upgrade is not modelled, so a busy app's real bill is higher than this.",
  };
}

export const SOURCES = [
  { label: "Workers pricing", href: "https://developers.cloudflare.com/workers/platform/pricing/" },
  { label: "D1 pricing", href: "https://developers.cloudflare.com/d1/platform/pricing/" },
  { label: "R2 pricing", href: "https://developers.cloudflare.com/r2/pricing/" },
  { label: "Durable Objects pricing", href: "https://developers.cloudflare.com/durable-objects/platform/pricing/" },
  { label: "Supabase pricing", href: "https://supabase.com/pricing" },
];
