import Versus from "@/components/Versus";

export default function VsSupabase() {
  return (
    <>
      <h1>voidbase compared to Supabase</h1>
      <p className="docs-lead">
        Supabase and voidbase want the same thing: a backend you can own. They disagree about what owning it should
        cost you in operations.
      </p>

      <Versus
        other="Supabase"
        rows={[
          { question: "Database", voidbase: "SQLite, through D1.", other: "Postgres, with everything Postgres has." },
          { question: "Source", voidbase: "Open, MIT.", other: "Open, Apache 2.0." },
          { question: "Self-host", voidbase: "One command into your Cloudflare account. It is the only mode.", other: "Postgres plus a handful of services, usually with Docker Compose." },
          { question: "What you operate", voidbase: "Nothing. There is no machine.", other: "A database and the services around it, or you pay them to." },
          { question: "Scaling", voidbase: "Cloudflare's, per request. No instance size to choose.", other: "A bigger instance, plus read replicas and connection pooling." },
          { question: "Cost when idle", voidbase: "Nothing.", other: "A hosted project bills for its instance whether or not anyone visits." },
          { question: "Writing server logic", voidbase: "Hooks in JavaScript, and endpoints, inside the instance.", other: "Edge functions on Deno, plus Postgres functions and triggers." },
          { question: "Where it runs", voidbase: "Every Cloudflare region.", other: "The region you picked for the project." },
        ]}
      />

      <h2>What Supabase does better</h2>
      <p>
        Postgres, and it is not close. Joins, window functions, CTEs, materialised views, full text search, PostGIS,
        pgvector, and thirty years of people knowing how to operate it. voidbase runs on SQLite through D1, which
        has no interactive transactions, a limit of 100 bound parameters per statement, and 100 columns per table.
        If your data needs Postgres, use Postgres.
      </p>
      <p>
        Row-level security is enforced by the database itself, so a rule holds no matter which client wrote the
        query. voidbase's API rules are enforced by the server, which is the same guarantee in practice and a weaker
        one in principle.
      </p>
      <p>
        It is also a much bigger project, with a company, a support contract and a large body of people who have hit
        your problem before you.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        Self-hosting that is a command rather than a project. <code>voidbase deploy</code> creates the database, the
        bucket, the queue and the realtime object in your account and puts the server on top of them. There is no
        compose file, no Postgres to upgrade, and no service to be paged about.
      </p>
      <p>
        Cost at rest, which is what decides whether a side project survives. An idle voidbase instance bills for
        stored bytes and nothing else. A hosted Postgres bills for the instance.
      </p>
      <p>
        Distance. Your code runs in whichever region the request arrives at, so someone in Sydney is not waiting on
        a database in Virginia.
      </p>

      <h2>Pick Supabase if</h2>
      <p>
        You need Postgres, or you want row-level security in the database, or your team is happy paying for a hosted
        product and would rather have the bigger ecosystem behind them.
      </p>

      <h2>Pick voidbase if</h2>
      <p>
        You want the open-source promise to be the thing you actually run, and SQLite is enough for your data, and
        you would rather have no server than a well-managed one.
      </p>
    </>
  );
}
