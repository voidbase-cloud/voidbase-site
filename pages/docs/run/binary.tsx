// The tracked directory without npm.
//
// It sat between two pages that both exist: the standalone page runs the executable and tracks nothing, and the
// project page tracks everything and needs node_modules. This is the middle, and it is a real shape because the
// executable has init, serve, import and export built in.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import Updating from "@/components/Updating";
import { hl } from "@/lib/hl";
import "@/scss/updating.scss";

const INIT = hl.bash`mkdir blog-api && cd blog-api
cp ~/Downloads/voidbase .
./voidbase init
./voidbase superuser upsert you@example.com your-password`;

const TREE = hl.markdown`Inside \`blog-api/\`:

- \`pb_hooks/\`: endpoints, event handlers and scheduled work, in JavaScript
- \`pb_migrations/\`: the collections, as code, applied once and in order
- \`pb_secrets/\`: what configuration exists and who may read it
- \`pb_data/\`: the database and the uploads, git-ignored
- \`.gitignore\`
`;

const RUN = hl.bash`./voidbase serve --dev`;

const HOOK = hl.javascript`/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/hello", (e) => e.json(200, { hello: "world" }));`;

const UPDATE = hl.bash`./voidbase update --backup`;

export default function DocsRunBinary() {
  return (
    <>
      <h1>A directory the binary serves</h1>
      <p className="docs-lead">
        The hooks, the schema and the configuration in git, served by the one file you downloaded. Nothing is
        installed and nothing is built, which is the whole point of this shape and also its limit: it does not reach
        Cloudflare.
      </p>

      <h2>Whether this is the one you want</h2>
      <p>
        Take it if you run your own server and want the backend reviewable. A colleague clones the repository,
        downloads the executable for their platform, and has the same collections and the same endpoints.
      </p>
      <p>
        Take <Link href="/docs/run/project">a voidbase project</Link> instead if you want it on Cloudflare. It is
        the same three directories with a package.json beside them, because deploying runs Void and wrangler out of
        node_modules and the executable has neither.
      </p>

      <h2>Start it</h2>
      <p>
        <Link href="/docs/run/standalone">Download the executable</Link> first if you have not. Then scaffold beside
        it.
      </p>
      <CodeBlock {...INIT} />
      <CodeBlock {...TREE} />

      <h2>The loop</h2>
      <CodeBlock {...RUN} />
      <p>
        The API is on 8090 and the panel is at <code>/_/</code>. With <code>--dev</code> the server restarts when a
        hook or a migration changes, so editing a tracked file is the whole loop.
      </p>
      <CodeBlock {...HOOK} />
      <p>
        Save that as <code>pb_hooks/hello.pb.js</code> and the endpoint is live. What else hooks can do is in{" "}
        <Link href="/docs/run/project/hooks">the pb_hooks reference</Link>, and the schema is in{" "}
        <Link href="/docs/run/project/migrations">pb_migrations</Link>. Both apply here unchanged: the directories
        are the same ones, and only the toolchain around them is missing.
      </p>

      <h2>Getting it onto a server</h2>
      <p>
        Copy the directory, put the executable beside it, and run it under a service manager.{" "}
        <Link href="/docs/run/standalone">The standalone page</Link> has a systemd unit that does this, and{" "}
        <Link href="/docs/cicd/binary">the pipeline for this shape</Link> turns the copy into something a push does.
      </p>
      <p>
        The data does not travel with the repository. A first deploy starts with an empty database and applies your
        migrations; moving existing records is <code>voidbase export</code> on one side and{" "}
        <code>voidbase import</code> on the other.
      </p>

      <Updating command={UPDATE}>
        <p>
          It replaces the executable in place and keeps <code>pb_data/</code> untouched. The tracked directories are
          yours and are never rewritten, so an upgrade is one file changing and nothing in the repository moving.
        </p>
      </Updating>

      <h2>When this stops being enough</h2>
      <p>
        The moment you want Cloudflare, or a package from npm inside a hook, or the site and the backend in one
        deploy. The first two are <Link href="/docs/track/project">a voidbase project</Link> and the third is{" "}
        <Link href="/docs/track/stack">a stack</Link>. Both keep the directories you already have.
      </p>
    </>
  );
}
