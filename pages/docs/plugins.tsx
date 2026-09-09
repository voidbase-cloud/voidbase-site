// Plugins, as they exist: what one is, how it reaches an instance, what is decided, what is not, and how to write one.
//
// This page was the design before any of it existed; most of it is built now, and the page says which parts are
// facts and which are still open. Anything that is a promise is marked as one.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const SHAPE = hl.bash`my-instance/
├─ pb_hooks/            your own code
├─ pb_migrations/       your own schema
├─ pb_plugins/          installed plugins, one directory each
│  └─ echo/
│     ├─ bundle.js      the plugin, as the marketplace built it: one ES module
│     └─ release.json   what the marketplace recorded: manifest, hash, source commit, audit
└─ voidbase.lock        every installed plugin: marketplace, version, hash, source commit`;

const USE = hl.bash`voidbase plugins                  # what this project runs, and where each plugin came from
voidbase plugins add echo         # download, verify against the marketplace's hash, pin in voidbase.lock
voidbase plugins update           # bring installed plugins to the latest their own marketplace serves
voidbase plugins remove echo      # remove it; for a plugin voidbase ships, turn it off
voidbase plugins add echo --marketplace https://marketplace.example.com   # any marketplace serving the protocol`;

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

export const stripe: Plugin = {
  manifest: { name: "stripe", version: "0.1.0", tier: "community", voidbase: "*", provides: ["payments@1"] },
  apply(ctx) { serve<Payments>(ctx, "payments@1", { checkout, webhook, cancel }); },
};

export const shop: Plugin = {
  manifest: { name: "shop", version: "0.1.0", tier: "community", voidbase: "*", requires: ["payments@1"] },
  apply(ctx) {
    const payments = using<Payments>(ctx, "payments@1"); // whichever plugin provides it: stripe, polar, yours
    ctx.app.post("/api/shop/checkout", async (c) => c.json(await payments.checkout(await c.req.json())));
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

export default function DocsPlugins() {
  return (
    <>
      <h1>
        Plugins <span className="label label-success">Built, mostly</span>
      </h1>
      <p className="docs-lead">
        A plugin is code somebody else wrote that you install into your instance by name, instead of copying a hook
        file out of a gist and hoping. Since 0.9.0-beta.7 that exists end to end: a manifest format, a loader that
        refuses a set of plugins that does not fit before running any of it, an open registry protocol, a marketplace
        that builds and audits a plugin from its repository, and <code>voidbase plugins add</code>, which puts the
        bundle in <code>pb_plugins</code> pinned by hash in <code>voidbase.lock</code>. Backups, realtime and the
        request limits ship this way. This page says what is a fact and what is still open.
      </p>

      <h2>What one is</h2>
      <p>
        A repository with a <code>plugin.json</code> in its root and an entry point (<code>exports["."]</code> in
        package.json, or <code>src/index.ts</code>) whose default export is the plugin: a manifest and an{" "}
        <code>apply(ctx)</code> that mounts routes on the instance's app, provides an interface, or both. That is the
        whole format. There is no build step on your side, no publishing, no registry account.
      </p>
      <CodeBlock {...MANIFEST} />
      <CodeBlock {...PLUGIN} />
      <p>
        Installed, it lives in a directory beside your own code, holding things you did not write, and it is
        committed like any dependency: what the repository says is running is what is running.
      </p>
      <CodeBlock {...SHAPE} />
      <p>
        A stack app keeps <code>pb_plugins</code> and <code>voidbase.lock</code> at its root, and its build carries
        both into the generated app.
      </p>

      <h2>How one reaches an instance</h2>
      <p>
        <Link href="/docs/marketplace">The marketplace</Link> does the work a publisher would otherwise do. On
        approval it fetches the repository at a commit, audits the source (a valid manifest, only interfaces voidbase
        defines, an entry point, nothing alarming), installs its dependencies without running their scripts, bundles
        it with Bun so that what an instance provides (voidbase's entry points, hono) stays an import and everything
        else is inside the file, audits the bundle again, hashes it, and serves it as{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">
          the registry protocol
        </a>{" "}
        says. That protocol is three GETs, defined in voidbase because voidbase is the consumer: any marketplace can
        serve it, a directory of static files is enough, and an instance verifies a bundle from any of them the same
        way. The demo runs one plugin from ours and one from a throwaway marketplace made of files on GitHub.
      </p>
      <CodeBlock {...USE} />
      <p>
        The command works for <Link href="/docs/run/standalone">the executable</Link>,{" "}
        <Link href="/docs/run/npm">an instance from the CLI</Link>, <Link href="/docs/run/project">a project</Link>{" "}
        and <Link href="/docs/run/stack">a stack app</Link>. An instance verifies every bundle against the lockfile
        each time it starts, and refuses a changed byte by name. On Workers the same check runs at build time, so a
        mismatch fails the build rather than the instance. A <Link href="/docs/run/cloud">cloud instance</Link> has no
        filesystem you hold, so its page records the plugin set and a builder rebuilds its Worker with the plugins
        baked in, minutes later, while the instance keeps serving what it has.
      </p>

      <h2>What is decided</h2>
      <ul>
        <li>
          <strong>Interfaces, not names.</strong> A plugin declares what it provides and what it requires, as
          versioned names (<code>payments@1</code>). Two providers of one interface are refused at load with both
          named, a cycle is refused with the circle printed, a missing requirement names who wanted it, and a plugin
          outside its voidbase range is refused before it runs. The list of interfaces lives in voidbase, in one
          place; a community plugin consumes one rather than inventing one.
        </li>
        <li>
          <strong>Three tiers, differing in what happens if you do nothing.</strong> A core plugin is on by default
          because the instance is not usable without it (auth will be the first; it is still built in, so the core
          list is empty). An official plugin is ours, versioned with voidbase, and you can turn it off or replace it:
          removing a shipped plugin turns it off for the project, and installing one with its name takes its place.
          A community plugin is somebody else's, from the marketplace or a marketplace of your own.
        </li>
        <li>
          Everything is versioned and every install is recorded: an instance says what it runs and where each plugin
          came from (<code>/api/plugins</code>, for a superuser), and <code>voidbase update</code> names the installed
          plugins whose range excludes the target before it changes anything.
        </li>
        <li>
          Trust is the hash and the audit, not the marketplace's name. A published version is immutable; a change is
          a new version.
        </li>
      </ul>
      <CodeBlock {...INTERFACE} />

      <h2>What is not</h2>
      <ul>
        <li>
          <strong>The unpackaged way.</strong> Source in <code>pb_plugins</code> that you write yourself and commit,
          without a marketplace in between. Today a plugin is always a bundle a marketplace built; for your own code,
          <code>pb_hooks</code> is that path.
        </li>
        <li>
          <strong>Collections a plugin owns.</strong> The manifest can declare them and the loader checks ownership
          and extension, but nothing creates them yet; a plugin that needs a collection has to make it itself.
        </li>
        <li>
          <strong>Whether a plugin can act at deploy time.</strong> Attaching a hostname, turning on a platform setting,
          creating an instance for a preview: that surface does not exist, and several roadmap items want it.
        </li>
        <li>
          <strong>Permissions.</strong> A plugin runs inside the instance with everything the instance has, the way
          your hooks do. The audit is deterministic and recorded, and a first pass rather than a sandbox. What a plugin
          has to ask for, and how that is checked against what it does, is still the question that decides how safe
          this is.
        </li>
        <li>
          On a cloud instance an install rebuilds on the active release, so an upgrade rides along; rebuilding on the
          version the instance already runs is a small change we have not made.
        </li>
        <li>Isolation: a plugin's failure is your instance's failure, as with a hook.</li>
      </ul>

      <h2>Write one</h2>
      <p>
        A repository, a <code>plugin.json</code>, an entry point, a licence, a README. Type it against voidbase's own
        entry points: <code>@voidbase-cloud/voidbase/plugins</code> for the manifest and plugin types,{" "}
        <code>/kernel</code> for <code>serve</code> and <code>using</code>, <code>/interfaces</code> for the contracts.
        Test it the way the marketplace's own tests do, by loading it through the kernel:
      </p>
      <CodeBlock {...TEST} />
      <p>
        Then <a href="https://github.com/voidbase-cloud/voidbase-marketplace/blob/master/SUBMISSION.md" target="_blank" rel="noreferrer noopener">submit it</a>:
        a form with the repository, a title, a line, a category and tags. A maintainer approves, the marketplace
        builds and audits it, and anyone can install it by name. The three plugins voidbase ships went through the
        same door (
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-backups" target="_blank" rel="noreferrer noopener">backups</a>,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-realtime" target="_blank" rel="noreferrer noopener">realtime</a>,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-plugin-hardening" target="_blank" rel="noreferrer noopener">hardening</a>
        ), which is the proof that nothing about ours is privileged.
      </p>
      <p>
        If you have built a plugin system before and something above looks wrong, that is more useful than a feature
        request. <Link href="/docs/roadmap">The roadmap</Link> carries what is next.
      </p>
    </>
  );
}
