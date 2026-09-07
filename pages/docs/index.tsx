// The first page of the documentation: what voidbase is, in as few words as that takes, and then the choice that
// decides which page you read next.
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
  // by href, not by position: adding a section should not silently renumber this page
  const at = (href: string) => DOCS_NAV.find((s) => s.href === href)!;
  const why = at("/docs/why");
  const connect = at("/docs/connect/sdk");
  const run = at("/docs/run/standalone");
  const project = at("/docs/run/project");
  const pipeline = at("/docs/deploy/pipeline");
  const stack = at("/docs/run/stack");

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

      <p>
        If you are still deciding whether to use it at all,{" "}
        <Link href={why.href}>{why.children![0]!.title}</Link> is the short history of how these backends got here
        and where this one sits, with a page for each of the ones you are probably comparing it to.
      </p>

      <h2>Connect to one that exists</h2>
      <p>{connect!.summary} You need the address and an account, and nothing installed but your own project.</p>
      <Cards links={connect!.children ?? []} />

      <h2>Or run one</h2>
      <p>
        Four ways, aimed at four different people. They are not steps: pick the one that describes you, and ignore
        the others until it stops describing you.
      </p>
      <Cards links={run!.children ?? []} />
      <div className="docs-cards">
        <Link href={project!.href} className="docs-card">
          <strong>{project!.title}</strong>
          <span>{project!.summary}</span>
        </Link>
        <Link href={stack!.href} className="docs-card">
          <strong>{stack!.title}</strong>
          <span>{stack!.summary}</span>
        </Link>
      </div>

      <h2>And keep it that way</h2>
      <p>
        Once an instance is yours, the next thing worth doing is making every change to it a commit: connect the
        repository once and a push is the deploy, with nothing done by hand and nothing to remember.
      </p>
      <Cards links={pipeline!.children ?? []} />

      <h2>Which one</h2>
      <table>
        <thead>
          <tr>
            <th>If you</th>
            <th>Read</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>want to see it working, now</td>
            <td><Link href="/docs/run/standalone">Standalone executable</Link></td>
          </tr>
          <tr>
            <td>want instances on Cloudflare and no code at all</td>
            <td><Link href="/docs/run/npm">Instances on Cloudflare</Link></td>
          </tr>
          <tr>
            <td>are building a backend: endpoints, hooks, a schema you keep</td>
            <td><Link href="/docs/run/project">A voidbase project</Link></td>
          </tr>
          <tr>
            <td>are building the whole thing, site included</td>
            <td><Link href="/docs/run/stack">The voidbase stack</Link></td>
          </tr>
          <tr>
            <td>are deciding between this and Firebase, Supabase, PocketBase or another</td>
            <td><Link href="/docs/why">Why another BaaS??!?!?</Link></td>
          </tr>
          <tr>
            <td>want every change tracked, and a push to be the deploy</td>
            <td><Link href="/docs/deploy/pipeline">Deploy from your repository</Link></td>
          </tr>
        </tbody>
      </table>

      <h2>What you can assume</h2>
      <p>
        These pages assume you have npm or bun, and nothing else. Where a command is written with <code>bun</code>,
        npm does the same thing: <code>npm i -g</code> for <code>bun i -g</code>, <code>npx</code> for{" "}
        <code>bunx</code>. The standalone page assumes even less than that.
      </p>
    </>
  );
}
