// The footer.
//
// It was one column of nine links, each with ten pixels of padding and ten more of margin, which is what
// PocketBase's footer looked like when it had four of them. Every link added since made it taller, and it had
// grown to about 660px: more than a phone screen, to leave a documentation page.
//
// They are grouped now by what somebody came down here for, which is the only grouping that helps: read about it,
// build with it, or take part in it. Four rows instead of nine, in three columns beside a brand block, and the
// labels use the mono eyebrow the pricing page already uses so the device belongs to this site rather than being
// imported. The ghost wordmark that used to float in the corner is gone; it did no work, and the brand block on
// the left says the same thing while meaning it.
import { Link } from "@void/react";
import { RELEASE, SITE } from "@/lib/env";
import { useTooltip } from "@/lib/useTooltip";

export default function PageFooter() {
  const orgRef = useTooltip<HTMLAnchorElement>({ text: "The voidbase-cloud organization", position: "top" });
  const discordRef = useTooltip<HTMLAnchorElement>({ text: "Join the Discord", position: "top" });
  const repoRef = useTooltip<HTMLAnchorElement>({ text: "Go to GitHub", position: "top" });
  const npmRef = useTooltip<HTMLAnchorElement>({ text: "The package on npm", position: "top" });

  return (
    <footer className="page-footer">
      <div className="wrapper wrapper-lg">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-mark">
              {/* one flex item, or the gap that separates it from the version opens up inside the word */}
              <span className="txt">void<strong>base</strong></span>
              <span className="footer-version">{RELEASE.number}</span>
            </Link>
            <p className="footer-what">PocketBase's API, in your own Cloudflare account.</p>
            <div className="footer-socials">
              <a ref={orgRef} href="https://github.com/voidbase-cloud" rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint" aria-label="voidbase on GitHub">
                <i className="ri-community-line" />
              </a>
              <a ref={repoRef} href={SITE.repoUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint" aria-label="Go to GitHub">
                <i className="ri-github-line" />
              </a>
              <a ref={npmRef} href={SITE.npmUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint" aria-label="The voidbase package on npm">
                <i className="ri-npmjs-line" />
              </a>
              <a ref={discordRef} href={SITE.discordUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint" aria-label="Join the voidbase Discord">
                <i className="ri-discord-line" />
              </a>
            </div>
          </div>

          <nav className="footer-group" aria-labelledby="footer-read">
            <h2 id="footer-read" className="footer-label">Read about it</h2>
            <Link href="/docs/start" className="footer-link">Docs</Link>
            <Link href="/docs/why" className="footer-link">Why voidbase</Link>
            <Link href="/docs/pricing" className="footer-link">Pricing</Link>
            <Link href="/docs/roadmap" className="footer-link">Roadmap</Link>
          </nav>

          <nav className="footer-group" aria-labelledby="footer-build">
            <h2 id="footer-build" className="footer-label">Build with it</h2>
            <a href={SITE.npmUrl} className="footer-link" target="_blank" rel="noopener noreferrer">npm package</a>
            <a href={SITE.jsSdkUrl} className="footer-link" target="_blank" rel="noopener noreferrer">JavaScript SDK</a>
            <a href={SITE.dartSdkUrl} className="footer-link" target="_blank" rel="noopener noreferrer">Dart SDK</a>
            <a href={SITE.marketplaceUrl} className="footer-link" target="_blank" rel="noopener noreferrer">Marketplace</a>
          </nav>

          <nav className="footer-group" aria-labelledby="footer-part">
            <h2 id="footer-part" className="footer-label">Take part</h2>
            <a href={SITE.discordUrl} className="footer-link" target="_blank" rel="noopener noreferrer">Discord</a>
            <a href={SITE.discussionsUrl} className="footer-link" target="_blank" rel="noopener noreferrer">Discussions</a>
            <Link href="/docs/contribute" className="footer-link">Contribute</Link>
            <Link href="/docs/sponsor" className="footer-link">Sponsor</Link>
          </nav>
        </div>

        <div className="credits-bar">
          <span className="txt">
            void<strong>base</strong> runs{" "}
            <a href="https://pocketbase.io" target="_blank" rel="noopener noreferrer">PocketBase</a>'s API and admin
            panel on <a href="https://void.cloud" target="_blank" rel="noopener noreferrer">Void</a>'s Cloudflare
            runtime, and is an independent project, not affiliated with or endorsed by either.{" "}
            <Link href="/docs/acknowledgments">Who made what</Link>.
          </span>
        </div>

        <div className="secondary-bar">
          <span className="txt">© {new Date().getFullYear()} void<strong>base</strong></span>
          {/*
            Two credits that are not the same kind of thing, so they do not sit in one sentence: the people building
            voidbase, and the person whose site design this one is a fork of. Running them together is what made the
            old line read as though Gani worked on this.
          */}
          <span className="credit">
            Built by{" "}
            <a href="https://www.saastemly.com/" target="_blank" rel="noopener noreferrer" className="link-hint credit-team">
              <img src="/images/saastemly_mark.svg" alt="" width="14" height="14" />
              <strong>Saastemly</strong>
            </a>
          </span>
          <span className="credit credit-fork">
            Site design forked from PocketBase's, by{" "}
            <a href="https://gani.bg" target="_blank" rel="noopener noreferrer" className="link-hint"><strong>Gani</strong></a>
          </span>
          <span className="credit credit-fork">
            Gopher by{" "}
            <a href="https://github.com/marcusolsson/gophers" target="_blank" rel="noreferrer noopener">Marcus Olsson</a>
          </span>
          {/* the bottom right corner belongs to the presence avatars, which are fixed there and would clip a credit */}
          <div className="flex-fill" />
        </div>
      </div>
    </footer>
  );
}
