// CI for a project, past the point the common page stops.
//
// The common page connects the repository once and explains the tokens. What it does not cover is the shape of a
// pipeline you keep: a branch that gets its own instance, a check that changes nothing, and the rule about which
// configuration a build is allowed to read.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const DRY = hl.bash`voidbase sync --dry-run`;

const PREVIEW = hl.bash`voidbase deploy --name blog-api-pr-42`;

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
        tokens. This one is what to do after that: what a branch should get, what a check should prove, and which
        keys a build is allowed to read.
      </p>

      <h2>A check that changes nothing</h2>
      <p>
        Sync will tell you what it would do and stop.
      </p>
      <CodeBlock {...DRY} />
      <p>
        It prints the Worker it would write to, the resources it would create and the configuration it would set,
        and exits without touching the account. Run it on pull requests. The failure it catches most often is a
        secret declared in the repository that has no value in the build, which would otherwise deploy and fail at
        runtime.
      </p>

      <h2>An instance per branch</h2>
      <p>
        Instances are cheap and completely separate, so a branch can have its own rather than sharing a staging one.
        Deploy under a name derived from the branch.
      </p>
      <CodeBlock {...PREVIEW} />
      <p>
        It gets its own Worker, its own database and its own bucket, and knows nothing about production. Delete it
        when the branch closes with <code>voidbase destroy blog-api-pr-42</code>, which takes all three with it.
      </p>
      <p>
        Two things to know before you turn this on. Each preview starts with an empty database, so a branch that
        needs data needs a seed step. And Cloudflare's free plan is per account, not per Worker, so previews spend
        the same allowance as production. What that costs is on{" "}
        <Link href="/docs/pricing#calculator">the pricing page</Link>.
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
        <Link href="/docs/run/project/secrets">pb_secrets</Link> has the whole model.
      </p>
      <CodeBlock {...CHECK} />
      <p>
        That prints what is declared and where each value is, and it is the fastest answer to "why did the deploy
        work on my machine".
      </p>

      <h2>Upgrading voidbase in a tracked way</h2>
      <p>
        The dependency is in package.json, so an upgrade is a commit and goes through the same pipeline as anything
        else. <Link href="/docs/deploy/pipeline">The common page</Link> has a scheduled job that opens the pull
        request for you, which keeps the upgrade reviewable rather than something someone runs locally.
      </p>
    </>
  );
}
