// The "plugins are coming" section, on every page that tells you how to run an instance.
//
// It repeats across five pages because the answer genuinely differs by shape: an executable keeps its plugins beside
// itself, a project commits them, a stack app builds them into one Worker, and a cloud instance has none of that
// because you do not hold the filesystem. What must not differ is the part underneath, which is that none of it
// exists yet and every command below is a proposal.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

export type Shape = "standalone" | "npm" | "cloud" | "project" | "stack";

const COMMANDS: Record<Shape, { code: ReturnType<typeof hl.bash>; dir: string | null }> = {
  standalone: {
    dir: "pb_plugins/",
    code: hl.bash`./voidbase plugins                  # what this instance has
./voidbase plugins add backups-r2    # install by name
./voidbase plugins update            # bring them all up to date
./voidbase plugins remove backups-r2`,
  },
  npm: {
    dir: "pb_plugins/",
    code: hl.bash`voidbase plugins --name blog             # what a local instance has
voidbase plugins add backups-r2 --name blog
voidbase plugins update --name blog
voidbase plugins remove backups-r2 --name blog`,
  },
  cloud: {
    dir: null,
    code: hl.bash`# nothing to run: you do not hold the filesystem of a cloud instance.
# installing is a button in the dashboard, and the instance redeploys itself.`,
  },
  project: {
    dir: "pb_plugins/",
    code: hl.bash`voidbase plugins add backups-r2   # writes pb_plugins/ and the lock entry
git add pb_plugins voidbase.lock  # the install is a commit, like any dependency
voidbase deploy                   # and the deploy is what puts it live`,
  },
  stack: {
    dir: "vb_plugins/",
    code: hl.bash`voidbase plugins add backups-r2   # writes vb_plugins/ and the lock entry
git add vb_plugins voidbase.lock
bun run build && cd .voidbase && voidbase deploy`,
  },
};

const REGISTRY = hl.bash`# our marketplace is the default; any registry serving the same shape works
voidbase plugins add backups-r2 --registry https://marketplace.example.com
VOIDBASE_PLUGIN_REGISTRY=https://marketplace.example.com voidbase plugins add backups-r2`;

export default function PluginsSoon({ shape }: { shape: Shape }) {
  const { code, dir } = COMMANDS[shape];
  return (
    <section className="soon">
      <h2>
        Plugins <span className="label label-warning">Not built yet</span>
      </h2>
      <p>
        <code>pb_plugins</code> does not exist. There is no manifest format, no loader, and nothing to install, so
        every command in this section is a proposal rather than something you can run today. It is written down
        because the shape of it is being decided now and{" "}
        <Link href="/docs/plugins">the design is worth arguing with</Link> before it is built.
      </p>

      <CodeBlock {...code} />

      {shape === "cloud" ? (
        <p>
          A cloud instance is provisioned for you, so there is no directory of yours for a plugin to land in.
          Installing one would be a choice in the dashboard, applied by redeploying the instance onto the same
          release with that plugin included.
        </p>
      ) : (
        <p>
          Installed plugins land in <code>{dir}</code>, beside{" "}
          {shape === "stack" ? <code>vb_hooks</code> : <code>pb_hooks</code>}, which is where installed things sit
          beside your own code everywhere else in voidbase.{" "}
          {shape === "project" || shape === "stack"
            ? "They are committed, so what is running is what the repository says is running, and a deploy is what puts a new one live."
            : "They load at startup, so restarting the server is what picks up a change."}
        </p>
      )}

      <h3>Somewhere other than our marketplace</h3>
      <p>
        A registry is a listing anyone can serve. Ours is{" "}
        <a href="https://marketplace.voidbase.cloud" target="_blank" rel="noreferrer noopener">the default</a>, not a
        requirement: a company that wants its own private set should be able to point at its own, and nothing about
        that path should be worse than the default one.
      </p>
      {shape === "cloud" ? (
        <p>
          For a cloud instance that means naming the registry once in its settings, after which its plugin list is
          drawn from there rather than from ours. There is no command, for the same reason as above.
        </p>
      ) : (
        <CodeBlock {...REGISTRY} />
      )}
      <p className="txt-hint">
        Progress is on <Link href="/docs/roadmap">the roadmap</Link>. If you would build a plugin,{" "}
        <Link href="/docs/marketplace/plugins">register it now</Link>: the answers shape the format.
      </p>
    </section>
  );
}
