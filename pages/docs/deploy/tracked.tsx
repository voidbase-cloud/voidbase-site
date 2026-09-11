// What belongs in the repository, what must not, and how the excluded half reaches production anyway.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const IGNORE = hl.gitignore`# a project
pb_data/                    the database and the uploaded files
pb_secrets/secrets.json     the values of your configuration
.cloud/                     the generated Cloudflare project

# a stack app
.voidbase/                  the generated instance
vb_secrets/secrets.json     the values of your configuration`;

const PUSH = hl.bash`voidbase secrets push`;

const STORE = hl.json`{
  "VOIDBASE_SECRETS_STORE": "<store id>"
}`;

const FLAG = hl.typescript`// pb_secrets/main.ts
import { defineSecrets, flag, boolean } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  NEW_CHECKOUT: flag(boolean().default(false), "the redesigned checkout"),
});`;

const STATE = hl.bash`voidbase secrets`;

const ROTATE = hl.bash`# change it where the value lives, then send it
$EDITOR pb_secrets/secrets.json
voidbase secrets push`;

export default function DocsTracked() {
  return (
    <>
      <h1>What git tracks</h1>
      <p className="docs-lead">
        Everything that decides how the instance behaves belongs in the repository: the endpoints, the schema, the
        static files, the list of configuration keys, the installed plugins, and the version of voidbase itself. One
        thing must never be there, and that is the values of your secrets.
      </p>

      <h2>In the repository</h2>
      <table>
        <thead>
          <tr>
            <th>What</th>
            <th>Why it matters that it is tracked</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Link href="/docs/run/project/hooks">pb_hooks/</Link></td>
            <td>Your endpoints and handlers. Reviewable, revertable, and the diff says what changed about behaviour.</td>
          </tr>
          <tr>
            <td><Link href="/docs/run/project/migrations">pb_migrations/</Link></td>
            <td>The schema. A deploy carries it, so production and a fresh clone end up with the same database.</td>
          </tr>
          <tr>
            <td><Link href="/docs/run/project/public">pb_public/</Link></td>
            <td>The static files, if the instance serves any.</td>
          </tr>
          <tr>
            <td><Link href="/docs/run/project/secrets">pb_secrets/main.ts</Link></td>
            <td>
              The <em>names</em> of every configuration key, their types, their defaults and who may read them. The
              declaration, never the values.
            </td>
          </tr>
          <tr>
            <td><code>pb_plugins/</code>, <code>voidbase.lock</code></td>
            <td>
              The installed plugins, each verified against the hash the lockfile pins. On a project deployed from a
              repository, installing or removing one is a commit the build deploys.
            </td>
          </tr>
          <tr>
            <td><code>package.json</code>, lockfile</td>
            <td>
              The version of voidbase production runs. Without it, what ships is whatever npm served that morning.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Not in the repository</h2>
      <CodeBlock {...IGNORE} />
      <p>
        <code>voidbase init</code> writes the project's three ignore lines for you. If your repository did not come
        from it, check them before the first commit, and check them again before making the repository public.
      </p>
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            A secret that has been committed is a secret that has leaked, even after you delete the line: it is in
            the history, and on any clone. Rotate it rather than trying to erase it.
          </p>
        </div>
      </div>

      <h2>So how do the values reach production?</h2>
      <p>Three different ways, depending on who is allowed to read the key.</p>

      <h3>Secrets are stored once, from your machine</h3>
      <p>
        A <code>secret()</code> value is put on the Worker by a deploy you run yourself, and lives there encrypted.
        The pipeline never sees it: a build has no <code>secrets.json</code>, and it does not need one, because the
        Worker already has the value.
      </p>
      <CodeBlock {...PUSH} />
      <p>
        A deploy stores a secret the Worker does not have yet, and deliberately will not overwrite one it does: a
        checkout whose <code>secrets.json</code> carries dev values must not overwrite production by deploying.{" "}
        <code>secrets push</code> is the command that replaces, which is what you want when rotating and never what
        you want by accident.
      </p>
      <p>
        A Worker's own secrets are seen by nothing else. If you would rather keep them in the account's Secrets Store,
        one place with role-based access, name the store and the deploy uses it instead:
      </p>
      <CodeBlock {...STORE} title="pb_secrets/secrets.json" />
      <p>
        Every declared <code>secret()</code> is then stored there as <code>blog-api__KEY</code>, bound to the Worker
        by its key, and the Worker's own secret of that name is retired. <code>secrets push</code> stores into it the
        same way and <code>voidbase secrets</code> says which names the store holds. Nothing in your code changes. The
        deploy token needs <em>Secrets Store: Write</em> and the account's Secrets Store Deployer role; the free plan
        holds 100 secrets per store.
      </p>

      <h3>Server and browser values travel with the deploy</h3>
      <p>
        A <code>server()</code> or <code>browser()</code> key is not a secret; it is configuration. Its value comes
        from the default in the declaration, which is tracked, or from the build environment, and every deploy sets
        it again. Most of them should simply have a default, and then there is nothing to configure anywhere.
      </p>
      <p>A boolean that you want to flip without a deploy is a feature flag:</p>
      <CodeBlock {...FLAG} />
      <p>
        The deploy creates a Cloudflare Flagship app named after the Worker, creates each declared flag in it with its
        default, and binds it. A flag that already exists is left as the dashboard has it, so a change there wins
        without a deploy. On every request the flags are evaluated for whoever is asking, the signed-in record or else
        the client's address, so a percentage rollout is sticky per person, and every reader of the key sees the
        answer as if it were a plain value. Where Flagship is not reachable, on Bun or with a token without{" "}
        <em>Flagship: Write</em>, the defaults answer and the deploy says so. Booleans only.
      </p>

      <h3>Tokens are yours and stay yours</h3>
      <p>
        A <code>local()</code> key is never deployed at all. The deploy token is the exception that has to reach the
        pipeline, because a build has to be able to deploy: <code>voidbase sync</code> stores it as a build secret on
        the trigger, once, from your machine. Cloudflare keeps it and does not show it back.
      </p>

      <h2>Checking what production actually has</h2>
      <CodeBlock {...STATE} />
      <p>
        One row per declared key: its tier, whether it has a value here or a default, and whether the Worker has it.
        This is the command to run when something behaves differently in production, because nine times out of ten
        the answer is a key that was declared but never given a value.
      </p>

      <h2>Rotating one</h2>
      <CodeBlock {...ROTATE} />
      <p>
        Nothing to commit and no redeploy. Removing a key is the reverse, and is two changes rather than one: take it
        out of the declaration and commit that, so the next person does not go looking for a value nothing reads.
      </p>

      <h2>What a build machine can see</h2>
      <p>
        Only what it needs: Bun's version, the deploy token as a build secret, and the declared server and browser
        values your machine had when you ran sync. With previews on, the repository's name as well, the GitHub token
        for the pull request comment as a build secret, and the superuser on the previews trigger so a preview can
        seed itself from production. Not your <code>secrets.json</code>, which never leaves your machine, and not the
        encrypted secrets on the Worker, which nothing can read back.
      </p>
    </>
  );
}
