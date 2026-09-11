// Turning a running instance into a voidbase project.
//
// The commands are the same for all three destinations and the differences are small, so this page carries the
// whole operation and its two siblings say only what changes. Whichever you came from, the job is: get the
// collections out, put them beside a scaffolded directory, write them down as a migration, point the instance at it.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import TrackFrom from "@/components/TrackFrom";

const INIT = hl.bash`mkdir blog-api && cd blog-api
bunx @voidbase-cloud/voidbase init          # or: npx @voidbase-cloud/voidbase init
bun install`;

const EXPORT = hl.bash`voidbase export ./snapshot --url https://blog-api.example.workers.dev --admin you@example.com:your-password`;

const SNAPSHOT = hl.markdown`Inside \`snapshot/\`:

- \`collections.json\`: every collection, field and API rule, in PocketBase's import format
- \`data.db\`: the rows, as SQLite, one table per collection
- \`storage/\`: the uploaded files, as \`{collectionId}/{recordId}/{filename}\`
`;

const RUN = hl.bash`voidbase serve --dev`;

const IMPORT = hl.bash`voidbase import ./snapshot/collections.json --url http://127.0.0.1:8090 --admin you@example.com:your-password`;

const MIGRATION = hl.javascript`// pb_migrations/1757500000_collections.js
migrate((app) => {
  app.importCollections([
    // the contents of snapshot/collections.json
  ], false);
});`;

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
        Export writes the schema, the rows and the uploaded files to a directory. Point it at whichever instance you
        have running and give it a superuser.
      </p>
      <CodeBlock {...EXPORT} />
      <CodeBlock {...SNAPSHOT} />
      <p>
        Only the first of those is part of the repository. The rows and the files are data, and data belongs in the
        instance, not in git. <Link href="/docs/deploy/tracked">What git tracks</Link> is the whole rule.
      </p>

      <h2>Put them back as something tracked</h2>
      <p>
        Start the project's instance, then import the collections into it. Import applies a collections file to a
        running instance, so it needs the address and a superuser; the API is on 8090 and the panel is at{" "}
        <code>/_/</code>, both reading the directory you are looking at.
      </p>
      <CodeBlock {...RUN} />
      <CodeBlock {...IMPORT} />
      <p>
        That gets the schema into this instance's database, and no further. The repository defines a schema through{" "}
        <Link href="/docs/run/project/migrations">pb_migrations</Link>, so write the export down as one: a migration
        can apply a collections list directly, and a fresh clone or a deploy then builds the same collections without
        the import.
      </p>
      <CodeBlock {...MIGRATION} />
      <p>
        From here the panel is no longer where the schema changes. Edit the migrations and the next start applies
        them, which is what makes the change reviewable. <code>--dev</code> restarts when a hook or a migration
        changes.
      </p>

      <h2>Check it, then connect the repository</h2>
      <p>When the collections match what you exported, commit and connect it.</p>
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
        an application at the new one, compare them, and delete the old one when you are satisfied. To move the rows
        and files across as well, <code>voidbase migrate &lt;from-url&gt; &lt;to-url&gt;</code> takes a backup on one
        side and restores it on the other, in either direction.
      </p>
      <p>
        Deleting depends on where it was. A directory you can remove, a CLI instance goes with{" "}
        <code>voidbase local rm</code>, and one on Cloudflare goes with <code>voidbase destroy</code>, which takes
        the Worker, the database, the bucket, the queue and the domains with it.
      </p>
    </>
  );
}
