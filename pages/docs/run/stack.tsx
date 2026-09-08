// The stack path: one application, site and backend, from an empty directory.
import { Link } from "@void/react";
import Updating from "@/components/Updating";
import "@/scss/updating.scss";
import CodeBlock from "@/components/CodeBlock";
import { DOCS_NAV } from "@/lib/docsNav";

const SCAFFOLD = `bun add void
bunx void init          # asks which framework and starter; React and a database-backed one here
bun add @voidbase-cloud/voidbase`;

const CONFIG = `// vite.config.ts
import { defineConfig } from "vite";
import { voidPlugin } from "void";
import { voidReact } from "@void/react/plugin";
import { voidbaseAdapter } from "@voidbase-cloud/voidbase/adapter/plugin";

export default defineConfig({ plugins: [voidPlugin(), voidReact(), voidbaseAdapter()] });`;

const TREE = `my-app/
├─ pages/           the site, server-rendered
├─ routes/          typed API endpoints
├─ middleware/      what runs on every request
├─ crons/           scheduled work
├─ queues/          background jobs
├─ db/              the app's own tables, in Drizzle
├─ src/             library code the rest imports
│
├─ vb_hooks/        handlers that run around record writes
├─ vb_migrations/   collections, for the schema the panel manages
├─ vb_secrets/      configuration, for the server, the build and the browser
│
└─ .voidbase/       generated on build; the instance this becomes (git-ignored)`;

const BUILD = `bun run build                                  # or: bunx --bun vite build
bun .voidbase/main.ts --http 127.0.0.1:8090    # site at /, API at /api, panel at /_/`;

const DEPLOY = `cd .voidbase && voidbase deploy`;

const UPDATE = `voidbase update`;

const IGNORE = `.voidbase/
vb_secrets/secrets.json`;

export default function DocsStack() {
  const section = DOCS_NAV.find((s) => s.href === "/docs/run/stack");
  const folders = (section?.children ?? []).filter((c) => c.href !== "/docs/run/stack");

  return (
    <>
      <h1>Start a stack app</h1>
      <p className="docs-lead">
        One application: pages, typed endpoints, background jobs and a database, which builds into a voidbase
        instance and deploys as a single Worker serving the site, the API and the admin panel from one address.
      </p>

      <p>
        It is a <a href="https://void.cloud" target="_blank" rel="noreferrer noopener">Void</a> app with an adapter
        added. The project stays a plain Void app the whole way through: the adapter generates the voidbase instance
        from it rather than asking you to keep one.
      </p>

      <h2>From an empty directory</h2>
      <CodeBlock language="bash" content={SCAFFOLD} />
      <p>Then add the adapter to the Vite config, which is the only wiring there is:</p>
      <CodeBlock language="javascript" content={CONFIG} />
      <p>
        And ignore the two things that should never be committed: the generated instance, and the local values of
        your configuration.
      </p>
      <CodeBlock language="bash" content={IGNORE} />

      <h2>What the project looks like</h2>
      <CodeBlock language="bash" content={TREE} />
      <p>
        Everything above the gap is Void's and means what Void means by it. The three directories below it are the
        ones the adapter adds, each named for the voidbase thing it is, each optional, and each with its own page:
      </p>
      <div className="docs-cards">
        {folders.map((f) => (
          <Link key={f.href} href={f.href} className="docs-card">
            <strong>{f.title}</strong>
            <span>{f.summary}</span>
          </Link>
        ))}
      </div>

      <h2>Build and run it</h2>
      <CodeBlock language="bash" content={BUILD} />
      <p>
        The build writes a complete voidbase project into <code>.voidbase/</code>: your pages as its static files,
        your routes and hooks compiled into its hook bundle, your collections as its migrations. It is git-ignored,
        because it is output, and it is an ordinary instance in every other respect.
      </p>

      <h2>Deploy it</h2>
      <CodeBlock language="bash" content={DEPLOY} />
      <p>
        Everything on <Link href="/docs/run/project">the project page</Link> applies from here: the same token and
        the same deploy. To have a push do it instead, so the site and its backend ship together on every commit,{" "}
        <Link href="/docs/deploy/pipeline">Deploy on every push</Link> is two commands and one dashboard step.
      </p>

      <Updating command={UPDATE}>
        <p>
          Run it in the project, the same as anywhere else: the <code>@voidbase-cloud/voidbase</code> dependency is
          bumped and installed, and the caret or pin you had is kept. Void and the rest of the toolchain are separate
          dependencies with their own versions, and this leaves them alone.
        </p>
        <p>
          A stack app is one Worker, so the backend and the site go live together. Build it first and look at it
          locally before you deploy, because a voidbase upgrade and your own application ship in the same artifact.
        </p>
      </Updating>

      <h2>Two things that are different</h2>
      <p>
        <strong>Two databases, on purpose.</strong> Void's <code>db/</code> is your application's own tables, in
        Drizzle, typed end to end, for the data your code owns. Collections are for the data the admin panel and the
        SDK own, with API rules and a schema someone can change without a deploy. Most apps want both, and{" "}
        <Link href="/docs/run/stack/migrations">vb_migrations</Link> is where the second kind is written down.
      </p>
      <p>
        <strong>Routes and hooks are not the same thing.</strong> A route in <code>routes/</code> is an endpoint you
        call. A hook in <Link href="/docs/run/stack/hooks">vb_hooks</Link> runs because a record changed, whoever
        changed it, including someone clicking in the admin panel. Reach for the first when you are writing an API,
        the second when a rule has to hold no matter who is writing.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">This site is built this way: the page you are reading, its API and the admin panel are one Worker.</p>
        </div>
      </div>
    </>
  );
}
