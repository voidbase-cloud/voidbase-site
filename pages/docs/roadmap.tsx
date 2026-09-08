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
        Four sections. The gaps other backends showed us, the shape we want the core to have, the plugins we intend
        to ship on top of it, and the ecosystem we would rather other people build than build ourselves.
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
        size="Medium for the queue, large for the local store. The queue is worth shipping alone, and the plugin that wraps it into an installable app is further down this page."
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
        Changes to the core that nobody pointed at. They are the shape we want voidbase to have, and the last of
        them is what both sections after it stand on.
      </p>

      <h3 className="why-group">Upgrading a running instance</h3>
      <Item
        title="Moving an instance onto a newer release, in place"
        from="Every way of running voidbase can be updated except the one that was meant to be the easiest. A CLI install runs one command; a cloud instance waits for us."
        now="voidbase update ships now, and covers the executable, a global install and a project's dependency: one command, and a deploy puts the new version live. The shape it does not cover is the one it was most needed for. voidbase cloud provisions from the release it holds and has no endpoint that changes an instance afterwards, so an instance stays on the release it was created with until somebody deletes it and makes another."
        plan="An upgrade for an instance the control plane owns: re-deploy it onto the active release, run the migrations the new version brings, and keep its database, its files, its custom domains and its secrets exactly where they are. Roll it per instance rather than to everyone at once, and make it reversible, because an upgrade you cannot undo is one nobody presses."
        size="Medium. Provisioning already writes a Worker from a release; the work is doing it to an instance that has data, and proving the rollback."
      />

      <h3 className="why-group">The stack</h3>
      <Item
        title="The stack, finished"
        from="It is the newest of the ways to run voidbase and the least complete. It deploys, and that is most of what it does."
        now="Pages, typed routes, your own Drizzle tables and a voidbase instance build into one Worker and go live in one deploy. Everything past that you wire yourself: two notions of who is signed in, collections the frontend knows nothing about, and an admin panel that lives at its own address rather than inside your app."
        plan="Make the two halves know about each other. One session across the pages and the API, which is the Better Auth item above. Collection types generated into the app so a renamed field breaks the build the way a renamed Drizzle column already does. The admin panel mountable under your own route behind your own authorisation. And one command that runs the pages, the backend and a seeded instance together, because two terminals is a thing you tolerate rather than a thing you like."
        size="Medium each, and they are independent. The typed collections are the one that changes how the stack feels."
      />

      <h3 className="why-group">voidbase cloud</h3>
      <Item
        title="A dashboard for the life of an instance, not its first minute"
        from="It provisions an instance beautifully and then has nothing else to say. Everything past the moment it exists happens somewhere else."
        now="Sign in with Cloudflare, name an instance, and it is created in your own account with its database, storage and domain. You can delete it. That is the whole of the surface."
        plan="The things you actually do to a backend after making one: requests and errors over time, logs you can search, backups and a restore that has been tested, custom domains, secrets, superusers, and the upgrade above. Templates, so a new instance can start as something rather than nothing. Teams, so an instance is not tied to whoever happened to click first. Everything the dashboard can do gets a CLI command as well, because a dashboard-only feature is one you cannot script or review."
        size="Large in total, small in pieces. Most of it is surfacing things the instance already knows."
      />

      <h3 className="why-group">Plugins</h3>
      <Item
        title="pb_plugins, with a marketplace"
        from="Every instance ends up needing the same handful of things, and everyone writes them again."
        now="A hook file, copied between projects by hand. There is no way to install one, version it, or find one somebody else wrote."
        plan="A pb_plugins directory beside the hooks, holding installed plugins the same way pb_hooks holds your own code. A plugin declares what it needs, adds routes, hooks, collections and panel screens, and is installed and updated by name. Core plugins ship with voidbase, official ones are ours and versioned with it, and a marketplace lists what the community has published so installing one does not mean trusting a gist."
        size="Large, and the order matters. The loader and the manifest first, because everything else is a plugin once those exist."
      />

      <h3 className="why-group">The three tiers, and what "core" means</h3>
      <Item
        title="Core plugins, installed and on by default"
        from="Auth leaving the core creates a problem the loader alone does not solve: an instance with no auth plugin is not a lean instance, it is a broken one. Some plugins are not optional in any useful sense."
        now="Nothing, because there are no plugins. The distinction matters now rather than later, because auth is the first thing that will need it and the loader has to know about the tier before it can carry auth."
        plan="Three tiers, and they differ in what happens if you do nothing. A core plugin is installed and enabled by default and comes with voidbase, because the instance is not usable without it: auth is the first, and there will not be many. An official plugin is ours and supported and versioned with voidbase, but it arrives because you asked for it. A community plugin is somebody else's, from our marketplace or a registry of your own. Removing a core plugin has to be possible, because replacing auth is the entire point of moving it out, but it has to be a thing you did on purpose rather than a thing that happened while you were installing something else, and the instance should say plainly what it is now missing."
        size="Small as code and worth settling early, because every later decision about defaults, upgrades and what a bare instance does hangs off it."
      />

      <h3 className="why-group">Keeping plugins current</h3>
      <Item
        title="Versions, updates, and what happens when voidbase moves underneath one"
        from="A plugin system without an update path produces the thing it was meant to prevent: code copied in once, never touched again, and quietly wrong two releases later. The gist problem with extra steps."
        now="Nothing. voidbase update already keeps voidbase itself current across the executable, a global install and a project's dependency, so the shape of the answer exists; there is simply nothing yet for it to apply to."
        plan="Every plugin is versioned and every install is recorded, so an instance can say what it is running and reproduce it. A plugin declares which voidbase versions it works against, and the loader refuses one that does not fit rather than discovering it at request time. Updating is one command for all of them or one for a named plugin, it says what changed before it does anything, and an unpackaged update is files while a packaged update is a rebuild, which is the same split as installing. Two harder halves come with it. Upgrading voidbase itself has to say which installed plugins will not survive the jump, before the upgrade rather than after. And a packaged plugin's update currently drags the whole instance onto the newest release, because rebuilding is how it is applied; separating those is the thing that decides whether a plugin update is routine or something you schedule."
        size="Medium for the mechanism, and the compatibility half is the part nobody enjoys: it only earns its keep once there are enough plugins for it to be tested against something real."
      />

      <h2>The official plugins</h2>
      <p>
        Everything below is a plugin, which is why the loader comes first. These are ours: they ship with voidbase,
        are versioned with it, and are supported like the rest of it. The order is roughly the order we would build
        them in.
      </p>

      <h3 className="why-group">Auth</h3>
      <Item
        title="Rip auth out of the core and ship it as a packaged plugin"
        from="Auth is the one thing every project needs and no two projects agree about. While it is welded into the server, having different auth means editing the server, which is not a thing anyone should have to do to use their own identity provider."
        now="About twelve hundred lines built into the server across auth, its flows, OTP, MFA, WebAuthn, JWT and OAuth2, owning _superusers, _externalAuths, _authOrigins, _otps and _mfas. The seam is already there and nobody put it there on purpose: the core calls one function, once per request, that turns a request into an auth record or null, and everything else in the server only reads the result. That one function is the whole of what the core actually needs."
        plan="Take everything on the far side of that seam out. The core keeps the contract and nothing else: a request goes in, a record or null comes out, and a record from _superusers is a superuser. Endpoints, tokens, tables, OAuth providers, one-time codes, passkeys, all of it moves into a packaged plugin, which is the shape that can carry it because a packaged plugin brings its own dependencies, its own schema and its own bindings. Ours provides Better Auth, with PocketBase's surface rebuilt on top of it as a Better Auth plugin so the SDK and the panel keep working unchanged, and it ships with voidbase and is installed by default. Nothing changes for anyone who does not go looking. What changes for everyone else is that the auth plugin is replaceable: bring an internal identity provider, a session model instead of tokens, an SSO plugin somebody else published, and the core neither knows nor cares. An instance with no auth plugin has no authenticated callers at all, so every rule that requires one denies, which is the right way for that to fail."
        size="The largest thing on this page. It lands after the plugin loader, because a loader that cannot carry auth is not a loader worth having, and auth is what will prove whether it can. One thing decides whether the compatibility half is possible rather than merely hard: PocketBase signs each token with that user's own key, so changing a password invalidates their tokens with no session table anywhere, and Better Auth is session-first. Whether that is reproducible exactly rather than approximately is the question, and we do not know the answer yet."
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

      <h3 className="why-group">Search engines, and the other crawlers</h3>
      <Item
        title="SEO, as official plugins"
        from="Anything that serves pages has to answer crawlers, and every project answers them again from scratch with a handful of routes nobody enjoys writing."
        now="pb_public serves static files and a stack app renders pages, so you can write a robots.txt and a sitemap by hand. Nothing generates either from what is actually in your collections, which is where the truth is and where a hand-written copy goes stale."
        plan="Generated from the routes and records that exist rather than kept in step by hand: robots.txt, a sitemap that changes when records do, JSON-LD from schema.org types mapped onto collections, OpenGraph and Twitter tags, canonical URLs so one page has one address, per-route rules for what may be indexed, and llms.txt for the crawlers that are not search engines. Open Graph images rendered on request and cached the way thumbnails already are, so a share card is a field rather than a design job. Deployment skew and asset versioning are on this list too, because they are the same question asked at deploy time: a browser that loaded one version should keep working against that version, and an asset URL should say which version it came from. Cloudflare's Worker versions and gradual deployments are what that would be built on."
        size="Medium, and it splits cleanly. robots.txt and the sitemap are small and useful on their own; the image rendering and the skew handling are the two that need real design."
      />

      <h3 className="why-group">Installable, and usable on a bad connection</h3>
      <Item
        title="A progressive web app, and the service worker under it"
        from="The offline item in the first section is the engine. This is everything you would otherwise assemble around it by hand, once per project, from a manifest you copied off a blog post."
        now="Nothing. A voidbase app is a website. Making it installable, cacheable and useful on a train is entirely yours."
        plan="A plugin that writes the manifest, the icon set and the service worker from what the app already declares, registers it with the parts everyone gets wrong handled: the update prompt, the skip-waiting path, and a way to unregister, because a stuck service worker is the worst bug in this area and the hardest to talk a user through. It precaches the shell and reuses the mutation queue from the offline item rather than inventing a second one, so a write made with no signal replays through the same path whichever page queued it."
        size="Medium, and it lands after the offline queue. Without that queue it is a caching layer with a better name."
      />

      <h3 className="why-group">Languages</h3>
      <Item
        title="Translations, as an official plugin"
        from="Every application that reaches a second country rebuilds this, and what gets rebuilt is usually a JSON file per language and a helper that cannot tell you which keys are missing."
        now="Nothing. A translated field is a field you named yourself, following a convention only your own code knows about."
        plan="Two halves, because they are two problems. Interface strings live in the project, are typed, and fail the build when a key is missing rather than rendering the key to a user. Content translations live in the collections: a field is declared translatable once and the API answers in the language the request asks for, falling back the way you said rather than the way we guessed. Then the parts around both, which is a locale in the route, hreflang and canonical tags handled by the SEO plugin above, and a panel screen showing what is untranslated so you find out before a reader does."
        size="Large. The content half reaches into the query path, which is the part of the server we change most carefully."
      />

      <h3 className="why-group">Commerce</h3>
      <Item
        title="A shop the other plugins plug into"
        from="Once payments, files, auth and editable content are all in the box, what is left of a shop is the part nobody enjoys building."
        now="Nothing. You build it on collections, and everybody builds it differently."
        plan="An official commerce plugin holding the parts that are the same everywhere: products and variants, inventory, carts, orders, tax, shipping, refunds and an audit trail. It declares its extension points, so a payment plugin supplies checkout, a shipping plugin supplies rates, and a plugin of your own supplies whatever your business does that nobody else's does."
        size="Large, and last, because it is the one that assumes all the others exist."
      />

      <h2>The ecosystem</h2>
      <p>
        The plugin loader above is half a system. The other half is somewhere to get things from, somewhere to put
        things you made, and a reason for anyone to bother. This is the part we most want other people involved in,
        so it is written down in more detail than our own confidence deserves.
      </p>

      <h3 className="why-group">Templates</h3>
      <Item
        title="Templates, and a listing anyone can add to"
        from="Starting from nothing is the slowest part of trying anything, and every project that gets past that point started as a copy of somebody's working example."
        now="voidbase init writes empty directories and void init scaffolds a stack app. Neither of them gives you a working example of anything, so the first hour is spent building what somebody else has already built."
        plan="A template is a public repository with a manifest. voidbase init --template <name> starts from one, the cloud dashboard offers them on the create screen, and anyone can publish theirs by adding it to the listing. Official templates are ours and are kept working, and the first of them is this site: voidbase-cloud/voidbase-site is already public, is a real voidbase stack app, and serves the page you are reading, which makes it an honest starting point rather than a demo we wrote to look good."
        size="Small for the mechanism, ongoing for the templates. The listing is the same listing as the marketplace below."
      />

      <h3 className="why-group">The marketplace</h3>
      <Item
        title="One marketplace for plugins, themes and templates"
        from="A gist is not a distribution channel, and an author you have never heard of is not a security model. Every backend that grew an ecosystem grew a supply chain problem at the same time."
        now="Nothing. Installing somebody else's hook means reading their code and pasting it, which is fine once and unworkable at any scale."
        plan="One place, three kinds of thing, and every listing a versioned repository you install by name. Each submission and each update goes through an automated audit that reports what the code reaches for, whether the permissions it asks for match the ones it uses, and what changed since the version you have, in language a person can read before installing. That audit is a first pass and not a guarantee, so its report is published with the listing and you are free to disagree with it."
        size="Large, and the audit is the part that decides whether any of it is worth having."
      />

      <h3 className="why-group">Paying the people who build it</h3>
      <Item
        title="Creators keeping what they earn, and us not taking a cut of the ecosystem"
        from="Free plugin ecosystems get abandoned and paid ones get gouged. The difference is usually who is being paid and for what."
        now="Nothing to sell and nowhere to sell it, which is at least honest."
        plan="Official plugins and themes stay free, as many as we can write, because an ecosystem does not start behind a paywall. Later a subscription may cover a growing basket of specialised official ones, and specialised is the word doing the work there: things most projects will never need, and never something that used to be free. Anyone can charge for what they publish and keep what they earn. We would rather the marketplace itself be paid for by sponsors than by a percentage of everybody in it, which is also the answer on the pricing page."
        size="This is a policy before it is code, and the policy is easier to keep if we write it down now."
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
