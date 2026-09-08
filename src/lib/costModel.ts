// The cost models behind the "What it costs" section at the end of every comparison page.
//
// An estimate whose assumptions are hidden is an advertisement. Every rate here is a published list price read off
// the vendor's own pricing page on 8 September 2026, every assumption that turns "an app" into "this many billable
// operations" is a named constant, and the section prints both. If a number here is wrong, it is wrong in one
// visible place and the source link is next to it.
//
// One rival has no numbers: Firestore's per-operation rates sit on a Google Cloud page that would not load in full,
// and a competitor's prices recalled from memory are not something to publish. That model returns null and the page
// says why rather than guessing.

export interface Usage {
  reads: number;
  writes: number;
  /** stored files, GB */
  storage: number;
  /** peak concurrent realtime connections */
  realtime: number;
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
  /** what this model leaves out, whichever way it cuts */
  caveat: string;
  /** the plan this figure is on, where it is not the paid one the page names */
  plan?: string;
}

export interface Source {
  label: string;
  href: string;
}

const over = (used: number, included: number) => Math.max(0, used - included);
const round = (n: number) => Math.round(n * 100) / 100;

// ---- what an app does, per operation ------------------------------------------------------------------------
export const ASSUME = {
  /** SQLite rows a typical read touches, with a relation expanded */
  rowsPerRead: 4,
  /** rows a write touches, counting the record and its indexes */
  rowsPerWrite: 3,
  /** CPU milliseconds a request costs, measured on this site's own instance */
  cpuMsPerRequest: 3,
  /** realtime updates pushed to each connected client a day */
  pushesPerConnectionPerDay: 50,
  /** database a million written rows occupies, GB */
  dbGbPerMillionRows: 0.5,
  /** average response size, for the plans that bill bandwidth */
  kbPerResponse: 8,
};

// ---- ours ----------------------------------------------------------------------------------------------------
export const CF = {
  base: 5,
  requestsIncluded: 10_000_000,
  perMillionRequests: 0.3,
  cpuMsIncluded: 30_000_000,
  perMillionCpuMs: 0.02,
  rowsReadIncluded: 25_000_000_000,
  perMillionRowsRead: 0.001,
  rowsWrittenIncluded: 50_000_000,
  perMillionRowsWritten: 1.0,
  dbStorageIncludedGb: 5,
  perGbDb: 0.75,
  r2PerGb: 0.015,
  doRequestsIncluded: 1_000_000,
  perMillionDoRequests: 0.15,
};

// What Cloudflare gives away before any of the above applies. Read off the same four pages as the paid rates on
// 8 September 2026, and every paid rate on those pages matched the constants above, which is some evidence the
// numbers here are being read correctly. The daily ones are daily: Cloudflare resets them each day rather than
// pooling them over a month, so a monthly figure has to be divided by thirty before it is compared.
export const CF_FREE = {
  requestsPerDay: 100_000,
  d1RowsReadPerDay: 5_000_000,
  d1RowsWrittenPerDay: 100_000,
  d1StorageGb: 5,
  doRequestsPerDay: 100_000,
  r2StorageGb: 10,
};

export interface Allowance {
  label: string;
  used: number;
  allowed: number;
  /** the period the allowance covers, said the way the reader would say it */
  per: string;
  /** what the two numbers are counted in, where they are not a plain count */
  unit?: string;
}

/**
 * Whether an app of this size costs nothing at all, and how much room is left in each allowance. This is the
 * question the pricing page raises and never answers: a bill only starts when one of these runs out, and knowing
 * which one runs out first is more use than knowing the bill.
 */
export function freePlan(u: Usage): { fits: boolean; allowances: Allowance[] } {
  const daily = (perMonth: number) => perMonth / 30;
  const apiRequests = u.reads + u.writes;
  const rowsWritten = u.writes * ASSUME.rowsPerWrite;
  const allowances: Allowance[] = [
    { label: "Worker requests", used: daily(apiRequests + u.realtime), allowed: CF_FREE.requestsPerDay, per: "a day" },
    { label: "Rows read", used: daily(u.reads * ASSUME.rowsPerRead), allowed: CF_FREE.d1RowsReadPerDay, per: "a day" },
    { label: "Rows written", used: daily(rowsWritten), allowed: CF_FREE.d1RowsWrittenPerDay, per: "a day" },
    { label: "Realtime fanout", used: daily(u.realtime * ASSUME.pushesPerConnectionPerDay * 30), allowed: CF_FREE.doRequestsPerDay, per: "a day" },
    { label: "Database storage", used: (rowsWritten / 1_000_000) * ASSUME.dbGbPerMillionRows, allowed: CF_FREE.d1StorageGb, per: "in total", unit: "GB" },
    { label: "File storage", used: u.storage, allowed: CF_FREE.r2StorageGb, per: "a month", unit: "GB" },
  ];
  return { fits: allowances.every((a) => a.used <= a.allowed), allowances };
}

/**
 * What Cloudflare would charge for an app of this size.
 *
 * The $5 Workers Paid minimum is not a floor. It is what you start paying once you leave the free plan, and until
 * then the answer is nothing at all: this site's own account runs several instances and a CI pipeline for $0. A
 * model that opened at $5 was wrong about every small app, on this page and on all six comparison pages, so the
 * free plan is checked first and the paid rates only apply past it.
 */
export function voidbaseCost(u: Usage): Estimate {
  const free = freePlan(u);
  if (free.fits) {
    const room = (a: Allowance) => `${Math.round((a.used / a.allowed) * 100)}% of the free allowance`;
    return {
      total: 0,
      plan: "Workers Free, D1, R2, Durable Objects",
      lines: [
        { label: "Workers Free", detail: "no account minimum", amount: 0 },
        ...free.allowances.map((a) => ({ label: a.label, detail: room(a), amount: 0 })),
      ],
      caveat:
        "Nothing is billed at this size: every one of these is inside what Cloudflare gives away. The first of them to run out puts the account on Workers Paid, and the whole bill starts there rather than just that line.",
    };
  }

  const apiRequests = u.reads + u.writes;
  const requests = apiRequests + u.realtime; // a websocket connection is one request; its messages are not
  const cpuMs = apiRequests * ASSUME.cpuMsPerRequest;
  const rowsRead = u.reads * ASSUME.rowsPerRead;
  const rowsWritten = u.writes * ASSUME.rowsPerWrite;
  const dbGb = (rowsWritten / 1_000_000) * ASSUME.dbGbPerMillionRows;
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
      detail: `${ASSUME.cpuMsPerRequest}ms a request`,
      amount: round((over(cpuMs, CF.cpuMsIncluded) / 1_000_000) * CF.perMillionCpuMs),
    },
    {
      label: "Database rows",
      detail: `${(rowsRead / 1_000_000).toFixed(0)}M read, ${(rowsWritten / 1_000_000).toFixed(1)}M written`,
      amount: round(
        (over(rowsRead, CF.rowsReadIncluded) / 1_000_000) * CF.perMillionRowsRead +
          (over(rowsWritten, CF.rowsWrittenIncluded) / 1_000_000) * CF.perMillionRowsWritten,
      ),
    },
    {
      label: "Database storage",
      detail: `${dbGb.toFixed(1)} GB, ${CF.dbStorageIncludedGb} GB included`,
      amount: round(over(dbGb, CF.dbStorageIncludedGb) * CF.perGbDb),
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
      "No per-user charge: signing in is an ordinary request, so monthly active users do not appear at all. Durable object compute is left out, because a hibernating connection bills none.",
  };
}

// ---- free tiers --------------------------------------------------------------------------------------------------
//
// Most of these products have one, and pricing a side project at $25 against a voidbase that costs nothing would be
// the same error in the other direction. So each vendor's free allowances are modelled the way Cloudflare's are,
// read off the same pricing page as their paid rates on 8 September 2026, and an app that fits inside them costs
// nothing here too. At the smallest slider settings that is what happens to all of them at once.
//
// Two of them pause a free project after a week of inactivity, which is a real difference from an allowance that
// simply resets, so the plan says so rather than leaving $0 to speak for itself.

/** $0 when every allowance holds, and null when one does not, so the caller falls through to its paid model */
function freeTier(plan: string, allowances: Allowance[], caveat: string): Estimate | null {
  if (!allowances.every((a) => a.used <= a.allowed)) return null;
  const room = (a: Allowance) => `${Math.round((a.used / a.allowed) * 100)}% of the free allowance`;
  return {
    total: 0,
    plan,
    lines: [
      { label: plan, detail: "no charge", amount: 0 },
      ...allowances.map((a) => ({ label: a.label, detail: room(a), amount: 0 })),
    ],
    caveat,
  };
}

// ---- the rivals ------------------------------------------------------------------------------------------------
export interface Rival {
  name: string;
  plan: string;
  /** null when we could not read the rates off the vendor's page, with `why` explaining */
  estimate: ((u: Usage) => Estimate) | null;
  why?: string;
  source: Source;
  /** which latency profile this product has, for the speed section */
  shape: "region" | "machine" | "cloud";
  shapeNote: string;
  /** how its realtime reaches a browser, for the speed table */
  realtime?: string;
}

const gbOut = (u: Usage) => ((u.reads + u.writes) * ASSUME.kbPerResponse) / 1_000_000; // KB to GB

export const RIVALS: Record<string, Rival> = {
  supabase: {
    name: "Supabase",
    plan: "Pro",
    source: { label: "supabase.com/pricing", href: "https://supabase.com/pricing" },
    shape: "region",
    shapeNote: "One region per project, with the database next to the code.",
    realtime: "Postgres replication broadcast over websockets, billed by peak connection and by message",
    estimate: (u) => {
      const messages = u.realtime * ASSUME.pushesPerConnectionPerDay * 30;
      const dbGb = ((u.writes * ASSUME.rowsPerWrite) / 1_000_000) * ASSUME.dbGbPerMillionRows;
      const free = freeTier(
        "Free",
        [
          { label: "Monthly active users", used: u.mau, allowed: 50_000, per: "a month" },
          { label: "Database", used: dbGb, allowed: 0.5, per: "in total", unit: "GB" },
          { label: "File storage", used: u.storage, allowed: 1, per: "in total", unit: "GB" },
          { label: "Egress", used: gbOut(u), allowed: 5, per: "a month", unit: "GB" },
          { label: "Realtime connections", used: u.realtime, allowed: 200, per: "at peak" },
          { label: "Realtime messages", used: messages, allowed: 2_000_000, per: "a month" },
        ],
        "Free on Supabase's own terms: two active projects, and a project is paused after a week without traffic. An app that has to stay up through a quiet week is on Pro whatever the numbers say.",
      );
      if (free) return free;
      const lines: Line[] = [
        { label: "Pro base", detail: "one project, one instance", amount: 25 },
        { label: "Monthly active users", detail: `${(u.mau / 1000).toFixed(0)}k, 100k included`, amount: round(over(u.mau, 100_000) * 0.00325) },
        { label: "Database disk", detail: `${dbGb.toFixed(1)} GB, 8 GB included`, amount: round(over(dbGb, 8) * 0.125) },
        { label: "File storage", detail: `${u.storage} GB, 100 GB included`, amount: round(over(u.storage, 100) * 0.0213) },
        { label: "Realtime connections", detail: `${u.realtime.toLocaleString()} peak, 500 included`, amount: round((over(u.realtime, 500) / 1000) * 10) },
        { label: "Realtime messages", detail: `${(messages / 1_000_000).toFixed(0)}M, 5M included`, amount: round((over(messages, 5_000_000) / 1_000_000) * 2.5) },
      ];
      return {
        total: round(lines.reduce((a, l) => a + l.amount, 0)),
        lines,
        caveat:
          "In Supabase's favour: reads and writes are not billed per operation, so all the API traffic above costs nothing here. What it does cost is compute, and sustained load means a larger instance than the Pro base includes. That upgrade is not modelled, so a busy app's real bill is higher than this.",
      };
    },
  },

  convex: {
    name: "Convex",
    plan: "Professional",
    source: { label: "convex.dev/pricing", href: "https://www.convex.dev/pricing" },
    shape: "region",
    shapeNote: "Their cloud, with the database beside the functions.",
    realtime: "Reactive queries: the server recomputes and pushes, which is more than a subscription",
    estimate: (u) => {
      // reactivity is the product: a subscribed query recomputes when its inputs change, and a recompute is a call
      const pushes = u.realtime * ASSUME.pushesPerConnectionPerDay * 30;
      const calls = u.reads + u.writes + pushes;
      const dbGb = ((u.writes * ASSUME.rowsPerWrite) / 1_000_000) * ASSUME.dbGbPerMillionRows;
      const egress = gbOut(u);
      const free = freeTier(
        "Free",
        [
          { label: "Function calls", used: calls, allowed: 1_000_000, per: "a month" },
          { label: "Database storage", used: dbGb, allowed: 0.5, per: "in total", unit: "GB" },
          { label: "File storage", used: u.storage, allowed: 1, per: "in total", unit: "GB" },
          { label: "Data egress", used: egress, allowed: 1, per: "a month", unit: "GB" },
        ],
        "The reactive re-runs above count against the free million calls as well, which is what a subscription costs here whether or not anything is being paid.",
      );
      if (free) return free;
      const lines: Line[] = [
        { label: "Professional base", detail: "one developer", amount: 25 },
        { label: "Function calls", detail: `${(calls / 1_000_000).toFixed(1)}M including ${(pushes / 1_000_000).toFixed(1)}M reactive re-runs, 25M included`, amount: round((over(calls, 25_000_000) / 1_000_000) * 2) },
        { label: "Database storage", detail: `${dbGb.toFixed(1)} GB, 50 GB included`, amount: round(over(dbGb, 50) * 0.2) },
        { label: "File storage", detail: `${u.storage} GB, 100 GB included`, amount: round(over(u.storage, 100) * 0.03) },
        { label: "Data egress", detail: `${egress.toFixed(0)} GB, 50 GB included`, amount: round(over(egress, 50) * 0.12) },
      ];
      return {
        total: round(lines.reduce((a, l) => a + l.amount, 0)),
        lines,
        caveat:
          "Reactive re-runs are counted as function calls, which is the assumption most likely to be wrong here and the one that decides this column: Convex may well batch or dedupe them. Query and mutation compute is free on this plan, and database bandwidth and action compute are not modelled. Convex bills per developer, so a team of five starts at five times the base.",
      };
    },
  },

  appwrite: {
    name: "Appwrite Cloud",
    plan: "Pro",
    source: { label: "appwrite.io/pricing", href: "https://appwrite.io/pricing" },
    shape: "region",
    shapeNote: "Their cloud, or a host you run yourself, in one place either way.",
    realtime: "Websocket channels, included in the plan and bounded by the host",
    estimate: (u) => {
      // realtime is not metered separately on the plan, but what it pushes is bandwidth like anything else
      const pushes = u.realtime * ASSUME.pushesPerConnectionPerDay * 30;
      const bandwidth = gbOut(u) + (pushes * 1) / 1_000_000; // ~1KB a push
      const free = freeTier(
        "Free",
        [
          { label: "Monthly active users", used: u.mau, allowed: 75_000, per: "a month" },
          { label: "Reads", used: u.reads, allowed: 500_000, per: "a month" },
          { label: "Writes", used: u.writes, allowed: 250_000, per: "a month" },
          { label: "Storage", used: u.storage, allowed: 2, per: "in total", unit: "GB" },
          { label: "Bandwidth", used: bandwidth, allowed: 5, per: "a month", unit: "GB" },
          { label: "Realtime connections", used: u.realtime, allowed: 250, per: "at peak" },
          { label: "Realtime messages", used: pushes, allowed: 2_000_000, per: "a month" },
        ],
        "Free on Appwrite's own terms: two projects, one database and one bucket each, and a project is paused after a week without traffic.",
      );
      if (free) return free;
      const lines: Line[] = [
        { label: "Pro base", detail: "one member, $10 of database credit", amount: 25 },
        { label: "Monthly active users", detail: `${(u.mau / 1000).toFixed(0)}k, 200k included`, amount: round((over(u.mau, 200_000) / 1000) * 3) },
        { label: "Reads", detail: `${(u.reads / 1_000_000).toFixed(1)}M`, amount: round((u.reads / 100_000) * 0.06) },
        { label: "Writes", detail: `${(u.writes / 1_000_000).toFixed(1)}M`, amount: round((u.writes / 100_000) * 0.1) },
        { label: "Storage", detail: `${u.storage} GB, 150 GB included`, amount: round((over(u.storage, 150) / 100) * 2.8) },
        { label: "Bandwidth", detail: `${bandwidth.toFixed(0)} GB including realtime pushes, 2 TB included`, amount: round((over(bandwidth, 2000) / 100) * 15) },
      ];
      const total = round(Math.max(25, lines.reduce((a, l) => a + l.amount, 0) - 10));
      return {
        total,
        lines: [...lines, { label: "Database credit", detail: "included every month", amount: -10 }],
        caveat:
          "Realtime connections are included in the plan rather than billed per connection, so only what they push shows up, as bandwidth. The $10 of monthly database credit is subtracted and the bill floors at the $25 base. Reads and writes are charged from the first one rather than after an allowance, which is what makes this column move quickly.",
      };
    },
  },

  encore: {
    name: "Encore Cloud",
    plan: "Pro",
    source: { label: "encore.dev/pricing", href: "https://encore.dev/pricing" },
    shape: "cloud",
    shapeNote: "Your own AWS or GCP region, so the same single-region trade.",
    realtime: "None to a browser. Pub/sub is between services; this is yours to build",
    estimate: (u) => {
      // Encore's Starter plan is free forever and gives you two dev environments and a million trace events. It
      // does not give you a production environment, which is the $99 line below and the thing this app needs, so
      // there is no size of app on these sliders that it makes free.
      const events = (u.reads + u.writes) / 1_000_000;
      const lines: Line[] = [
        { label: "Pro base", detail: "one member", amount: 49 },
        { label: "Environment", detail: "one production environment", amount: 99 },
        { label: "Resources", detail: "6 at $2.50: services, database, bucket, cron, queue, secrets", amount: 15 },
        { label: "Tracing events", detail: `${events.toFixed(0)}M, 20M included`, amount: round(over(events, 20) * 1.2) },
      ];
      return {
        total: round(lines.reduce((a, l) => a + l.amount, 0)),
        lines,
        caveat:
          "Their Starter plan is free forever, but it covers development: two dev environments and a million trace events, not the production environment this one prices. There is no realtime line because there is no realtime product: pushing to a browser is something you would build and run on your own infrastructure. This is Encore's platform fee only. The infrastructure runs in your own AWS or GCP account and that cloud bills you directly for compute, storage and data transfer, which is not modelled here and is usually the larger half. The voidbase column, by contrast, is the whole bill.",
      };
    },
  },

  pocketbase: {
    name: "PocketBase",
    plan: "on a server you rent",
    source: { label: "no vendor pricing: it is a binary", href: "https://pocketbase.io/docs/going-to-production/" },
    shape: "machine",
    shapeNote: "One machine, wherever you put it, with SQLite on its own disk.",
    realtime: "Server-sent events from the process itself, pushed straight from memory",
    estimate: (u) => {
      // no vendor to quote, so the assumption is stated: a small VPS, sized up as the data grows
      const vps = u.storage > 500 || u.reads > 100_000_000 ? 48 : u.storage > 100 || u.reads > 20_000_000 ? 24 : 12;
      const backups = round(u.storage * 0.02);
      const lines: Line[] = [
        { label: "The server", detail: vps === 12 ? "a 2 GB VPS" : vps === 24 ? "a 4 GB VPS" : "an 8 GB VPS", amount: vps },
        { label: "Backups off the box", detail: `${u.storage} GB of object storage`, amount: backups },
      ];
      return {
        total: round(lines.reduce((a, l) => a + l.amount, 0)),
        lines,
        caveat:
          "Realtime costs nothing either, but the sockets are held by that one machine, which is what sizes it. PocketBase costs nothing; the machine does. This assumes a VPS sized to the data and object storage for backups, and it is the honest cheap answer at small scale. It leaves out the thing that actually costs: somebody patching, restarting and restoring it, and the request that arrives while the one box is down.",
      };
    },
  },

  firebase: {
    name: "Firebase",
    plan: "Blaze",
    estimate: null,
    why:
      "Firestore's per-operation rates live on a Google Cloud pricing page that would not load in full when this was built, and putting a competitor's prices on a public page from memory is not a thing worth doing. The free tier is documented and generous, 50,000 reads and 20,000 writes a day. The paid rates are the ones that decide a comparison, and they will appear here when they can be quoted from the source rather than recalled.",
    source: { label: "firebase.google.com/pricing", href: "https://firebase.google.com/pricing" },
    shape: "region",
    shapeNote: "Google's, with multi-region options for Firestore.",
    realtime: "Listeners wired into the offline cache, with every delivered document billed as a read",
  },
};

export const OUR_SOURCES: Source[] = [
  { label: "Workers", href: "https://developers.cloudflare.com/workers/platform/pricing/" },
  { label: "D1", href: "https://developers.cloudflare.com/d1/platform/pricing/" },
  { label: "R2", href: "https://developers.cloudflare.com/r2/pricing/" },
  { label: "Durable Objects", href: "https://developers.cloudflare.com/durable-objects/platform/pricing/" },
];
