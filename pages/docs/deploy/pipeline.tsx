// Connecting a repository to Cloudflare Workers Builds, so a push is the deploy.
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

const FIRST = hl.output`ci: the GitHub App is not installed for you/blog-api. One dashboard step:
  open https://dash.cloudflare.com/?to=/:account/workers/services/view/blog-api/production/builds
  Under Builds, connect you/blog-api: that installs the "Cloudflare Workers and Pages"
  GitHub App for it and creates the build token. Then run voidbase sync again.`;

const SECOND = hl.output`ci: you/blog-api -> Worker blog-api (account Example Ltd)
  created trigger "blog-api (main)": a push to main runs \`true\`, then \`bun run deploy\`
  created trigger "blog-api (branches)": every other branch runs \`true\`, then \`bun run version\`; nothing live is touched
  build environment: BUN_VERSION, VOIDBASE_DEPLOY_CF_API_KEY (secret), MAX_UPLOAD_MB
  the pipeline: push to main and watch it at https://dash.cloudflare.com/...`;

const PUSH = hl.bash`git add -A
git commit -m "posts: add a featured flag"
git push`;

const DRY = hl.bash`voidbase sync --dry-run`;

const CHECK = hl.yaml`name: voidbase update
on:
  schedule: [{ cron: "0 9 * * 1" }]   # Monday morning
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: ./node_modules/.bin/voidbase update --check`;

export default function DocsPipeline() {
  return (
    <>
      <h1>Deploy on every push</h1>
      <p className="docs-lead">
        Connect the repository once and a push is the deploy: Cloudflare builds the project, applies the migrations
        and replaces the Worker. Every change to the instance is then a commit somebody can read, revert and blame,
        which is the whole reason to do it this way.
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
        Neither is strictly required, but doing the first deploy from your own machine means the first thing the
        pipeline ever does is an update rather than a creation, which is much easier to read when something is wrong.
      </p>

      <h2>Two tokens</h2>
      <p>
        One deploys the instance, one connects the repository. Both are yours, both are declared as{" "}
        <code>local()</code> keys, which is the tier that means read here and never deployed.
      </p>
      <CodeBlock {...TOKENS} />
      <p>
        <code>voidbase token</code> prints the link that creates the first. The second is a{" "}
        <strong>user</strong> API token from your Cloudflare profile with{" "}
        <em>Workers Builds Configuration: Edit</em> and <em>Workers Scripts: Edit</em>. An account token will not do:
        the Builds API refuses it.
      </p>
      <p>Their values go in the git-ignored file beside the declaration, and stay on your machine:</p>
      <CodeBlock {...VALUES} />

      <h2>Connect it</h2>
      <CodeBlock {...SYNC} />
      <p>
        <code>sync</code> deploys the instance and then wires the repository to it. There is one step an API cannot
        do for you, installing Cloudflare's GitHub App on the repository, so the first run stops and points at it:
      </p>
      <CodeBlock {...FIRST} />
      <p>Do that, run the same command again, and the triggers are in place:</p>
      <CodeBlock {...SECOND} />

      <h2>What it built</h2>
      <p>Two triggers, because the two cases want different things:</p>
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
            <td>The project is built and deployed. Migrations apply on the first request afterwards.</td>
          </tr>
          <tr>
            <td>any other branch</td>
            <td>
              The project is built, and the deploy step reads back the configuration that branch would deploy with
              instead of deploying it. A branch can never replace what is live.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The commands are the project's own verbs, <code>bun run deploy</code> and <code>bun run version</code>, which
        is why a scaffolded project has them in its <code>package.json</code>. Nothing about the pipeline lives in
        the dashboard: what those words do is decided by the repository, so it changes in a commit like everything
        else.
      </p>

      <h2>Then just push</h2>
      <CodeBlock {...PUSH} />
      <p>
        That is the loop from here. Watch it at the link sync printed, or in the Cloudflare dashboard under the
        Worker's Builds tab.
      </p>

      <h2>A stack app is the same</h2>
      <p>
        Run <code>voidbase sync</code> at the project root. The build runs your Vite build, which generates the
        instance into <code>.voidbase/</code>, and the deploy publishes from there. The generated directory stays
        git-ignored: it is output, rebuilt on every build, and committing it would only create conflicts.
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
        write. <code>--no-ci</code> deploys without touching the pipeline, and <code>--repo</code> and{" "}
        <code>--branch</code> override what git says.
      </p>

      <div className="alert alert-info">
        <div className="content">
          <p className="m-0">
            An existing trigger keeps the watch paths you set in the dashboard, so tuning which paths trigger a build
            is not undone the next time somebody runs sync.
          </p>
        </div>
      </div>

      <h2>Updating voidbase, tracked like everything else</h2>
      <p>
        A build installs what <code>package.json</code> says, so that file is what decides which voidbase a deploy
        carries. That is the useful property: an upgrade is a commit, it shows up in the diff, it deploys through the
        same pipeline as your own code, and reverting it is reverting a commit. Run{" "}
        <code>voidbase update</code> on your machine, look at the change to <code>package.json</code> and your
        lockfile, and push it.
      </p>
      <p>
        A pinned version never changes underneath you. A caret range picks up a new version on the next install,
        which is convenient until a build behaves differently from the one before it for a reason that is not in any
        commit. Pin it if that matters to you, and let the update commit be the only thing that moves it.
      </p>
      <p>
        To be told when there is something to update, add a step that asks. <code>--check</code> changes nothing and
        exits <code>1</code> when you are behind, so a scheduled job fails and notifies you exactly when a release is
        out.
      </p>
      <CodeBlock {...CHECK} title=".github/workflows/voidbase-update.yml" />
      <p>
        Nothing in the check needs a token or an account: it reads your lockfile and the public registry. It exits{" "}
        <code>2</code> if it could not reach the registry, so a network problem is distinguishable from being out of
        date and you can decide which of the two should fail a build.
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
