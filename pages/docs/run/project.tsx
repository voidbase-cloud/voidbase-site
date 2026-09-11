// The project path: a backend you keep in a repository and extend. This page is the shape and the loop; the
// directories get a page each.
import { Link } from "@void/react";
import PluginsSoon from "@/components/PluginsSoon";
import StartFromTemplate from "@/components/StartFromTemplate";
import "@/scss/soon.scss";
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

const INIT_OUT = hl.output`pb_hooks/, pb_migrations/ and pb_secrets/ ready (wrote pb_hooks/main.pb.js, .gitignore, .env, package.json, pb_secrets/main.ts)
.gitignore covers pb_data/, pb_secrets/secrets.json and .cloud/

next: voidbase serve   (the API on 8090, the admin panel at /_/), or bun install && bun run dev`;

const TREE = hl.markdown`Inside \`blog-api/\`:

- \`pb_hooks/\`: endpoints, event handlers, scheduled work; \`main.pb.js\` answers \`GET /api/hello\`
- \`pb_migrations/\`: the schema, as code
- \`pb_secrets/\`: configuration, and who may read each key; \`main.ts\` is a commented declaration to fill in
- \`pb_public/\`: static files served at \`/\`, if you add any
- \`pb_data/\`: the database and the uploaded files, git-ignored
- \`package.json\`: the dependency, and \`dev\`, \`start\`, \`deploy\` scripts
- \`.env\`, \`.gitignore\`
`;

const TEMPLATE = hl.bash`voidbase templates                                  # what the marketplace lists: name, title, summary, repository
voidbase init blog-api --template voidbase-demo     # one of those, by name
voidbase init blog-api --template owner/name        # or any public GitHub repository, at --ref if not the default branch`;

const DEV = hl.bash`voidbase serve --dev              # restarts when a hook or a migration changes
voidbase serve --dev --tunnel     # and on the internet meanwhile, at https://<words>.trycloudflare.com
voidbase serve --workers          # the same project on Cloudflare's runtime, locally, with D1, R2, queue and hub in Miniflare`;

const TYPES = hl.bash`voidbase types --url http://127.0.0.1:8090 --email you@example.com --password your-password
# writes src/voidbase.ts: an interface per collection, a Collections map, a TypedPocketBase type`;

const DEPLOY = hl.bash`voidbase deploy`;

const DEPLOY_MORE = hl.bash`voidbase deploy --domain api.example.com          # the domains plugin attaches it and turns workers.dev off
voidbase deploy --database durable                 # the data in a SQLite-backed Durable Object instead of D1
voidbase deploy --preview feature/login            # a second Worker for the branch, seeded from production
voidbase deploy --dry-run                          # the whole plan, nothing touched`;

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
        That is a working instance on <code>http://127.0.0.1:8090</code>, with the admin panel at <code>/_/</code>,
        the API reference at <code>/api/docs</code> and a sample endpoint answering <code>GET /api/hello</code>.{" "}
        <code>init</code> says what it wrote:
      </p>
      <CodeBlock {...INIT_OUT} />
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
      <p>
        Or start from somebody's working project rather than empty directories. The files of the repository are
        downloaded as a tarball and unpacked into the directory, which has to be empty or absent; nothing is cloned
        and no <code>.git</code> is left behind, and the next steps are read from what the template contains.
      </p>
      <CodeBlock {...TEMPLATE} />

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
            <strong>Run it while you work.</strong> On Bun, or on Cloudflare's own runtime without a token or an
            account, which is the one to use before a first deploy.
          </p>
          <CodeBlock {...DEV} />
        </li>
        <li>
          <p>
            <strong>Type the client from it.</strong> The instance describes its own API at{" "}
            <code>/api/openapi.json</code>, and <code>types</code> turns that into a file your app imports, so a
            renamed field is a compile error rather than an empty value. <Link href="/docs/connect/sdk">The SDK
            page</Link> shows the other end.
          </p>
          <CodeBlock {...TYPES} />
        </li>
      </ol>

      <h2>Put it on Cloudflare</h2>
      <p>
        One API token, which <code>voidbase token</code> prints the link for, declared as a <code>local()</code> key
        in <Link href="/docs/run/project/secrets">pb_secrets</Link> and valued in its <code>secrets.json</code>. Then,
        from the project:
      </p>
      <CodeBlock {...DEPLOY} />
      <p>
        It creates the Worker, its database, its file storage, its queue and its realtime object on the first run,
        stores the declared secrets on it, applies any pending migrations on the first request, and prints the
        address. Deploy again whenever anything changes; the data is untouched, and a secret the Worker already holds
        is left alone.
      </p>
      <CodeBlock {...DEPLOY_MORE} />

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
            <Link href="/docs/run/npm">voidbase instances and voidbase destroy</Link>, and{" "}
            <code>voidbase migrate</code> moves the data between this instance and any other.
          </p>
        </div>
      </div>

      <Updating command={UPDATE}>
        <p>
          Run it in the project. The dependency in <code>package.json</code> is bumped to the newest published
          version and installed, keeping the caret or the exact pin you already had, so a project that deliberately
          pins stays pinned. The change is a diff in <code>package.json</code> and your lockfile: review it and
          commit it like any other dependency bump. Before changing anything it names the installed plugins whose
          declared range excludes the new version.
        </p>
      </Updating>

      <h2>When this stops being enough</h2>
      <p>
        A project is a backend. When the site is yours too and you would rather write pages, typed routes and a
        database schema in one application than keep a frontend and a backend in step,{" "}
        <Link href="/docs/run/stack">the voidbase stack</Link> is the next page.
      </p>
      <StartFromTemplate shape="project" />

      <PluginsSoon shape="project" />
    </>
  );
}
