// Publishing a template: what one is, what the audit looks at, and the submission path.
//
// The audit table is the important part of this page. Every check is listed with what it means and whether it
// blocks, because a submitter who can read the rules before submitting is one who does not need a maintainer to
// explain a rejection.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { SITE } from "@/lib/env";

const START = hl.bash`# a template is an ordinary voidbase project, so start one the ordinary way
voidbase init my-template
cd my-template

# make it worth starting from: collections, a hook or two, something that runs
voidbase serve --dev`;

const SUBMIT = "https://github.com/voidbase-cloud/voidbase-marketplace/issues/new?template=submit-template.yml";

function Check({ name, blocking, children }: { name: string; blocking?: boolean; children: React.ReactNode }) {
  return (
    <tr>
      <td><code>{name}</code></td>
      <td>{children}</td>
      <td>{blocking ? <strong>blocks</strong> : "reported"}</td>
    </tr>
  );
}

export default function DocsMarketplaceTemplates() {
  return (
    <>
      <h1>Publish a template</h1>
      <p className="docs-lead">
        A template is a public repository somebody can start a voidbase project from. It stays yours, in your
        account, under your licence. Listing it points people at it.
      </p>

      <h2>What makes one worth listing</h2>
      <p>
        A template is not a snippet. Someone clicks <em>Use this template</em>, gets a repository, and should be able
        to run it within a minute and see something working. The three we list first are all real projects that
        serve real traffic rather than demos written to look good: the{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-demo" target="_blank" rel="noreferrer noopener">public demo</a>{" "}
        as <Link href="/docs/run/project">a voidbase project</Link>, and{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-site" target="_blank" rel="noreferrer noopener">this site</a>{" "}
        and the{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-marketplace" target="_blank" rel="noreferrer noopener">marketplace</a>{" "}
        as <Link href="/docs/run/stack">stack apps</Link>.
      </p>
      <CodeBlock {...START} />

      <h2>Before you submit</h2>
      <ul>
        <li>The repository is <strong>public</strong>.</li>
        <li>
          It has a licence GitHub can identify. A <code>LICENSE</code> file GitHub cannot recognise counts as none,
          which is a real trap: an explanatory paragraph inside the licence text is enough to break detection.
        </li>
        <li>It has a README saying what someone gets from starting with it.</li>
        <li>
          <strong>Template repository</strong> is switched on in its settings. Without that, <em>Use this template</em>{" "}
          does nothing, and that button is the only way anyone can use what you listed.
        </li>
      </ul>

      <h2>What the audit checks</h2>
      <p>
        It runs when you open the issue and comments with what it found. Every check is deterministic and reported
        with its reason, and all of them appear on the listing, so you can disagree with any one of them by reading
        it.
      </p>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Check</th><th>What it means</th><th></th></tr>
          </thead>
          <tbody>
            <Check name="public repository" blocking>It exists and is reachable without signing in.</Check>
            <Check name="not archived" blocking>An archived repository stops getting fixes.</Check>
            <Check name="has a licence">GitHub can identify one. Reported rather than fatal, because whether an unlicensed repository is a problem for you is not ours to decide.</Check>
            <Check name="has a commit to point at" blocking>The default branch reads, and its tip is recorded with the listing so a later change is visible as a change.</Check>
            <Check name="looks like a voidbase project" blocking>One of <code>void.json</code>, <code>vb_hooks</code>, <code>vb_migrations</code>, <code>pb_hooks</code>, <code>pb_migrations</code>, <code>vb_secrets</code> or <code>pb_secrets</code> is in the root.</Check>
            <Check name="has a README">There is something to read before cloning it.</Check>
            <Check name="nothing obviously alarming">The files it reads contain no shell-piped downloads, <code>eval</code>, process spawning, or anything shaped like a credential.</Check>
          </tbody>
        </table>
      </div>

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            The audit does not run your code. It reads a handful of files at one commit on one day, and the
            repository can change the minute after. It cannot tell anyone a template is safe, only that nothing it
            knows to look for was there. There is no model in the blocking path, and if an advisory pass is ever
            added it will be labelled advisory and will not be able to fail a submission on its own.
          </p>
        </div>
      </div>

      <h2>Submitting</h2>
      <ol>
        <li>Open the <a href={SUBMIT} target="_blank" rel="noreferrer noopener">template submission form</a>.</li>
        <li>The audit comments within a minute or two. If it flags something, edit the issue: that runs it again.</li>
        <li>A maintainer decides. Accepted listings are committed to the registry and appear after the next deploy.</li>
      </ol>
      <p>
        A listing can be removed if the repository disappears, becomes something other than what was listed, or turns
        out to be someone else's work. If you would rather ask before you spend time on it, we are on{" "}
        <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a>.
      </p>
    </>
  );
}
