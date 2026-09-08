// The introduction: what voidbase is, what it is made of, and what these pages assume.
//
// It answers "what is this" and stops. Choosing between the ways to run it is a different question and has its own
// page, because a front page that tries to introduce and route at the same time does neither well.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";

const TASTE = `# one file, nothing installed
./voidbase serve

# or from npm, with instances you name
bun i -g @voidbase-cloud/voidbase
voidbase local new blog`;

export default function DocsIndex() {
  return (
    <>
      <h1>Introduction</h1>
      <p className="docs-lead">
        voidbase is an open source backend that speaks PocketBase's API and runs on Cloudflare. A database with a
        schema you design in a browser, authentication, file storage, realtime subscriptions and an admin panel, from
        one address, in an account that belongs to you.
      </p>

      <h2>What you get</h2>
      <p>
        One server, and everything a small application needs from a backend before it needs a team. Collections with
        a schema you edit in the admin panel and API rules that decide who may read and write each one. Users,
        passwords, OAuth and one-time codes. File uploads with thumbnails generated on request. A realtime
        subscription that pushes changes as they happen. Scheduled jobs. Endpoints and event handlers you write in
        JavaScript and drop into a directory.
      </p>
      <p>
        None of that is new, and that is the point. It is{" "}
        <a href="https://pocketbase.io" target="_blank" rel="noreferrer noopener">PocketBase</a>'s API, reimplemented
        so it can run somewhere PocketBase cannot.
      </p>

      <h2>Two things it is made of</h2>
      <p>
        <strong>PocketBase's API, not its code.</strong> The endpoints, the filter language, the API rules, the hook
        surface and the admin panel are PocketBase's, which means the SDKs work unchanged, anything written for
        PocketBase applies here, and moving between the two is changing an address. The panel served at{" "}
        <code>/_/</code> is PocketBase's own build, unmodified. What differs is written down on{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          the differences page
        </a>{" "}
        rather than left for you to discover.
      </p>
      <p>
        <strong>Cloudflare, in your own account.</strong> A deployed instance is a Worker with a D1 database, an R2
        bucket and a Durable Object, created in the Cloudflare account you already have. There is no machine to size,
        nothing to keep patched, and nothing sitting between you and the platform. It also runs as a single process
        on your laptop, from one downloaded file, with the same API and the same panel.
      </p>

      <CodeBlock language="bash" content={TASTE} />

      <h2>What these pages assume</h2>
      <p>
        You have npm or bun, and nothing else. Where a command uses <code>bun</code>, npm does the same thing:{" "}
        <code>npm i -g</code> for <code>bun i -g</code>, and <code>npx</code> for <code>bunx</code>. The{" "}
        <Link href="/docs/run/standalone">standalone page</Link> assumes less than that.
      </p>
      <p>
        Because the API is PocketBase's, these pages are short on purpose. Where something differs we say so, and
        where it does not we link PocketBase's own documentation rather than copying it, because a copy goes stale
        and a link does not.
      </p>

      <h2>Where this is going</h2>
      <p>
        voidbase is in public beta. It runs, people are running it, and the API is not going to move. The version is
        0.x for everything around that, and both what is coming and what is deliberately not are on{" "}
        <Link href="/docs/roadmap">the roadmap</Link>. It is <Link href="/docs/pricing">free</Link>, and that page
        explains what we mean by the word and how a free backend pays for itself.
      </p>

      <div className="docs-cards">
        <Link href="/docs/start" className="docs-card">
          <strong>Where to start</strong>
          <span>Two questions, and the page that answers them. Read this next.</span>
        </Link>
        <Link href="/docs/why" className="docs-card">
          <strong>Why another BaaS??!?!?</strong>
          <span>Where this came from, how it compares to the ones you know, and what each of them costs.</span>
        </Link>
        <Link href="/docs/connect/sdk" className="docs-card">
          <strong>Already have an address?</strong>
          <span>Someone else is running the instance. You want the SDK, and nothing else on this page.</span>
        </Link>
      </div>
    </>
  );
}
