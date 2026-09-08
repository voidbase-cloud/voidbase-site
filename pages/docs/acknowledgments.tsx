// What voidbase is built out of, and who wrote it.
//
// The list is taken from the package's NOTICE file, the site's dependencies and the fonts actually served from
// public/fonts, rather than from memory, because a credits page that is wrong is worse than none.
import { Link } from "@void/react";
import { SITE } from "@/lib/env";
import "@/scss/thanks.scss";

interface Credit {
  name: string;
  url: string;
  what: string;
  licence?: string;
}

function Credits({ title, lead, items }: { title: string; lead: string; items: Credit[] }) {
  return (
    <section className="thanks-group">
      <h2>{title}</h2>
      <p>{lead}</p>
      <ul className="thanks-list">
        {items.map((c) => (
          <li key={c.name}>
            <a href={c.url} target="_blank" rel="noreferrer noopener">{c.name}</a>
            {c.licence && <span className="thanks-licence">{c.licence}</span>}
            <span className="thanks-what">{c.what}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const RUNTIME: Credit[] = [
  { name: "Hono", url: "https://hono.dev", licence: "MIT", what: "The router every request goes through." },
  { name: "cordis", url: "https://github.com/cordiverse/cordis", licence: "MIT", what: "The plugin kernel: services, dependency injection and the lifetime of a plugin, from the people behind Koishi." },
  { name: "cosmokit", url: "https://github.com/cordiverse/cosmokit", licence: "MIT", what: "The utilities cordis is built on." },
  { name: "Standard Schema", url: "https://standardschema.dev", licence: "MIT", what: "The specification cordis validates plugin configuration against." },
  { name: "fflate", url: "https://github.com/101arrowz/fflate", licence: "MIT", what: "Zip and unzip, for backups and for the admin panel inside the executable." },
  { name: "Photon", url: "https://github.com/silvia-odwyer/photon", licence: "Apache-2.0", what: "Image processing compiled to WebAssembly, by Silvia O'Dwyer, which is what generates thumbnails. Packaged as @cf-wasm/photon." },
  { name: "SimpleWebAuthn", url: "https://simplewebauthn.dev", licence: "MIT", what: "Passkey registration and verification on the server." },
  { name: "bcryptjs", url: "https://github.com/dcodeIO/bcrypt.js", licence: "MIT", what: "Password hashing." },
];

const SITE_CREDITS: Credit[] = [
  { name: "React", url: "https://react.dev", licence: "MIT", what: "The pages you are reading." },
  { name: "Vite", url: "https://vite.dev", licence: "MIT", what: "The build, through Void's plugin." },
  { name: "Sass", url: "https://sass-lang.com", licence: "MIT", what: "The stylesheets." },
  { name: "Remix Icon", url: "https://remixicon.com", licence: "Apache-2.0", what: "Every icon on this site, including the ones in the sidebar." },
  { name: "Source Sans Pro", url: "https://github.com/adobe-fonts/source-sans", licence: "SIL OFL 1.1", what: "The typeface this sentence is set in, by Paul D. Hunt for Adobe." },
  { name: "Ubuntu Mono", url: "https://design.ubuntu.com/font", licence: "Ubuntu Font Licence", what: "Every command and code block." },
  { name: "Gopher artwork", url: "https://github.com/marcusolsson/gophers", what: "The gopher on the landing page, drawn by Marcus Olsson, from the original by Renee French." },
];

export default function DocsAcknowledgments() {
  return (
    <article className="thanks">
      <h1>Acknowledgments</h1>
      <p className="docs-lead">
        Almost nothing here is original. voidbase is one idea, that PocketBase's API could run on Cloudflare, resting
        on a great deal of work other people did first and gave away. This site is a fork of theirs, and the section
        below says exactly how much of it we kept.
      </p>

      <section className="thanks-team">
        <a href="https://www.saastemly.com/" target="_blank" rel="noreferrer noopener" className="thanks-team-mark">
          <img src="/images/saastemly_logo.svg" alt="Saastemly" width="120" height="120" loading="lazy" />
        </a>
        <div>
          <h2>Who builds voidbase</h2>
          <p>
            voidbase is built by{" "}
            <a href="https://www.saastemly.com/" target="_blank" rel="noreferrer noopener">Saastemly</a>. Everything
            below is what we build on, and nobody on those lists works on this or has approved it.
          </p>
        </div>
      </section>

      <section className="thanks-major">
        <h2>PocketBase</h2>
        <p>
          <a href="https://pocketbase.io" target="_blank" rel="noreferrer noopener">PocketBase</a> is Gani Georgiev's,
          MIT licensed, and it is the reason this project exists. voidbase reimplements its HTTP API, its filter and
          rule language, its email templates and its JavaScript hook surface.
        </p>
        <p>
          Two pieces of it are not reimplemented at all. They are PocketBase's own code, running as they were
          written, and they are what makes the compatibility real rather than claimed.
        </p>
        <ul className="thanks-pb">
          <li>
            <a href="https://github.com/pocketbase/pocketbase/tree/master/ui" target="_blank" rel="noreferrer noopener">
              The admin panel
            </a>
            <span className="thanks-licence">MIT</span>
            <span className="thanks-what">
              Served at <code>/_/</code> on every voidbase instance. It is PocketBase's own prebuilt{" "}
              <code>ui/dist</code>, copied in from a pinned release and unmodified. We did not write a line of it and
              have not changed one, so when the panel asks voidbase for something it cannot answer, that is our bug
              rather than the panel's.
            </span>
          </li>
          <li>
            <a href={SITE.jsSdkUrl} target="_blank" rel="noreferrer noopener">The JavaScript SDK</a>
            <span className="thanks-licence">MIT</span>
            <span className="thanks-what">
              We ship no client of our own. <Link href="/docs/connect/sdk">Our documentation points at theirs</Link>,
              because it works against a voidbase instance unchanged, and the day it stops doing so we have broken
              something rather than they have.
            </span>
          </li>
          <li>
            <a href={SITE.dartSdkUrl} target="_blank" rel="noreferrer noopener">The Dart SDK</a>
            <span className="thanks-licence">MIT</span>
            <span className="thanks-what">
              The same, for Flutter. Also theirs, also unchanged, and the reason a mobile app written against
              PocketBase can be pointed at voidbase by editing one address.
            </span>
          </li>
        </ul>
        <p>
          <strong>This website is a fork of PocketBase's.</strong> Not an homage to it and not a design inspired by
          it: the site you are reading started as{" "}
          <a href="https://github.com/pocketbase/site" target="_blank" rel="noreferrer noopener">pocketbase/site</a>{" "}
          and still carries its layout, its stylesheets and its components. The landing page is the clearest evidence
          of that and we would rather point at it than hope nobody notices. What has changed since is the framework,
          because it was ported from Svelte to React and refactored more than once, and the documentation, which is
          written from scratch because none of it would have been true otherwise.
        </p>
        <p>
          Copyright (c) 2022 - present, Gani Georgiev, under the MIT licence. The same person wrote the backend we
          reimplement and the site we forked, which is worth saying in one sentence rather than two paragraphs apart.
        </p>
        <p>
          voidbase is not affiliated with or endorsed by the PocketBase project. If a single machine suits you, run
          PocketBase: it is faster, older and better proven, and{" "}
          <Link href="/docs/why/pocketbase">we say so on the page that compares them</Link>.
        </p>
      </section>

      <section className="thanks-major">
        <h2>Void and Cloudflare</h2>
        <p>
          <a href="https://void.cloud" target="_blank" rel="noreferrer noopener">Void</a> is what turns a voidbase
          project into a Worker and deploys it, and it is what this site is built with. The parts of it we lean on
          hardest are the ones that were shipped while we were building on them.
        </p>
        <p>
          <a href="https://www.cloudflare.com/developer-platform/" target="_blank" rel="noreferrer noopener">Cloudflare</a>{" "}
          is the platform underneath: Workers, D1, R2, Durable Objects and Workers AI. A backend that costs nothing
          until it has users is their achievement rather than ours, and the argument for voidbase mostly reduces to
          getting out of the way of it.
        </p>
      </section>

      <section className="thanks-major">
        <h2>The Omarchy plugin marketplace</h2>
        <p>
          <a href="https://github.com/omacom/omarchy-plugin-marketplace" target="_blank" rel="noreferrer noopener">
            omarchy-plugin-marketplace
          </a>{" "}
          worked out how to run a community marketplace without accounts, uploads or a place to host other people's
          code: a submission is a GitHub issue, an automated pass reports on the repository before anyone decides, an
          explicit maintainer approval is what publishes it, and the registry is a file in the repository rather than
          rows in a database.
        </p>
        <p>
          <a href="https://marketplace.voidbase.cloud" target="_blank" rel="noreferrer noopener">
            The voidbase marketplace
          </a>{" "}
          is a much smaller version of that idea and none of their code is in it, but the shape is theirs and it saved
          us from designing a worse one.
        </p>
      </section>

      <Credits
        title="What the server is made of"
        lead="Runtime dependencies, from the package's NOTICE file."
        items={RUNTIME}
      />

      <Credits
        title="What this site is made of"
        lead="Everything above, plus the pieces that only the site uses."
        items={SITE_CREDITS}
      />

      <h2>And everyone who reports something</h2>
      <p>
        A backend gets trustworthy by being used in ways nobody designed for and having the results reported back. If
        you have opened an issue, corrected a page, or told us a number on the comparison pages was wrong, that is the
        contribution this project needs most and the one it is least able to make on its own.{" "}
        <Link href="/docs/contribute">How to contribute</Link> is the short version of why.
      </p>
    </article>
  );
}
