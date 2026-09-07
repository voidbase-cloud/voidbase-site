import ProductMark from "@/components/ProductMark";
import Versus from "@/components/Versus";
import "@/scss/why.scss";

export default function VsSupabase() {
  return (
    <article className="why">
      <span className="why-eyebrow">Compared to</span>
      <div className="why-marks">
        <ProductMark id="voidbase" size={40} />
        <span className="why-vs">vs</span>
        <ProductMark id="supabase" size={40} />
      </div>
      <h1>voidbase compared to Supabase</h1>
      <p className="docs-lead">
        Supabase and voidbase want the same thing: a backend you can own. They disagree about what owning it should
        cost you in operations.
      </p>

      <Versus
        other="Supabase"
        logo={<ProductMark id="supabase" size={18} />}
        rows={[
          { q: "Database", vb: ["depends", "SQLite through D1. No interactive transactions, 100 bound parameters per statement, 100 columns per table."], them: ["yes", "Postgres, with joins, extensions and thirty years of tooling."] },
          { q: "Source", vb: ["yes", "Open, MIT."], them: ["yes", "Open, Apache 2.0."] },
          { q: "Self-host", vb: ["yes", "One command into your Cloudflare account. It is the only mode."], them: ["depends", "Possible and documented. Postgres plus a handful of services, usually with Docker Compose."] },
          { q: "What you operate", vb: ["yes", "Nothing. There is no machine."], them: ["no", "A database and the services around it, or you pay them to."] },
          { q: "Rules enforced by", vb: ["depends", "The server, on every request. The same guarantee in practice, a weaker one in principle."], them: ["yes", "Postgres itself, through row-level security."] },
          { q: "Server logic", vb: ["depends", "Hooks and endpoints in JavaScript, inside the instance."], them: ["yes", "Edge functions on Deno, plus Postgres functions and triggers."] },
          { q: "Scaling", vb: ["yes", "Per request, automatically. No instance size to choose."], them: ["depends", "A bigger instance, plus read replicas and connection pooling."] },
          { q: "Where it runs", vb: ["yes", "Every Cloudflare region."], them: ["depends", "The region you picked for the project."] },
          { q: "Cost when idle", vb: ["yes", "Nothing."], them: ["no", "A hosted project bills for its instance whether or not anyone visits."] },
          { q: "Ecosystem", vb: ["no", "Young, and small. You may be the first to hit a given bug."], them: ["yes", "A company, support, and a large body of people who hit it before you."] },
        ]}
      />

      <h2>What Supabase does better</h2>
      <p>
        Postgres, and it is not close. Joins, window functions, materialised views, full text search, PostGIS and
        pgvector, on a database people know how to operate. voidbase runs on SQLite through D1, with the limits in
        the table above. If your data needs Postgres, use Postgres.
      </p>
      <p>
        Row-level security is enforced by the database, so a rule holds no matter which client wrote the query.
        voidbase enforces API rules in the server, which is the same thing in practice and a weaker claim in
        principle.
      </p>
      <p>
        It is also a far bigger project, with a company behind it, a support contract if you want one, and a large
        body of people who have hit your problem already.
      </p>

      <h2>What voidbase does better</h2>
      <p>
        Self-hosting that is a command rather than a project. <code>voidbase deploy</code> creates the database, the
        bucket, the queue and the realtime object in your account and puts the server on top of them. No compose
        file, no Postgres to upgrade, no service to be paged about.
      </p>
      <p>
        Cost at rest, which decides whether a side project survives. An idle voidbase instance bills for stored bytes
        and nothing else. A hosted Postgres bills for the instance.
      </p>
      <p>
        Distance. Your code runs in whichever region the request arrives at, so someone in Sydney is not waiting on a
        database in Virginia.
      </p>

      <div className="why-picks">
        <div className="why-pick is-them">
          <h3>Pick Supabase if</h3>
          <p>
            You need Postgres, or you want the rules enforced in the database, or your team is happy paying for a
            hosted product and would rather have the bigger ecosystem behind them.
          </p>
        </div>
        <div className="why-pick is-us">
          <h3>Pick voidbase if</h3>
          <p>
            You want the open-source promise to be the thing you actually run, SQLite is enough for your data, and
            you would rather have no server than a well-managed one.
          </p>
        </div>
      </div>
    </article>
  );
}
