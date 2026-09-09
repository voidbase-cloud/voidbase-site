// The plugins section, on every page that tells you how to run an instance.
//
// It repeats across five pages because the answer genuinely differs by shape: an executable keeps its plugins beside
// itself, a project commits them, a stack app builds them into one Worker, and a cloud instance has none of that
// because you do not hold the filesystem. What must not differ is the part underneath: the same lockfile, the same
// verification, the same marketplaces. Every shape works; two of them are a rebuild rather than a restart.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

export type Shape = "standalone" | "npm" | "cloud" | "project" | "stack";

const COMMANDS: Record<Shape, { code: ReturnType<typeof hl.bash>; dir: string | null }> = {
  standalone: {
    dir: null,
    code: hl.bash`./voidbase plugins                  # what this instance runs, and where each plugin came from
./voidbase plugins add echo          # install by name: into pb_plugins/echo, pinned in voidbase.lock
./voidbase plugins update            # bring them all up to date
./voidbase plugins remove echo       # remove it; for a plugin voidbase ships, turn it off`,
  },
  npm: {
    dir: null,
    code: hl.bash`voidbase plugins --name blog             # what a local instance runs
voidbase plugins add echo --name blog
voidbase plugins update --name blog
voidbase plugins remove echo --name blog`,
  },
  cloud: {
    dir: null,
    code: hl.bash`# nothing to run: you do not hold the filesystem of a cloud instance. Installing is
# a button on the cloud page; a builder rebuilds the instance's Worker around the
# plugin within minutes, the page shows it happening, and the instance keeps serving
# what it has until the new Worker is deployed.`,
  },
  project: {
    dir: "pb_plugins/",
    code: hl.bash`voidbase plugins add echo         # writes pb_plugins/echo and the lock entry
git add pb_plugins voidbase.lock  # the install is a commit, like any dependency
voidbase deploy                   # and the deploy is what puts it live (or push, if a pipeline deploys)`,
  },
  stack: {
    dir: "pb_plugins/",
    code: hl.bash`voidbase plugins add echo         # writes pb_plugins/echo and the lock entry, at the project root
git add pb_plugins voidbase.lock  # the build carries both into the generated app
bun run build && cd .voidbase && voidbase deploy   # or push, if a pipeline deploys`,
  },
};

// which of the two ways reaches this shape at all, which is the part worth saying per page
const SPLIT: Record<Shape, string> = {
  standalone:
    "Both, which is more than this page first claimed. The executable already compiles the hooks directory beside it at startup and loads the result, so an unpackaged plugin dropped beside it is loaded the same way pb_hooks is; there is no build of yours to wait for. A packaged one is a prebuilt bundle with its manifest, evaluated the same way. Neither rebuilds the executable, and neither needs to.",
  npm:
    "Both, for the same reason as the executable: an instance made this way is a directory the CLI can compile at startup, so source and prebuilt plugins both load. The CLI does the rebuild where one is needed, because the toolchain is already on your machine.",
  cloud:
    "Packaged only, and you do none of the work: the control plane rebuilds and redeploys the instance around the plugin. On Cloudflare the set of plugins is fixed when the instance is deployed, so an install here is a deployment, minutes rather than a toggle, and the dashboard says so while it runs. This is the shape the packaged format exists for, because nothing else could reach it.",
  project:
    "Both. Packaged plugins install the way they do everywhere. Unpackaged ones are source in pb_plugins/ that you commit and deploy, which is the cheaper path and only available because you already have a repository.",
  stack:
    "Both, and unpackaged is at its most natural here: the plugin joins the same build as your pages and routes, which is the closest this design gets to a plugin being ordinary code.",
};

const REGISTRY = hl.bash`# our marketplace is the default; any marketplace serving the registry protocol works
voidbase plugins add echo --marketplace https://marketplace.example.com
VOIDBASE_PLUGIN_MARKETPLACES=https://a.example.com,https://b.example.com voidbase plugins add echo
# a name served by two of them is refused until --marketplace says which; voidbase.lock keeps the list`;

export default function PluginsSoon({ shape }: { shape: Shape }) {
  const { code, dir } = COMMANDS[shape];
  return (
    <section className="soon">
      <h2>
        Plugins{" "}
        <span className="label label-success">Since {shape === "stack" || shape === "cloud" ? "0.9.0-beta.8" : "0.9.0-beta.7"}</span>
      </h2>
      <p>
        <code>voidbase plugins add &lt;name&gt;</code> installs a plugin from a marketplace: the bundle lands in{" "}
        <code>pb_plugins/&lt;name&gt;</code>, verified against the hash the marketplace promised, and{" "}
        <code>voidbase.lock</code> pins the marketplace, the version, the hash and the commit it was built from. The
        instance loads it beside the plugins voidbase ships (backups, realtime and the request limits, each also{" "}
        <a href="https://marketplace.voidbase.cloud/plugins">a release on the marketplace</a>), verifies the bytes
        again every time it starts, and a superuser can read where each plugin came from at <code>/api/plugins</code>.
        Removing a shipped plugin turns it off for the project; installing one with its name takes its place.{" "}
        <Link href="/docs/plugins">The design page</Link> is what this was built from.
      </p>

      <CodeBlock {...code} />

      {dir ? (
        <p>
          Unpackaged plugins land in <code>{dir}</code>, beside{" "}
          {shape === "stack" ? <code>vb_hooks</code> : <code>pb_hooks</code>}, which is where installed things sit
          beside your own code everywhere else in voidbase. They are committed, so what is running is what the
          repository says is running, and a deploy is what puts a new one live. A packaged plugin is not a directory
          at all: it is part of what the build produces.
        </p>
      ) : (
        <p>
          Nothing lands in a directory you keep. The control plane records the plugin set on the instance, a builder
          installs it the way the command does (verified against the same hashes) and builds the instance's Worker with
          it baked in, and the instance is deployed from that build with its database, files, domains and superuser
          untouched. An upgrade of an instance with plugins is the same build on the new release.
        </p>
      )}

      <h3>Which of the two ways this shape can do</h3>
      <p>
        A plugin arrives <Link href="/docs/plugins">unpackaged or packaged</Link>: source that joins a repository you
        already have, or a built artifact that installs into any instance without you writing a line. Today only the
        packaged way exists, as the bundle a marketplace built and audited; the rest of this paragraph is the design.{" "}
        {SPLIT[shape]}
      </p>

      <h3>Somewhere other than our marketplace</h3>
      <p>
        A marketplace is three GETs anyone can serve, and static files are enough:{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">the registry protocol</a>{" "}
        is defined in voidbase, which is the consumer, so nothing about ours is privileged. Ours is{" "}
        <a href="https://marketplace.voidbase.cloud" target="_blank" rel="noreferrer noopener">the default</a>, not a
        requirement: the demo runs one plugin from it and one from{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-throwaway-marketplace" target="_blank" rel="noreferrer noopener">a throwaway marketplace</a>{" "}
        that is a repository of static files, and an instance verifies both the same way.
      </p>
      {shape === "cloud" ? (
        <p>
          For a cloud instance the plugins panel offers our marketplace and reads any other by URL; what it installs is
          verified against that marketplace's hash the same way. There is no command, for the same reason as above.
        </p>
      ) : (
        <CodeBlock {...REGISTRY} />
      )}
      <p className="txt-hint">
        Progress is on <Link href="/docs/roadmap">the roadmap</Link>. To publish a plugin, a repository with a{" "}
        <code>plugin.json</code> is enough:{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-marketplace/blob/master/SUBMISSION.md" target="_blank" rel="noreferrer noopener">submit it</a>{" "}
        and the marketplace builds, audits and serves it.
      </p>
    </section>
  );
}
