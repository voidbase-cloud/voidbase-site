// CI for the shape that has no vendor in it.
//
// The other two pipelines end at Cloudflare, which does the deploy. This one ends at a server you own, so the last
// step is yours and this page says so rather than inventing a transport. What it can be exact about is the half
// that is voidbase's: what to check, and what must never be in the artifact.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const CHECK = hl.yaml`name: check
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: get the executable
        run: |
          VERSION=0.9.0-beta.1
          curl -sLO https://github.com/voidbase-cloud/voidbase/releases/download/v\${VERSION}/voidbase_\${VERSION}_linux_amd64.zip
          unzip -q voidbase_\${VERSION}_linux_amd64.zip && chmod +x voidbase
      - name: the migrations apply to an empty database
        run: |
          ./voidbase serve --dir /tmp/check &
          sleep 3
          curl -fsS http://127.0.0.1:8090/api/health`;

const SECRETS = hl.bash`voidbase secrets                     # what is declared, and what has a value here`;

const ARTIFACT = hl.gitignore`pb_data/
pb_secrets/secrets.json
voidbase`;

export default function DocsCicdBinary() {
  return (
    <>
      <h1>A pipeline for a directory the binary serves</h1>
      <p className="docs-lead">
        There is no Cloudflare in this one, so nothing external does the deploy. A push checks the directory, and
        moving it to your server is a step you own.
      </p>

      <h2>What CI can check</h2>
      <p>
        The useful check is that a fresh start works: the executable, an empty data directory and your migrations,
        with nothing carried over from your machine. A migration that only applies to your laptop's database is the
        failure this catches, and it is the common one.
      </p>
      <CodeBlock {...CHECK} />
      <p>
        Pin the version rather than tracking the latest release, so a new voidbase does not change what a green
        build means. <Link href="/docs/deploy/pipeline">The common pipeline page</Link> makes the same argument for
        the other shapes.
      </p>

      <h2>What goes to the server</h2>
      <p>
        The three tracked directories and an executable for the server's platform. Not your database, not your
        configuration values, and not the executable from your own machine unless the platforms match.
      </p>
      <CodeBlock {...ARTIFACT} />
      <p>
        How it gets there is yours: rsync over ssh, a container image, a package. voidbase has no opinion and this
        page will not pretend to, because a transport we have not tested is worse than none. What matters is the
        order on the far side: put the new directory in place, then restart the service, so the server never reads
        half of one version and half of another.
      </p>

      <h2>Configuration on the far side</h2>
      <p>
        The values live on the server, never in the repository.{" "}
        <Link href="/docs/run/project/secrets">pb_secrets</Link> declares which keys exist and who may read them,
        and the file holding the values is git-ignored. On the server that file is written once, by hand or by
        whatever holds your secrets.
      </p>
      <CodeBlock {...SECRETS} />
      <p>
        Run that on the server after a deploy and it prints what is declared and what is missing, which is the
        cheapest way to catch a key that was added in the repository and never given a value.
      </p>

      <h2>Backups are not the pipeline's job, but nothing else is doing them</h2>
      <p>
        The database is a file in <code>pb_data/</code> on that one machine. Nothing in this shape replicates it,
        which is the cost of having no vendor in the loop. Copy the directory on a schedule, off the box.
      </p>
      <p>
        If that sentence is the one that changes your mind,{" "}
        <Link href="/docs/track/project">a voidbase project</Link> puts the database on Cloudflare's D1 and the
        files in R2, and the pipeline becomes theirs to run.
      </p>
    </>
  );
}
