// "Start from a template", on the two pages where starting from one makes sense.
//
// Three routes, and only the first works today: GitHub's own button, our marketplace, and someone else's registry.
// The section says which is which rather than presenting three equal options.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const SCRATCH: Record<"project" | "stack", ReturnType<typeof hl.bash>> = {
  project: hl.bash`voidbase init blog-api && cd blog-api`,
  stack: hl.bash`bun add void && bunx void init && bun add @voidbase-cloud/voidbase`,
};

const PROPOSED = hl.bash`voidbase init blog-api --template voidbase-cloud/voidbase-site
voidbase init blog-api --template blog-with-comments   # by listed name
voidbase init blog-api --template acme/internal-starter --registry https://templates.acme.internal`;

export default function StartFromTemplate({ shape }: { shape: "project" | "stack" }) {
  const what = shape === "project" ? "a voidbase project" : "a stack app";
  return (
    <section className="from-template">
      <h2>Starting from a template</h2>
      <p>
        Everything above starts from nothing, which is the right way to learn what the pieces are and the slow way to
        get something running. A template is somebody's working {what} that you copy into your own account and change.
      </p>

      <h3>From GitHub, which works today</h3>
      <p>
        Every template in <Link href="/docs/marketplace">the marketplace</Link> is a public repository with GitHub's{" "}
        <em>Use this template</em> switched on. Open it, press the button, and you have your own copy with its whole
        history left behind. That is the entire mechanism and it is GitHub's, not ours, which is why it is the one
        that works.
      </p>
      <p>
        {shape === "project" ? (
          <>
            <a href="https://github.com/voidbase-cloud/voidbase-demo" target="_blank" rel="noreferrer noopener">
              voidbase-demo
            </a>{" "}
            is the one to copy for this shape: PocketBase's layout, a seeded schema, hooks, and nothing else.
          </>
        ) : (
          <>
            <a href="https://github.com/voidbase-cloud/voidbase-site" target="_blank" rel="noreferrer noopener">
              voidbase-site
            </a>{" "}
            and{" "}
            <a href="https://github.com/voidbase-cloud/voidbase-marketplace" target="_blank" rel="noreferrer noopener">
              voidbase-marketplace
            </a>{" "}
            are both stack apps serving real traffic, which makes them honest starting points rather than demos
            written to look good.
          </>
        )}
      </p>

      <h3>
        From the CLI <span className="label label-warning">Not built yet</span>
      </h3>
      <p>
        Cloning through a browser is fine once and tedious after that, so <code>init</code> should be able to take a
        template directly, from our marketplace or from a registry of your own. This is a proposal, not a command
        that exists.
      </p>
      <CodeBlock {...PROPOSED} />
      <p className="txt-hint">
        Until it lands, the command that does exist starts from nothing:
      </p>
      <CodeBlock {...SCRATCH[shape]} />
      <p>
        Publishing your own is <Link href="/docs/marketplace/templates">a GitHub issue</Link>, and{" "}
        <Link href="/docs/templates">what makes a template worth listing</Link> is its own page.
      </p>
    </section>
  );
}
