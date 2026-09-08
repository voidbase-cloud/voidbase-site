// What is coming, in two halves. The first came out of writing the comparison pages honestly, so every item in it
// is a row that carries an amber mark and the two stay true to each other: nothing is amber unless it is here, and
// nothing is here without a design. The second is where we are taking the product regardless of what anyone else
// does. Both are plans. Neither is a shipped feature.
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
      <h1>Roadmap</h1>
      <p className="docs-lead">
        Two halves. The gaps other backends showed us, and the things we want to build regardless of what anyone
        else does.
      </p>

      <p>
        Everything here is a plan, not a shipped feature. An item earns its place by having a design, not by being
        desirable. In the first half that rule is visible on the comparison pages: a row is amber only when it is
        listed below, and a gap with no answer yet stays a red cross.
      </p>

      <h2>From the comparisons</h2>
      <p>
        Writing the <Link href="/docs/why">comparison pages</Link> was the most useful research we have done,
        because it produced a list of things other people do better. Each item below is a row on one of those pages
        marked amber rather than red.
      </p>

      <h3 className="why-group">Transactions and the database limits</h3>
      <Item
        title="Real transactions, and fewer platform limits"
        from="PocketBase has interactive transactions and no bound-parameter or column ceiling. Convex is transactional by design. We have neither."
        now="Every write validates first and then runs as one atomic D1 batch. That is atomic, but it is not a transaction: hook code cannot open one, reads inside a batch cannot depend on a write earlier in the same batch, and D1 caps a statement at 100 bound parameters and a table at 100 columns."
        plan="Move an instance's data into its own SQLite-backed Durable Object instead of a D1 database. The object is a single writer, so transactionSync gives real interactive transactions, the caches never need invalidating, and the D1 statement limits stop applying. The database layer already goes through one interface with a swappable implementation, which is what makes this a replacement rather than a rewrite."
        size="Large. The interface exists; the work is the adapter, the migration path for instances that already hold data, and proving equivalence against the existing suites."
      />

      <h3 className="why-group">Offline</h3>
      <Item
        title="Writes that survive a tunnel"
        from="Firebase caches writes on the device and reconciles them when the network returns, and has done for a decade."
        now="Nothing. A request that fails is a request your code has to handle."
        plan="Two pieces, in order. A service worker that queues mutations and replays them on reconnect, which needs no change to the API and works with the existing SDK. Then a client of our own that reads through a local store so a screen renders before the network answers, which is the part that needs the typed client below to exist first."
        size="Medium for the queue, large for the local store. The queue is worth shipping alone."
      />

      <h3 className="why-group">Types</h3>
      <Item
        title="A typed client generated from your collections"
        from="Convex types the whole path from schema to component, so a rename breaks the build. Ours breaks at the call instead."
        now="The PocketBase SDK is typed, but it knows nothing about your collections: a record is a bag of fields, and a renamed field is a runtime surprise."
        plan="Generate a typed client from the collections the instance actually has, the way the schema already generates the API. A command writes it, the build refreshes it, and a rename becomes a compile error. The collection definitions are already data on the server, so nothing new has to be described."
        size="Medium, and it does not touch the server."
      />

      <h3 className="why-group">Operations</h3>
      <Item
        title="Cloudflare's observability, on by default"
        from="Every hosted competitor shows you what your backend is doing. Ours makes you go and look."
        now="Errors reach Workers Logs if your code logs them, and the platform's own request data is there for anyone who opens the dashboard. Neither is set up for you or surfaced anywhere."
        plan="Turn on Workers Observability at deploy so logs and traces are retained without being asked for, sample the request path into an Analytics Engine dataset the deploy already knows how to create, and put the instance's own numbers behind the admin panel: requests, errors, slow endpoints, and which hooks are costing the CPU."
        size="Small for the wiring, medium for the panel screens."
      />

      <h2>Where we are taking it</h2>
      <p>
        These are not gaps anyone pointed at. They are the shape we want the product to have, and each one is a
        design rather than a wish.
      </p>

      <h3 className="why-group">Plugins</h3>
      <Item
        title="pb_plugins, with a marketplace"
        from="Every instance ends up needing the same handful of things, and everyone writes them again."
        now="A hook file, copied between projects by hand. There is no way to install one, version it, or find one somebody else wrote."
        plan="A pb_plugins directory beside the hooks, holding installed plugins the same way pb_hooks holds your own code. A plugin declares what it needs, adds routes, hooks, collections and panel screens, and is installed and updated by name. Core plugins ship with voidbase, official ones are ours and versioned with it, and a marketplace lists what the community has published so installing one does not mean trusting a gist."
        size="Large, and the order matters. The loader and the manifest first, because everything else is a plugin once those exist."
      />

      <h3 className="why-group">Backups worth relying on</h3>
      <Item
        title="Enterprise backup, as an official plugin"
        from="The built-in backup is a zip in the same account as the thing it is backing up."
        now="Backups are archives written to R2 on a schedule, restorable from the panel. Good enough to undo a mistake, not good enough to survive losing the account."
        plan="An official plugin that takes the whole instance, not only the rows. Two modes, because they answer different fears. A complete instance backup captures the database, the files, the configuration and the schema so the instance can be rebuilt from nothing. A data-only backup captures the rows and files for moving between environments or restoring after a bad migration. Both use Cloudflare's own storage and both are scheduled, verified and restorable without a support ticket."
        size="Medium. The archive format exists; the work is completeness, verification, and a restore path that is tested rather than assumed."
      />

      <h3 className="why-group">Previews</h3>
      <Item
        title="Preview environments, as an official plugin"
        from="A pull request that changes the schema cannot be reviewed against production, and reviewing it against nothing is not reviewing it."
        now="A branch build checks the configuration it would deploy with and stops there, which is safe and unhelpful. There is nowhere to click."
        plan="A preview per pull request, in the shape that fits the change. Either a new instance for the branch, using Cloudflare's own preview deployments, seeded from the production schema so the reviewer gets a working address that disappears on merge. Or, where an instance is expensive or the data matters, the same instance with the branch's writes flagged as preview and filtered out of production reads, which makes a preview a query rather than a deploy. The plugin picks based on what the change touches, and the pull request gets the address either way."
        size="Large, and it lands after the plugin loader, because it is the first thing worth building on top of it."
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

      <h2>Where the first half came from</h2>
      <p>
        Each item in it is a row on one of the comparison pages:{" "}
        <Link href="/docs/why/pocketbase">PocketBase</Link> and <Link href="/docs/why/convex">Convex</Link> for
        transactions and types, <Link href="/docs/why/firebase">Firebase</Link> for offline, and all of them for
        observability. That is the point of writing comparisons honestly: the list of things to build falls out of
        it.
      </p>
    </article>
  );
}
