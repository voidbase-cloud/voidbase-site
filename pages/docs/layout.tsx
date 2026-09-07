// The chrome every documentation page sits in: the sidebar on the left, the page and its breadcrumbs on the right,
// and previous/next at the bottom so the whole thing can be read straight through. Nested inside the root layout,
// which already puts its children in the flex wrapper this expects (src/scss/_layout.scss: .page-content-wrapper).
//
// The sidebar's markup is the site's existing sidebar markup, so it needs no styles of its own.
import type { ReactNode } from "react";
import { Link, useRouter } from "@void/react";
import { DOCS_NAV, locate, samePath, type DocsLink } from "@/lib/docsNav";
import "@/scss/docs.scss";

function Item({ link, path }: { link: DocsLink; path: string }) {
  const here = samePath(link.href, path);
  const inside = !!link.children?.some((c) => samePath(c.href, path));
  return (
    <>
      <Link href={link.href} className={`list-item${here || inside ? " active" : ""}`}>
        {link.icon && <span className="icon"><i className={link.icon} /></span>}
        <span className="txt">{link.title}</span>
      </Link>
      {/* a section opens only when you are in it, so the sidebar stays a short list rather than a wall of links */}
      {link.children?.length && (here || inside)
        ? link.children.map((child, i) => (
            <Link key={child.href} href={child.href} className={`sub-list-item${samePath(child.href, path) ? " active" : ""}`}>
              <span className="tree-node">{i === link.children!.length - 1 ? "└" : "├"}</span>
              {child.title}
            </Link>
          ))
        : null}
    </>
  );
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const path = useRouter().path;
  const { section, page, prev, next } = locate(path);
  const crumbs = [section?.title, page && page.title !== section?.title ? page.title : null].filter(Boolean);

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
              <Link href={prev.href} className="docs-pager-link">
                <span className="txt-hint txt-sm">Previous</span>
                <strong>{prev.title}</strong>
              </Link>
            ) : <span />}
            {next && (
              <Link href={next.href} className="docs-pager-link docs-pager-next">
                <span className="txt-hint txt-sm">Next</span>
                <strong>{next.title}</strong>
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
