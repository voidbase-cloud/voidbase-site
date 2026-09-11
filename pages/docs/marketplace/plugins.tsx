// Publishing a plugin: what the repository needs, what the marketplace does with it, and how a version lands.
//
// The contributor builds nothing and publishes nothing; the marketplace does that from the repository at a commit.
// The page says what is checked, with the reason, so a submitter can read the rules before submitting.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { SITE } from "@/lib/env";

const SUBMIT = "https://github.com/voidbase-cloud/voidbase-marketplace/issues/new?template=submit-plugin.yml";

const LAYOUT = hl.bash`voidbase-plugin-echo/
├─ plugin.json      the manifest: name, version, tier, the voidbase range, provides, requires
├─ src/index.ts     the entry point (or exports["."] in package.json): default export is the plugin
├─ package.json
├─ LICENSE          one GitHub can identify
└─ README.md        what it does for someone running voidbase`;

const MANIFEST = hl.json`{
  "name": "echo",
  "version": "0.1.0",
  "tier": "community",
  "voidbase": ">=0.9.0-beta.7",
  "provides": [],
  "requires": []
}`;

export default function DocsMarketplacePlugins() {
  return (
    <>
      <h1>Publish a plugin</h1>
      <p className="docs-lead">
        A plugin is a repository with a <code>plugin.json</code> in its root and an entry point whose default export
        is the plugin. You do not build or publish anything: once listed, the marketplace builds the bundle from your
        repository at a commit, audits it, hashes it and serves it, and anyone installs it with{" "}
        <code>voidbase plugins add &lt;name&gt;</code>.
      </p>

      <h2>What the repository needs</h2>
      <CodeBlock {...LAYOUT} />
      <CodeBlock {...MANIFEST} />
      <p>
        The manifest is what voidbase's loader reads, checked with its own <code>checkManifest</code>: the{" "}
        <code>name</code> (<code>^[a-z][a-z0-9-]*$</code>, and a marketplace serves each name once), the{" "}
        <code>version</code>, the <code>tier</code>, the voidbase range, and the interfaces it provides and requires,
        which have to be ones voidbase defines. The entry point is <code>exports["."]</code> in package.json or{" "}
        <code>src/index.ts</code>. The bundle the marketplace builds may import only what an instance provides,{" "}
        <code>@voidbase-cloud/voidbase/*</code> and <code>hono</code>; everything else is inlined, and Node built-ins
        are out because an instance may be a Worker. <Link href="/docs/plugins">The plugins page</Link> has the
        format, the interfaces, owning collections and the deploy-time half; the official packages
        (<code>@voidbase-cloud/plugin-*</code>, one repository each) show the shape.
      </p>
      <ul>
        <li>The repository is <strong>public</strong>.</li>
        <li>It has a licence GitHub can identify. A <code>LICENSE</code> file GitHub cannot recognise counts as none.</li>
        <li>It has a README saying what the plugin does for someone running voidbase.</li>
      </ul>

      <h2>What the marketplace does with it</h2>
      <p>
        On approval the pipeline runs against the repository at its current commit: audit the source (public, a
        licence, <code>plugin.json</code> valid, only interfaces voidbase defines, an entry point, nothing alarming),
        install its dependencies without running their scripts, bundle it with Bun, audit the bundle (it imports only
        what an instance provides, has a default export, is not oversized, nothing alarming), hash it, write the
        version record and regenerate the index. What every check found is recorded with the version and shown on the
        listing, so you can read it and disagree with any one of them. A published version never changes; a change is
        a new version.
      </p>
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            The audit does not run your code, and it is not a sandbox: a bundle runs inside the instance with
            everything the instance has, the way <code>pb_hooks</code> does. There is no model in the blocking path.
          </p>
        </div>
      </div>

      <h2>Submitting</h2>
      <ol>
        <li>
          Open the <a href={SUBMIT} target="_blank" rel="noreferrer noopener">plugin submission form</a>: the
          repository, a title, a one-line summary, a category and tags.
        </li>
        <li>
          The audit comments on the issue within a minute or two. If it flags something, edit the issue: that runs it
          again.
        </li>
        <li>
          A maintainer labels it <code>approved</code>. The plugin is built, audited, hashed, committed to the
          registry and pushed; the push deploys, the issue is answered and closed, and the plugin is installable by
          name.
        </li>
      </ol>

      <h2>Versions</h2>
      <p>
        A new version is a new commit of your repository with a bumped <code>version</code> in{" "}
        <code>plugin.json</code>, tagged. The marketplace's daily check asks every listed repository for its tags and
        publishes the versions it does not serve yet, each built and audited the same way; a maintainer can also
        publish one by hand against a ref. An instance moves with <code>voidbase plugins update</code>, or from
        inside with its installer, and the loader refuses a version whose voidbase range does not fit.
      </p>

      <h2>Removal</h2>
      <p>
        Open an issue titled <code>[remove] owner/name</code>. Once a maintainer approves it, the entry leaves the
        listing and the served versions leave the registry, in one commit. Instances that installed it keep what they
        have. A listing can also be removed if the repository disappears, becomes something other than what was
        listed, or turns out to be someone else's work.
      </p>
      <p>
        If you would rather ask before you spend time on it, we are on{" "}
        <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a>. If you have built a plugin
        system before and any of this looks wrong, that is the most useful thing you could tell us.
      </p>
    </>
  );
}
