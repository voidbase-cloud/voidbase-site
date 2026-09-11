// CI for the shape that has no vendor in it.
//
// The other two pipelines end at Cloudflare, which does the deploy. This one ends at a server you own, so the last
// step is yours and this page says so rather than inventing a transport. What it can be exact about is the half
// that is voidbase's: what to check, and what must never be in the artifact.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";

const CHECK = hl.bash`# in the checkout, on any CI runner
VERSION=0.9.0-beta.35
curl -sLO https://github.com/voidbase-cloud/voidbase/releases/download/v\${VERSION}/voidbase_\${VERSION}_linux_amd64.zip
unzip -q voidbase_\${VERSION}_linux_amd64.zip && chmod +x voidbase

# the migrations apply to an empty database
./voidbase serve --dir /tmp/check &
sleep 3
curl -fsS http://127.0.0.1:8090/api/health`;

const UPDATE = hl.bash`./voidbase update --check            # exits 1 when a newer release is out, 2 when it could not find out`;

const SECRETS = hl.bash`./voidbase secrets                   # what is declared, and what has a value here`;

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
        The archive is named <code>voidbase_&lt;version&gt;_&lt;os&gt;_&lt;arch&gt;.zip</code>, with{" "}
        <code>darwin</code> and <code>windows</code> beside <code>linux</code>, <code>arm64</code> beside{" "}
        <code>amd64</code>, and a <code>_musl</code> suffix for Alpine. Pin the version rather than tracking the
        latest release, so a new voidbase does not change what a green build means, and let a check tell you when it
        is time to move it:
      </p>
      <CodeBlock {...UPDATE} />
      <p>
        <Link href="/docs/deploy/pipeline">The common pipeline page</Link> makes the same argument for the other
        shapes. The runner is yours to pick; the executable needs nothing installed beside it.
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
        which is the cost of having no vendor in the loop. The scheduled backup from Settings &gt; Backups writes an
        archive that is verified after it is written, and with <code>VOIDBASE_BACKUP_S3_ENDPOINT</code>,{" "}
        <code>VOIDBASE_BACKUP_S3_BUCKET</code>, <code>VOIDBASE_BACKUP_S3_ACCESS_KEY_ID</code> and{" "}
        <code>VOIDBASE_BACKUP_S3_SECRET_ACCESS_KEY</code> set, every archive is also copied to that bucket, off the
        box: another R2 account, Backblaze B2, AWS S3 or anything S3-compatible. A failed copy is reported and never
        fails the backup.
      </p>
      <p>
        If that sentence is the one that changes your mind,{" "}
        <Link href="/docs/track/project">a voidbase project</Link> puts the database on Cloudflare's D1 and the
        files in R2, and the pipeline becomes theirs to run.
      </p>
    </>
  );
}
