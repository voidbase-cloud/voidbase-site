// Instances as things you create and throw away, with no repository and no code: the CLI as an instance manager.
import CodeBlock from "@/components/CodeBlock";

const INSTALL = `bun i -g @voidbase-cloud/voidbase      # or: npm i -g @voidbase-cloud/voidbase
voidbase version`;

const LOCAL = `mkdir my-instance && cd my-instance
voidbase superuser upsert you@example.com your-password
voidbase serve`;

const TOKEN = `voidbase token                        # prints the link that creates the token
export VOIDBASE_DEPLOY_CF_API_KEY=...   # paste it here`;

const CREATE = `voidbase deploy --name blog-api`;

const DOMAIN = `voidbase deploy --name blog-api --domain api.example.com`;

const LIST = `voidbase instances`;

const LIST_OUT = `3 instance(s) on Example Ltd:
  blog-api                         release 0.7.0  updated 2026-09-07
  staging-api                      release 0.7.0  updated 2026-09-04
  workshop-demo                    release 0.6.2  updated 2026-08-30`;

const DESTROY = `voidbase destroy workshop-demo`;

const DESTROY_OUT = `This deletes, on account Example Ltd:
  the Worker workshop-demo
  the database workshop-demo-db
  the bucket workshop-demo-storage and everything in it
  the queue workshop-demo-jobs
  every custom domain pointing at it
There is no undo, and no backup is taken.

Type the instance name to confirm:`;

export default function DocsNpm() {
  return (
    <>
      <h1>Instances on Cloudflare</h1>
      <p className="docs-lead">
        One command line, no repository, no code. This page is for treating instances as things you make when you
        need one and delete when you do not: a backend for a prototype, one per client, one for a workshop that is
        gone on Monday.
      </p>

      <CodeBlock language="bash" content={INSTALL} />

      <h2>One instance, on this machine</h2>
      <p>
        An empty directory is a complete instance. <code>serve</code> creates what it needs on the first run, and
        everything it owns stays in that directory.
      </p>
      <CodeBlock language="bash" content={LOCAL} />
      <p>
        The API is on <code>http://127.0.0.1:8090</code> and the admin panel at <code>/_/</code>. This is the same
        thing the <a href="/docs/run/standalone">standalone executable</a> gives you, for people who would rather
        install it from npm than download a binary.
      </p>

      <h2>Instances on your Cloudflare account</h2>
      <p>
        Everything below needs one API token, and one command prints the link that creates it with the right
        permissions already selected. Put it in your shell and the CLI will find it.
      </p>
      <CodeBlock language="bash" content={TOKEN} />

      <h3>Create one</h3>
      <p>Run this in an empty directory. It is not a project and it does not become one.</p>
      <CodeBlock language="bash" content={CREATE} />
      <p>
        That creates the Worker, its database, its file storage, its job queue and its realtime object, deploys the
        server into it, and prints the address, which will be{" "}
        <code>https://blog-api.&lt;your-subdomain&gt;.workers.dev</code>. It takes about a minute the first time.
      </p>
      <p>
        With a hostname you own on the same Cloudflare account, name it and the instance answers there as well.
        Several are allowed, comma separated.
      </p>
      <CodeBlock language="bash" content={DOMAIN} />

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            The first superuser is created with a generated password, saved to{" "}
            <code>pb_data/.superuser-credentials</code> in the directory you ran the command from. That file is the
            one thing the command leaves behind, so keep it, or sign in and change the password. Running the same
            command again updates the instance and keeps the account.
          </p>
        </div>
      </div>

      <h3>See what you have</h3>
      <p>Every instance is tagged when it deploys, so this lists them wherever they were created from.</p>
      <CodeBlock language="bash" content={LIST} />
      <CodeBlock language="bash" content={LIST_OUT} />

      <h3>Delete one</h3>
      <p>
        This takes the Worker and everything it owns: the database and its contents, the bucket and its files, the
        queue, and any custom domain pointing at it. It prints that list and waits for the name to be typed back.
      </p>
      <CodeBlock language="bash" content={DESTROY} />
      <CodeBlock language="bash" content={DESTROY_OUT} />
      <p className="txt-hint txt-sm">
        In a script, where nobody can be asked, it refuses unless <code>--yes</code> says you already decided.
      </p>

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            There is no undo and no backup is taken. Take one from the admin panel's Backups screen first if the data
            matters.
          </p>
        </div>
      </div>

      <h2>Updating an instance</h2>
      <p>
        <code>voidbase deploy --name blog-api</code> again, from anywhere, once you have a newer version of the CLI.
        The database and the files are untouched; the server code is replaced.
      </p>

      <h2>When this stops being enough</h2>
      <p>
        The moment you want an endpoint of your own, a handler that runs when a record changes, or a schema you keep
        in version control rather than clicking into the panel, you want{" "}
        <a href="/docs/run/project">a voidbase project</a>. It is the same instance with a directory around it, and
        moving to it costs nothing.
      </p>
    </>
  );
}
