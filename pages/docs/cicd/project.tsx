// CI for a project, past the point the common page stops.
//
// The common page connects the repository once and explains the tokens. What it does not cover is the shape of a
// pipeline you keep: a check that changes nothing, a preview instance per branch, and the rule about which
// configuration a build is allowed to read.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const DRY = hl.bash`voidbase sync --dry-run`;

const PREVIEWS = hl.bash`VOIDBASE_GH_TOKEN=... voidbase sync --previews`;

const TRIGGER = hl.output`  created trigger "blog-api (previews)": a push to any other branch runs \`true\`, then \`VOIDBASE_PREVIEW=$WORKERS_CI_BRANCH bun run deploy\`; the production build prunes the previews whose pull request is over (VOIDBASE_PREVIEW_PRUNE=1)`;

const PREVIEW = hl.bash`voidbase deploy --preview feature/login            # a preview of this project's Worker for the branch
voidbase previews                                  # the previews on the account: branch, address, created
voidbase previews remove feature/login             # the preview goes with its database, bucket and queue
voidbase previews prune --merged                   # every preview whose pull request is merged or closed goes`;

const TIERS = hl.typescript`// pb_secrets/main.ts
import { defineSecrets, secret, server, browser, local, string } from "@voidbase-cloud/voidbase/secrets";

export default defineSecrets({
  STRIPE_SECRET_KEY: secret(string(), "the worker holds it; no build ever sees it"),
  SENTRY_DSN: server(string().optional(), "the worker, and readable back"),
  PB_PUBLIC_URL: browser(string().optional(), "inlined into what the browser downloads"),
  VOIDBASE_DEPLOY_CF_API_KEY: local(string(), "your machine and the pipeline, never the worker"),
});`;

const CHECK = hl.bash`voidbase secrets                     # declared, valued, and by whom`;

export default function DocsCicdProject() {
  return (
    <>
      <h1>A pipeline for a voidbase project</h1>
      <p className="docs-lead">
        <Link href="/docs/deploy/pipeline">The common page</Link> connects the repository and explains the two
        tokens. This one is what to do after that: what a check should prove, what a branch should get, and which
        keys a build is allowed to read.
      </p>

      <h2>A check that changes nothing</h2>
      <p>
        Sync will tell you what it would do and stop.
      </p>
      <CodeBlock {...DRY} />
      <p>
        It prints the Worker it would write to, the resources it would create, the configuration it would set and
        the exact trigger commands, and exits without touching the account. The deploy plugins run as a dry run too,
        so the printed plan is the whole plan. The failure it catches most often is a secret declared in the
        repository that has no value anywhere, which would otherwise fail the deploy of a new Worker.
      </p>

      <h2>A preview instance per branch</h2>
      <p>
        Instances are cheap and completely separate, so a branch can have its own rather than sharing a staging one.
        The second trigger a Worker may have is for exactly that.
      </p>
      <CodeBlock {...PREVIEWS} />
      <CodeBlock {...TRIGGER} />
      <p>
        From then on a push to any branch but the production one deploys a second Worker beside production,{" "}
        <code>blog-api-pr-&lt;slug&gt;</code>, the slug being the branch lowercased and cut short with a short hash of
        the whole branch name on the end, so <code>feature/login</code> and <code>feature-login</code> are two
        Workers and the same branch is always the same one. It gets its own database, bucket and queue, stays on
        workers.dev whatever custom domains production has, and knows nothing about production.
      </p>
      <p>
        It is seeded from production after the upload, through the backups API: the collections' definitions by
        default, <code>VOIDBASE_PREVIEW_SEED=data</code> for the rows and files too, <code>none</code> to skip it.
        The seed signs in on both sides with the superuser, which is why sync puts{" "}
        <code>VOIDBASE_SUPERUSER_EMAIL</code> and <code>VOIDBASE_SUPERUSER_PASSWORD</code> on the previews trigger as
        build secrets when your environment has them. A seed that fails leaves the preview up and unseeded, and says
        so.
      </p>
      <p>
        With <code>VOIDBASE_GH_TOKEN</code>, a fine-grained GitHub token with pull requests: write on the repository,
        the branch's open pull request gets one comment with the address, the REST API and the panel under it, what it
        was seeded with and the version, updated by every later deploy of the branch rather than repeated. And because
        sync sets <code>VOIDBASE_PREVIEW_PRUNE=1</code> on the production trigger, every production deploy removes the
        previews whose pull request is merged or closed. That is how a preview disappears on merge without anything
        listening for GitHub events.
      </p>
      <p>The same from a laptop:</p>
      <CodeBlock {...PREVIEW} />
      <p>
        Two things to know before you turn this on. A preview Worker is new and holds no secrets, so a{" "}
        <code>secret()</code> declared without a value in the build's environment fails its deploy the way it would
        for any new Worker: declare it optional, or set it as a build secret on the previews trigger. And each preview
        has a D1 database of its own, which counts against the free plan's 10 per account. What a preview costs past
        that is on <Link href="/docs/pricing#calculator">the pricing page</Link>.
      </p>
      <p className="txt-hint txt-sm">
        Removing a preview deletes everything it owns, unlike a production <code>--remove</code>, because a preview is
        disposable by definition. <code>voidbase sync --no-previews</code> removes the trigger.
      </p>

      <h2>What the build may read</h2>
      <p>
        Every key is declared with a tier, and the tier is what decides whether the pipeline can see it.
      </p>
      <CodeBlock {...TIERS} />
      <p>
        <code>secret()</code> is written to the Worker and never readable again, so a build cannot print it even by
        accident. <code>local()</code> is the opposite: it belongs to your machine and to CI, and never reaches the
        Worker, which is where the deploy token lives.{" "}
        <Link href="/docs/run/project/secrets">pb_secrets</Link> has the whole model, and{" "}
        <Link href="/docs/deploy/tracked">what git tracks</Link> covers the account's Secrets Store and feature
        flags.
      </p>
      <CodeBlock {...CHECK} />
      <p>
        That prints what is declared and where each value is, and it is the fastest answer to "why did the deploy
        work on my machine".
      </p>

      <h2>A domain, and taking it down</h2>
      <p>
        Both are on the common page, because they are the same for a stack app:{" "}
        <Link href="/docs/deploy/pipeline">a custom domain</Link> is <code>--domain</code> on sync with the
        canonical hostname first, and <code>voidbase deploy --remove</code> takes the Worker down while keeping its
        data.
      </p>

      <h2>Upgrading voidbase in a tracked way</h2>
      <p>
        The dependency is in package.json, so an upgrade is a commit and goes through the same pipeline as anything
        else. <code>voidbase update</code> bumps it on your machine; <code>voidbase update --check</code> changes
        nothing and exits <code>1</code> when a newer release is out, which is what to run wherever you run scheduled
        checks. <code>voidbase update</code> also names the installed plugins a new voidbase would leave behind before
        it changes anything.
      </p>
    </>
  );
}
