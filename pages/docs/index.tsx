// The front page of the documentation: what voidbase is, then the two questions that decide which page you read
// next. Everything else hangs off one of the five leaves in the tree, so this is the only page to read in order.
import { Link } from "@void/react";
import DecisionTree from "@/components/DecisionTree";
import "@/scss/tree.scss";

export default function DocsIndex() {
  return (
    <>
      <h1>Documentation</h1>
      <p className="docs-lead">
        voidbase is an open source backend that runs on Cloudflare and speaks PocketBase's API. A database with a
        schema you design in a browser, authentication, file storage, realtime subscriptions and an admin panel, from
        one address.
      </p>

      <p className="tree-aside">
        Already have an address from someone else? You want the <Link href="/docs/connect/sdk">SDK</Link> or the{" "}
        <Link href="/docs/connect/admin-panel">admin panel</Link>, and nothing on this page.
      </p>

      <DecisionTree />

      <h2>Then, whichever you picked</h2>
      <div className="docs-cards">
        <Link href="/docs/deploy/pipeline" className="docs-card">
          <strong>Deploy on every push</strong>
          <span>Connect the repository once and a push is the deploy, with every change tracked but your secrets.</span>
        </Link>
        <Link href="/docs/connect/sdk" className="docs-card">
          <strong>Talk to it from your app</strong>
          <span>The PocketBase SDK, pointed at your own instance. Reads, writes, auth and realtime.</span>
        </Link>
        <Link href="/docs/why" className="docs-card">
          <strong>Why another BaaS??!?!?</strong>
          <span>Where this came from, how it compares to the ones you know, and what each of them costs.</span>
        </Link>
      </div>

      <h2>What these pages assume</h2>
      <p>
        You have npm or bun, and nothing else. Where a command uses <code>bun</code>, npm does the same thing:{" "}
        <code>npm i -g</code> for <code>bun i -g</code>, and <code>npx</code> for <code>bunx</code>. The standalone
        page assumes less than that.
      </p>
      <p>
        Because the API is PocketBase's, anything written for PocketBase works here unchanged. That is why these
        pages are short: where something differs we say so, and where it does not we link PocketBase's own
        documentation rather than copying it, because a copy goes stale and a link does not.
      </p>
    </>
  );
}
