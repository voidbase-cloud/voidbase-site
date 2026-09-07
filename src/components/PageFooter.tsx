import { Link } from "@void/react";
import { SITE } from "@/lib/env";
import { useTooltip } from "@/lib/useTooltip";

export default function PageFooter() {
  const orgRef = useTooltip<HTMLAnchorElement>({ text: "The voidbase-cloud organization", position: "top" });
  const repoRef = useTooltip<HTMLAnchorElement>({ text: "Go to GitHub", position: "top" });

  return (
    <footer className="page-footer">
      <div className="wrapper wrapper-lg">
        <div className="primary-bar">
          <nav className="footer-col links">
            <Link href="/docs" className="link-item">Docs</Link>
            <Link href="/faq" className="link-item">FAQ</Link>
            <a href={SITE.discussionsUrl} className="link-item" target="_blank" rel="noopener noreferrer">Discussions</a>
          </nav>

          <nav className="footer-col links">
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
          </div>
        </div>

        <div className="credits-bar">
          <span className="txt">
            void<strong>base</strong> is an independent project, not affiliated with or endorsed by PocketBase.
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
          <div className="flex-fill" />
          <div className="credit">
            Site design by <a href="https://gani.bg" target="_blank" rel="noopener noreferrer" className="link-hint"><strong>Gani</strong></a> (PocketBase)
          </div>
        </div>
      </div>
    </footer>
  );
}
