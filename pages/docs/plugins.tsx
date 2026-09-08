// Plugins as a concept, before any of it exists.
//
// The honest structure for an unbuilt feature is: what it will be, what is decided, what is not, and what you can do
// about it now. Anything else on this page would be describing a format nobody has written.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const SHAPE = hl.bash`my-instance/
├─ pb_hooks/            your own code
├─ pb_migrations/       your own schema
└─ pb_plugins/          installed plugins, one directory each
   └─ backups-r2/
      ├─ plugin.json    what it is, what it needs, what it may touch
      ├─ hooks/         handlers it registers
      ├─ migrations/    collections it owns
      └─ panel/         screens it adds to the admin panel`;

const USE = hl.bash`voidbase plugins                 # what is installed
voidbase plugins add backups-r2  # install by name from the marketplace
voidbase plugins update          # bring them up to date
voidbase plugins remove backups-r2`;

export default function DocsPlugins() {
  return (
    <>
      <h1>
        Plugins <span className="label label-warning">Not built yet</span>
      </h1>
      <p className="docs-lead">
        A plugin is code somebody else wrote that you install into your instance by name, instead of copying a hook
        file out of a gist and hoping. <code>pb_plugins</code> does not exist yet: there is no format, no loader, and
        nothing to install. This page is the design, written down so it can be argued with before it is built.
      </p>

      <h2>What one will be</h2>
      <p>
        A directory beside your own code, holding things you did not write. That placement is the whole idea: a
        plugin registers hooks, owns collections and adds panel screens the same way your own code does, so nothing
        about it is a special case at runtime.
      </p>
      <CodeBlock {...SHAPE} />
      <p>
        A stack app calls it <code>vb_plugins</code>, beside <code>vb_hooks</code>, because that is what the stack
        calls everything else.
      </p>

      <h2>Using one</h2>
      <CodeBlock {...USE} />
      <p>
        Installed by name, versioned, and recorded in a lock file, so what is running is what your repository says is
        running. Each page under <Link href="/docs/run/standalone">Run an instance</Link> has a section on what this
        looks like for that shape, because a downloaded executable, a committed project and a cloud instance cannot
        all install things the same way.
      </p>

      <h2>What is decided</h2>
      <ul>
        <li>Plugins live in a directory beside your hooks, installed and updated by name rather than copied in.</li>
        <li>A plugin declares what it needs and can add routes, hooks, collections and admin panel screens.</li>
        <li>
          Core plugins ship with voidbase, official ones are ours and versioned with it, and anyone can publish their
          own through <Link href="/docs/marketplace">the marketplace</Link> or a registry of their own.
        </li>
      </ul>

      <h2>What is not</h2>
      <ul>
        <li>The manifest: what <code>plugin.json</code> declares, and how strictly.</li>
        <li>
          <strong>Permissions.</strong> A plugin that can add routes and read collections can do damage. What it has
          to ask for, and how that is checked against what it actually does, is the question that decides whether any
          of this is safe to install, and it is the one we are least sure about.
        </li>
        <li>Versioning: what happens to an installed plugin when voidbase changes underneath it.</li>
        <li>Isolation: whether a plugin runs in the same isolate as your hooks, and what its failures do to yours.</li>
      </ul>

      <h2>What you can do now</h2>
      <p>
        <Link href="/docs/marketplace/plugins">Register the plugin you would write.</Link> The form asks what it would
        need from voidbase, and those answers are what the format gets designed around. A format designed against
        imagined plugins fits none of the real ones, which is the whole reason this page exists before the code does.
      </p>
      <p>
        If you have built a plugin system before and something above looks wrong, that is more useful than a feature
        request. <Link href="/docs/roadmap">The roadmap</Link> carries the design as it stands.
      </p>
    </>
  );
}
