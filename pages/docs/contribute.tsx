// How to help, for the two kinds of person who arrive here: someone who spotted a mistake on a page, and someone
// who could actually move the project. The first needs one link and no ceremony. The second needs to know which of
// the things we cannot do ourselves would help most, which is why the benchmarking section comes before the code.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { SITE } from "@/lib/env";

const SETUP = hl.bash`git clone https://github.com/voidbase-cloud/voidbase.git
cd voidbase
bun install          # also installs the git hooks
bun run check        # codegen and three typecheck passes
bun test             # the unit tests, about a second`;

const SITE_SETUP = hl.bash`git clone https://github.com/voidbase-cloud/voidbase-site.git
cd voidbase-site
bun install
bun run dev          # the site at http://127.0.0.1:5173`;

export default function DocsContribute() {
  return (
    <>
      <h1>How to contribute</h1>
      <p className="docs-lead">
        voidbase is in public beta and is built in the open. The API is PocketBase's and is not moving; everything
        around it is 0.x and is. If you know backends, or Cloudflare, or just found a page here that is wrong, there
        is something useful you can do in the next ten minutes. If you would rather talk to someone first, we are
        on <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a>.
      </p>

      <h2>The smallest thing first</h2>
      <p>
        Every page in these docs has an <strong>Improve this page</strong> card at the bottom. It opens that page's
        source file in GitHub's editor, forks the repository for you if you do not have one, and turns your change
        into a pull request without you leaving the browser. Typos, a command that does not work, a paragraph that
        assumes something you did not have: all of that is welcome and none of it needs a discussion first.
      </p>

      <h2>What would help most</h2>

      <h3>Benchmarks, honestly run</h3>
      <p>
        The <Link href="/docs/why">comparison pages</Link> carry performance numbers that we label as guesses,
        because that is what they are. We are not qualified to benchmark a database engine and we would rather say so
        than publish a number we cannot defend. If you have done this work before, a methodology is worth more to us
        than a result, and a single honestly-run figure against one competitor is worth more than either. Start a
        discussion before you spend a weekend on it, so we can agree what is being measured.
      </p>

      <h3>Cloudflare, from production</h3>
      <p>
        D1's limits, Durable Object placement, how Workers CPU time is actually accounted, R2 lifecycle behaviour.
        Several of our design decisions rest on assumptions we have not been able to test at the scale where they
        would break. If you have run this in anger and we are wrong somewhere, that is the most valuable thing you
        can tell us.
      </p>

      <h3>Where we do not match PocketBase</h3>
      <p>
        Compatibility is the whole premise, so a case where we diverge and have not written it down is a real bug.{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/docs/differences.md" target="_blank" rel="noreferrer noopener">
          The differences page
        </a>{" "}
        is what we know about. A failing test that proves something is missing from it is a good report, and a better
        pull request.
      </p>

      <h3>Something on the roadmap</h3>
      <p>
        <Link href="/docs/roadmap">Every item</Link> has a design and a rough size against it. Say which one you are
        taking in an issue before you start, because some of them are larger than they look and a few depend on
        each other.
      </p>

      <h3>A logo, if you draw</h3>
      <p>
        The mark at the top of this page is an open ring with a dot crossing the gap. A model produced it in one
        attempt, nobody iterated on it, and it has stayed because it was good enough and there was nothing else. It
        is 379 bytes of hand-checkable SVG, which is the nicest thing that can be said about it.
      </p>
      <p>
        We would replace it with something better and we cannot pay for one. There is no revenue here and{" "}
        <Link href="/docs/pricing">the pricing page</Link> explains why there is unlikely to be any soon, so
        commissioning a designer is not a thing we can honestly do. That leaves asking, which is what this is.
      </p>
      <p>
        What it has to survive: 16 pixels as a favicon, one colour, light and dark backgrounds, and being small
        enough to inline. If you make one and we use it, it ships under the project's licence and you are credited
        on <Link href="/docs/acknowledgments">the acknowledgments page</Link>. Nothing is owed either way, and we
        would rather say that plainly than have someone spend a weekend on a maybe.
      </p>
      <p>
        Show it in <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a> or open an issue.
        A sketch is enough to start a conversation; it does not need to be finished.
      </p>

      <h2>Working on voidbase</h2>
      <CodeBlock {...SETUP} />
      <p>
        <code>bun run dev</code> starts the dev server, and <code>bun run ci</code> runs the suite the way CI does,
        working out which parts your change affects rather than running all of it. Commits follow{" "}
        <a href="https://www.conventionalcommits.org" target="_blank" rel="noreferrer noopener">Conventional Commits</a>,
        which the git hooks and CI both enforce, because every commit message is a release note in waiting. The
        full guide is{" "}
        <a href="https://github.com/voidbase-cloud/voidbase/blob/master/CONTRIBUTING.md" target="_blank" rel="noreferrer noopener">
          CONTRIBUTING.md
        </a>
        .
      </p>

      <h2>Working on this site</h2>
      <CodeBlock {...SITE_SETUP} />
      <p>
        The site and these documentation pages are a separate repository,{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-site" target="_blank" rel="noreferrer noopener">
          voidbase-cloud/voidbase-site
        </a>
        . Every page is one file under <code>pages/</code>, so the URL tells you where it lives:{" "}
        <code>/docs/run/npm</code> is <code>pages/docs/run/npm.tsx</code>. Its{" "}
        <a href="https://github.com/voidbase-cloud/voidbase-site/blob/master/CONTRIBUTING.md" target="_blank" rel="noreferrer noopener">
          contributing guide
        </a>{" "}
        covers the rest, including how the pages are written.
      </p>

      <h2>Where to talk</h2>
      <ul>
        <li>
          <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a> if you want an answer the
          same day, or you are part way through something and stuck. It is the fastest of these and the least
          formal.
        </li>
        <li>
          <a href={SITE.discussionsUrl} target="_blank" rel="noreferrer noopener">Discussions</a> for questions,
          ideas, and anything you are not sure is a bug yet. Slower than Discord and easier for the next person to
          find, which is why proposals belong here rather than in a chat scroll.
        </li>
        <li>
          <a href="https://github.com/voidbase-cloud/voidbase/issues" target="_blank" rel="noreferrer noopener">Issues</a>{" "}
          for bugs, with the version from <code>voidbase version</code>, how you are running it, and the smallest
          thing that reproduces it.
        </li>
        <li>
          Security problems go through GitHub's private vulnerability reporting on the repository, never a public
          issue.
        </li>
      </ul>

      <p>
        One last thing worth saying plainly: this is a beta and we would rather hear that something is wrong than
        find out later that people worked around it quietly.
      </p>
    </>
  );
}
