// The marketplace section's front page: what it is, and the honest state of it.
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
        added.
      </p>

      <h2>What works, and what does not</h2>
      <p>
        It is early, and the useful thing to say about an early marketplace is what it cannot do. Nothing below is a
        roadmap item dressed up as a feature.
      </p>
      <ul>
        <li>
          <strong>You can list a template, and you can start from one.</strong> Starting is GitHub's own{" "}
          <em>Use this template</em> button, which clones the repository into your account. That is the entire
          install mechanism and it is somebody else's.
        </li>
        <li>
          <strong>You cannot install a plugin.</strong> <code>pb_plugins</code> does not exist yet: no format, no
          loader, nothing to install into. Plugin submissions are open anyway, and{" "}
          <Link href="/docs/marketplace/plugins">that page</Link> explains why.
        </li>
        <li>
          <strong>There are no accounts and nothing to pay.</strong> No sign-in, no download counts, no ranking, and
          no way to charge for anything yet.
        </li>
      </ul>

      <h2>The registry is a file</h2>
      <p>
        Every listing lives in <code>registry/templates.json</code> or <code>registry/plugins.json</code> in a{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-marketplace" target="_blank" rel="noreferrer noopener">
          public repository
        </a>
        , and the site is prerendered from those files. A listing therefore arrives as a commit: readable,
        reviewable, revertable, and arguable. That is deliberate, and it is the same reason the rest of voidbase
        keeps configuration in git rather than in a database.
      </p>
      <p>
        Being listed is not an endorsement. The audit is a first pass and not a guarantee, it looks at one commit on
        one day, and it never runs the code. Read anything before you run it.
      </p>

      <h2>Publishing</h2>
      <div className="docs-cards">
        <Link href="/docs/marketplace/templates" className="docs-card">
          <strong>Publish a template</strong>
          <span>What makes a good one, what the seven checks look at, and the submission form.</span>
        </Link>
        <Link href="/docs/marketplace/plugins" className="docs-card">
          <strong>Publish a plugin</strong>
          <span>Register one before the format exists, and help decide what the format is.</span>
        </Link>
        <Link href="/docs/marketplace/getting-paid" className="docs-card">
          <strong>Getting paid</strong>
          <span>What is already promised about charging for your work, and what is still undecided.</span>
        </Link>
      </div>
    </>
  );
}
