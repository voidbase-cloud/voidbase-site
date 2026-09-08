// pb_data: everything a running instance owns.
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const TYPES = hl.javascript`/// <reference path="../pb_data/types.d.ts" />`;


const TREE = hl.bash`pb_data/
├─ data.db                    the database: your collections and their records
├─ storage/                   uploaded files, by collection and record
├─ types.d.ts                 generated: what makes hook editing autocomplete
└─ .superuser-credentials     only when a password was generated for you`;

const BACKUP = hl.bash`# locally: stop the server, copy the directory
cp -r pb_data pb_data.backup-$(date +%F)`;

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
        one. That is the one to use for an instance anyone depends on.
      </p>
      <p>To take a copy of a deployed instance onto your machine, database, collections and files together:</p>
      <CodeBlock {...EXPORT} />

      <h2>On Cloudflare it is not used</h2>
      <p>
        A deployed instance has no filesystem. The database is Cloudflare's own SQL database and the uploaded files
        are in object storage, both created for the instance on its first deploy and both belonging to your account.
        The same code reaches them the same way, which is why a hook that works locally works deployed.
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
