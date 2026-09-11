// The marketplace section's front page: what it is, what works, and how a listing arrives and leaves.
//
// Everything under here is about somebody else's code, so the page leads with what that means rather than with a
// feature list. The three pages below it are the two ways to publish and the question everyone asks third.
import { Link } from "@void/react";
import { SITE } from "@/lib/env";

export default function DocsMarketplace() {
  return (
    <>
      <h1>The marketplace</h1>
      <p className="docs-lead">
        Templates and plugins for voidbase, written by the people who use it, at{" "}
        <a href={SITE.marketplaceUrl} target="_blank" rel="noreferrer noopener">marketplace.voidbase.cloud</a>. Your
        code stays in your repository; a listing points at it and records what our checks found on the day it was
        added. For a plugin the marketplace also builds the bundle from your repository at that commit, audits it on
        both sides of the build, hashes it and serves it, because that is the marketplace's job and not yours.
      </p>

      <h2>What works, and what does not</h2>
      <ul>
        <li>
          <strong>You can list a template, and you can start from one.</strong> GitHub's own <em>Use this template</em>{" "}
          button clones the repository into your account, and <code>voidbase init --template &lt;name&gt;</code>{" "}
          downloads it from the listing; <Link href="/docs/templates">the templates page</Link> has both.
        </li>
        <li>
          <strong>You can list a plugin, and you can install one.</strong> <code>voidbase plugins add &lt;name&gt;</code>{" "}
          (voidbase 0.9.0-beta.7 or later) downloads the release this marketplace serves into{" "}
          <code>pb_plugins/&lt;name&gt;</code>, verifies it against the hash recorded here, and pins it in{" "}
          <code>voidbase.lock</code>; the instance verifies the bytes again every time it starts. A cloud instance
          installs from its page on voidbase.cloud through the instance's own installer.{" "}
          <Link href="/docs/plugins">The plugins page</Link> is the whole of it.
        </li>
        <li>
          <strong>You are not tied to this marketplace.</strong> What it serves under <code>/registry/v1/</code> is{" "}
          <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/registry.md" target="_blank" rel="noreferrer noopener">
            the registry protocol
          </a>
          , three GETs defined in voidbase that any marketplace can serve and any instance can read;{" "}
          <code>--marketplace &lt;url&gt;</code> installs from another.
        </li>
        <li>
          <strong>There are no accounts, downloads or rankings, and nothing to pay.</strong> Nothing to sign in to
          and nothing counted. <Link href="/docs/marketplace/getting-paid">Getting paid</Link> says what that means
          for charging.
        </li>
      </ul>

      <h2>The registry is a file</h2>
      <p>
        <code>registry/templates.json</code> and <code>registry/plugins.json</code> are the listings, and{" "}
        <code>registry/v1/</code> is what is served: the index, one record per plugin version, and the bundle beside
        it, all written by the pipeline and committed to a{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-marketplace" target="_blank" rel="noreferrer noopener">
          public repository
        </a>
        . Together they are the whole database. A listing therefore arrives as a commit: readable, reviewable,
        revertable, and arguable. That is deliberate, and it is the same reason the rest of voidbase keeps
        configuration in git rather than in a database. The site is prerendered from those files.
      </p>
      <p>
        Being listed is not an endorsement. The audit is deterministic and recorded, a first pass and not a
        guarantee; it looks at one commit on one day, and it never runs the code. Read anything before you run it.
      </p>

      <h2>How a listing arrives, and leaves</h2>
      <p>
        A submission is a GitHub issue from a form, and the marketplace handles it itself. The repository's webhook
        audits a submission when it is opened or edited and answers with a comment. One a maintainer labels{" "}
        <code>approved</code> is listed: a template is added to the listing; a plugin is built, audited and hashed
        as well. The listing is committed, pushed, answered and closed, and the push deploys. A new plugin version is
        a tag on your repository: a daily check asks every listed repository for its tags and publishes the versions
        this marketplace does not serve yet. A listing leaves through an issue titled{" "}
        <code>[remove] owner/name</code>: once approved, the entry leaves the listing and a plugin's served versions
        leave the registry, in one commit. Instances that installed it keep what they have.
      </p>

      <h2>Publishing</h2>
      <div className="docs-cards">
        <Link href="/docs/marketplace/templates" className="docs-card">
          <strong>Publish a template</strong>
          <span>What makes a good one, what the seven checks look at, and the submission form.</span>
        </Link>
        <Link href="/docs/marketplace/plugins" className="docs-card">
          <strong>Publish a plugin</strong>
          <span>A repository with a plugin.json: what the marketplace builds, audits and serves, and how a version lands.</span>
        </Link>
        <Link href="/docs/marketplace/getting-paid" className="docs-card">
          <strong>Getting paid</strong>
          <span>Nothing is sold through the marketplace. What is promised, and what your instance can do today.</span>
        </Link>
      </div>
    </>
  );
}
