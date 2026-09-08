// CI for the stack, where one artifact holds two things people usually deploy separately.
//
// Everything the project pipeline says still applies. What this page is for is the consequence of shipping the site
// and the backend together, which is the thing that surprises people: a voidbase upgrade is now a frontend deploy.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const BUILD = hl.bash`bun run build                        # vite build, and the adapter writes .voidbase/
bunx @voidbase-cloud/voidbase sync   # deploy what the build produced`;

const LOOK = hl.bash`bun run build
bun run preview                      # the built Worker, locally, on 5181`;

const SPLIT = hl.bash`bunx @voidbase-cloud/voidbase deploy --name my-app-preview`;

export default function DocsCicdStack() {
  return (
    <>
      <h1>A pipeline for a voidbase stack</h1>
      <p className="docs-lead">
        Everything on <Link href="/docs/cicd/project">the project pipeline</Link> applies here too. What is
        different is that one build produces one artifact holding the site and the backend, and both go live
        together.
      </p>

      <h2>Build first, then deploy what the build made</h2>
      <p>
        A project deploys its directories. A stack deploys the output of a build: the adapter turns the Void
        application into an instance under <code>.voidbase/</code>, and that is what ships.
      </p>
      <CodeBlock {...BUILD} />
      <p>
        So the pipeline has a real build step that can fail on its own, before anything is deployed. A type error in
        a page stops the backend from shipping, which is either exactly what you want or an argument for{" "}
        <Link href="/docs/track/project">keeping the two apart</Link>.
      </p>

      <h2>Look at it before it goes</h2>
      <CodeBlock {...LOOK} />
      <p>
        Preview runs the built Worker locally rather than the dev server, so it is the artifact the deploy would
        send. Worth a step in CI on its own: it catches the things that only exist after a build, like a route that
        works in dev and was not included.
      </p>

      <h2>The upgrade is now a frontend deploy</h2>
      <p>
        In a project, upgrading voidbase changes the backend and leaves your site alone. Here they are one Worker,
        so a voidbase upgrade rebuilds and redeploys the site as well.
      </p>
      <p>
        Nothing about that is dangerous, and it is worth knowing before an upgrade lands on a Friday. Build it
        locally and open it first. The dependency is in package.json like any other, so the upgrade is a pull
        request and the pipeline treats it as one.
      </p>

      <h2>A preview that includes the site</h2>
      <CodeBlock {...SPLIT} />
      <p>
        A branch instance for a stack gives you a whole application at its own address, site included, which is a
        better review than a diff. It starts with an empty database like any other instance, so seed it if the pages
        need rows to render.
      </p>
      <p>
        Delete it with <code>voidbase destroy</code> when the branch closes. The same warning as the project page
        applies: previews spend the same Cloudflare allowance as production, because the free plan is per account.
      </p>
    </>
  );
}
