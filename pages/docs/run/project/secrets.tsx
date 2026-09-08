// pb_secrets: configuration, and the question every key has to answer.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const DECLARE = hl.typescript`// pb_secrets/main.ts
import { defineSecrets, secret, server, browser, local, string, number, boolean } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  SMTP_PASSWORD:  secret(string(), "the mail provider's password"),
  STRIPE_KEY:     secret(string()),

  MAX_UPLOAD_MB:  server(number().default(10)),
  FEATURE_DIGEST: server(boolean().default(false)),

  PUBLIC_SITE_URL: browser(string().default("https://example.com")),

  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "the deploy token"),
  VOIDBASE_DEPLOY_NAME:       local(string().default("blog-api"), "the Worker this project deploys to"),
});`;

const VALUES = hl.json`{
  "SMTP_PASSWORD": "...",
  "STRIPE_KEY": "...",
  "VOIDBASE_DEPLOY_CF_API_KEY": "..."
}`;

const READ = hl.javascript`// in a hook, the way PocketBase reads configuration
const limit = Number($os.getenv("MAX_UPLOAD_MB"));`;

const LIST = hl.bash`voidbase secrets`;

const LIST_OUT = hl.output`pb_secrets: 7 declared (2 secret, 2 server, 1 public, 2 local, never deployed), 3 valued in secrets.json,
worker "blog-api" has 2 of the secrets
  SMTP_PASSWORD       secret   local value    on the worker      the mail provider's password
  STRIPE_KEY          secret   local value    on the worker
  MAX_UPLOAD_MB       server   default 10
  FEATURE_DIGEST      server   default false
  PUBLIC_SITE_URL     public   default "https://example.com"
  VOIDBASE_DEPLOY_...  local   local value                       the deploy token`;

export default function DocsProjectSecrets() {
  return (
    <>
      <h1>pb_secrets</h1>
      <p className="docs-lead">
        Every piece of configuration a project has, declared in one file, each key saying who is allowed to read it.
        The values live beside it in a file that never enters version control, so a project needs no{" "}
        <code>.env</code> at all.
      </p>

      <h2>Two files</h2>
      <p>
        <code>main.ts</code> is the declaration and belongs in the repository. <code>secrets.json</code> holds the
        values on your machine and is git-ignored, which <code>voidbase init</code> has already arranged.
      </p>
      <CodeBlock {...DECLARE} />
      <CodeBlock {...VALUES} />

      <h2>Who may read it</h2>
      <p>
        Every key is wrapped in one of four words, and a bare validator is refused. That is deliberate: the person
        maintaining this file is the one answering for who can see what, so the file makes them say it rather than
        letting it be inferred.
      </p>
      <table>
        <thead>
          <tr>
            <th>Wrapper</th>
            <th>Where the value ends up</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>secret()</code></td>
            <td>
              The deployed instance only, as an encrypted secret. Never listed back, never in a build. Stored on the
              first deploy and never silently replaced afterwards.
            </td>
          </tr>
          <tr>
            <td><code>server()</code></td>
            <td>A plain variable on the instance, readable by hooks and routes. Set by every deploy.</td>
          </tr>
          <tr>
            <td><code>browser()</code></td>
            <td>The same, plus inlined into any client build. Treat it as public, because it is.</td>
          </tr>
          <tr>
            <td><code>local()</code></td>
            <td>
              Your own tooling: the deploy token, the Worker's name. Read on your machine and in CI, deployed
              nowhere.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Validation, defaults and types</h2>
      <p>
        The validators are <code>string()</code>, <code>number()</code>, <code>boolean()</code>, <code>url()</code>,{" "}
        <code>email()</code>, <code>oneOf()</code> and <code>json()</code>, each with <code>.optional()</code> and{" "}
        <code>.default(value)</code>. A default is a real value, so a key with one needs no entry in{" "}
        <code>secrets.json</code> and no entry in production either. A deploy stops on a missing or invalid value
        and names the key, never the value, so a typo is caught before it ships rather than after.
      </p>

      <h2>Reading them</h2>
      <CodeBlock {...READ} />
      <p>
        Locally the declared values, defaults included, are put into the environment when the server starts. On
        Cloudflare the secrets are the Worker's secrets and the rest are its variables, so the same call works in
        both places.
      </p>

      <h2>Seeing the state of it</h2>
      <CodeBlock {...LIST} />
      <CodeBlock {...LIST_OUT} />
      <p>
        One row per declared key: its tier, whether it has a value here or a default, and, when the deploy token is
        available, whether the instance already has it. <code>voidbase secrets push</code> stores local secret values
        on the Worker, including replacing ones already there, which a deploy deliberately will not do.
      </p>

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            <code>secrets.json</code> is the one file in a project that must never be committed. Check your{" "}
            <code>.gitignore</code> has it before the first commit, especially in a repository that did not come from{" "}
            <code>voidbase init</code>.
          </p>
        </div>
      </div>
    </>
  );
}
