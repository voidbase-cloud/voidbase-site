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
        title="Writes that survive a tunnel, as a client plugin"
        from="Firebase caches writes on the device and reconciles them when the network returns, and has done for a decade."
        now="Nothing. A request that fails is a request your code has to handle."
        plan="A plugin on the typed client above rather than a feature inside it, because offline is exactly the shape that surface is for: it sits in the request path, holds state of its own, and most applications do not want it. Two pieces, in order. A queue that takes mutations the network refused and replays them on reconnect, which needs no change to the API. Then reads through a local store, so a screen renders before the network answers. Being a plugin is what makes the second piece safe to attempt: an application that only wants the queue installs only the queue, and one that wants neither carries neither."
        size="Medium for the queue, large for the local store, and both wait on the client having a plugin surface at all. The installable-app plugin further down this page wraps whichever of them you have."
      />

      <h3 className="why-group">Types</h3>
      <Item
        title="A typed client, and a client that takes plugins"
        from="Convex types the whole path from schema to component, so a rename breaks the build. Ours breaks at the call instead."
        now="The PocketBase SDK is typed, but it knows nothing about your collections: a record is a bag of fields, and a renamed field is a runtime surprise. It is also closed to extension, so anything you want around a request you wrap by hand, once per project."
        plan="Generate a typed client from the instance's own OpenAPI description rather than from a second reading of the collections, so the client and the documentation cannot disagree about what the API is. A command writes it, the build refreshes it, and a rename becomes a compile error. The collection definitions are already data on the server, so nothing new has to be described. Then give that client the same thing the server is getting: a plugin surface. A client plugin sits in the request path, can add methods, and can hold state of its own, which is what turns the next item from a feature we would have to build into something that can be written by us or by anyone else. Caching, retries, telemetry and offline are all the same shape once that exists."
        size="Medium for the generator, medium again for the plugin surface, and neither touches the server."
      />

      <h3 className="why-group">Operations</h3>
      <Item
        title="Cloudflare's observability, as a core plugin"
        from="Every hosted competitor shows you what your backend is doing. Ours makes you go and look."
        now="Errors reach Workers Logs if your code logs them, and the platform's own request data is there for anyone who opens the dashboard. Neither is set up for you or surfaced anywhere."
        plan="Turn on Workers Observability at deploy so logs and traces are retained without being asked for, sample the request path into an Analytics Engine dataset the deploy already knows how to create, and put the instance's own numbers behind the admin panel: requests, errors, slow endpoints, and which hooks are costing the CPU. All of it as a core plugin, installed and on by default, which is the second of those after auth. Core because an instance you cannot see into is one you cannot operate, and a plugin because somebody who would rather send all of this somewhere else should be able to remove ours and install theirs against the same interface rather than fork the server."
        size="Small for the wiring, medium for the panel screens, and it lands after the loader like everything else that is a plugin."
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
        now="A loader and a manifest, in voidbase but not yet reachable: a plugin declares its name, version, tier, the voidbase range it works against, what it provides and requires, and which collections it owns or extends, and the loader refuses a set that does not fit before running any of it. Backups is the first feature to arrive that way. There is still nothing to install, no pb_plugins directory and no command, so from outside nothing has changed."
        plan="A pb_plugins directory beside the hooks, holding installed plugins the same way pb_hooks holds your own code. A plugin declares what it needs, adds routes, hooks and collections, and is installed and updated by name. Panel screens are not on that list: the admin panel is PocketBase's own build, used unmodified because that is what keeps it compatible, and a plugin cannot add a screen to a bundle voidbase does not build. Plugin settings live in collections the stock panel already edits, and a surface of voidbase's own for plugins that need one is an open question rather than a promise. Core plugins ship with voidbase, official ones are ours and versioned with it, and a marketplace lists what the community has published so installing one does not mean trusting a gist."
        size="Large, and the order matters. The loader and the manifest first, because everything else is a plugin once those exist."
      />

      <h3 className="why-group">The three tiers, and what "core" means</h3>
      <Item
        title="Core plugins, installed and on by default"
        from="Auth leaving the core creates a problem the loader alone does not solve: an instance with no auth plugin is not a lean instance, it is a broken one. Some plugins are not optional in any useful sense."
        now="Nothing, because there are no plugins. The distinction matters now rather than later, because auth is the first thing that will need it and the loader has to know about the tier before it can carry auth."
        plan="Three tiers, and they differ in what happens if you do nothing. A core plugin is installed and enabled by default and comes with voidbase, because the instance is not usable without it: auth and observability are the two, one because nothing works without it and the other because an instance you cannot see into is one you cannot operate, and the list should stay about that short. An official plugin is ours and supported and versioned with voidbase, but it arrives because you asked for it. A community plugin is somebody else's, from our marketplace or a registry of your own. Removing a core plugin has to be possible, because replacing auth is the entire point of moving it out, but it has to be a thing you did on purpose rather than a thing that happened while you were installing something else, and the instance should say plainly what it is now missing."
        size="Small as code and worth settling early, because every later decision about defaults, upgrades and what a bare instance does hangs off it."
      />

      <h3 className="why-group">Interfaces, and plugins that need other plugins</h3>
      <Item
        title="Depend on what a plugin does, not on which plugin it is"
        from="Three items on this page describe the same mechanism without naming it. The core will need an auth plugin without caring which. Commerce will need a payment plugin without caring which. Payments are one plugin per provider over a shared shape, and the shared shape is the whole point. Left unnamed, that becomes three private arrangements that do not compose."
        now="Built, ahead of the plugins that will use it. Interfaces are versioned names, auth@1 and payments@1, kept in one list in voidbase, and a manifest naming one outside the list is refused. Two providers of one interface are refused at install with both named, a cycle is refused with the circle printed, a missing provider names the interface and who wanted it, and removing a provider unloads what required it and reloads it against a replacement without the dependent changing. Each of those is a test. What is not decided is who besides us may define an interface."
        plan="A plugin declares what it provides and what it requires, and both are interfaces rather than names. Something that needs to take a payment requires the payment interface; Stripe, Polar and Lemon Squeezy each provide it; swapping one for another is removing a provider and installing another, and nothing that depended on it changes or is even aware. The loader resolves the graph and loads in its order. Interfaces are versioned, because an interface is a contract and a contract that can change silently is not one. The failures are decided up front rather than discovered: no provider for a required interface means the dependent plugin does not load and says why, two providers for the same interface is ambiguous and has to be resolved on purpose rather than by whichever won a sort, and a cycle is refused at install rather than at boot. Auth is the first proof of it: the core requires an auth interface, our Better Auth plugin provides it, and yours can too."
        size="Medium as code and the highest-consequence design on this page. Interfaces defined badly early are inherited by everything downstream, and a marketplace where every plugin invents its own is no better than having none. Who is allowed to define one, and what happens when two plugins define the same thing differently, is unresolved."
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
        plan="Take everything on the far side of that seam out. The core keeps the contract and nothing else, and the contract turned out to have three parts rather than one. A request goes in and a record or null comes out; a record from _superusers is a superuser; and the core has to know auth's shape, because API rules are compiled to SQL against @request.auth.<field> and a rule naming a field that does not exist should be refused when it is written rather than fail when it runs. So the interface carries the fields an auth record may have and which collections hold them, as well as the function that authenticates. Endpoints, tokens, tables, OAuth providers, one-time codes, passkeys, all of it moves into a packaged plugin, which is the shape that can carry it because a packaged plugin brings its own dependencies. The core requires the auth interface, our plugin provides it, and yours can too."
        size="The largest thing on this page. It lands after the plugin loader, because a loader that cannot carry auth is not a loader worth having, and auth is what will prove whether it can. It also has to land with the hardening plugin below: today's wildcard CORS is safe only because a bearer token is not something a browser attaches by itself, and an auth plugin that uses cookies changes that. One thing decides whether the compatibility half is possible rather than merely hard: PocketBase signs each token with that user's own key, so changing a password invalidates their tokens with no session table anywhere, and Better Auth is session-first. Whether that is reproducible exactly rather than approximately is the question, and we do not know the answer yet."
      />

      <h3 className="why-group">Headers, origins and the requests you did not mean to accept</h3>
      <Item
        title="Hardening, as a plugin, and one that matters more once auth is pluggable"
        from="What an instance sends back is a security decision, and right now it is four headers chosen to match PocketBase rather than to match your application. Everything past that is yours to remember."
        now="Four headers on every response: X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, X-Xss-Protection, and Cross-Origin-Opener-Policy same-origin. A strict Content-Security-Policy on file responses only. CORS wide open, origin *, with Authorization allowed. No CSRF anywhere and no SameSite handling. Rate limiting is real, both PocketBase's rules and the per-IP ceiling the deploy binds. The rate limit and the 32 MB body limit are already the hardening plugin: it provides hardening@1 behind a slot the server keeps in its middleware chain, so removing it leaves an instance with no limits, and a plugin of your own providing hardening@1 puts yours there instead. The headers and CORS are still built in."
        plan="A plugin owning the whole response policy rather than a list of headers nobody revisits. A Content-Security-Policy you can set per route instead of one that applies to files and nothing else, HSTS, Referrer-Policy, Permissions-Policy, and the cross-origin trio. CORS as a list of origins you named, with the wildcard something you choose rather than inherit. CSRF protection, with SameSite defaults, origin checking and a double-submit token for the flows that need it. And an OWASP-shaped check that reports what an instance is missing rather than quietly defaulting it, because a header you did not know was absent is the only kind that hurts. It provides an interface, so a company with its own policy replaces ours instead of arguing with it."
        size="Small to write, and the reason it is on this list is not its size. CORS at origin * is safe today only because authentication is a bearer token: nothing a browser sends automatically can carry it. Auth becoming a plugin means somebody can install one that uses cookies, and Better Auth is session-first by default, at which point a wildcard origin and an automatic credential are a CSRF hole that arrived without anybody deciding to open it. This lands with that item, not after it."
      />

      <h3 className="why-group">A domain of your own</h3>
      <Item
        title="Domains leave the deploy and become a plugin"
        from="Where an instance answers is not a property of the server. It is a decision about DNS, certificates and which of several names is the real one, and the core has no business holding an opinion about any of it."
        now="The deploy owns the whole thing. It reads VOIDBASE_DEPLOY_DOMAIN, validates the hostnames, turns workers.dev off when one is given, attaches each of them through the Workers Custom Domains API after the upload, and derives the URL it reports from the first in the list. The control plane repeats it for instances it provisions. None of that is wrong, and all of it is in the wrong place."
        plan="The deploy uploads a Worker and says where it answers, which is its workers.dev address, and stops. Everything else moves out: which hostnames, which one is canonical, permanently redirecting the rest to it, waiting for the certificate before claiming success, and removing them again on teardown. Where the zone is on the same account, the plugin should ask for a domain and nothing else, because the records, the certificate and the redirects are all reachable from there."
        size="The plugin is small. What it needs is not: plugins today run inside an instance, and attaching a hostname is an account-level action taken around a deploy rather than during a request. So this wants a deploy-time plugin surface that does not exist yet, and that is the real work. It is also the general thing rather than a favour to domains: backups want to schedule, previews want to create and destroy instances, and observability wants to turn a setting on, and all three are the same shape. Domains are just the first item honest enough to admit it needs it."
      />

      <h3 className="why-group">Email from that domain</h3>
      <Item
        title="Sending through Cloudflare Email Service, on the domain you just set up"
        from="A backend sends password resets, verification links and email changes. Sending them from a domain with no SPF, no DKIM and no DMARC is sending them to spam folders, and that is a thing nobody discovers until users say they never got the mail."
        now="A real SMTP client over Cloudflare TCP sockets, with implicit TLS or STARTTLS and AUTH PLAIN or LOGIN. It works, and it asks you to bring a mail server, its credentials, and every deliverability record yourself. Nothing about running on Cloudflare helps."
        plan="Use Cloudflare's own Email Service instead, which wants exactly what the item above already arranged: a domain whose zone is on the account and whose DNS Cloudflare runs. Onboarding it writes the SPF, DKIM and DMARC records itself, which is the whole deliverability problem solved by the thing that already has the authority to solve it. The Worker gets a send_email binding, the plugin points the instance's mail at it, and the sender address is restricted to the domain rather than left open. SMTP stays for anyone who has a mail server they trust and would rather use it."
        size="Small if Email Service is available to the account, and it is the pair to the domain plugin rather than a separate errand: one asks for a domain, the other makes mail from that domain arrive. Worth checking its availability before promising it, because it is new."
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

      <h3 className="why-group">A description of the API, generated and scoped</h3>
      <Item
        title="OpenAPI, Scalar and a stateless MCP server, from the collections you have"
        from="Every instance already knows its own shape: the collections, their fields, the rules that decide who may read and write each one. Nothing exposes that in a form other tools can read, so anything that wants to understand a voidbase instance has to be told separately, by hand, and go stale."
        now="The API is PocketBase's and is documented as PocketBase's, which is accurate and generic. Your instance's own endpoints, its own fields and its own permissions are not described anywhere a machine can consume."
        plan="Generate an OpenAPI document from the collections an instance actually has, and scope it to the caller. A document fetched with no token describes what an anonymous request can do; one fetched as a user describes what that user can do; one fetched as a superuser describes everything. That scoping is the part that matters, because an API description that lists what you may not call is a description that lies to you. Serve Scalar over the same document so there is a page to read and try requests on, and a stateless MCP server over it too, so an agent can discover an instance rather than be told about it. Stateless because a voidbase instance is a Worker: no session to keep, each call carrying its own auth, which is the only shape that survives being run at the edge."
        size="Medium, and it is worth doing early for what it feeds rather than for itself. The typed client generates from the same description instead of inventing its own view of the schema, the AI plugins get a tool list they did not have to be handed, and anybody writing a client in a language we will never ship gets a generator's worth of help for free."
      />

      <h3 className="why-group">AI</h3>
      <Item
        title="Workers AI and Think, as official plugins"
        from="The instance already runs on the network that serves the models, and it already runs a Durable Object for realtime. Calling a third-party API to add a chat box is the long way round."
        now="Nothing. A hook can call Workers AI because a hook can call anything, and that is the whole of the support."
        plan="Plugins built on Cloudflare's Think harness, which is a chat agent over Durable Object SQLite with Workers AI behind it. One puts a chat in the admin panel that can read the instance's own schema, records and logs, so finding where something lives is a question rather than a search. One does the same inside a preview environment, where the thing worth asking about is the change under review. And because a Think agent can be driven as a sub-agent over RPC, the third is a chat your own app mounts, scoped to the collections you let it read. None of them needs a hand-written tool list: the MCP server above already describes the instance, scoped to whoever is asking, which is the same scoping these three need anyway."
        size="Medium each, and all three want the plugin loader first."
      />

      <h3 className="why-group">Payments</h3>
      <Item
        title="Payment providers, as official plugins"
        from="Taking money is the first thing most projects add and the last thing anyone wants to write a second time."
        now="Nothing in the box. The webhook endpoint is a hook you write, and the reconciliation is yours to get right."
        plan="One plugin per provider, all of them providing the same payment interface, starting with Stripe, Polar and Lemon Squeezy. Each owns its webhook route, verifies signatures, and writes customers, subscriptions and payments into collections you query like any other. Changing provider becomes changing which plugin is installed, and the shared shape is what makes the next provider cheap to add."
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
        from="The offline plugin in the first section is the engine. This is everything you would otherwise assemble around it by hand, once per project, from a manifest you copied off a blog post."
        now="Nothing. A voidbase app is a website. Making it installable, cacheable and useful on a train is entirely yours."
        plan="A plugin that writes the manifest, the icon set and the service worker from what the app already declares, registers it with the parts everyone gets wrong handled: the update prompt, the skip-waiting path, and a way to unregister, because a stuck service worker is the worst bug in this area and the hardest to talk a user through. It precaches the shell and reuses the offline plugin's queue rather than inventing a second one, so a write made with no signal replays through the same path whichever page queued it. Two plugins on two different surfaces, one on the client and one on the server side of the build, which is a reasonable early test of whether those surfaces compose."
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
        plan="An official commerce plugin holding the parts that are the same everywhere: products and variants, inventory, carts, orders, tax, shipping, refunds and an audit trail. It requires interfaces rather than particular plugins, so a payment plugin supplies checkout, a shipping plugin supplies rates, and a plugin of your own supplies whatever your business does that nobody else's does, without commerce knowing which."
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
