// Publishing a plugin: what the repository needs, what the marketplace does with it, and how a version lands.
//
// The contributor builds nothing and publishes nothing, and neither does the marketplace: it audits the repository at
// a commit and records that commit, and an instance loads the files from it. The page says what is checked, with the
// reason, so a submitter can read the rules before submitting.
import { Link } from "@void/react";
import CodeBlock from "@/components/CodeBlock";
import { hl } from "@/lib/hl";
import { SITE } from "@/lib/env";

const SUBMIT = "https://github.com/voidbase-cloud/voidbase-marketplace/issues/new?template=submit-plugin.yml";

const LAYOUT = hl.bash`voidbase-plugin-echo/
├─ manifest.json    name, version, tier, the voidbase range, provides, requires, collections, config
├─ main.js          what the plugin does, when it does more than hooks: plain JavaScript, default export
├─ lib/             modules main.js imports, if any
├─ pb_hooks/        hooks, loaded after the project's own
├─ pb_migrations/   its schema, if it has one
├─ pb_public/       files it serves, if any
├─ LICENSE          one GitHub can identify
└─ README.md        what it does for someone running voidbase`;

const MANIFEST = hl.json`{
  "name": "echo",
  "version": "0.1.0",
  "tier": "community",
  "voidbase": ">=1.0.0",
  "provides": [],
  "requires": []
}`;

export default function DocsMarketplacePlugins() {
  return (
    <>
      <h1>Publish a plugin</h1>
      <p className="docs-lead">
        A plugin is a repository with a <code>manifest.json</code> in its root and the files an instance loads beside
        it: hooks, migrations, public files, and a <code>main.js</code> when it does more than hooks. Nobody builds
        anything. Once listed, the marketplace records the commit it audited, an instance fetches the files at that
        commit and verifies them, and anyone installs it with <code>voidbase plugins add &lt;name&gt;</code>.
      </p>

      <h2>What the repository needs</h2>
      <CodeBlock {...LAYOUT} />
      <CodeBlock {...MANIFEST} />
      <p>
        The manifest is what voidbase's loader reads, checked with its own <code>checkManifest</code>: the{" "}
        <code>name</code> (<code>^[a-z][a-z0-9-]*$</code>, and a marketplace serves each name once), the{" "}
        <code>version</code>, the <code>tier</code>, the voidbase range, and the interfaces it provides and requires,
        which may be ones voidbase defines or names of your own (a near-miss of one it defines is refused as a
        typo). <code>main.js</code> is plain JavaScript, because nothing is compiled:
        its default export is the plugin (<code>apply</code>, and <code>info</code> if it reports anything), and the
        instance attaches the manifest to it when it loads. It and <code>lib/</code> may import only what an instance
        provides, <code>@voidbase-cloud/voidbase/*</code> and <code>hono</code>, plus their own files; Node built-ins
        are out because an instance may be a Worker. <Link href="/docs/plugins">The plugins page</Link> has the
        format, the interfaces, owning collections and the deploy-time half; the official plugins in voidbase's own
        repository (<code>packages/plugin-*</code>, one directory each) show the shape.
      </p>
      <ul>
        <li>The repository is <strong>public</strong>.</li>
        <li>It has a licence GitHub can identify. A <code>LICENSE</code> file GitHub cannot recognise counts as none.</li>
        <li>It has a README saying what the plugin does for someone running voidbase.</li>
      </ul>

      <h2>What the marketplace does with it</h2>
      <p>
        On approval the pipeline audits what an instance would load at the repository's current commit: public, a
        licence, a <code>manifest.json</code> valid against voidbase's <code>checkManifest</code>, something to load,
        nothing to compile, imports only of what an instance provides and nothing outside the plugin, not oversized,
        nothing alarming. Then it writes the version record naming that commit (and the directory, for a repository
        holding several plugins) and regenerates the index. Nothing is installed, built, bundled or hosted. What every
        check found is recorded with the version and shown on the listing, so you can read it and disagree with any
        one of them. A published version never changes; a change is a new version.
      </p>
      <div className="alert alert-warning">
        <div className="content">
          <p className="m-0">
            The audit does not run your code, and it is not a sandbox: a plugin runs inside the instance with
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
          A maintainer labels it <code>approved</code>. The commit is audited and recorded in the registry, which is
          pushed; the push deploys, the issue is answered and closed, and the plugin is installable by name.
        </li>
      </ol>

      <h2>Versions</h2>
      <p>
        A new version is a new commit of your repository with a bumped <code>version</code> in{" "}
        <code>manifest.json</code>, tagged. The marketplace's daily check asks every listed repository for its tags and
        queues the versions it does not serve yet, each audited the same way and held for a maintainer to approve; a
        maintainer can also record one by hand against a ref. An instance moves with <code>voidbase plugins update</code>, or from
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
