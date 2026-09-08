// The project path: a backend you keep in a repository and extend. This page is the shape and the loop; the
// directories get a page each.
import { Link } from "@void/react";
import Updating from "@/components/Updating";
import "@/scss/updating.scss";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { DOCS_NAV } from "@/lib/docsNav";

const START = hl.bash`bun i -g @voidbase-cloud/voidbase

mkdir blog-api && cd blog-api
voidbase init
voidbase superuser upsert you@example.com your-password
voidbase serve`;

const TREE = hl.bash`blog-api/
├─ pb_hooks/        endpoints, event handlers, scheduled work
├─ pb_migrations/   the schema, as code
├─ pb_public/       static files served at /   (optional)
├─ pb_secrets/      configuration, and who may read each key
├─ pb_data/         the database and the uploaded files (git-ignored)
└─ .gitignore`;

const DEV = hl.bash`voidbase serve --dev`;

const DEPLOY = hl.bash`voidbase deploy`;

const SYNC = hl.bash`voidbase sync`;

const UPDATE = hl.bash`voidbase update`;

export default function DocsProject() {
  const section = DOCS_NAV.find((s) => s.href === "/docs/run/project");
  const folders = (section?.children ?? []).filter((c) => c.href !== "/docs/run/project");

  return (
    <>
      <h1>Create a project</h1>
      <p className="docs-lead">
        A backend you extend and keep: your own endpoints, handlers that run when records change, a schema in version
        control. It runs as one process on your machine and as one Worker on Cloudflare, from the same directory.
      </p>

      <h2>Start one</h2>
      <CodeBlock {...START} />
      <p>
        That is a working instance on <code>http://127.0.0.1:8090</code>, with the admin panel at <code>/_/</code> and
        a sample endpoint answering <code>GET /api/hello</code>. <code>init</code> wrote this:
      </p>
      <CodeBlock {...TREE} />
      <p>
        Only <code>pb_hooks/</code> and <code>pb_migrations/</code> matter on day one. Each directory has its own page:
      </p>
      <div className="docs-cards">
        {folders.map((f) => (
          <Link key={f.href} href={f.href} className="docs-card">
            <strong>{f.title}</strong>
            <span>{f.summary}</span>
          </Link>
        ))}
      </div>

      <h2>The loop</h2>
      <ol className="docs-steps">
        <li>
          <p>
            <strong>Design the schema in the panel.</strong> Collections, fields, and the API rules that decide who
            may read and write what. It is the fastest way to get the shape right, and it is immediately live.
          </p>
        </li>
        <li>
          <p>
            <strong>Write it down</strong> as a file in <Link href="/docs/run/project/migrations">pb_migrations</Link>,
            so the same schema reaches production and the next person who clones this.
          </p>
        </li>
        <li>
          <p>
            <strong>Add behaviour</strong> in <Link href="/docs/run/project/hooks">pb_hooks</Link>: an endpoint the
            API does not have, a handler that fires when a record is written, a nightly job.
          </p>
        </li>
        <li>
          <p>
            <strong>Run it while you work.</strong> <code>--dev</code> restarts when a hook or migration changes.
          </p>
          <CodeBlock {...DEV} />
        </li>
      </ol>

      <h2>Put it on Cloudflare</h2>
      <p>
        One API token, which <code>voidbase token</code> prints the link for, declared as a <code>local()</code> key
        in <Link href="/docs/run/project/secrets">pb_secrets</Link>. Then, from the project:
      </p>
      <CodeBlock {...DEPLOY} />
      <p>
        It creates the Worker, its database, its file storage, its queue and its realtime object on the first run,
        stores the declared secrets on it, applies any pending migrations on the first request, and prints the
        address. Deploy again whenever anything changes; the data is untouched.
      </p>

      <h3>Or let a push do it</h3>
      <p>
        <code>sync</code> is that deploy plus the wiring, so every later push to the repository deploys by itself and
        every change to the instance is a commit somebody can read and revert.
      </p>
      <CodeBlock {...SYNC} />
      <p>
        It needs a second token and one dashboard step the first run points at. From then on the whole loop above is:
        edit, commit, push. <Link href="/docs/deploy/pipeline">Deploy on every push</Link> is the guide, and{" "}
        <Link href="/docs/deploy/tracked">What git tracks</Link> is the list of what belongs in the repository and
        what must not.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            Listing and deleting instances works the same from a project as without one:{" "}
            <Link href="/docs/run/npm">voidbase instances and voidbase destroy</Link>.
          </p>
        </div>
      </div>

      <Updating command={UPDATE}>
        <p>
          Run it in the project. The dependency in <code>package.json</code> is bumped to the newest published
          version and installed, keeping the caret or the exact pin you already had, so a project that deliberately
          pins stays pinned. The change is a diff in <code>package.json</code> and your lockfile: review it and
          commit it like any other dependency bump.
        </p>
      </Updating>

      <h2>When this stops being enough</h2>
      <p>
        A project is a backend. When the site is yours too and you would rather write pages, typed routes and a
        database schema in one application than keep a frontend and a backend in step,{" "}
        <Link href="/docs/run/stack">the voidbase stack</Link> is the next page.
      </p>
    </>
  );
}
