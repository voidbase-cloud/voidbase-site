// The first page of the documentation: what voidbase is, in as few words as that takes, and then the one choice
// that decides which page you read next.
import { Link } from "@void/react";
import { DOCS_NAV, type DocsLink } from "@/lib/docsNav";

function Cards({ links }: { links: DocsLink[] }) {
  return (
    <div className="docs-cards">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="docs-card">
          <strong>{l.title}</strong>
          <span>{l.summary}</span>
        </Link>
      ))}
    </div>
  );
}

export default function DocsIndex() {
  const [, connect, run] = DOCS_NAV;

  return (
    <>
      <h1>Documentation</h1>
      <p className="docs-lead">
        voidbase is an open source backend that runs on Cloudflare, and it speaks PocketBase's API. A database with a
        schema you design in a browser, authentication, file storage, realtime subscriptions and an admin panel, from
        one address.
      </p>

      <p>
        Because the API is PocketBase's, everything written for PocketBase works against voidbase unchanged: the
        client libraries, the filter syntax, the admin panel itself. That is deliberate, and it is why these pages
        are short. Where something genuinely differs, it is said here; where it does not, PocketBase's own
        documentation is linked rather than copied, because a copy goes stale and a link does not.
      </p>

      <h2>Start here</h2>
      <p>Two questions bring people to this page, and the answer to one of them is a lot shorter than the other.</p>

      <h3>{connect!.title}</h3>
      <p>{connect!.summary} You need the address and an account, and nothing installed but your own project.</p>
      <Cards links={connect!.children ?? []} />

      <h3>{run!.title}</h3>
      <p>
        {run!.summary} Every one of them puts the instance somewhere you control, and the data with it. Start with the
        standalone executable if you are only looking; it takes about a minute and needs neither npm nor bun.
      </p>
      <Cards links={run!.children ?? []} />

      <h2>What you can assume</h2>
      <p>
        These pages assume you have npm or bun, and nothing else. Where a command is written with <code>bun</code>,
        npm does the same thing: <code>npm i -g</code> for <code>bun i -g</code>, <code>npx</code> for{" "}
        <code>bunx</code>. The standalone page assumes even less than that.
      </p>
    </>
  );
}
