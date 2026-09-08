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
      ├─ panel/         screens it adds to the admin panel
      └─ register.ts    packaged plugins only: what the build composes in`;

// in a project or a stack app, where you already have the source
const USE = hl.bash`voidbase plugins                 # what is installed, and which way each one is in
voidbase plugins add backups-r2  # source into pb_plugins/, committed like any dependency
voidbase plugins update
voidbase plugins remove backups-r2`;

// anywhere, including the shapes that have no repository at all
const PACKAGED = hl.bash`./voidbase plugins add cache-kv     # the standalone executable
voidbase plugins add cache-kv --name blog   # an instance made with the CLI
# or a button in the dashboard, for a cloud instance
#
# each rebuilds the instance around the plugin and restarts it on the result.`;

export default function DocsPlugins() {
  return (
    <>
      <h1>
        Plugins <span className="label label-warning">Not built yet</span>
      </h1>
      <p className="docs-lead">
        A plugin is code somebody else wrote that you install into your instance by name, instead of copying a hook
        file out of a gist and hoping. There are two ways one could arrive, one cheap and one that rebuilds the
        instance, and the difference between them is most of this page. <code>pb_plugins</code> does not exist yet:
        no format, no loader, nothing to install. This is the design, written down so it can be argued with before
        it is built.
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

      <h2>Two ways in</h2>
      <p>
        A plugin arrives one of two ways, and the difference is who can install it. One asks you to have a
        repository and a build. The other asks nothing of you at all.
      </p>

      <h3>Unpackaged, for instances you build</h3>
      <p>
        Source in <code>pb_plugins/</code>, joining your repository the way <code>pb_hooks</code> does. It works in{" "}
        <Link href="/docs/run/project">a voidbase project</Link> and{" "}
        <Link href="/docs/run/stack">a stack app</Link>, and only there, because those are the shapes where you
        already have the code, the toolchain and a deploy of your own. The plugin is one more thing in a build you
        were running anyway.
      </p>
      <p>
        That makes it the cheap path for people who are already writing code, and useless to everyone else. It also
        keeps what the plugin can do inside what a hook can do: routes, handlers, collections, panel screens. No npm
        dependencies of its own, no new bindings.
      </p>
      <CodeBlock {...USE} />

      <h3>Packaged, for every instance, without writing anything</h3>
      <p>
        The plugin is a built artifact rather than source, so installing it does not require you to have a project,
        a toolchain or an opinion about builds. It works in{" "}
        <Link href="/docs/run/standalone">the standalone executable</Link>,{" "}
        <Link href="/docs/run/npm">instances from the CLI</Link> and{" "}
        <Link href="/docs/run/cloud">voidbase cloud</Link> as well as in a project or a stack app. Someone who has
        never opened an editor can install one, which is the entire point of the format existing.
      </p>
      <p>
        What that costs is a rebuild, done by the tooling rather than by you: the instance is put together again with
        the plugin compiled into it, and the result is what runs. In exchange the plugin gets what an unpackaged one
        cannot have, which is real dependencies and bindings of its own, a queue or a KV namespace the base instance
        never had.
      </p>
      <CodeBlock {...PACKAGED} />
      <p>
        Because the instance is rebuilt, it is rebuilt on the current voidbase release rather than whichever one it
        was running. A packaged install therefore carries an upgrade with it whether or not you wanted one. That is
        the most awkward thing in this design and it is not settled.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            If you are publishing, packaged is what reaches people. Unpackaged reaches only those who already have a
            repository, which is the smaller half of everyone running voidbase and the half least in need of help.
          </p>
        </div>
      </div>

      <h2>What is decided</h2>
      <ul>
        <li>Plugins live in a directory beside your hooks, installed and updated by name rather than copied in.</li>
        <li>A plugin declares what it needs and can add routes, hooks, collections and admin panel screens.</li>
        <li>
          There are two ways in, and a plugin declares which it is. Unpackaged reaches projects and stack apps only.
          Packaged reaches every shape, including the ones with no repository, and is what a publisher should aim
          for unless there is a reason not to.
        </li>
        <li>
          <strong>Three tiers, differing in what happens if you do nothing.</strong> A core plugin is installed and
          on by default, because the instance is not usable without it; auth is the first and there will not be
          many. An official plugin is ours, supported and versioned with voidbase, and arrives because you asked
          for it. A community plugin is somebody else's, from{" "}
          <Link href="/docs/marketplace">the marketplace</Link> or a registry of your own.
        </li>
        <li>
          Removing a core plugin is possible, because replacing auth is the whole reason it left the core, but it
          has to be deliberate rather than something that happens while you install something else, and the
          instance should say what it is now missing.
        </li>
        <li>
          Everything is versioned and every install is recorded, so an instance can say what it is running and
          reproduce it. A plugin declares which voidbase versions it works against, and the loader refuses one that
          does not fit instead of finding out at request time.
        </li>
        <li>
          <strong>Plugins depend on interfaces, not on each other by name.</strong> A plugin declares what it
          provides and what it requires. Something that takes payments requires the payment interface; Stripe,
          Polar and Lemon Squeezy each provide it; swapping one for another changes nothing for anything that
          depended on it. The loader resolves that graph, loads in its order, refuses a cycle, and says so when an
          interface has no provider or two.
        </li>
      </ul>

      <h2>What is not</h2>
      <ul>
        <li>The manifest: what <code>plugin.json</code> declares, and how strictly.</li>
        <li>
          <strong>Whether a plugin can act at deploy time.</strong> Everything above describes a plugin running
          inside an instance, handling requests. Some of what should be a plugin happens around a deploy instead:
          attaching a hostname, turning on a platform setting, creating an instance for a preview. That surface does
          not exist, and several roadmap items want it.
        </li>
        <li>
          Who may define an interface, and what happens when two plugins define the same thing differently. Get this
          wrong early and everything built afterwards inherits it.
        </li>
        <li>
          <strong>Permissions.</strong> A plugin that can add routes and read collections can do damage. What it has
          to ask for, and how that is checked against what it actually does, is the question that decides whether any
          of this is safe to install, and it is the one we are least sure about.
        </li>
        <li>
          Upgrading voidbase under installed plugins: telling you which ones will not survive the jump before you
          take it, rather than after.
        </li>
        <li>Isolation: whether a plugin runs in the same isolate as your hooks, and what its failures do to yours.</li>
        <li>
          <strong>The upgrade a packaged install drags along.</strong> Rebuilding puts the instance on the current
          release, so installing a plugin and upgrading voidbase become the same action. Whether that can be
          separated, by rebuilding on the version you are already on, is open, and it is the difference between a
          plugin install being routine and being a thing you schedule.
        </li>
        <li>
          Whether a packaged plugin can be uninstalled without a second rebuild, and what an instance falls back to
          if that rebuild fails.
        </li>
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
