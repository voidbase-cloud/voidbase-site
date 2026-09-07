// What the comparison pages turned up, turned into work. Every item here is a row somewhere in this section that
// carries an amber mark, so the two stay honest about each other: nothing is amber unless it is on this page, and
// nothing is on this page without a design.
import { Link } from "@void/react";
import "@/scss/why.scss";

function Item({
  title,
  from,
  now,
  plan,
  size,
}: {
  title: string;
  from: string;
  now: string;
  plan: string;
  size: string;
}) {
  return (
    <section className="why-item">
      <h3>{title}</h3>
      <p className="why-item-from">{from}</p>
      <dl className="why-item-body">
        <dt>Today</dt>
        <dd>{now}</dd>
        <dt>The plan</dt>
        <dd>{plan}</dd>
        <dt>Size</dt>
        <dd>{size}</dd>
      </dl>
    </section>
  );
}

export default function DocsRoadmap() {
  return (
    <article className="why">
      <span className="why-eyebrow">The roadmap</span>
      <h1>What we are going to fix</h1>
      <p className="docs-lead">
        Writing the comparison pages was the most useful research we have done, because it produced a list of things
        other people do better. This is that list, with what we intend to do about each one.
      </p>

      <p>
        Everything here is a plan, not a shipped feature, and the pages that link to it mark these rows amber rather
        than green for exactly that reason. An item earns a place here by having a design, not by being desirable. If
        a gap has no answer yet it stays a red cross on the comparison page and is not listed.
      </p>

      <h2>Transactions and the database limits</h2>
      <Item
        title="Real transactions, and fewer platform limits"
        from="PocketBase has interactive transactions and no bound-parameter or column ceiling. Convex is transactional by design. We have neither."
        now="Every write validates first and then runs as one atomic D1 batch. That is atomic, but it is not a transaction: hook code cannot open one, reads inside a batch cannot depend on a write earlier in the same batch, and D1 caps a statement at 100 bound parameters and a table at 100 columns."
        plan="Move an instance's data into its own SQLite-backed Durable Object instead of a D1 database. The object is a single writer, so transactionSync gives real interactive transactions, the caches never need invalidating, and the D1 statement limits stop applying. The database layer already goes through one interface with a swappable implementation, which is what makes this a replacement rather than a rewrite."
        size="Large. The interface exists; the work is the adapter, the migration path for instances that already hold data, and proving equivalence against the existing suites."
      />

      <h2>Offline</h2>
      <Item
        title="Writes that survive a tunnel"
        from="Firebase caches writes on the device and reconciles them when the network returns, and has done for a decade."
        now="Nothing. A request that fails is a request your code has to handle."
        plan="Two pieces, in order. A service worker that queues mutations and replays them on reconnect, which needs no change to the API and works with the existing SDK. Then a client of our own that reads through a local store so a screen renders before the network answers, which is the part that needs the typed client below to exist first."
        size="Medium for the queue, large for the local store. The queue is worth shipping alone."
      />

      <h2>Types</h2>
      <Item
        title="A typed client generated from your collections"
        from="Convex types the whole path from schema to component, so a rename breaks the build. Ours breaks at the call instead."
        now="The PocketBase SDK is typed, but it knows nothing about your collections: a record is a bag of fields, and a renamed field is a runtime surprise."
        plan="Generate a typed client from the collections the instance actually has, the way the schema already generates the API. A command writes it, the build refreshes it, and a rename becomes a compile error. The collection definitions are already data on the server, so nothing new has to be described."
        size="Medium, and it does not touch the server."
      />

      <h2>Operations</h2>
      <Item
        title="Cloudflare's observability, on by default"
        from="Every hosted competitor shows you what your backend is doing. Ours makes you go and look."
        now="Errors reach Workers Logs if your code logs them, and the platform's own request data is there for anyone who opens the dashboard. Neither is set up for you or surfaced anywhere."
        plan="Turn on Workers Observability at deploy so logs and traces are retained without being asked for, sample the request path into an Analytics Engine dataset the deploy already knows how to create, and put the instance's own numbers behind the admin panel: requests, errors, slow endpoints, and which hooks are costing the CPU."
        size="Small for the wiring, medium for the panel screens."
      />

      <h2>Not on this list</h2>
      <p>
        Some of the crosses on the comparison pages are staying crosses, and it is more useful to say which than to
        imply everything is coming.
      </p>
      <ul>
        <li>
          <strong>Postgres.</strong> voidbase is SQLite-shaped through and through. If your data needs Postgres,{" "}
          <Link href="/docs/why/supabase">Supabase</Link> is the answer and always will be.
        </li>
        <li>
          <strong>Crash reporting, push notifications and analytics products.</strong> Firebase has a suite around
          the backend. We are a backend.
        </li>
        <li>
          <strong>Server code in other languages.</strong> Hooks are JavaScript, because they run in the Worker
          alongside everything else.
        </li>
        <li>
          <strong>Running anywhere.</strong> Deployment targets Cloudflare. The standalone binary runs on your own
          machine, but an air-gapped cluster is not a thing we are building for.
        </li>
        <li>
          <strong>Being older than we are.</strong> Ecosystem and maturity are earned by time, and no roadmap item
          fixes them.
        </li>
      </ul>

      <h2>Where this came from</h2>
      <p>
        Each item above is a row on one of the comparison pages:{" "}
        <Link href="/docs/why/pocketbase">PocketBase</Link> and <Link href="/docs/why/convex">Convex</Link> for
        transactions and types, <Link href="/docs/why/firebase">Firebase</Link> for offline, and all of them for
        observability. That is the point of writing comparisons honestly: the list of things to build falls out of
        it.
      </p>
    </article>
  );
}
