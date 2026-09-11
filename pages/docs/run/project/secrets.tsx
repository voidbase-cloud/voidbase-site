// pb_secrets: configuration, and the question every key has to answer.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const DECLARE = hl.typescript`// pb_secrets/main.ts
import { defineSecrets, secret, server, browser, local, flag, string, number, boolean } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  SMTP_PASSWORD:  secret(string(), "the mail provider's password"),
  STRIPE_SECRET_KEY: secret(string().optional(), "set it and the stripe plugin takes money"),

  MAX_UPLOAD_MB:  server(number().default(10)),
  VOIDBASE_MAIL_DOMAIN: server(string().optional(), "mail leaves through Cloudflare from this domain"),

  PUBLIC_SITE_URL: browser(string().default("https://example.com")),

  FEATURE_DIGEST: flag(boolean().default(false), "a Flagship feature flag, evaluated per request"),

  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "the deploy token"),
  VOIDBASE_DEPLOY_NAME:       local(string().default("blog-api"), "the Worker this project deploys to"),
});`;

const VALUES = hl.json`{
  "SMTP_PASSWORD": "...",
  "STRIPE_SECRET_KEY": "...",
  "VOIDBASE_DEPLOY_CF_API_KEY": "..."
}`;

const READ = hl.javascript`// in a hook, the way PocketBase reads configuration: the stored string
const limit = Number($os.getenv("MAX_UPLOAD_MB"));`;

const READ_TYPED = hl.typescript`// in TypeScript, the typed values through the same declaration
import config from "../pb_secrets/main";
const { MAX_UPLOAD_MB, FEATURE_DIGEST } = await config.read((n) => $os.getenv(n));   // a number and a boolean`;

const LIST = hl.bash`voidbase secrets`;

const LIST_OUT = hl.output`pb_secrets: 8 declared (2 secret, 2 server, 1 public, 1 flag, 2 local, never deployed), 3 valued in secrets.json, worker "blog-api" has 2 of the secrets
  SMTP_PASSWORD                  secret  local value         on the worker  the mail provider's password
  STRIPE_SECRET_KEY              secret  local value         on the worker  set it and the stripe plugin takes money
  MAX_UPLOAD_MB                  server  default 10
  VOIDBASE_MAIL_DOMAIN           server  optional, unset     mail leaves through Cloudflare from this domain
  PUBLIC_SITE_URL                public  default "https://example.com"
  FEATURE_DIGEST                 flag    default false       a Flagship feature flag, evaluated per request
  VOIDBASE_DEPLOY_CF_API_KEY     local   local value         the deploy token
  VOIDBASE_DEPLOY_NAME           local   default "blog-api"  the Worker this project deploys to`;

const PUSH = hl.bash`voidbase secrets push         # store the local secrets on the Worker, replacing, without redeploying`;

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
        Every key is wrapped in one of five words, and a bare validator is refused. That is deliberate: the person
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
            <td>The same, plus inlined into any client build. Treat it as public, because it is; the listing calls this tier <code>public</code>.</td>
          </tr>
          <tr>
            <td><code>flag()</code></td>
            <td>
              A boolean feature flag from Cloudflare Flagship. The deploy creates a Flagship app named after the
              Worker with every declared flag at its default and binds it; a change in the dashboard wins without a
              deploy. On every request the flag is evaluated with a targeting key, the signed-in record or else the
              client's address, so a percentage rollout is sticky per person, and <code>$os.getenv</code> sees the
              answer without knowing it is a flag. Where Flagship is not reachable, the default answers.
            </td>
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
        <code>.default(value)</code>, and any Standard Schema validator works inside the wrappers. A default is a
        real value, so a key with one needs no entry in <code>secrets.json</code> and no entry in production either.
        A deploy stops on a missing or invalid value and names the key, never the value, so a typo is caught before
        it ships rather than after.
      </p>

      <h2>Reading them</h2>
      <CodeBlock {...READ} />
      <CodeBlock {...READ_TYPED} />
      <p>
        Locally the declared values, defaults included, are put into the environment when the server starts: the
        shell outranks <code>secrets.json</code>, which outranks <code>.env</code>. On Cloudflare the secrets are the
        Worker's secrets and the rest are its variables, so the same call works in both places.
      </p>

      <h2>The knobs a deploy reads from here</h2>
      <p>
        Some names mean something to the deploy itself, and the shipped plugins read theirs from the same place. A
        declared <code>server()</code> or <code>secret()</code> key with one of these names is enough; the deploy
        wires the binding, and the plugin does the rest.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>What it turns on</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>VOIDBASE_DEPLOY_NAME</code>, <code>VOIDBASE_DOMAINS</code></td>
            <td>The Worker's name, and the hostnames the <code>domains</code> plugin attaches, the first canonical.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_DATABASE=durable</code></td>
            <td>The data in a SQLite-backed Durable Object instead of D1; a batch is a real transaction.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_MAIL_DOMAIN</code></td>
            <td>The <code>send_email</code> binding: mail from that domain leaves through Cloudflare Email Service.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_AI</code></td>
            <td>The Workers AI binding, and <code>POST /api/ai/chat</code> over the instance's own tools.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_TRANSLATABLE</code>, <code>VOIDBASE_LOCALES</code></td>
            <td>Which fields have translations and in which locales; the records API answers in <code>?locale=</code>.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_SITE_URL</code>, <code>VOIDBASE_SITEMAP</code>, <code>VOIDBASE_SEO</code></td>
            <td>What robots.txt, the sitemap, llms.txt and the page metadata are generated from.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_BACKUP_KIND</code>, <code>VOIDBASE_BACKUP_KEEP</code>, <code>VOIDBASE_BACKUP_S3_*</code></td>
            <td>What the scheduled backup writes, how many it keeps, and the bucket outside the account it copies to.</td>
          </tr>
          <tr>
            <td><code>STRIPE_SECRET_KEY</code>, <code>POLAR_ACCESS_TOKEN</code>, <code>LEMONSQUEEZY_API_KEY</code></td>
            <td>Which payments plugin answers, each with its webhook secret beside it.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_CORS_ORIGINS</code>, <code>VOIDBASE_HSTS</code>, <code>VOIDBASE_CSP</code></td>
            <td>The response policy the <code>hardening</code> plugin applies; all off unless set.</td>
          </tr>
          <tr>
            <td><code>VOIDBASE_SECRETS_STORE</code></td>
            <td>
              The id of the account's Secrets Store. Every <code>secret()</code> is then stored there as{" "}
              <code>&lt;worker&gt;__&lt;KEY&gt;</code> and bound by name instead of living on the Worker; nothing in
              the app changes.
            </td>
          </tr>
        </tbody>
      </table>
      <p className="txt-hint txt-sm">
        The full list, with what each accepts, is the environment table in{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/deploy.md" target="_blank" rel="noreferrer noopener">
          docs/deploy.md
        </a>
        .
      </p>

      <h2>Seeing the state of it</h2>
      <CodeBlock {...LIST} />
      <CodeBlock {...LIST_OUT} />
      <p>
        One row per declared key: its tier, whether it has a value here or a default, and, when the deploy token is
        available, whether the Worker already has it (or the Secrets Store, when one is named). A value in{" "}
        <code>secrets.json</code> that the declaration does not name is listed as never deployed.
      </p>
      <CodeBlock {...PUSH} />
      <p>
        A deploy stores a secret the Worker lacks and leaves one it already holds alone, because a checkout whose{" "}
        <code>secrets.json</code> carries dev values must not overwrite production by deploying. Replacing is
        explicit, and that is what <code>push</code> is for. It is also what keeps CI simple: a checkout without{" "}
        <code>secrets.json</code> deploys with nothing but the deploy token, because the secrets were pushed once
        from a machine that has them.
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
