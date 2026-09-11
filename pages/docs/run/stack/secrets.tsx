// vb_secrets: one declaration serving three audiences.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const DECLARE = hl.typescript`// vb_secrets/main.ts
import { defineSecrets, secret, server, browser, local, flag, string, number, boolean } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  STRIPE_SECRET_KEY: secret(string(), "server side only, never in a build"),

  MAX_UPLOAD_MB:     server(number().default(10)),
  VOIDBASE_DOMAINS:  server(string().optional(), "the hostnames, the first canonical"),

  PUBLIC_SITE_NAME:  browser(string().default("My App")),
  PUBLIC_STRIPE_KEY: browser(string()),

  FEATURE_COMMENTS:  flag(boolean().default(true), "a Flagship flag, per request"),

  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "the deploy token"),
  VOIDBASE_DEPLOY_NAME:       local(string().default("my-app"), "the Worker this deploys to"),
});`;

const BROWSER = hl.typescript`// in a page or a component: the value is inlined at build time
const name = import.meta.env.PUBLIC_SITE_NAME;`;

const SERVER = hl.typescript`import { defineHandler } from "void";
import { pb } from "@voidbase-cloud/voidbase/adapter";
import config from "../../vb_secrets/main";

// in a route: the Worker's env
export const GET = defineHandler((c) => ({ limit: Number(c.env.MAX_UPLOAD_MB) }));

// in a hook, or anywhere the hook globals are: the stored string
const limit = Number(pb.$os.getenv("MAX_UPLOAD_MB"));

// or the typed values, through the same declaration
const { MAX_UPLOAD_MB } = await config.read((n) => pb.$os.getenv(n));   // a number, on both runtimes`;

export default function DocsStackSecrets() {
  return (
    <>
      <h1>vb_secrets</h1>
      <p className="docs-lead">
        A stack app has three audiences for its configuration: the server, the build, and the browser. One
        declaration covers all three, and each key says which of them may read it.
      </p>

      <h2>The declaration</h2>
      <p>
        <code>main.ts</code> belongs in the repository. <code>secrets.json</code> beside it holds the values on your
        machine and must be git-ignored.
      </p>
      <CodeBlock {...DECLARE} />

      <h2>The audiences</h2>
      <table>
        <thead>
          <tr>
            <th>Wrapper</th>
            <th>Who sees the value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>secret()</code></td>
            <td>The deployed Worker only, encrypted. Never in a build, never listed back.</td>
          </tr>
          <tr>
            <td><code>server()</code></td>
            <td>Routes, middleware, crons, queues and hooks. A plain variable on the Worker.</td>
          </tr>
          <tr>
            <td><code>browser()</code></td>
            <td>The same, and inlined into the client bundle, so anyone who loads the page can read it.</td>
          </tr>
          <tr>
            <td><code>flag()</code></td>
            <td>
              A boolean feature flag from Cloudflare Flagship, created at deploy with its default and evaluated per
              request; readers see a boolean without knowing it is a flag.
            </td>
          </tr>
          <tr>
            <td><code>local()</code></td>
            <td>Your machine and your CI: the deploy token, the Worker's name. Never deployed.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Every key must be wrapped in one of them; a bare validator is refused at build time. So is a value in{" "}
        <code>secrets.json</code> that <code>main.ts</code> does not declare, by name, because it would silently
        never reach the Worker. That is the whole point of the file: the person maintaining it is the one deciding
        what reaches a browser, so it makes them say so rather than letting a naming convention decide.
      </p>

      <h2>Reading them</h2>
      <p>In the client, a browser key is inlined by the build, so it is a constant by the time the page runs:</p>
      <CodeBlock {...BROWSER} />
      <p>On the server, it is the environment, or the typed values through the declaration itself:</p>
      <CodeBlock {...SERVER} />

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            A <code>browser()</code> key is public the moment you deploy. Anything that would embarrass you in view
            source belongs in <code>secret()</code>, and a build that inlines it will not tell you afterwards.
          </p>
        </div>
      </div>

      <h2>Seeing the state of it</h2>
      <p>
        <code>voidbase secrets</code>, run inside the generated <code>.voidbase/</code>, lists every declared key,
        its audience, whether it has a value here or a default, and whether the Worker already has it. Everything on
        a project's <a href="/docs/run/project/secrets">pb_secrets</a> page applies: the same validators, the same
        defaults, the same knobs the deploy reads, the same refusal to deploy an invalid or missing value, and the
        same rule that a deploy stores a secret the Worker lacks but never replaces one it has.
      </p>
      <p className="txt-hint txt-sm">
        The adapter writes a re-export of this declaration into <code>.voidbase/pb_secrets/main.ts</code> and copies{" "}
        <code>secrets.json</code> beside it on build, so the deployed Worker validates against the same file you
        edited.
      </p>
    </>
  );
}
