// Turning a running instance into a voidbase project.
//
// The commands are the same for all three destinations and the differences are small, so this page carries the
// whole operation and its two siblings say only what changes. Whichever you came from, the job is: get the
// collections out, put them beside a scaffolded directory, point the instance at it.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import TrackFrom from "@/components/TrackFrom";

const INIT = hl.bash`mkdir blog-api && cd blog-api
bunx @voidbase-cloud/voidbase init          # or: npx @voidbase-cloud/voidbase init
bun install`;

const EXPORT = hl.bash`voidbase export ./snapshot --url https://blog-api.example.workers.dev --admin you@example.com:your-password`;

const SNAPSHOT = hl.markdown`Inside \`snapshot/\`:

- \`collections.json\`: every collection, field and API rule
- \`records/\`: one file per collection, with the rows
- \`storage/\`: the uploaded files
`;

const MIGRATION = hl.bash`voidbase import ./snapshot/collections.json`;

const RUN = hl.bash`voidbase serve --dev`;

const SYNC = hl.bash`git init && git add . && git commit -m "the backend"
voidbase sync --repo you/blog-api`;

export default function DocsTrackProject() {
  return (
    <>
      <h1>Into a voidbase project</h1>
      <p className="docs-lead">
        You have an instance running with collections you made in the admin panel, and you want those collections in
        a repository. This is the destination to pick if you want it on your own Cloudflare account, because the npm
        layout is the one that can deploy there.
      </p>

      <TrackFrom />

      <h2>Make the directory</h2>
      <p>
        A project is a directory with three tracked subdirectories and a package.json. <code>init</code> writes them
        into an empty directory.
      </p>
      <CodeBlock {...INIT} />
      <p>
        What each one holds is <Link href="/docs/run/project">on the project page</Link>, and one page per directory
        is in <Link href="/docs/run/project/hooks">the reference</Link>.
      </p>

      <h2>Take the collections out of the instance</h2>
      <p>
        Export writes the schema, the records and the uploaded files to a directory. Point it at whichever instance
        you have running and give it a superuser.
      </p>
      <CodeBlock {...EXPORT} />
      <CodeBlock {...SNAPSHOT} />
      <p>
        Only the first of those is part of the repository. The records and the files are data, and data belongs in
        the instance, not in git. <Link href="/docs/deploy/tracked">What git tracks</Link> is the whole rule.
      </p>

      <h2>Put them back as something tracked</h2>
      <p>
        Import applies a collections file to an instance. Run it against the project you just scaffolded and the
        schema you designed by clicking becomes the schema the repository defines.
      </p>
      <CodeBlock {...MIGRATION} />
      <p>
        From here the panel is no longer where the schema changes. Edit{" "}
        <Link href="/docs/run/project/migrations">pb_migrations</Link> and the next start applies it, which is what
        makes the change reviewable.
      </p>

      <h2>Check it, then connect the repository</h2>
      <CodeBlock {...RUN} />
      <p>
        The API is on 8090 and the panel is at <code>/_/</code>, both reading the directory you are looking at. When
        the collections match what you exported, commit and connect it.
      </p>
      <CodeBlock {...SYNC} />
      <p>
        That deploys once and wires the repository to Cloudflare Workers Builds, so every later push is the deploy.{" "}
        <Link href="/docs/deploy/pipeline">How a push becomes a deploy</Link> covers the tokens it needs, and{" "}
        <Link href="/docs/cicd/project">the project pipeline</Link> covers preview instances and what the build is
        allowed to read.
      </p>

      <h2>The old instance</h2>
      <p>
        Nothing here touched it. It is still running and still holds the records, which is deliberate: you can point
        an application at the new one, compare them, and delete the old one when you are satisfied.
      </p>
      <p>
        Deleting depends on where it was. A directory you can remove, a CLI instance goes with{" "}
        <code>voidbase local rm</code>, and one on Cloudflare goes with <code>voidbase destroy</code>, which takes
        the Worker, the database, the bucket and the domains with it.
      </p>
    </>
  );
}
