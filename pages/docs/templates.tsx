// Templates as a concept, separate from publishing one.
//
// Someone arriving here wants one of two things: to start from a template, or to make one. The page answers both and
// hands the publishing mechanics to the marketplace section rather than repeating them.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const SHAPE = hl.bash`my-template/
├─ pb_hooks/        or vb_hooks/ in a stack app: the behaviour someone inherits
├─ pb_migrations/   the collections, so the schema arrives with the code
├─ pb_secrets/      what has to be configured, declared with safe defaults
├─ README.md        what someone gets, and the first command to run
└─ LICENSE          so people know what they may do with it`;

export default function DocsTemplates() {
  return (
    <>
      <h1>Templates</h1>
      <p className="docs-lead">
        A template is a working voidbase project somebody publishes so other people can start from it instead of from
        an empty directory. It stays in their repository under their licence; copying it gives you your own.
      </p>

      <h2>Starting from one</h2>
      <p>
        Every listed template is a public GitHub repository with <em>Use this template</em> switched on, so starting
        is pressing that button and getting your own copy. Browse them in{" "}
        <a href="https://marketplace.voidbase.cloud/templates" target="_blank" rel="noreferrer noopener">
          the marketplace
        </a>
        , and then follow the page for whichever shape it is:{" "}
        <Link href="/docs/run/project">a voidbase project</Link> or{" "}
        <Link href="/docs/run/stack">a stack app</Link>. Both of those pages have a section on starting from a
        template rather than from nothing.
      </p>
      <p>
        Taking a template does not tie you to it. What you get is a repository, and from there it is an ordinary
        project: <Link href="/docs/run/standalone">run it locally</Link>,{" "}
        <Link href="/docs/run/npm">make instances of it</Link>, or{" "}
        <Link href="/docs/deploy/pipeline">deploy it from a push</Link>.
      </p>

      <h2>What makes one worth publishing</h2>
      <p>
        A template is not a snippet and not a tutorial. Someone copies it, runs one command, and sees something
        working; anything short of that costs them more than starting fresh would. The three we list are all real
        projects that serve real traffic rather than examples written for the listing.
      </p>
      <CodeBlock {...SHAPE} />
      <p>
        The pieces that matter most are the least interesting ones. Migrations mean the schema arrives with the code
        instead of being a setup step. Declared secrets with defaults mean it runs before anything is configured. A
        README that says what someone gets is what makes the difference between a template and a repository.
      </p>

      <h2>Publishing yours</h2>
      <p>
        A submission is a GitHub issue, an automated audit reports on the repository before anyone decides, and a
        maintainer lists it. The seven checks it runs, and which four of them block, are on{" "}
        <Link href="/docs/marketplace/templates">the publishing page</Link>.
      </p>
      <p>
        One thing worth knowing before you spend time on it: turn on <strong>Template repository</strong> in your
        repository settings. Without it, <em>Use this template</em> does nothing, and that button is the only way
        anyone can currently use what you published.
      </p>
    </>
  );
}
