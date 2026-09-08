// The chrome every documentation page sits in: the sidebar on the left, the page and its breadcrumbs on the right,
// and previous/next at the bottom so the whole thing can be read straight through. Nested inside the root layout,
// which already puts its children in the flex wrapper this expects (src/scss/_layout.scss: .page-content-wrapper).
//
// The sidebar's markup is the site's existing sidebar markup, so it needs no styles of its own.
import type { ReactNode } from "react";
import { Link, useRouter } from "@void/react";
import EditThisPage from "@/components/EditThisPage";
import { contains, DOCS_NAV, locate, samePath, type DocsLink } from "@/lib/docsNav";
import "@/scss/docs.scss";
import "@/scss/edit-page.scss";

/**
 * One sidebar entry, and whatever is under it.
 *
 * Recursive because "Run an instance" holds groups that hold pages, and the sidebar should not care how deep that
 * goes. A group is highlighted when you are anywhere inside it; a page only when you are on it. A group's own href
 * is its first child, so highlighting it as a page too would mark the same row twice.
 */
// Every link in this nav prefetches on hover. The pages are prerendered and small, the reader's pointer reaches a
// link well before the click, and the highlighted code now travels with the page's own chunk, so by the time the
// click lands there is usually nothing left to fetch.
function Item({ link, path, depth = 0, last = false }: { link: DocsLink; path: string; depth?: number; last?: boolean }) {
  const kids = link.children ?? [];
  const open = contains(link, path);
  const active = kids.length ? open : samePath(link.href, path);
  const under = open
    ? kids.map((c, i) => <Item key={c.href} link={c} path={path} depth={depth + 1} last={i === kids.length - 1} />)
    : null;

  if (depth === 0) {
    return (
      <>
        <Link href={link.href} prefetch="hover" className={`list-item${active ? " active" : ""}`}>
          {link.icon && <span className="icon"><i className={link.icon} /></span>}
          <span className="txt">{link.title}</span>
        </Link>
        {under}
      </>
    );
  }

  return (
    <>
      <Link
        href={link.href}
        prefetch="hover"
        className={`sub-list-item docs-depth-${depth}${kids.length ? " docs-group" : ""}${active ? " active" : ""}`}
      >
        <span className="tree-node">{last ? "\u2514" : "\u251c"}</span>
        {link.title}
      </Link>
      {under}
    </>
  );
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const path = useRouter().path;
  const { trail, prev, next } = locate(path);
  // the trail already ends at the page, so drop a group whose title the next crumb repeats
  const crumbs = trail.map((t) => t.title).filter((t, i, all) => t !== all[i + 1]);

  return (
    <>
      <aside className="page-sidebar docs-sidebar">
        <div className="sidebar-content">
          <nav className="sidebar-list">
            {DOCS_NAV.map((link) => <Item key={link.href} link={link} path={path} />)}
          </nav>
        </div>
      </aside>

      <div className="page-content">
        <nav className="breadcrumbs">
          <div className="breadcrumb-item">Docs</div>
          {crumbs.map((c) => <div key={c} className="breadcrumb-item">{c}</div>)}
        </nav>

        <div className="content docs-content">{children}</div>

        {(prev || next) && (
          <nav className="docs-pager">
            {prev ? (
              <Link href={prev.href} prefetch="hover" className="docs-pager-link">
                <span className="txt-hint txt-sm">Previous</span>
                <strong>{prev.title}</strong>
              </Link>
            ) : <span />}
            {next && (
              <Link href={next.href} prefetch="hover" className="docs-pager-link docs-pager-next">
                <span className="txt-hint txt-sm">Next</span>
                <strong>{next.title}</strong>
              </Link>
            )}
          </nav>
        )}

        <EditThisPage path={path} />
      </div>
    </>
  );
}
