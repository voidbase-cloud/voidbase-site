import { Link } from "@void/react";
import CloudflareSignIn from "@/components/CloudflareSignIn";
import Dropdown from "@/components/Dropdown";
import { RELEASE, SITE } from "@/lib/env";

export interface PageHeaderProps { compact?: boolean }

// The search box sits in the centre section on the SvelteKit site; it is indexed from the docs, which have not been
// migrated yet, so the section stays empty until they are (see docs/migration.md).
export default function PageHeader({ compact = false }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="wrapper wrapper-lg">
        <div className="header-section left">
          <Link href="/" className={`logo${compact ? " logo-sm" : ""}`} title={`voidbase ${SITE.vbVersion}${SITE.pbVersion ? ` · PocketBase ${SITE.pbVersion} API` : ""}`}>
            <img src="/images/logo.svg" alt="voidbase logo" width="40" height="40" />
            <span className="txt">void<strong>base</strong></span>
            <span className="version">{RELEASE.number}</span>
            {RELEASE.channel && <span className="channel">{RELEASE.channel}</span>}
          </Link>
        </div>

        <div className="header-section center" />

        <div className="header-section right">
          <Dropdown
            className="dropdown dropdown-lg dropdown-right dropdown-nowrap responsive-menu-dropdown"
            trigger={({ active, onClick, "aria-expanded": expanded }) => (
              <button type="button" className={`btn btn-circle btn-secondary responsive-menu-btn${active ? " active" : ""}`} title="Menu" aria-expanded={expanded} onClick={onClick}>
                <span />
                <i className="ri-menu-3-fill" />
              </button>
            )}
          >
            <Link href="/docs" className="dropdown-item">Docs</Link>
            <Link href="why" className="dropdown-item">Why</Link>
            <Link href="/docs/pricing" className="dropdown-item">Pricing</Link>
            <Link href="/cloud" className="dropdown-item">Cloud</Link>
            <a href={SITE.discordUrl} className="dropdown-item" target="_blank" rel="noreferrer noopener">Discord</a>
            <a href={SITE.discussionsUrl} className="dropdown-item" target="_blank" rel="noreferrer noopener">Discussions</a>
            <hr />
            <CloudflareSignIn className="dropdown-item" />
          </Dropdown>

          <nav className="main-menu">
            <Link href="/docs" className="btn btn-secondary">Docs</Link>
            <Link href="/docs/why" className="btn btn-secondary">Why</Link>
            <Link href="/docs/pricing" className="btn btn-secondary">Pricing</Link>
            <a href={SITE.discordUrl} className="btn btn-circle btn-secondary" target="_blank" rel="noreferrer noopener" title="Join the Discord">
              <i className="ri-discord-line" />
            </a>
            <a href={SITE.repoUrl} className="btn btn-circle btn-secondary" target="_blank" rel="noreferrer noopener" title="GitHub Repo">
              <i className="ri-github-line" />
            </a>
            <CloudflareSignIn className="btn btn-secondary cf-header" />
          </nav>
        </div>
      </div>
    </header>
  );
}
