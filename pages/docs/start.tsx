// Two questions that decide which page you read next. Everything else hangs off one of the five leaves in the tree,
// so this is the only page here that has to be read in order.
//
// It used to be the front page of the documentation and is now a page of its own, because "what is this" and "which
// of these do I want" are different questions and answering both at once served neither.
import { Link } from "@void/react";
import DecisionTree from "@/components/DecisionTree";
import "@/scss/tree.scss";

export default function DocsIndex() {
  return (
    <>
      <h1>Where to start</h1>
      <p className="docs-lead">
        Two questions get you to the right page. What do you want to do, and then which shape of it. If you have not
        read <Link href="/docs">the introduction</Link> yet, it is shorter than this page.
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

      <h2>Still not sure?</h2>
      <p>
        Take the standalone executable. It is one file, it needs nothing installed, and it deletes cleanly, so it is
        the cheapest way to find out whether any of this is what you wanted. Everything you build against it works
        against every other option on this page, because they are all the same server.
      </p>
    </>
  );
}
