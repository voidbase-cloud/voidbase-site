// What an instance is, before any page tells you how to get one.
//
// The six starter guides were readable on their own and left one question unanswered between them: what is the
// thing they all produce, and why are there six of them. Both answers are short, and they are here rather than
// repeated six times.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TREE = hl.markdown`An instance is these four things and an address:

- **The database.** One SQLite database holding your collections and their records.
- **The files.** Whatever has been uploaded to those records.
- **The definition.** The collections, the API rules, the hooks, the configuration and the installed plugins. This is the part that can live in a repository.
- **The superuser.** One account that can open the admin panel.
`;

const SAME = hl.bash`curl https://your-instance.example.com/api/collections/posts/records`;

const SURFACE = hl.markdown`What every instance answers, whichever way it runs:

- \`/api/\`: PocketBase's REST API, records, auth, files, realtime, batch
- \`/_/\`: the admin panel, PocketBase's own build, unmodified
- \`/api/docs\`: the instance's own API reference, over \`/api/openapi.json\`, scoped to the token it is opened with
- \`/api/mcp\`: a stateless MCP server whose tools are the routes your token may call
- \`/robots.txt\`, \`/sitemap.xml\`, \`/llms.txt\`: generated from the public collections, unless a real file wins
- \`/api/plugins\`: what this instance loaded and where each plugin came from, for a superuser
`;

const MIGRATE = hl.bash`voidbase migrate http://127.0.0.1:8090 https://blog-api.example.workers.dev \\
  --from-email you@example.com --from-password ... --to-email you@example.com --to-password ...`;

export default function DocsInstance() {
  return (
    <>
      <h1>What is an instance</h1>
      <p className="docs-lead">
        One running voidbase. Every guide in this section produces the same thing, and they differ only in where it
        runs and how much of it you keep in version control.
      </p>

      <CodeBlock {...TREE} />

      <p>
        The API is PocketBase's, so the same request works against every one of them. An instance on your laptop and
        an instance on Cloudflare answer identically, which is what makes moving between the shapes below a change of
        address rather than a rewrite.
      </p>
      <CodeBlock {...SAME} />

      <h2>What it carries</h2>
      <p>
        More than the API. voidbase composes its server from plugins, and these ship inside every instance:{" "}
        <code>auth</code>, <code>realtime</code>, <code>hardening</code>, <code>backups</code>, <code>installer</code>,{" "}
        <code>openapi</code>, <code>mcp</code>, <code>seo</code>, <code>mail</code>, <code>ai</code>,{" "}
        <code>translations</code>, <code>stripe</code>, <code>polar</code>, <code>lemonsqueezy</code>,{" "}
        <code>previews</code> and <code>domains</code>. Several do nothing until a knob names them (a provider's key,
        a mail domain, the translatable fields), and any of them can be turned off for a project or replaced by one
        with the same name from <Link href="/docs/marketplace">a marketplace</Link>.
      </p>
      <CodeBlock {...SURFACE} />

      <h2>Where it can run</h2>
      <p>
        Three ways, and the same instance in each. Which one decides how you install voidbase, and nothing else.
      </p>
      <p>
        <strong>The standalone executable.</strong> One file on a machine you own: a laptop, a server, a container.
        The server, the panel and the migrations are inside it, so nothing else is installed. It serves, it takes
        plugins, it moves data, and it cannot reach Cloudflare, because that toolchain is not in it.
      </p>
      <p>
        <strong>The npm package.</strong> The same server on Bun, plus the toolchain. <code>voidbase serve</code>{" "}
        runs it here; <code>voidbase serve --tunnel</code> puts it on the internet through a Cloudflare quick tunnel
        for as long as it runs; <code>voidbase serve --workers</code> runs it on workerd, Cloudflare's own runtime,
        with a local D1, R2, queue and realtime hub, so what you exercise is the Workers code without a token or an
        account.
      </p>
      <p>
        <strong>Your Cloudflare account.</strong> One Worker with a D1 database, an R2 bucket, a jobs queue and the
        Durable Object that fans out realtime, created in your account and owned by you. <code>voidbase deploy</code>{" "}
        from the npm package puts it there, and <Link href="/docs/run/cloud">voidbase cloud</Link> does the same
        from a page, in your account rather than ours. With <code>--database durable</code> the data lives in its
        own SQLite-backed Durable Object instead of D1, and a batched write is a real transaction.
      </p>
      <p>
        Choosing is never final. <code>voidbase migrate</code> moves an instance's data from any running instance to
        any other, in either direction, as a backup taken on one side and restored on the other, and it works from
        the executable as well as the package:
      </p>
      <CodeBlock {...MIGRATE} />

      <h2>What decides the shape</h2>
      <p>
        Two questions, and the six guides are their answers. Where should it run, and is its definition in a
        repository yet.
      </p>

      <h3>Nothing tracked yet</h3>
      <p>
        You want a backend to exist so you can point something at it. The definition lives in the instance, you
        change it in the admin panel, and there is no repository. This is the right start for finding out whether
        voidbase suits you, and it is not a dead end: everything you build here moves.
      </p>
      <div className="docs-cards">
        <Link href="/docs/run/standalone" className="docs-card">
          <strong>The standalone executable</strong>
          <span>One file on a machine you own. Nothing installed, nothing to build.</span>
        </Link>
        <Link href="/docs/run/npm" className="docs-card">
          <strong>The npm CLI</strong>
          <span>Instances by name, on this machine or on your Cloudflare account.</span>
        </Link>
        <Link href="/docs/run/cloud" className="docs-card">
          <strong>voidbase cloud</strong>
          <span>From a page, into your own Cloudflare account, with a repository if you want one.</span>
        </Link>
      </div>

      <h3>The repository first</h3>
      <p>
        The hooks, the schema and the configuration are files you commit, and the instance is built out of them. A
        colleague can check the repository out and get the same backend, and a push can be the deploy.
      </p>
      <div className="docs-cards">
        <Link href="/docs/run/binary" className="docs-card">
          <strong>A directory the binary serves</strong>
          <span>Tracked hooks and schema. No npm, and no Cloudflare.</span>
        </Link>
        <Link href="/docs/run/project" className="docs-card">
          <strong>A voidbase project</strong>
          <span>The same directory plus npm, which is what reaches Cloudflare.</span>
        </Link>
        <Link href="/docs/run/stack" className="docs-card">
          <strong>A voidbase stack</strong>
          <span>The site and the backend as one application, in one Worker.</span>
        </Link>
      </div>

      <h3>Already running, and you want it tracked</h3>
      <p>
        The common case, because the first thing most people do is click around the admin panel. The collections you
        made there come out as a file, the file goes in a repository, and{" "}
        <Link href="/docs/track/project">the instance carries on running</Link> while you do it.
      </p>

      <h2>What an instance is not</h2>
      <p>
        It is not your application. Your site, your app and your scripts are separate things that talk to it over
        the API, and <Link href="/docs/connect/sdk">the SDK</Link> is how. The one shape where that line moves is{" "}
        <Link href="/docs/run/stack">the stack</Link>, which puts a Void application and an instance in the same
        Worker on purpose.
      </p>
      <p>
        It is also not shared. Every instance has its own database, its own files and its own address, and nothing
        is pooled between them. Two instances on the same Cloudflare account are named apart down to the rate-limit
        counters, and know nothing about each other.
      </p>

      <p>
        Still deciding? <Link href="/docs/start">Which one do I want?</Link> asks three questions and names the page.
      </p>
    </>
  );
}
