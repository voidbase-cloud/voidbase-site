// Templates as a concept, separate from publishing one.
//
// Someone arriving here wants one of two things: to start from a template, or to make one. The page answers both and
// hands the publishing mechanics to the marketplace section rather than repeating them.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const INIT = hl.bash`voidbase templates                                   # what the marketplace lists: name, title, summary, repository
voidbase init --template voidbase-site               # a listed template, by name, into ./voidbase-site
voidbase init my-app --template acme/starter         # any public GitHub repository, into ./my-app
voidbase init my-app --template acme/starter --ref v2            # a branch or a tag instead of the default branch
voidbase templates --marketplace https://marketplace.example.com  # another marketplace's listing`;

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
        an empty directory. It stays in their repository under their licence; copying it gives you your own. Three
        ways to start from one, and one listing behind all of them.
      </p>

      <h2>From GitHub</h2>
      <p>
        Every listed template is a public GitHub repository with <em>Use this template</em> switched on, so starting
        is pressing that button and getting your own copy in your account. Browse them in{" "}
        <a href="https://marketplace.voidbase.cloud/templates" target="_blank" rel="noreferrer noopener">
          the marketplace
        </a>
        , and then follow the page for whichever shape it is:{" "}
        <Link href="/docs/run/project">a voidbase project</Link> or{" "}
        <Link href="/docs/run/stack">a stack app</Link>.
      </p>

      <h2>From the CLI</h2>
      <p>
        <code>voidbase init [dir] --template &lt;name&gt;</code> takes a template the marketplace lists, and{" "}
        <code>--template owner/name</code> takes any public GitHub repository. The files of the default branch (or{" "}
        <code>--ref</code>) are downloaded from GitHub as a tarball and unpacked into the directory, which has to be
        empty or absent and defaults to the repository's name; nothing is cloned and no <code>.git</code> is left
        behind. The next steps are read from the template itself: <code>bun install</code> and its <code>dev</code>{" "}
        script for a package, <code>voidbase serve</code> for a PocketBase layout, <code>bun install</code> and{" "}
        <code>bun run dev</code> for a stack app.
      </p>
      <CodeBlock {...INIT} />
      <p>
        <code>voidbase templates</code>, or <code>voidbase init --template</code> with no name, prints the listing.{" "}
        <code>--marketplace &lt;url&gt;</code> reads another marketplace's, and <code>VOIDBASE_PLUGIN_MARKETPLACES</code>{" "}
        applies here as it does for plugins. GitHub answers 404 for a private repository and a missing one alike, and
        the command says so.
      </p>

      <h2>From the cloud page</h2>
      <p>
        With GitHub connected, <Link href="/docs/run/cloud">the cloud page</Link> offers a template when it creates an
        instance: the repository is created from it in your account in the same click and wired to the instance, so
        the instance deploys from a repository of your own and its plugins are commits. The same for an instance you
        already have, from its card.
      </p>
      <p>
        Taking a template does not tie you to it. What you get is a repository, and from there it is an ordinary
        project: <Link href="/docs/run/standalone">run it locally</Link>,{" "}
        <Link href="/docs/run/npm">make instances of it</Link>, or{" "}
        <Link href="/docs/deploy/pipeline">deploy it from a push</Link>.
      </p>

      <h2>The listing</h2>
      <p>
        One listing serves all three ways: <code>registry/templates.json</code> in{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-marketplace" target="_blank" rel="noreferrer noopener">
          the marketplace's repository
        </a>
        , served to the CLI as the <code>templates</code> of the registry index, each entry a pointer at a repository
        with a title, a summary and the commit the audit read. A marketplace only lists templates; the repository is
        what you start from. The three listed first are real projects serving real traffic: the public demo as a
        voidbase project, and this site and the marketplace itself as stack apps.
      </p>

      <h2>What makes one worth publishing</h2>
      <p>
        A template is not a snippet and not a tutorial. Someone copies it, runs one command, and sees something
        working; anything short of that costs them more than starting fresh would.
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
        repository settings. Without it, <em>Use this template</em> does nothing; the CLI downloads the tarball and
        does not need it.
      </p>
    </>
  );
}
