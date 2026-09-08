// What an instance is, before any page tells you how to get one.
//
// The six starter guides were readable on their own and left one question unanswered between them: what is the
// thing they all produce, and why are there six of them. Both answers are short, and they are here rather than
// repeated six times.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TREE = hl.markdown`An instance is these four things and an address:

- **The database.** One SQLite file holding your collections and their records.
- **The files.** Whatever has been uploaded to those records.
- **The definition.** The collections, the API rules, the hooks and the configuration. This is the part that can live in a repository.
- **The superuser.** One account that can open the admin panel.
`;

const SAME = hl.bash`curl https://your-instance.example.com/api/collections/posts/records`;

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

      <h2>Where it can run</h2>
      <p>
        There are two answers, and one of them decides how you install voidbase.
      </p>
      <p>
        <strong>A machine you own.</strong> A laptop, a server, a container. The standalone executable is the whole
        product in one file, so nothing else has to be installed for this.
      </p>
      <p>
        <strong>Your Cloudflare account.</strong> A Worker, a D1 database and an R2 bucket, created in your account
        and owned by you. Reaching Cloudflare needs the npm package, because deploying runs Void and wrangler out of
        node_modules. The standalone executable cannot do it, and no page here will suggest otherwise.
      </p>

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
          <span>On Cloudflare without an account of your own. Experimental.</span>
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
          <span>Tracked hooks, schema and configuration. No npm, and no Cloudflare.</span>
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
        is pooled between them. Two instances on the same Cloudflare account know nothing about each other.
      </p>

      <p>
        Still deciding? <Link href="/docs/start">Which one do I want?</Link> asks three questions and names the page.
      </p>
    </>
  );
}
