// Connecting a repository to Cloudflare Workers Builds, so a push is the deploy.
//
// A push does two things and nothing else: the build command, then the deploy command, which is `voidbase sync` and
// in a build is the deploy alone. The dashboard shows three words; the repository decides what they mean. This page
// says exactly what sync writes, what a deploy creates, and the knobs on it, so nothing here has to be inferred.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TOKENS = hl.typescript`// pb_secrets/main.ts   (vb_secrets/main.ts in a stack app)
import { defineSecrets, local, string } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "deploys the instance"),
  CLOUDFLARE_BUILDS_TOKEN:    local(string(), "connects the repository to Workers Builds"),
  VOIDBASE_DEPLOY_NAME:       local(string().default("blog-api"), "the Worker this repository deploys to"),
});`;

const VALUES = hl.json`{
  "VOIDBASE_DEPLOY_CF_API_KEY": "...",
  "CLOUDFLARE_BUILDS_TOKEN": "..."
}`;

const SYNC = hl.bash`voidbase sync`;

const FIRST = hl.output`ci: the GitHub App is not installed for you/blog-api. One dashboard step: open https://dash.cloudflare.com/?to=/:account/workers/services/view/blog-api/production/settings/builds
  Under Builds, connect you/blog-api: that installs the "Cloudflare Workers and Pages" GitHub App for it and creates the build token. Then run voidbase sync again.`;

const SECOND = hl.output`ci: you/blog-api -> Worker blog-api (account Example Ltd)
  created trigger "blog-api (main)": a push to main runs \`true\`, then \`bun run deploy\`
  build environment: BUN_VERSION, VOIDBASE_DEPLOY_CF_API_KEY (secret)
  the pipeline: push to main and watch it at https://dash.cloudflare.com/?to=/:account/workers/services/view/blog-api/production/settings/builds`;

const PUSH = hl.bash`git add pb_migrations pb_hooks
git commit -m "posts: add a featured flag"
git push`;

const DOMAIN = hl.bash`voidbase sync --domain example.com,www.example.com    # or VOIDBASE_DOMAINS in secrets.json`;

const DRY = hl.bash`voidbase sync --dry-run`;

const REMOVE = hl.bash`voidbase deploy --remove             # the Worker goes; the database, the bucket and the queue stay
voidbase destroy blog-api            # everything the instance owns goes. Irreversible; asks first`;

const CHECK = hl.bash`voidbase update --check              # exits 1 when a newer release is out, 2 when it could not find out
voidbase update                      # bumps the dependency in package.json and installs it`;

export default function DocsPipeline() {
  return (
    <>
      <h1>Deploy on every push</h1>
      <p className="docs-lead">
        Connect the repository once and a push is the deploy: Cloudflare runs the build, then <code>voidbase sync</code>{" "}
        deploys the instance, and nothing else runs. Every change to the instance is then a commit somebody can read,
        revert and blame, which is the whole reason to do it this way.
      </p>

      <p>
        This works the same for <Link href="/docs/run/project">a project</Link> and{" "}
        <Link href="/docs/run/stack">a stack app</Link>. Where they differ is noted as it comes up.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>The project is in a GitHub repository, and you have pushed it at least once.</li>
        <li>You have deployed it by hand once, with <code>voidbase deploy</code>, so the instance exists.</li>
      </ul>
      <p className="txt-hint txt-sm">
        Neither is strictly required: <code>sync</code> deploys first and creates what does not exist. Doing the first
        deploy from your own machine means the first thing the pipeline ever does is an update rather than a creation,
        which is much easier to read when something is wrong.
      </p>

      <h2>Two tokens</h2>
      <p>
        One deploys the instance, one connects the repository. Both are yours, both are declared as{" "}
        <code>local()</code> keys, which is the tier that means read here and never deployed.
      </p>
      <CodeBlock {...TOKENS} />
      <p>
        <code>voidbase token</code> prints the link that creates the first, with the permissions already selected:
        Workers Scripts, D1, Workers R2 Storage and Queues edit, Account Settings read. The second is a{" "}
        <strong>user</strong> API token from your Cloudflare profile with{" "}
        <em>Workers Builds Configuration: Edit</em> and <em>Workers Scripts: Edit</em>. An account token will not do:
        the Builds API refuses it.
      </p>
      <p>Their values go in the git-ignored file beside the declaration, and stay on your machine:</p>
      <CodeBlock {...VALUES} />

      <h2>Connect it</h2>
      <CodeBlock {...SYNC} />
      <p>
        <code>sync</code> deploys the instance, then wires the repository to it. There is one step an API cannot do
        for you, installing Cloudflare's GitHub App on the repository, so the first run stops and points at it:
      </p>
      <CodeBlock {...FIRST} />
      <p>Do that, run the same command again, and the trigger is in place:</p>
      <CodeBlock {...SECOND} />

      <h2>What it built</h2>
      <p>One trigger, on the branch you ran it from:</p>
      <table>
        <thead>
          <tr>
            <th>On a push to</th>
            <th>What happens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>your production branch</td>
            <td>
              The build command runs, then the deploy command. The Worker is replaced, and{" "}
              <code>pb_migrations</code> apply on the first request afterwards.
            </td>
          </tr>
          <tr>
            <td>any other branch</td>
            <td>
              Nothing. A branch can never replace what is live. <code>voidbase sync --previews</code> adds a second
              trigger that deploys every other branch as its own preview instance, which{" "}
              <Link href="/docs/cicd/project">the project pipeline</Link> covers.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The commands are the project's own verbs when it has them. <code>voidbase init</code> writes a{" "}
        <code>package.json</code> with <code>deploy: "voidbase deploy"</code> and no build script, so a scaffolded
        project's trigger runs <code>true</code>, then <code>bun run deploy</code>. A project without a deploy script
        gets the command spelled out, <code>bunx @voidbase-cloud/voidbase sync --name blog-api</code>, which in a
        build is the deploy alone: a build has no <code>CLOUDFLARE_BUILDS_TOKEN</code> and nothing to connect. Nothing
        about the pipeline lives in the dashboard; what those words do is decided by the repository, so it changes in a
        commit like everything else.
      </p>
      <p className="txt-hint txt-sm">
        A Worker takes two triggers at most, and two triggers may not watch the same branch. That is the whole budget:
        production, and optionally previews.
      </p>

      <h2>Then just push</h2>
      <CodeBlock {...PUSH} />
      <p>
        That is the loop from here. Watch it at the link sync printed, or in the Cloudflare dashboard under the
        Worker's Builds tab.
      </p>

      <h2>A stack app is the same</h2>
      <p>
        Run <code>voidbase sync</code> at the project root. On your machine it runs <code>bun run build</code> first,
        which is the Vite build with the adapter, and deploys from the instance the build generated into{" "}
        <code>.voidbase/</code>; <code>--no-build</code> skips that step. In a build the trigger's build command is{" "}
        <code>bun run build</code> and the deploy command deploys what it produced. The generated directory stays
        git-ignored: it is output, rebuilt on every build, and committing it would only create conflicts.
      </p>

      <h2>What a deploy creates, and the knobs on it</h2>
      <p>
        Every resource is named after the Worker, and two instances on one account never share one. Re-running is
        idempotent: what exists is reused, what changed is updated.
      </p>
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>What it is</th>
            <th>Knob</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>blog-api-db</code></td>
            <td>The D1 database. Free plan: 10 per account.</td>
            <td><code>VOIDBASE_DATABASE=durable</code> or <code>--database durable</code> keeps the data in a SQLite-backed Durable Object instead, and creates no D1. A batch is then one transaction; the 100-column and 100-parameter ceilings stay.</td>
          </tr>
          <tr>
            <td><code>blog-api-storage</code></td>
            <td>The R2 bucket: uploaded files and backups.</td>
            <td></td>
          </tr>
          <tr>
            <td><code>blog-api-jobs</code></td>
            <td>The queue: outbound mail and scheduled backups run from it with retries.</td>
            <td><code>--no-queue</code>; skipped by itself when the token lacks Queues edit</td>
          </tr>
          <tr>
            <td>the Worker</td>
            <td>The instance, with its realtime hub Durable Object inside it, its cron triggers, and Smart Placement on.</td>
            <td><code>--no-hub</code> keeps the D1 poll for realtime; <code>--rate-limit 300/10</code> sets the per-IP ceiling on <code>/api</code>, <code>0</code> disables it</td>
          </tr>
          <tr>
            <td>optional bindings</td>
            <td>Workers AI for the chat route, Email Sending from the instance's own domain, an Analytics Engine data point per request.</td>
            <td><code>VOIDBASE_AI=1</code>, <code>VOIDBASE_MAIL_DOMAIN=example.com</code>, <code>--analytics</code>. Each is off unless set</td>
          </tr>
        </tbody>
      </table>
      <p>
        The knobs that are environment variables are read from <code>pb_secrets/secrets.json</code> as well as the
        shell, so they can be declared as <code>local()</code> keys and live beside the tokens. Some of them turn on a
        line of Cloudflare's bill that was not there before; <Link href="/docs/pricing#knobs">the pricing page</Link>{" "}
        lists which.
      </p>

      <h2>Where it answers: a custom domain</h2>
      <CodeBlock {...DOMAIN} />
      <p>
        The hostnames are comma separated and the first is canonical. The deploy turns workers.dev off, attaches each
        hostname through the Workers Custom Domains API, where Cloudflare creates the DNS record and issues the
        certificate, waits up to 90 seconds for the certificate to be active, and sets a redirect rule per other
        hostname sending everything under it, 301, to the same path on the canonical one. The zone has to be on the
        same account. Reading the certificate's status takes <em>SSL and Certificates Read</em> on the deploy token, and
        writing the redirect rules takes <em>Single Redirect: Edit</em> on the zone; without either the deploy says so
        and carries on. Previews never get these hostnames: they stay on workers.dev.
      </p>

      <h2>More than one instance in one repository</h2>
      <p>
        A build may deploy only the Worker its trigger belongs to, so each instance needs its own trigger. Run{" "}
        <code>voidbase sync</code> inside each project directory and each gets one, with commands that step into
        that directory. Declare <code>VOIDBASE_DEPLOY_NAME</code> in each, which makes a deploy refuse to run against
        a Worker the project does not name, and turns the worst mistake available here into an error message.
      </p>

      <h2>Checking without changing anything</h2>
      <CodeBlock {...DRY} />
      <p>
        Prints the plan and stops: which repository, which Worker, which branch, and the exact commands it would
        write. <code>--no-ci</code> deploys without touching the pipeline, <code>--ci</code> forces the pipeline part
        inside a build, and <code>--repo owner/name</code> and <code>--branch</code> override what git says.{" "}
        <code>--previews</code> adds the previews trigger and <code>--no-previews</code> removes it; a plain sync
        leaves an existing one as it is.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            An existing trigger keeps the watch paths you set in the dashboard, so tuning which paths trigger a build
            is not undone the next time somebody runs sync.
          </p>
        </div>
      </div>

      <h2>Taking it down</h2>
      <CodeBlock {...REMOVE} />
      <p>
        <code>--remove</code> runs every deploy plugin's remove hook first, so custom domains are detached and their
        redirect rules deleted, then deletes the Worker. The database, the bucket and the queue stay with everything in
        them, and a deploy afterwards finds them again. Both commands ask you to type the Worker's name unless{" "}
        <code>--yes</code> says nobody can be asked; <code>--dry-run</code> shows the plan.
      </p>

      <h2>Updating voidbase, tracked like everything else</h2>
      <p>
        A build installs what <code>package.json</code> says, so that file is what decides which voidbase a deploy
        carries. That is the useful property: an upgrade is a commit, it shows up in the diff, it deploys through the
        same pipeline as your own code, and reverting it is reverting a commit.
      </p>
      <CodeBlock {...CHECK} />
      <p>
        <code>--check</code> changes nothing and its exit code is what a pipeline reads: <code>1</code> when you are
        behind, <code>2</code> when it could not reach the registry, so a network problem is distinguishable from
        being out of date. Run <code>voidbase update</code> on your machine, look at the change to{" "}
        <code>package.json</code> and your lockfile, and push it. A pinned version never changes underneath you; a
        caret range picks up a new version on the next install, which is convenient until a build behaves differently
        from the one before it for a reason that is not in any commit.
      </p>

      <h2>Next</h2>
      <p>
        The one thing that must not be in the repository is the values of your secrets.{" "}
        <Link href="/docs/deploy/tracked">What git tracks</Link> is the list, and how those values reach production
        without going through a commit.
      </p>
    </>
  );
}
