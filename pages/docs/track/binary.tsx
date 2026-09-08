// Tracking an instance without adding npm to it.
//
// The same three steps as the project page, minus the parts that only exist because of node_modules. Worth its own
// page because the ending is different: no Cloudflare, so the deploy is a directory arriving on a server.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import TrackFrom from "@/components/TrackFrom";

const INIT = hl.bash`mkdir blog-api && cd blog-api
cp ~/Downloads/voidbase .          # the executable you already downloaded
./voidbase init`;

const EXPORT = hl.bash`./voidbase export ./snapshot --url http://127.0.0.1:8090 --admin you@example.com:your-password`;

const IMPORT = hl.bash`./voidbase import ./snapshot/collections.json`;

const IGNORE = hl.gitignore`pb_data/
pb_secrets/secrets.json
voidbase`;

const RUN = hl.bash`./voidbase serve --dev`;

export default function DocsTrackBinary() {
  return (
    <>
      <h1>Into a directory the binary serves</h1>
      <p className="docs-lead">
        Put what defines your instance into git and keep running it with the executable you already have. Nothing is
        installed, and nothing here reaches Cloudflare, which is the trade this page makes.
      </p>

      <TrackFrom />

      <h2>Make the directory</h2>
      <p>
        <code>init</code> writes the three directories the server reads. The executable has the command, so this
        needs no toolchain.
      </p>
      <CodeBlock {...INIT} />

      <h2>Take the collections out, and put them back</h2>
      <p>Export against the instance you already have, then import into the one this directory defines.</p>
      <CodeBlock {...EXPORT} />
      <CodeBlock {...IMPORT} />
      <p>
        The snapshot also holds the records and the uploaded files. Those are data and stay out of the repository;{" "}
        <Link href="/docs/deploy/tracked">what git tracks</Link> is the rule, and it is the same rule here.
      </p>

      <h2>Ignore the three things that must not be committed</h2>
      <CodeBlock {...IGNORE} />
      <p>
        The database and the uploads are in <code>pb_data/</code>, the values of your configuration are in{" "}
        <code>pb_secrets/secrets.json</code>, and the executable is a build artifact that a colleague downloads for
        their own platform rather than takes from yours.
      </p>

      <h2>Run it from the directory</h2>
      <CodeBlock {...RUN} />
      <p>
        <code>--dev</code> restarts when a hook or a migration changes, so editing a tracked file is the loop.
      </p>

      <h2>What you give up, and what you can do about it</h2>
      <p>
        Deploying to Cloudflare needs the npm package, because it runs Void and wrangler out of node_modules. This
        directory cannot do it, so the deploy is yours: the same directory on a server, and the executable started
        by a unit file. <Link href="/docs/run/standalone">The standalone page</Link> has the unit, and{" "}
        <Link href="/docs/cicd/binary">the pipeline for this shape</Link> is a job that moves the directory and
        restarts the service.
      </p>
      <p>
        If Cloudflare is what you wanted, this directory is already most of{" "}
        <Link href="/docs/track/project">a voidbase project</Link>: add a package.json with the dependency and the
        same three directories keep working.
      </p>
    </>
  );
}
