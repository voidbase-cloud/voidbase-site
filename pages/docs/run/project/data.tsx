// pb_data: everything a running instance owns.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TYPES = hl.javascript`/// <reference path="../pb_data/types.d.ts" />`;


const TREE = hl.markdown`Inside \`pb_data/\`:

- \`data.db\`: the database, meaning your collections and their records
- \`storage/\`: uploaded files, by collection and record
- \`types.d.ts\`: generated, and what makes hook editing autocomplete
- \`.superuser-credentials\`: only when a password was generated for you
`;

const BACKUP = hl.bash`# locally: stop the server, copy the directory
cp -r pb_data pb_data.backup-$(date +%F)`;

const MIGRATE = hl.bash`voidbase migrate https://blog-api.example.workers.dev http://127.0.0.1:8090 \\
  --from-email you@example.com --from-password ... --to-email you@example.com --to-password ...`;

const EXPORT = hl.bash`voidbase export ./snapshot --url https://blog-api.example.workers.dev --admin you@example.com:your-password`;

export default function DocsProjectData() {
  return (
    <>
      <h1>pb_data</h1>
      <p className="docs-lead">
        Everything a running instance owns, in one directory. It is created on the first run, it is git-ignored, and
        it is the thing to copy when you want to copy an instance.
      </p>

      <CodeBlock {...TREE} />

      <h2>The generated typings</h2>
      <p>
        <code>types.d.ts</code> is written on startup and describes every global a hook can use. The reference
        comment at the top of a hook file points at it:
      </p>
      <CodeBlock {...TYPES} />
      <p>
        That single line is what turns <a href="/docs/run/project/hooks">pb_hooks</a> from untyped scripting into
        something an editor can complete and check. Run the server once before writing hooks so the file exists.
      </p>

      <h2>Backing it up</h2>
      <p>Locally, it is a directory:</p>
      <CodeBlock {...BACKUP} />
      <p>
        The admin panel's Backups screen does the same thing properly, on demand or on a schedule, and can restore
        one. That is the one to use for an instance anyone depends on. An archive is verified after it is written,
        <code>VOIDBASE_BACKUP_KEEP</code> says how many scheduled ones to keep, and <code>VOIDBASE_BACKUP_S3_*</code>{" "}
        copies each one to a bucket outside the account. <code>voidbase update --backup</code> zips the directory
        before the executable replaces itself.
       A restore reads the archive as one stream and loads it in
        batches, so an archive larger than the instance's memory still goes back in.
      </p>
      <p>
        To bring a deployed instance's data onto your machine, or send yours up, <code>migrate</code> takes a backup
        on one side and restores it on the other; the target becomes the source:
      </p>
      <CodeBlock {...MIGRATE} />
      <p>
        For a copy on disk rather than a running target, <code>export</code> writes the database, the collections
        and the files into a directory, reading only through the API:
      </p>
      <CodeBlock {...EXPORT} />

      <h2>On Cloudflare it is not used</h2>
      <p>
        A deployed instance has no filesystem. The database is a D1 database, or with <code>--database durable</code>{" "}
        a SQLite-backed Durable Object of its own, the uploaded files are in an R2 bucket, and the backups are in
        that bucket under <code>__backups__/</code>, all created for the instance on its first deploy and all
        belonging to your account. The same code reaches them the same way, which is why a hook that works locally
        works deployed.
      </p>

      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            Do not commit <code>pb_data/</code>. It holds real data, and on a shared repository it holds someone
            else's. <code>voidbase init</code> ignores it for you.
          </p>
        </div>
      </div>
    </>
  );
}
