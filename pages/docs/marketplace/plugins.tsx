// Publishing a plugin, before plugins exist.
//
// This page has to be useful and honest at once, which mostly means resisting the urge to describe a format nobody
// has written. What it can offer is the reason to submit anyway: the answers shape the loader.
import { Link } from "@void/react";
import { SITE } from "@/lib/env";

const SUBMIT = "https://github.com/voidbase-cloud/voidbase-marketplace/issues/new?template=submit-plugin.yml";

export default function DocsMarketplacePlugins() {
  return (
    <>
      <h1>Publish a plugin</h1>
      <p className="docs-lead">
        <span className="label label-warning">Not built yet</span> <code>pb_plugins</code> does not exist. There is
        no manifest format, no loader, and nothing to install into, so nothing listed as a plugin can be used.
      </p>

      <h2>Then why is the form open?</h2>
      <p>
        Because the loader is being designed now, and a format designed against imagined plugins is a format that
        fits none of the real ones. The submission asks what your plugin would need from voidbase: which hooks, which
        routes, which collections, whether it wants a screen in the admin panel, whether it needs background work.
        Those answers are the useful part, and they are worth more to us at this stage than a listing is to you.
      </p>
      <p>
        Submitting also means you are told when the format lands, rather than finding out from a changelog.
      </p>
      <p>
        <a href={SUBMIT} target="_blank" rel="noreferrer noopener">The plugin submission form</a> takes a public
        repository, which can be a README describing the idea. A submission is recorded rather than audited, because
        there is nothing yet to audit it against and inventing checks for a format we are about to change would only
        teach people to satisfy the wrong ones.
      </p>

      <h2>What is decided</h2>
      <ul>
        <li>
          Plugins live in a <code>pb_plugins</code> directory beside your hooks, the way installed things sit beside
          your own code everywhere else.
        </li>
        <li>A plugin declares what it needs, and is installed and updated by name rather than copied in.</li>
        <li>
          A plugin can add routes, hooks, collections and admin panel screens. That set is what makes the format hard
          and is why it is taking a while.
        </li>
        <li>
          Core plugins ship with voidbase, official ones are ours and versioned with it, and anyone can publish their
          own through the marketplace.
        </li>
      </ul>

      <h2>What is not</h2>
      <ul>
        <li>The manifest: what it declares, and in what language.</li>
        <li>
          Permissions. A plugin that can add routes and read collections is a plugin that can do damage, so what it
          has to ask for, and how that is checked against what it actually does, is the part that decides whether any
          of this is safe to use.
        </li>
        <li>Versioning and compatibility: what happens when voidbase changes underneath a plugin.</li>
        <li>Whether plugins run in the same isolate as your hooks, and what that means for a plugin's failures.</li>
      </ul>

      <p>
        <Link href="/docs/roadmap">The roadmap</Link> carries the design as it stands, and the{" "}
        <a href={SITE.discordUrl} target="_blank" rel="noreferrer noopener">Discord</a> is where the open questions
        above get argued about. If you have built a plugin system before and any of this looks wrong, that is the
        most useful thing you could tell us.
      </p>
    </>
  );
}
