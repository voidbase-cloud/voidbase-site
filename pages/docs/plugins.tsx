// Plugins, as they exist in voidbase 1.0: what one is, the eight that ship and the official ones added by name, how
// one is installed, what a plugin does at deploy time, and what is not built.
//
// Every claim here traces to voidbase's own docs (docs/plugins.md, docs/registry.md, docs/setup.md) and the
// marketplace's README. The design rationale that this page used to be is kept as a short closing section.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { SITE } from "@/lib/env";

const MANIFEST = hl.json`{
  "name": "echo",
  "version": "0.1.0",
  "tier": "community",
  "voidbase": ">=1.0.0",
  "provides": [],
  "requires": []
}`;

const PLUGIN = hl.ts`// main.js: plain JavaScript, nothing compiled. The default export is what the plugin does; the instance attaches
// manifest.json to it when it loads it.
export default {
  apply(ctx) {
    // ctx.app is the instance's Hono app; routes mount before the instance serves anything
    ctx.app.get("/api/echo", (c) => c.text("echo"));
  },
};`;

const INTERFACE = hl.ts`// a plugin that provides an interface, and one that requires it
import { serve, using } from "@voidbase-cloud/voidbase/kernel";
import type { Plugin } from "@voidbase-cloud/voidbase/plugins";
import type { Payments } from "@voidbase-cloud/voidbase/interfaces";

export const provider: Plugin = {
  manifest: { name: "pay", version: "0.1.0", tier: "community", voidbase: "*", provides: ["payments@1"] },
  apply(ctx) { serve<Payments>(ctx, "payments@1", implementation); },
};

export const shop: Plugin = {
  manifest: { name: "shop", version: "0.1.0", tier: "community", voidbase: "*", requires: ["payments@1"] },
  apply(ctx) {
    const payments = using<Payments>(ctx, "payments@1"); // whichever plugin provides it
    ctx.app.post("/api/shop/checkout", async (c) => c.json(await payments.checkout(c.env, await c.req.json())));
  },
};`;

const COLLECTIONS = hl.ts`import { onBootstrap } from "@voidbase-cloud/voidbase/kernel";
import { ensureCollections } from "@voidbase-cloud/voidbase/plugins/collections";

const plugin = {
  manifest: { name: "shop", version: "1.0.0", tier: "community", voidbase: "*", collections: ["orders"] },
  apply(ctx) {
    onBootstrap(ctx, (env) => ensureCollections(plugin, env.DB, [
      { name: "orders", type: "base", fields: [{ name: "total", type: "number" }] },
    ]));
    ctx.app.get("/api/shop/orders", ...);
  },
};`;

const SHAPE = hl.bash`my-instance/
├─ pb_hooks/            your own code
├─ pb_migrations/       your own schema
├─ pb_plugins/          installed plugins, one directory each
│  └─ echo/             the plugin's files at the commit the marketplace approved
│     ├─ manifest.json  its declaration
│     ├─ main.js        what it does, when it does more than hooks
│     ├─ pb_hooks/      its hooks, run after the project's own
│     └─ pb_migrations/ its schema, when it has one
└─ voidbase.lock        every installed plugin: marketplace, version, source commit, a hash of its files`;

const USE = hl.bash`voidbase plugins ls               # what this project runs, and where each plugin came from
voidbase plugins add echo         # download, verify against the marketplace's hash, pin in voidbase.lock
voidbase plugins add echo@0.1.0   # a version other than the latest
voidbase plugins update           # bring installed plugins to the latest their own marketplace serves
voidbase plugins remove echo      # remove it; for a plugin voidbase ships, turn it off
voidbase plugins enable echo      # turn a shipped plugin back on
voidbase plugins add echo --marketplace https://marketplace.example.com   # any marketplace serving the protocol`;

const DEPLOY = hl.ts`import type { DeployPlugin } from "@voidbase-cloud/voidbase/deploy-plugin";

export const deploy: DeployPlugin = {
  name: "echo",
  manifest: plugin.manifest,
  deploy: {
    async before(ctx) { /* the config and the vars are yours to change; claim ctx.url; throw to refuse the deploy */ },
    async after(ctx) { /* the Worker is up: act on the account with ctx.api */ },
    async remove(ctx) { /* voidbase deploy --remove: undo what after did, before the Worker is deleted */ },
  },
};`;

const TEST = hl.ts`// test/plugin.test.ts: the package is a loadable plugin
import { test, expect } from "bun:test";
import { Hono } from "hono";
import { createKernel, load } from "@voidbase-cloud/voidbase/kernel";
import main from "../main.js";
import manifest from "../manifest.json";

const plugin = { ...main, manifest }; // what the instance does when it loads the directory

test("loads through the kernel and its route answers", async () => {
  const app = new Hono();
  await load(createKernel(app as never), [plugin], "0.9.0");
  expect(await (await app.request("/api/echo")).text()).toBe("echo");
});`;

function Row({ name, on, children }: { name: string; on: React.ReactNode; children: React.ReactNode }) {
  return (
    <tr>
      <td><code>{name}</code></td>
      <td>{children}</td>
      <td>{on}</td>
    </tr>
  );
}

export default function DocsPlugins() {
  return (
    <>
      <h1>Plugins</h1>
      <p className="docs-lead">
        voidbase composes its server from plugins. Auth, realtime, the request limits, backups, the API description,
        mail, payments and the rest each arrive as one, and a plugin somebody else wrote installs the same way, by
        name, at the commit its marketplace approved. This page is what a plugin is, the eight that ship with
        voidbase and the official ones you add by name, how one reaches an instance, and what is not built.
      </p>

      <h2>What a plugin is</h2>
      <p>
        pb_ files, the way an instance's own are, plus a declaration. <code>manifest.json</code> says the{" "}
        <code>name</code>, <code>version</code>, <code>tier</code>, the <code>voidbase</code> range it works against,
        the interfaces it <code>provides</code> and <code>requires</code>, the <code>collections</code> it owns or{" "}
        <code>extends</code>, and its <code>config</code>. Beside it sit <code>pb_hooks</code>,{" "}
        <code>pb_migrations</code> and <code>pb_public</code> when it has them, and <code>main.js</code> when it does
        more than hooks: plain JavaScript, nothing compiled, whose default export is what the plugin does.{" "}
        <code>apply</code> receives the kernel: <code>ctx.app</code> is the instance's Hono app, so a route mounts there
        before the instance serves anything, and <code>info</code>, if present, is what it reports about itself.
      </p>
      <CodeBlock {...MANIFEST} />
      <CodeBlock {...PLUGIN} />
      <p>
        <strong>Three tiers</strong>, differing in what happens if you do nothing. A <code>core</code> plugin ships
        with voidbase and is on unless you turn it off; there are eight, below. Two of them, <code>auth</code> and{" "}
        <code>observability</code>, are ones the instance is not usable without, and an instance running without a
        provider of <code>auth@1</code> loads, runs with nobody signed in, and says what it is missing at boot and on{" "}
        <code>/api/plugins</code>. Taking one out is deliberate: the CLI refuses without <code>--yes</code> and says
        what stops working, and the installer route answers 409 unless the call carries <code>force</code>. The same
        guard covers a plugin another installed plugin depends on. An <code>official</code> plugin is ours, versioned
        with voidbase and listed on the marketplace, and you add it by name. A <code>community</code> plugin is somebody else's, from{" "}
        <Link href="/docs/marketplace">the marketplace</Link> or a marketplace of your own.
      </p>
      <p>
        <strong>Interfaces, not names.</strong> A plugin depends on what another plugin does rather than on which
        plugin it is, through versioned names. voidbase defines twelve: <code>auth@1</code>,{" "}
        <code>observability@1</code>, <code>realtime@1</code>, <code>hardening@1</code>, <code>backups@1</code>,{" "}
        <code>installer@1</code>, <code>openapi@1</code>, <code>mail@1</code>, <code>payments@1</code>,{" "}
        <code>tax@1</code>, <code>shipping@1</code> and <code>commerce@1</code>. A name outside that list loads, so two
        plugins can agree on a capability before voidbase does; a near-miss of one it defines (<code>payjments@1</code>)
        is refused, because a typo is a plugin that never meets its provider. Before a single plugin is applied the whole graph is checked and
        everything wrong is reported at once: two providers of one interface (both named), a missing requirement (who
        wanted it), a cycle (the circle printed), a plugin outside its voidbase range, a second owner of a collection.
        A plugin that requires an interface is applied once a provider exists, and re-applied against a replacement
        when the provider changes.
      </p>
      <CodeBlock {...INTERFACE} />
      <p>
        <strong>Owning collections.</strong> A manifest names the collections a plugin owns, which is what lets the
        loader refuse a second owner. Owning one also means creating it: <code>onBootstrap</code> runs work once per
        isolate with the bindings, after voidbase's own bootstrap, and <code>ensureCollections</code> creates what is
        missing from the definition the collections API takes. When the collection exists a newer definition is
        reconciled forward: a field, an index or a rule the plugin now declares is added, and nothing the instance has
        is dropped, so a column with data in it survives a plugin update. A name the manifest does not own is refused
        before the database is touched.
      </p>
      <CodeBlock {...COLLECTIONS} />

      <h2>What ships</h2>
      <p>
        Eight plugins ship with voidbase, all tier core, one line each. Every one is loaded unless the project turned
        it off; the last column is the knob that makes it do something, read from the instance's environment or{" "}
        <code>pb_secrets</code>. <code>GET /api/plugins</code>, for a superuser, says which are loaded, which provide
        what, where each came from, and what each one reports.
      </p>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Plugin</th><th>What it does</th><th>What turns it on</th></tr>
          </thead>
          <tbody>
            <Row name="auth" on={<>On by default, tier core. <code>voidbase plugins remove auth</code> refuses without <code>--yes</code>, because it is an instance with nobody signed in.</>}>
              Provides <code>auth@1</code>: who is making a request, the fields an auth record answers to in a rule, which collections hold accounts. Owns the five auth collections and mounts every auth route (password, OAuth2, refresh, the flows, passkeys).
            </Row>
            <Row name="observability" on={<>On by default, tier core. <code>VOIDBASE_OBSERVABILITY_SAMPLE</code> lowers the sampling; <code>--analytics</code> adds the dataset.</>}>
              Provides <code>observability@1</code>: one data point per request, and <code>GET /api/observability/summary</code>, <code>/errors</code> and <code>/logs</code> for a superuser. The summary answers from the Analytics Engine dataset when the account id and a token with Analytics Read are set, and from the instance&apos;s own request log otherwise, saying which.
            </Row>
            <Row name="realtime" on="On by default.">
              Provides <code>realtime@1</code>: the subscriptions, built per request over the hub binding on Workers, so the write path knows whether a change has anywhere to go.
            </Row>
            <Row name="hardening" on={<>On by default. The policy knobs (<code>VOIDBASE_CORS_ORIGINS</code>, <code>VOIDBASE_HSTS</code>, <code>VOIDBASE_CSP_ROUTES</code>, <code>VOIDBASE_CSRF</code>, <code>VOIDBASE_CSP</code> and the rest) are off unless set.</>}>
              Provides <code>hardening@1</code>: the body limit, the rate limit and the response policy, the headers every answer carries. Naming CORS origins also turns on the CSRF rule for cookie-carrying writes. Remove it and there is no policy at all.
             <code>VOIDBASE_CSP_ROUTES</code> gives a path its own
              policy, and <code>VOIDBASE_CSRF=double-submit</code> adds the token a cookie-authenticated write must
              echo; a bearer request is exempt. <code>voidbase check --security &lt;url&gt;</code> reads a running
              instance from outside and says pass, warn or fail per line.
            </Row>
            <Row name="backups" on={<>On by default. <code>VOIDBASE_BACKUP_KIND</code>, <code>VOIDBASE_BACKUP_KEEP</code> and <code>VOIDBASE_BACKUP_S3_*</code> shape the schedule and the off-site copy.</>}>
              PocketBase's backups routes plus <code>verify</code>: full, data and schema archives with a manifest, each read back and verified after it is written, restore per kind read as one stream so an archive larger than memory loads, retention, and a copy to any S3-compatible bucket outside the account.
            </Row>
            <Row name="installer" on={<>On by default. <code>VOIDBASE_PROJECT_REPO</code> and <code>VOIDBASE_GH_TOKEN</code> on the Worker, with <code>VOIDBASE_AUTO_MERGE=on</code>, make a change a commit.</>}>
              How an instance changes its own plugins: <code>POST /api/plugins/install</code>, <code>remove</code>, <code>update</code> and <code>GET /api/plugins/available</code>, for superusers. Below, "Installing one".
            </Row>
            <Row name="openapi" on="On by default.">
              <code>GET /api/openapi.json</code>, an OpenAPI 3.1 document generated from the collections and scoped to the token that asked, and <code>GET /api/docs</code>, Scalar over it. <code>voidbase types</code> generates the typed client from the same document.
            </Row>
            <Row name="mail" on={<><code>VOIDBASE_MAIL_DOMAIN=example.com</code></>}>
              Provides <code>mail@1</code>, tier core and on by default: outbound mail from the instance's own domain through Cloudflare's Email Service. The deploy adds the binding; a sender off the domain falls back to SMTP or is refused with the reason on <code>/api/plugins</code>.
            </Row>
          </tbody>
        </table>
      </div>
      <p>
        Removing a shipped plugin turns it off for the project; installing one with a shipped plugin's name takes its
        place.
      </p>

      <h2>The official plugins, added by name</h2>
      <p>
        The rest of ours are official plugins on <Link href="/docs/marketplace">the marketplace</Link>, each a
        directory of voidbase's own repository (<code>packages/plugin-*</code>) listed at a commit, through the same
        door anyone's goes through. <code>voidbase plugins add stripe</code> is all it takes; the knob in the last
        column is then what turns it on.
      </p>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Plugin</th><th>What it does</th><th>What turns it on</th></tr>
          </thead>
          <tbody>
            <Row name="mcp" on={<><code>voidbase plugins add mcp</code>; on once added.</>}>
              <code>POST /api/mcp</code>, a stateless MCP server whose tools are the routes the caller's token may call, derived per request from the same scoped document; every call runs through the instance's own route and rules.
            </Row>
            <Row name="seo" on={<>Added by name. <code>VOIDBASE_SITEMAP</code>, <code>VOIDBASE_SEO</code>, <code>VOIDBASE_SITE_URL</code>, <code>VOIDBASE_ROBOTS_DISALLOW</code> and <code>VOIDBASE_LLMS_NOTE</code> shape the answers; <code>VOIDBASE_SEO_PNG=1</code> renders the share cards as PNG.</>}>
              <code>robots.txt</code>, <code>sitemap.xml</code> from public records, <code>llms.txt</code>, <code>GET /api/seo/meta</code> (canonical, title, JSON-LD, OpenGraph and Twitter tags, a ready head fragment) and share cards rendered on request at <code>/api/seo/og</code>. A real file in <code>pb_public</code> wins.
             The cards are SVG by default; the PNG knob carries a WebAssembly rasteriser and a subset font into the Worker, about a megabyte compressed, which is why it is a choice rather than a default.
            </Row>
            <Row name="ai" on={<><code>VOIDBASE_AI=1</code>, or a Workers AI model name.</>}>
              A tool-calling chat over the instance on Workers AI, <code>POST /api/ai/chat</code>, with the MCP server's tool list for the caller's token. A signed-in user's conversations are records, <code>ai_conversations</code> and <code>ai_messages</code>, with a streaming route.
            </Row>
            <Row name="translations" on={<><code>VOIDBASE_TRANSLATABLE</code> and <code>VOIDBASE_LOCALES</code>, both.</>}>
              Declared fields answered in the locale the request asks for (<code>?locale=</code> or <code>Accept-Language</code>), falling back in the declared order, with <code>Content-Language</code> and a per-record note of what was swapped. Owns the <code>translations</code> collection; superusers get the missing and status reports.
            </Row>
            <Row name="stripe" on={<><code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code>, as secrets.</>}>
              Provides <code>payments@1</code> and owns <code>customers</code>, <code>subscriptions</code> and <code>payments</code>: checkout, portal, cancel and a signature-checked webhook under <code>/api/payments/stripe/</code>, with no SDK.
            </Row>
            <Row name="polar" on={<><code>POLAR_ACCESS_TOKEN</code> and <code>POLAR_WEBHOOK_SECRET</code>; <code>POLAR_SANDBOX=1</code> for the sandbox.</>}>
              The same four routes under <code>/api/payments/polar/</code>, writing the same rows. Joins stripe's family at load; whichever key is set is the provider that answers, and <code>/api/plugins</code> says which.
            </Row>
            <Row name="lemonsqueezy" on={<><code>LEMONSQUEEZY_API_KEY</code>, <code>LEMONSQUEEZY_STORE_ID</code> and <code>LEMONSQUEEZY_WEBHOOK_SECRET</code>.</>}>
              The same four routes under <code>/api/payments/lemonsqueezy/</code>, same rows, same rule about which provider answers.
            </Row>
            <Row name="commerce" on={<>Added by name, then <code>VOIDBASE_COMMERCE=1</code>. <code>VOIDBASE_TAX_RATE</code>, <code>VOIDBASE_SHIPPING_FLAT</code> and <code>VOIDBASE_SHIPPING_FREE_OVER</code> shape the two flat-rate defaults.</>}>
              A shop over ten collections: products, variants, inventory, carts, orders, shipments, refunds and an
              append-only audit trail, with a cart, an address that quotes tax and shipping, a checkout that reserves
              stock and charges the order's whole total at whichever payment provider runs, tax and shipping
              included, and fulfilment and refunds for a superuser. A payment moves an order only when it names that
              order, pays it in full before the provider's own tax, and bought what the order is. It requires <code>payments@1</code>, <code>tax@1</code> and <code>shipping@1</code>, so the
              provider of each is yours to choose; <code>tax-flat</code> and <code>shipping-flat</code> are the flat-rate pair to add beside it.
            </Row>
            <Row name="domains" on={<><code>VOIDBASE_DOMAINS=example.com,www.example.com</code>, or <code>voidbase deploy --domain</code>.</>}>
              Deploy time: validates the hostnames, turns workers.dev off, attaches each through the Custom Domains API, waits for the certificate, redirects every other hostname to the canonical one, and detaches all of it on <code>voidbase deploy --remove</code>.
            </Row>
            <Row name="previews" on={<><code>voidbase deploy --preview &lt;branch&gt;</code>, or <code>VOIDBASE_PREVIEW</code>, which <code>voidbase sync --previews</code> sets from the branch in CI.</>}>
              Deploy time: a second Worker for the branch with its own database, bucket and queue, seeded from production through the backups API, its address posted once on the pull request and updated on every push, gone with everything it owns when the pull request closes.
             A preview comes in two shapes: <code>--shape instance</code>, a whole
              instance for the branch, and <code>--shape flagged</code>, the same instance with the branch&apos;s new
              rows marked and filtered out of every production read. The flagged one isolates new rows only, and
              refuses a change to a row production already has rather than making it quietly.
            </Row>
          
          </tbody>
        </table>
      </div>
      <p>
        The client side of several of them is in{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-js-sdk" target="_blank" rel="noreferrer noopener">@voidbase-cloud/sdk</a>:{" "}
        <code>ai()</code>, <code>payments()</code> and <code>seo()</code> are plugins on the SDK's own surface over
        the routes above.
      </p>

      <h2>Installing one</h2>
      <p>
        <code>voidbase plugins add &lt;name&gt;</code> installs a plugin from a marketplace: the plugin's files at the
        commit the marketplace approved are fetched into <code>pb_plugins/&lt;name&gt;</code>, its{" "}
        <code>manifest.json</code> is checked against the listing, and <code>voidbase.lock</code> pins the marketplace,
        the version, the source commit and a hash of the files. It is committed like any dependency: what the repository
        says is running is what is running.
      </p>
      <CodeBlock {...SHAPE} />
      <CodeBlock {...USE} />
      <p>
        An instance reads the same files when it starts. On Bun (<Link href="/docs/run/standalone">the executable</Link>,{" "}
        <Link href="/docs/run/npm">a local instance</Link>, <Link href="/docs/run/project">a project</Link>) every
        plugin's files are hashed again and checked against the lockfile, and a changed byte is refused by name. A
        directory in <code>pb_plugins</code> the lockfile does not name is not loaded. On Workers the same check runs
        at build time, so a mismatch fails the build rather than the instance; <Link href="/docs/run/stack">a stack
        app</Link> keeps <code>pb_plugins</code> and <code>voidbase.lock</code> at its root and its build carries both
        into the generated app. The marketplaces a project uses are the lockfile's list (ours is the default and can be
        removed) or <code>VOIDBASE_PLUGIN_MARKETPLACES</code>; a name served by two of them is refused until{" "}
        <code>--marketplace</code> says which. <code>voidbase update</code> names the installed plugins whose range
        excludes the target before it changes anything.
      </p>
      <p>
        The <code>installer</code> plugin is how a running instance changes its own plugins, and it knows where they
        live. Three modes:
      </p>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Mode</th><th>Where</th><th>What a change is</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>filesystem</code></td>
              <td>Bun: <code>voidbase serve</code>, the executable</td>
              <td><code>pb_plugins/</code> and <code>voidbase.lock</code> changed in place, as the CLI does; the instance loads them when it restarts.</td>
            </tr>
            <tr>
              <td><code>repository</code></td>
              <td>A project deployed from a repository: <code>VOIDBASE_PROJECT_REPO</code> and <code>VOIDBASE_GH_TOKEN</code> on the Worker, and <code>VOIDBASE_AUTO_MERGE=on</code></td>
              <td>One commit to the repository, made by the instance through GitHub's API after fetching and verifying the plugin's files itself, which the repository's own build deploys.</td>
            </tr>
            <tr>
              <td><code>fixed</code></td>
              <td>A Worker built without either</td>
              <td>Nothing: the answer says what to connect.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A request to the installer names only a marketplace the project already trusts: one{" "}
        <code>voidbase.lock</code> lists under <code>marketplaces</code>, or, for a plugin already installed, the one its
        own lock entry records. Anything else is refused before that marketplace is asked for anything, because an
        installed plugin runs with the Worker's secrets and a superuser session is not the project's owner. The owner
        trusts a new marketplace where the project lives: add it to the lockfile and commit, or run{" "}
        <code>voidbase plugins add &lt;name&gt; --marketplace &lt;url&gt;</code> on a checkout, then commit and push.
        Reading what a marketplace serves stays open, so an instance's page can show one before you trust it.
      </p>
      <p>
        That is the whole cloud story. A <Link href="/docs/run/cloud">cloud instance</Link> is your Worker in your
        account, deployed from a repository in your GitHub by your own Workers build; the instance's page on
        voidbase.cloud is a client of the instance's installer, signed in as its superuser, and{" "}
        <code>voidbase cloud plugins &lt;instance&gt;</code> does the same from a shell. Nothing is built for an
        instance by anyone but its own pipeline.
      </p>

      <h2>Where a plugin comes from</h2>
      <p>
        <Link href="/docs/marketplace">The marketplace</Link> does the work a publisher would otherwise do. A plugin
        is a public repository with a <code>manifest.json</code>; on approval the marketplace audits what an instance
        would load at a commit (nothing to compile, imports only of what an instance provides and nothing outside the
        plugin, nothing alarming) and records that commit, as{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">
          the registry protocol
        </a>{" "}
        says: three GETs, defined in voidbase because voidbase is the consumer. A static directory is enough to
        serve them, any marketplace can, and an instance fetches and verifies a plugin from any of them the same way. A published
        version never changes; a change is a new version. The demo runs one plugin from ours and one from{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-throwaway-marketplace" target="_blank" rel="noreferrer noopener">
          a throwaway marketplace
        </a>{" "}
        made of static files on GitHub.
      </p>

      <h2>At deploy time</h2>
      <p>
        Some of what a plugin is about happens around a deploy rather than inside a request: attaching a hostname,
        creating an instance for a preview. That is a second object a plugin may export beside its <code>Plugin</code>,
        with <code>before</code>, <code>after</code> and <code>remove</code> hooks around <code>voidbase deploy</code>.
        Every hook gets the Worker's name, the account, the Cloudflare API client the deploy uses, the resolved
        environment, the Worker config and vars (mutable in <code>before</code>), the URL, a log, and{" "}
        <code>dryRun</code>, with which a hook says what it would do and touches nothing.
      </p>
      <CodeBlock {...DEPLOY} />
      <p>
        <code>domains</code> and <code>previews</code> are the two official plugins built on it. A plugin ships its
        half as <code>deploy.js</code>: the marketplace record names the file and its integrity,{" "}
        <code>voidbase plugins add</code> downloads it with the plugin, and the lockfile pins its bytes too, so a
        changed <code>deploy.js</code> refuses the deploy the way a changed plugin refuses the build.
        Shipped deploy plugins run first, then installed ones in the lockfile's order; a hook that throws fails the
        deploy with the plugin and the phase named.
      </p>

      <h2>What is not built</h2>
      <ul>
        <li>
          <strong>Interactive transactions for hooks.</strong> <code>VOIDBASE_DATABASE=durable</code> makes a batch
          one real transaction; a hook still cannot open a transaction of its own.
        </li>
        <li>
          <strong>A plugin's own panel screens.</strong> The admin panel is PocketBase's own build, with voidbase's
          Plugins page added through the panel's extension file; that page edits each plugin's configuration plane.
          A plugin cannot add a screen of its own.
        </li>
        <li>
          <strong>The unpackaged way.</strong> Source in <code>pb_plugins</code> that you write and commit without a
          marketplace in between. Today a plugin loads only when <code>voidbase.lock</code> pins it; for your own
          code,{" "}
          <code>pb_hooks</code> is that path.
        </li>
        <li>
          <strong>A second auth provider.</strong> The seam exists and is proven by removal; no other plugin provides{" "}
          <code>auth@1</code> yet.
        </li>
        <li>
          <strong>A sandbox.</strong> A marketplace's audit is a first pass. A plugin runs inside the instance with
          everything the instance has, the way <code>pb_hooks</code> does, and a plugin's failure is your instance's
          failure.
        </li>
      </ul>

      <h2>Write one</h2>
      <p>
        A repository with a <code>manifest.json</code>, the pb_ files it needs, a <code>main.js</code> if it does more
        than hooks, a licence and a README. Check it against voidbase's own type entry points: <code>@voidbase-cloud/voidbase/plugins</code> for the manifest and plugin types,{" "}
        <code>/kernel</code> for <code>serve</code>, <code>using</code> and <code>onBootstrap</code>,{" "}
        <code>/interfaces</code> for the contracts, <code>/deploy-plugin</code> for the deploy-time half. A plugin may
        import from <code>@voidbase-cloud/voidbase/*</code> and <code>hono</code>, because the instance has both, from
        its own files, and never from Node built-ins, because an instance may be a Worker. Nothing is compiled, so
        what you commit is JavaScript. Test it by loading it through the kernel:
      </p>
      <CodeBlock {...TEST} />
      <p>
        Then <Link href="/docs/marketplace/plugins">submit it</Link>: a form issue with the repository, a title, a
        line, a category and tags. The marketplace audits it and records the commit, and anyone can install it by name.
      </p>

      <h2>Why it is shaped this way</h2>
      <p>
        Interfaces rather than names, so that swapping a payment provider is removing one plugin and installing
        another and nothing that depended on it changes. Three tiers, so that a bare instance is usable and everything
        past that is something you asked for. Trust in the hash and the recorded audit rather than in a host name, so
        that a marketplace is three GETs anyone can serve and an instance is locked to none of them, ours included.
        And every install a commit, so that what an instance runs can be read, reviewed and reverted. If you have built
        a plugin system before and something here looks wrong, that is more useful than a feature request:{" "}
        <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a>, or{" "}
        <a href={`${SITE.repoUrl}/issues`} target="_blank" rel="noreferrer noopener">an issue</a>.
      </p>
    </>
  );
}
