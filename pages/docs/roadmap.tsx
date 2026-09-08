// What is coming, in three sections. The first came out of writing the comparison pages honestly, so every item in
// it is a row that carries an amber mark and the two stay true to each other: nothing is amber unless it is here,
// and nothing is here without a design. The second is the core, and the third is the plugins we intend to ship on
// top of it. All three are plans. None of them is a shipped feature.
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
        Three sections. The gaps other backends showed us, the shape we want the core to have, and the plugins we
        intend to ship on top of it.
      </p>

      <p>
        Everything here is a plan, not a shipped feature. An item earns its place by having a design, not by being
        desirable. In the first section that rule is visible on the comparison pages: a row is amber only when it
        is listed below, and a gap with no answer yet stays a red cross.
      </p>

      <h2>From the comparisons</h2>
      <p>
        Writing the <Link href="/docs/why">comparison pages</Link> was the most useful research we have done,
        because it produced a list of things other people do better. Each item in this section is a row on one of
        those pages marked amber rather than red.
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
        Three changes to the core that nobody pointed at. They are the shape we want voidbase to have, and the last
        of them is what the whole section after it stands on.
      </p>

      <h3 className="why-group">Auth</h3>
      <Item
        title="Better Auth, natively"
        from="Void ships Better Auth. voidbase ships PocketBase's. An app built on the voidbase stack has to pick one and work around the other."
        now="Authentication is PocketBase's: auth collections, its token format, its OAuth flow and the SDK's authStore. That is the right default, because wire compatibility is the point of the project and every existing client expects it."
        plan="Better Auth as a first-class option beside it, over the same user records rather than a second set of them. The stack's pages and the instance's API then agree on who is signed in, one session covers both, and Better Auth's own plugins for organisations, passkeys and two-factor become available without us writing each one again. PocketBase's auth stays exactly where it is, because the compatibility depends on it."
        size="Large. The hard part is one identity behind two token formats, not two auth systems living side by side."
      />

      <h3 className="why-group">Upgrading a running instance</h3>
      <Item
        title="Moving an instance onto a newer release, in place"
        from="Every way of running voidbase can be updated except the one that was meant to be the easiest. A CLI install runs one command; a cloud instance waits for us."
        now="voidbase update covers the executable, a global install and a project's dependency, and a deploy puts the new version live. voidbase cloud provisions from the release it holds, so instances that already exist stay on the release they were created with."
        plan="An upgrade for an instance the control plane owns: re-deploy it onto the active release, run the migrations the new version brings, and keep its database, its files, its custom domains and its secrets exactly where they are. Roll it per instance rather than to everyone at once, and make it reversible, because an upgrade you cannot undo is one nobody presses."
        size="Medium. Provisioning already writes a Worker from a release; the work is doing it to an instance that has data, and proving the rollback."
      />

      <h3 className="why-group">Plugins</h3>
      <Item
        title="pb_plugins, with a marketplace"
        from="Every instance ends up needing the same handful of things, and everyone writes them again."
        now="A hook file, copied between projects by hand. There is no way to install one, version it, or find one somebody else wrote."
        plan="A pb_plugins directory beside the hooks, holding installed plugins the same way pb_hooks holds your own code. A plugin declares what it needs, adds routes, hooks, collections and panel screens, and is installed and updated by name. Core plugins ship with voidbase, official ones are ours and versioned with it, and a marketplace lists what the community has published so installing one does not mean trusting a gist."
        size="Large, and the order matters. The loader and the manifest first, because everything else is a plugin once those exist."
      />

      <h2>The official plugins</h2>
      <p>
        Everything below is a plugin, which is why the loader comes first. These are ours: they ship with voidbase,
        are versioned with it, and are supported like the rest of it. The order is roughly the order we would build
        them in.
      </p>

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
        size="Large, and it lands after the plugin loader, because it is the one that exercises every part of it."
      />

      <h3 className="why-group">AI</h3>
      <Item
        title="Workers AI and Think, as official plugins"
        from="The instance already runs on the network that serves the models, and it already runs a Durable Object for realtime. Calling a third-party API to add a chat box is the long way round."
        now="Nothing. A hook can call Workers AI because a hook can call anything, and that is the whole of the support."
        plan="Plugins built on Cloudflare's Think harness, which is a chat agent over Durable Object SQLite with Workers AI behind it. One puts a chat in the admin panel that can read the instance's own schema, records and logs, so finding where something lives is a question rather than a search. One does the same inside a preview environment, where the thing worth asking about is the change under review. And because a Think agent can be driven as a sub-agent over RPC, the third is a chat your own app mounts, scoped to the collections you let it read."
        size="Medium each, and all three want the plugin loader first."
      />

      <h3 className="why-group">Payments</h3>
      <Item
        title="Payment providers, as official plugins"
        from="Taking money is the first thing most projects add and the last thing anyone wants to write a second time."
        now="Nothing in the box. The webhook endpoint is a hook you write, and the reconciliation is yours to get right."
        plan="One plugin per provider over a shared shape, starting with Stripe, Polar and Lemon Squeezy. Each owns its webhook route, verifies signatures, and writes customers, subscriptions and payments into collections you query like any other. Changing provider becomes changing which plugin is installed, and the shared shape is what makes the next provider cheap to add."
        size="Medium for the first. Small for each one after it."
      />

      <h3 className="why-group">Editing content</h3>
      <Item
        title="Rich text you edit where it renders"
        from="Editing a markdown field in an admin panel means editing it away from the page it appears on."
        now="The panel edits records and your site reads them. Nothing links a block on the page to the field behind it."
        plan="A plugin that binds a block on your own site to the field it came from. A signed-in admin gets contenteditable on that block with a markdown toolbar over it, edits in place, and the save writes the field back through the same rules as any other write. The content stays markdown in a collection, so it is still queryable and still exports, and none of it turns into a document only one editor can open."
        size="Medium. A small client script, a field-level permission check, and a toolbar."
      />

      <h3 className="why-group">Commerce</h3>
      <Item
        title="A shop the other plugins plug into"
        from="Once payments, files, auth and editable content are all in the box, what is left of a shop is the part nobody enjoys building."
        now="Nothing. You build it on collections, and everybody builds it differently."
        plan="An official commerce plugin holding the parts that are the same everywhere: products and variants, inventory, carts, orders, tax, shipping, refunds and an audit trail. It declares its extension points, so a payment plugin supplies checkout, a shipping plugin supplies rates, and a plugin of your own supplies whatever your business does that nobody else's does."
        size="Large, and last, because it is the one that assumes all the others exist."
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
          <strong>Separate products around the backend.</strong> Firebase sells crash reporting, push notifications
          and analytics as their own services, with their own bills and their own accounts. The plugins above are
          code that runs inside your instance, in your account, installed when you want them. We are not building
          the other kind.
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

      <h2>Where the first section came from</h2>
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
