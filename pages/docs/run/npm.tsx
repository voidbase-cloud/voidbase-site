// The npm path: a project in a repository, and one command to put it on Cloudflare.
import CodeBlock from "@/components/CodeBlock";

const INSTALL = `bun i -g @voidbase-cloud/voidbase        # or: npm i -g @voidbase-cloud/voidbase`;

const LOCAL = `mkdir my-backend && cd my-backend
voidbase init      # writes pb_hooks/, pb_migrations/, pb_secrets/, .env and a .gitignore
voidbase superuser upsert you@example.com your-password
voidbase serve     # http://127.0.0.1:8090, panel at /_/`;

const DECLARE = `// pb_secrets/main.ts
import { defineSecrets, local, string } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "the deploy token"),
  VOIDBASE_DEPLOY_NAME: local(string().default("my-backend"), "the Worker this project deploys to"),
});`;

const VALUES = `{ "VOIDBASE_DEPLOY_CF_API_KEY": "..." }`;

export default function DocsNpm() {
  return (
    <>
      <h1>With npm, onto Cloudflare</h1>
      <p className="docs-lead">
        A project you keep in a repository, running locally while you build it, and deployed to your own Cloudflare
        account with one command when you are ready.
      </p>

      <CodeBlock language="bash" content={INSTALL} />

      <h2>A project on your machine</h2>
      <CodeBlock language="bash" content={LOCAL} />
      <p>
        That is a working instance: the API on 8090, the admin panel at <code>/_/</code>, and a sample hook answering{" "}
        <code>GET /api/hello</code>. <a href="/docs/run/project">What is in a project</a> explains each directory it
        wrote.
      </p>
      <p className="txt-hint txt-sm">
        Instead of the <code>superuser</code> command you can put <code>VOIDBASE_SUPERUSER_EMAIL</code> and{" "}
        <code>VOIDBASE_SUPERUSER_PASSWORD</code> in <code>.env</code> and let the first run create the account.
      </p>

      <h2>Onto Cloudflare</h2>
      <p>
        The same directory deploys to your own Cloudflare account as a single Worker, with its database, file storage,
        job queue and realtime object created for it on the first run. You need one API token.
      </p>

      <ol className="docs-steps">
        <li>
          <p>
            <strong>Create the token.</strong> <code>voidbase token</code> prints a link that opens Cloudflare's token
            wizard with the permissions already selected. Nothing else needs configuring.
          </p>
        </li>
        <li>
          <p>
            <strong>Declare it</strong> in <code>pb_secrets/main.ts</code> as a <code>local()</code> key, meaning one
            your own tooling reads and that is never deployed anywhere:
          </p>
          <CodeBlock language="javascript" content={DECLARE} />
        </li>
        <li>
          <p>
            <strong>Give it a value</strong> in <code>pb_secrets/secrets.json</code>, which is already in your{" "}
            <code>.gitignore</code>:
          </p>
          <CodeBlock language="json" content={VALUES} />
        </li>
        <li>
          <p>
            <strong>Deploy.</strong> It creates what does not exist, updates what does, stores the declared secrets on
            the Worker and prints the URL.
          </p>
          <CodeBlock language="bash" content="voidbase deploy" />
        </li>
      </ol>

      <p>
        Deploy again whenever anything changes. <code>voidbase secrets</code> lists every declared key, who may read
        it, whether it has a value here and whether the Worker already has it.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            The Worker takes its name from the directory unless you say otherwise. Declaring{" "}
            <code>VOIDBASE_DEPLOY_NAME</code> anyway is worth the line: a project that names its target refuses to be
            deployed anywhere else, which matters as soon as a repository holds more than one instance.
          </p>
        </div>
      </div>

      <h2>Deploying on every push instead</h2>
      <p>
        <code>voidbase sync</code> does the deploy and then connects the repository to Cloudflare's build service, so
        every later push deploys by itself. It asks for one extra token, and the first run points at the single
        dashboard step an API cannot do for you.
      </p>
    </>
  );
}
