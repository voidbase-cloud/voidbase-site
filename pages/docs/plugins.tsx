// Plugins, as they exist in voidbase 0.9.0-beta.35: what one is, the sixteen that ship, how one is installed, what a
// plugin does at deploy time, and what is not built.
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
  "voidbase": ">=0.9.0-beta.7",
  "provides": [],
  "requires": []
}`;

const PLUGIN = hl.ts`// src/index.ts: the default export is the plugin, and this file is the whole of it
import type { Plugin } from "@voidbase-cloud/voidbase/plugins";

const plugin: Plugin = {
  manifest: { name: "echo", version: "0.1.0", tier: "community", voidbase: ">=0.9.0-beta.7" },
  apply(ctx) {
    // ctx.app is the instance's Hono app; routes mount before the instance serves anything
    ctx.app.get("/api/echo", (c) => c.text("echo"));
  },
};
export default plugin;`;

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
  manifest: { name: "shop", version: "1.0.0", tier: "community", voidbase: ">=0.9.0-beta.15", collections: ["orders"] },
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
│  └─ echo/
│     ├─ bundle.js      the plugin, as the marketplace built it: one ES module
│     ├─ deploy.js      its deploy-time half, when it has one
│     └─ release.json   what the marketplace recorded: manifest, hash, source commit, audit
└─ voidbase.lock        every installed plugin: marketplace, version, hash, source commit`;

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
import plugin from "../src/index";

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
        name, verified against the hash its marketplace recorded. This page is what a plugin is, the sixteen that ship
        with voidbase, how one reaches an instance, and what is not built.
      </p>

      <h2>What a plugin is</h2>
      <p>
        A manifest and an <code>apply(ctx)</code>. The manifest is <code>plugin.json</code> in the repository's root:{" "}
        <code>name</code>, <code>version</code>, <code>tier</code>, the <code>voidbase</code> range it works against,
        the interfaces it <code>provides</code> and <code>requires</code>, and the <code>collections</code> it owns or{" "}
        <code>extends</code>. The entry point (<code>exports["."]</code> in package.json, or <code>src/index.ts</code>)
        has the plugin as its default export, and <code>apply</code> receives the kernel: <code>ctx.app</code> is the
        instance's Hono app, so a route mounts there before the instance serves anything.
      </p>
      <CodeBlock {...MANIFEST} />
      <CodeBlock {...PLUGIN} />
      <p>
        <strong>Three tiers</strong>, differing in what happens if you do nothing. A <code>core</code> plugin is one
        the instance is not usable without: <code>auth</code> and <code>observability</code> are the two, and an instance running without a
        provider of <code>auth@1</code> loads, runs with nobody signed in, and says what it is missing at boot and on{" "}
        <code>/api/plugins</code>. Taking one out is deliberate: the CLI refuses without <code>--yes</code> and says
        what stops working, and the installer route answers 409 unless the call carries <code>force</code>. The same
        guard covers a plugin another installed plugin depends on. An <code>official</code> plugin is ours, versioned with voidbase, and can be turned
        off or replaced. A <code>community</code> plugin is somebody else's, from{" "}
        <Link href="/docs/marketplace">the marketplace</Link> or a marketplace of your own.
      </p>
      <p>
        <strong>Interfaces, not names.</strong> A plugin depends on what another plugin does rather than on which
        plugin it is, through versioned names kept in one closed list in voidbase: <code>auth@1</code>,{" "}
        <code>payments@1</code>, <code>realtime@1</code>, <code>hardening@1</code> and <code>mail@1</code>. A manifest
        naming one outside the list is refused. Before a single plugin is applied the whole graph is checked and
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
        Sixteen plugins in 0.9.0-beta.35, one line each. Every shipped plugin is loaded unless the project turned it
        off; the last column is the knob that makes it do something, read from the instance's environment or{" "}
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
            <Row name="installer" on={<>On by default. <code>VOIDBASE_PROJECT_REPO</code> and <code>VOIDBASE_GH_TOKEN</code> on the Worker make a change a commit.</>}>
              How an instance changes its own plugins: <code>POST /api/plugins/install</code>, <code>remove</code>, <code>update</code> and <code>GET /api/plugins/available</code>, for superusers. Below, "Installing one".
            </Row>
            <Row name="openapi" on="On by default.">
              <code>GET /api/openapi.json</code>, an OpenAPI 3.1 document generated from the collections and scoped to the token that asked, and <code>GET /api/docs</code>, Scalar over it. <code>voidbase types</code> generates the typed client from the same document.
            </Row>
            <Row name="mcp" on="On by default.">
              <code>POST /api/mcp</code>, a stateless MCP server whose tools are the routes the caller's token may call, derived per request from the same scoped document; every call runs through the instance's own route and rules.
            </Row>
            <Row name="seo" on={<>On by default. <code>VOIDBASE_SITEMAP</code>, <code>VOIDBASE_SEO</code>, <code>VOIDBASE_SITE_URL</code>, <code>VOIDBASE_ROBOTS_DISALLOW</code> and <code>VOIDBASE_LLMS_NOTE</code> shape the answers; <code>VOIDBASE_SEO_PNG=1</code> renders the share cards as PNG.</>}>
              <code>robots.txt</code>, <code>sitemap.xml</code> from public records, <code>llms.txt</code>, <code>GET /api/seo/meta</code> (canonical, title, JSON-LD, OpenGraph and Twitter tags, a ready head fragment) and share cards rendered on request at <code>/api/seo/og</code>. A real file in <code>pb_public</code> wins.
             The cards are SVG by default; the PNG knob carries a WebAssembly rasteriser and a subset font into the Worker, about a megabyte compressed, which is why it is a choice rather than a default.
            </Row>
            <Row name="mail" on={<><code>VOIDBASE_MAIL_DOMAIN=example.com</code></>}>
              Provides <code>mail@1</code>: outbound mail from the instance's own domain through Cloudflare's Email Service. The deploy adds the binding; a sender off the domain falls back to SMTP or is refused with the reason on <code>/api/plugins</code>.
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
        Removing a shipped plugin turns it off for the project; installing one with a shipped plugin's name takes its
        place. Four of these are also packages on the marketplace, built through the same door as anyone's (
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-auth" target="_blank" rel="noreferrer noopener">auth</a>,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-backups" target="_blank" rel="noreferrer noopener">backups</a>,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-realtime" target="_blank" rel="noreferrer noopener">realtime</a>,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-hardening" target="_blank" rel="noreferrer noopener">hardening</a>
        ), which is the proof that nothing about ours is privileged. The client side of several of them is in{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-js-sdk" target="_blank" rel="noreferrer noopener">@voidbase-cloud/sdk</a>:{" "}
        <code>ai()</code>, <code>payments()</code> and <code>seo()</code> are plugins on the SDK's own surface over
        the routes above.
      </p>

      <h2>Installing one</h2>
      <p>
        <code>voidbase plugins add &lt;name&gt;</code> installs a plugin from a marketplace: the bundle is downloaded
        into <code>pb_plugins/&lt;name&gt;/bundle.js</code> with the marketplace's record beside it, its bytes are
        verified against the integrity the marketplace promised, and <code>voidbase.lock</code> pins the marketplace,
        the version, the integrity and the source commit. It is committed like any dependency: what the repository
        says is running is what is running.
      </p>
      <CodeBlock {...SHAPE} />
      <CodeBlock {...USE} />
      <p>
        An instance reads the same files when it starts. On Bun (<Link href="/docs/run/standalone">the executable</Link>,{" "}
        <Link href="/docs/run/npm">a local instance</Link>, <Link href="/docs/run/project">a project</Link>) every
        bundle is verified against the lockfile and a changed byte is refused by name. On Workers the same check runs
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
              <td>A project deployed from a repository: <code>VOIDBASE_PROJECT_REPO</code> and <code>VOIDBASE_GH_TOKEN</code> on the Worker</td>
              <td>One commit to the repository, made by the instance through GitHub's API after downloading and verifying the bundle itself, which the repository's own build deploys.</td>
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
        That is the whole cloud story. A <Link href="/docs/run/cloud">cloud instance</Link> is your Worker in your
        account, deployed from a repository in your GitHub by your own Workers build; the instance's page on
        voidbase.cloud is a client of the instance's installer, signed in as its superuser, and{" "}
        <code>voidbase cloud plugins &lt;instance&gt;</code> does the same from a shell. Nothing is built for an
        instance by anyone but its own pipeline.
      </p>

      <h2>Where a plugin comes from</h2>
      <p>
        <Link href="/docs/marketplace">The marketplace</Link> does the work a publisher would otherwise do. A plugin
        is a public repository with a <code>plugin.json</code>; on approval the marketplace fetches it at a commit,
        audits the source, bundles it with Bun so that what an instance provides (voidbase's entry points, hono) stays
        an import and everything else is inside the file, audits the bundle, hashes it, and serves it as{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">
          the registry protocol
        </a>{" "}
        says: three GETs, defined in voidbase because voidbase is the consumer. A static directory is enough to
        serve them, any marketplace can, and an instance verifies a bundle from any of them the same way. A published
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
        <code>domains</code> and <code>previews</code> are the two shipped plugins built on it. An installed plugin
        ships its half as <code>deploy.js</code> beside <code>bundle.js</code>: the marketplace record names the file
        and its integrity, <code>voidbase plugins add</code> downloads it with the bundle, and the lockfile pins its
        bytes too, so a changed <code>deploy.js</code> refuses the deploy the way a changed bundle refuses the build.
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
          <strong>Panel screens.</strong> The admin panel is PocketBase's own build, used unmodified, and a plugin
          cannot add a screen to a bundle voidbase does not build. A plugin's settings live in collections the stock
          panel already edits.
        </li>
        <li>
          <strong>The unpackaged way.</strong> Source in <code>pb_plugins</code> that you write and commit without a
          marketplace in between. Today a plugin is always a bundle a marketplace built; for your own code,{" "}
          <code>pb_hooks</code> is that path.
        </li>
        <li>
          <strong>A second auth provider.</strong> The seam exists and is proven by removal; no other plugin provides{" "}
          <code>auth@1</code> yet.
        </li>
        <li>
          <strong>A sandbox.</strong> A marketplace's audit is a first pass. A bundle runs inside the instance with
          everything the instance has, the way <code>pb_hooks</code> does, and a plugin's failure is your instance's
          failure.
        </li>
        <li>
          <strong>Who besides us may define an interface.</strong> The list is closed and lives in voidbase.
        </li>
      </ul>

      <h2>Write one</h2>
      <p>
        A repository, a <code>plugin.json</code>, an entry point, a licence, a README. Type it against voidbase's own
        entry points: <code>@voidbase-cloud/voidbase/plugins</code> for the manifest and plugin types,{" "}
        <code>/kernel</code> for <code>serve</code>, <code>using</code> and <code>onBootstrap</code>,{" "}
        <code>/interfaces</code> for the contracts, <code>/deploy-plugin</code> for the deploy-time half. A bundle may
        import from <code>@voidbase-cloud/voidbase/*</code> and <code>hono</code>, because the instance has both, and
        never from Node built-ins, because an instance may be a Worker. Test it by loading it through the kernel:
      </p>
      <CodeBlock {...TEST} />
      <p>
        Then <Link href="/docs/marketplace/plugins">submit it</Link>: a form issue with the repository, a title, a
        line, a category and tags. The marketplace builds, audits and serves it, and anyone can install it by name.
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
        <Link href="/docs/roadmap">the roadmap</Link> for what is next.
      </p>
    </>
  );
}
