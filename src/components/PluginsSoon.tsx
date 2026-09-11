// The plugins section, on every page that tells you how to run an instance.
//
// It repeats across five pages because where an installed plugin lives differs by shape: an executable and a local
// instance keep pb_plugins beside themselves, a project commits it, a stack app builds it into one Worker, and a cloud
// instance is a project whose install is a commit. What does not differ is underneath: the same lockfile, the same
// verification, the same marketplaces. The full page is /docs/plugins; this block says what applies here.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

export type Shape = "standalone" | "npm" | "cloud" | "project" | "stack";

const COMMANDS: Record<Exclude<Shape, "cloud">, ReturnType<typeof hl.bash>> = {
  standalone: hl.bash`./voidbase plugins ls                # what this instance runs, and where each plugin came from
./voidbase plugins add echo          # into pb_plugins/echo beside the executable, pinned in voidbase.lock
./voidbase plugins update            # bring them all up to date
./voidbase plugins remove echo       # remove it; for a plugin voidbase ships, turn it off`,
  npm: hl.bash`voidbase plugins ls                  # in the instance's directory
voidbase plugins add echo
voidbase plugins update
voidbase plugins remove echo`,
  project: hl.bash`voidbase plugins add echo         # writes pb_plugins/echo and the lock entry
git add pb_plugins voidbase.lock  # the install is a commit, like any dependency
voidbase deploy                   # and the deploy is what puts it live (or push, if a pipeline deploys)`,
  stack: hl.bash`voidbase plugins add echo         # writes pb_plugins/echo and the lock entry, at the project root
git add pb_plugins voidbase.lock  # the build carries both into the generated app
bun run build && cd .voidbase && voidbase deploy   # or push, if a pipeline deploys`,
};

const WHERE: Record<Shape, React.ReactNode> = {
  standalone: (
    <>
      The executable is the filesystem case: the command changes <code>pb_plugins/</code> and{" "}
      <code>voidbase.lock</code> beside it, and the instance verifies every bundle against the lockfile and loads it
      when it restarts. There is no build of yours to wait for and no node_modules: a bundle's imports resolve to
      the modules the executable is already running.
    </>
  ),
  npm: (
    <>
      A local instance and a project are the same shape, a directory, so the command runs there as it does in a
      project: it changes <code>pb_plugins/</code> and <code>voidbase.lock</code> in place, and the instance verifies
      every bundle against the lockfile and loads them when it restarts.
    </>
  ),
  project: (
    <>
      Installed plugins land in <code>pb_plugins/</code> beside <code>pb_hooks</code> and are committed, so what is
      running is what the repository says is running, and a deploy is what puts a new one live. On Workers the
      verification runs at build time, so a mismatch fails the build rather than the instance. A project deployed
      from a repository can also change its plugins from inside: with <code>VOIDBASE_PROJECT_REPO</code> and{" "}
      <code>VOIDBASE_GH_TOKEN</code> on the Worker, the instance's installer makes one commit, which the repository's
      own build deploys.
    </>
  ),
  stack: (
    <>
      <code>pb_plugins/</code> and <code>voidbase.lock</code> sit at the project root beside <code>vb_hooks</code>,
      and the build carries both into the generated app, verifying every bundle against the lockfile as it does; a
      mismatch fails the build rather than the instance.
    </>
  ),
  cloud: (
    <>
      Nothing to run on your machine. A cloud instance is a project deployed from a repository in your own GitHub, and
      its page on voidbase.cloud is a client of the instance's own installer, signed in as its superuser: an install,
      an update or a removal is one commit the instance makes to the repository, which the repository's own build
      deploys. <code>voidbase cloud plugins &lt;instance&gt;</code> does the same from a shell.
    </>
  ),
};

export default function PluginsSoon({ shape }: { shape: Shape }) {
  return (
    <section className="soon">
      <h2>Plugins</h2>
      <p>
        Plugins exist and <Link href="/docs/marketplace">the marketplace</Link> lists them.{" "}
        <code>voidbase plugins add &lt;name&gt;</code> installs one: the bundle lands in{" "}
        <code>pb_plugins/&lt;name&gt;</code>, verified against the hash the marketplace recorded, and{" "}
        <code>voidbase.lock</code> pins the marketplace, the version, the hash and the commit it was built from. The
        instance loads it beside the sixteen plugins voidbase ships, and a superuser reads where each came from at{" "}
        <code>/api/plugins</code>. Removing a shipped plugin turns it off; installing one with its name takes its
        place. <Link href="/docs/plugins">The plugins page</Link> has what a plugin is, the shipped ones and their
        knobs, and the installer.
      </p>
      <p>{WHERE[shape]}</p>
      {shape !== "cloud" && <CodeBlock {...COMMANDS[shape]} />}
      <p className="txt-hint">
        Any marketplace serving{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">the registry protocol</a>{" "}
        works, ours being the default: <code>--marketplace &lt;url&gt;</code> on an install, or{" "}
        <code>VOIDBASE_PLUGIN_MARKETPLACES</code>. To publish one, a repository with a <code>plugin.json</code> is
        enough: <Link href="/docs/marketplace/plugins">submit it</Link> and the marketplace builds, audits and serves
        it.
      </p>
    </section>
  );
}
