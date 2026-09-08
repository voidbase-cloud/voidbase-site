// Folding a running instance into a Void application.
//
// The one destination where the instance stops being a separate thing: the site and the backend become one Worker,
// which is a bigger decision than the other two and is why this page leads with it rather than with commands.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import TrackFrom from "@/components/TrackFrom";

const SCAFFOLD = hl.bash`bunx void init my-app
cd my-app
bun add @voidbase-cloud/voidbase`;

const EXPORT = hl.bash`bunx @voidbase-cloud/voidbase export ./snapshot --url https://blog-api.example.workers.dev --admin you@example.com:your-password`;

const MIGRATION = hl.bash`bunx @voidbase-cloud/voidbase import ./snapshot/collections.json --url http://127.0.0.1:5180`;

const BUILD = hl.bash`bun run build                        # vite build, which runs the adapter
bunx @voidbase-cloud/voidbase sync --repo you/my-app`;

export default function DocsTrackStack() {
  return (
    <>
      <h1>Into a voidbase stack</h1>
      <p className="docs-lead">
        Your instance becomes part of an application rather than a service beside it. The site, the typed routes and
        the collections live in one repository and deploy as one Worker.
      </p>

      <h2>Whether you want this</h2>
      <p>
        Pick it if the frontend does not exist yet, or exists and you are willing to move it. The site and the
        backend ship together after this, which means one deploy, one address and no CORS, and it also means a
        voidbase upgrade and your own application go live in the same artifact.
      </p>
      <p>
        If your frontend is already built and deployed somewhere you are happy with,{" "}
        <Link href="/docs/track/project">a voidbase project</Link> is the smaller change and keeps the two apart.
      </p>

      <TrackFrom />

      <h2>Start the application</h2>
      <p>
        A stack is a Void app with the voidbase adapter added. <Link href="/docs/run/stack">Start a stack app</Link>{" "}
        covers the layout; this is the short version.
      </p>
      <CodeBlock {...SCAFFOLD} />

      <h2>Bring the collections across</h2>
      <p>Export from the instance you have, then import into the one the dev server is running.</p>
      <CodeBlock {...EXPORT} />
      <CodeBlock {...MIGRATION} />
      <p>
        Write them into <Link href="/docs/run/stack/migrations">vb_migrations</Link> once they are what you want, so
        a fresh checkout builds the same collections rather than needing the import again.
      </p>

      <h2>Build and connect</h2>
      <CodeBlock {...BUILD} />
      <p>
        The build runs the adapter, which turns the Void app into an instance under <code>.voidbase/</code>, and sync
        deploys it and wires the repository.{" "}
        <Link href="/docs/cicd/stack">The stack pipeline</Link> covers what shipping both halves at once changes
        about CI.
      </p>

      <h2>Two things that move</h2>
      <p>
        <strong>Hooks become TypeScript.</strong> A project's hooks run in the server's JavaScript runtime; a
        stack's are <Link href="/docs/run/stack/hooks">vb_hooks</Link>, one per file, typed and bundled by the
        build.
      </p>
      <p>
        <strong>Configuration is declared once.</strong>{" "}
        <Link href="/docs/run/stack/secrets">vb_secrets</Link> serves the server, the build and the browser from one
        declaration, and says which of the three each key is allowed to reach.
      </p>
    </>
  );
}
