// The whole-application path: a Void app that builds into a voidbase instance and deploys as one Worker.
import CodeBlock from "@/components/CodeBlock";

const SCAFFOLD = `mkdir my-app && cd my-app
bun add void && bunx void init      # scaffolds a Void app: pages/, routes/, db/, vite.config.ts
bun add @voidbase-cloud/voidbase`;

const CONFIG = `// vite.config.ts
import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidbaseAdapter } from "@voidbase-cloud/voidbase/adapter/plugin";

export default defineConfig({ plugins: [voidPlugin(), voidbaseAdapter()] });`;

const BUILD = `bun run build                                  # writes the whole voidbase app into .voidbase/
bun .voidbase/main.ts --http 127.0.0.1:8090    # site at /, API at /api, panel at /_/

cd .voidbase && voidbase deploy                # one Worker with all three`;

export default function DocsStack() {
  return (
    <>
      <h1>The voidbase stack</h1>
      <p className="docs-lead">
        The other pages give you a backend that a separate frontend talks to. This one gives you a single
        application: pages, routes and a database in one project, which builds into a voidbase instance and deploys as
        one Worker serving the site, the API and the admin panel from the same address.
      </p>

      <p>
        It is a <a href="https://void.cloud" target="_blank" rel="noreferrer noopener">Void</a> app with an adapter
        added. The project stays a plain Void app the whole time: the adapter generates the voidbase project from it
        rather than asking you to write one.
      </p>

      <h2>Set it up</h2>
      <CodeBlock language="bash" content={SCAFFOLD} />
      <p>Then add the adapter to the Vite config, which is the only wiring there is:</p>
      <CodeBlock language="javascript" content={CONFIG} />

      <h2>What is yours to add</h2>
      <p>
        <code>routes/</code>, <code>middleware/</code>, <code>crons/</code>, <code>queues/</code>,{" "}
        <code>pages/</code> and <code>db/</code> are Void's, and mean what Void means by them. Three directories are
        yours to add when you want them, each named for the voidbase thing it is:
      </p>
      <table>
        <thead>
          <tr>
            <th>Directory</th>
            <th>What goes in it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>vb_hooks/</code></td>
            <td>
              Event hooks, one per file: <code>export default defineHook("onRecordCreate", handler, "posts")</code>.
              Void has no equivalent, which is why they get a home of their own.
            </td>
          </tr>
          <tr>
            <td><code>vb_migrations/</code></td>
            <td>Collection migrations, the counterpart of Void's <code>db/</code> for schema you design in the panel.</td>
          </tr>
          <tr>
            <td><code>vb_secrets/</code></td>
            <td>
              The app's configuration, exactly as <a href="/docs/run/project">pb_secrets</a> works, with the same four
              ways of saying who may read a key.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Build and deploy</h2>
      <CodeBlock language="bash" content={BUILD} />
      <p>
        The build writes a complete voidbase project into a git-ignored <code>.voidbase/</code>, so what you deploy is
        an ordinary instance and everything on <a href="/docs/run/npm">the npm page</a> applies to it: the same deploy
        command, the same token, the same <code>voidbase sync</code> if you would rather push to a repository than run
        a command.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            This site is built this way. The page you are reading, the API behind it and the admin panel are one
            Worker.
          </p>
        </div>
      </div>
    </>
  );
}
