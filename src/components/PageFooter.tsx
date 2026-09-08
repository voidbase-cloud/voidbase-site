import { Link } from "@void/react";
import { SITE } from "@/lib/env";
import { useTooltip } from "@/lib/useTooltip";

export default function PageFooter() {
  const orgRef = useTooltip<HTMLAnchorElement>({ text: "The voidbase-cloud organization", position: "top" });
  const discordRef = useTooltip<HTMLAnchorElement>({ text: "Join the Discord", position: "top" });
  const repoRef = useTooltip<HTMLAnchorElement>({ text: "Go to GitHub", position: "top" });
  const npmRef = useTooltip<HTMLAnchorElement>({ text: "The package on npm", position: "top" });

  return (
    <footer className="page-footer">
      <div className="wrapper wrapper-lg">
        <div className="primary-bar">
          <nav className="footer-col links">
            <Link href="/docs/start" className="link-item">Docs</Link>
            <Link href="/docs/why" className="link-item">Why</Link>
            <a href={SITE.marketplaceUrl} className="link-item" target="_blank" rel="noopener noreferrer">Marketplace</a>
            <Link href="/docs/pricing" className="link-item">Pricing</Link>
            <Link href="/docs/roadmap" className="link-item">Roadmap</Link>
            <Link href="/docs/contribute" className="link-item">Contribute</Link>
            <Link href="/docs/sponsor" className="link-item">Sponsor</Link>
            <a href={SITE.discordUrl} className="link-item" target="_blank" rel="noopener noreferrer">Discord</a>
            <a href={SITE.discussionsUrl} className="link-item" target="_blank" rel="noopener noreferrer">Discussions</a>
          </nav>

          <nav className="footer-col links">
            <a href={SITE.npmUrl} className="link-item" target="_blank" rel="noopener noreferrer">npm package</a>
            <a href={SITE.jsSdkUrl} className="link-item" target="_blank" rel="noopener noreferrer">JavaScript SDK</a>
            <a href={SITE.dartSdkUrl} className="link-item" target="_blank" rel="noopener noreferrer">Dart SDK</a>
          </nav>

          <div className="footer-col socials">
            <div className="watermark-logo">void<strong>base</strong></div>
            <a ref={orgRef} href="https://github.com/voidbase-cloud" rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint social-item" aria-label="voidbase on GitHub">
              <i className="ri-community-line" />
            </a>
            <a ref={repoRef} href={SITE.repoUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint social-item" aria-label="Go to GitHub">
              <i className="ri-github-line" />
            </a>
            <a ref={npmRef} href={SITE.npmUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint social-item" aria-label="The voidbase package on npm">
              <i className="ri-npmjs-line" />
            </a>
            <a ref={discordRef} href={SITE.discordUrl} rel="noopener noreferrer" target="_blank" className="btn btn-secondary btn-circle btn-hint social-item" aria-label="Join the voidbase Discord">
              <i className="ri-discord-line" />
            </a>
          </div>
        </div>

        <div className="credits-bar">
          <span className="txt">
            void<strong>base</strong> is an independent project, not affiliated with or endorsed by PocketBase.{" "}
            <Link href="/docs/acknowledgments">Who made what</Link>.
          </span>
          <span className="txt">
            It runs <a href="https://pocketbase.io" target="_blank" rel="noopener noreferrer">PocketBase</a>'s API and admin
            panel and is built on <a href="https://void.cloud" target="_blank" rel="noopener noreferrer">Void</a>'s Cloudflare
            runtime; the two power most of what runs here and keep shipping the updates voidbase builds on.
          </span>
        </div>

        <div className="secondary-bar">
          <div className="terms">
            <span className="txt">© {new Date().getFullYear()} void<strong>base</strong></span>{" "}
            <span className="gopher-credit">
              The Gopher artwork is from{" "}
              <a href="https://github.com/marcusolsson/gophers" target="_blank" rel="noreferrer noopener">marcusolsson/gophers</a>
            </span>
          </div>
          {/*
            Two credits that are not the same kind of thing, so they do not sit in one sentence: the people building
            voidbase, and the person whose site design this one is a fork of. Running them together is what made the
            old line read as though Gani worked on this.
          */}
          <div className="credit">
            Built by{" "}
            <a href="https://www.saastemly.com/" target="_blank" rel="noopener noreferrer" className="link-hint credit-team">
              <img src="/images/saastemly_mark.svg" alt="" width="15" height="15" />
              <strong>Saastemly</strong>
            </a>
          </div>
          <div className="credit credit-fork">
            Site design forked from PocketBase's, by{" "}
            <a href="https://gani.bg" target="_blank" rel="noopener noreferrer" className="link-hint"><strong>Gani</strong></a>
          </div>
          {/* the bottom right corner belongs to the presence avatars, which are fixed there and would clip a credit */}
          <div className="flex-fill" />
        </div>
      </div>
    </footer>
  );
}
