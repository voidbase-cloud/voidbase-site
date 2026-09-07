// The shape of the documentation: one list, read by the sidebar, the breadcrumbs and the previous/next links, so
// adding a page means adding it here and nowhere else.
//
// Two questions bring people to these pages, and the two sections answer one each: something already runs somewhere
// and you need to talk to it, or nothing runs yet and you need to change that. Each section's first child is also
// the section's own link, because a heading that goes nowhere is a dead click.

export interface DocsLink {
  href: string;
  title: string;
  /** one line under the title on the section's index, and the page's meta description */
  summary?: string;
  icon?: string;
  children?: DocsLink[];
}

export const DOCS_NAV: DocsLink[] = [
  {
    href: "/docs",
    title: "Introduction",
    icon: "ri-home-2-line",
    summary: "What voidbase is, and which page to read next.",
  },
  {
    href: "/docs/connect/sdk",
    title: "Connect to an instance",
    icon: "ri-plug-line",
    summary: "Someone has given you an address. Here is how to use it.",
    children: [
      {
        href: "/docs/connect/sdk",
        title: "With the SDK",
        summary: "Read and write records, sign users in, subscribe to changes.",
      },
      {
        href: "/docs/connect/admin-panel",
        title: "With the admin panel",
        summary: "Design collections, write API rules, browse data in a browser.",
      },
    ],
  },
  {
    href: "/docs/run/standalone",
    title: "Run an instance",
    icon: "ri-server-line",
    summary: "Four ways to have one of your own. The first needs no toolchain at all.",
    children: [
      {
        href: "/docs/run/standalone",
        title: "Standalone executable",
        summary: "One file, no npm, no build. The fastest way to see it working.",
      },
      {
        href: "/docs/run/npm",
        title: "With npm, onto Cloudflare",
        summary: "A project on your machine, and one command to put it online.",
      },
      {
        href: "/docs/run/project",
        title: "What is in a project",
        summary: "pb_hooks, pb_migrations, pb_public, pb_secrets, pb_data: what each is for.",
      },
      {
        href: "/docs/run/stack",
        title: "The voidbase stack",
        summary: "A full application, site and backend, deployed as one Worker.",
      },
      {
        href: "/docs/run/cloud",
        title: "voidbase cloud",
        summary: "An instance without a machine of your own. Experimental.",
      },
    ],
  },
];

/** Every page, in reading order, which is what previous and next walk. */
export const DOCS_PAGES: DocsLink[] = DOCS_NAV.flatMap((s) => (s.children?.length ? s.children : [s]));

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
export const samePath = (a: string, b: string) => normalize(a) === normalize(b);

/** where a path sits in the documentation: its section, its page, and what is either side of it */
export function locate(path: string): { section?: DocsLink; page?: DocsLink; prev?: DocsLink; next?: DocsLink } {
  const section = DOCS_NAV.find((s) => samePath(s.href, path) || s.children?.some((c) => samePath(c.href, path)));
  const at = DOCS_PAGES.findIndex((p) => samePath(p.href, path));
  return {
    section,
    page: DOCS_PAGES[at],
    prev: at > 0 ? DOCS_PAGES[at - 1] : undefined,
    next: at >= 0 ? DOCS_PAGES[at + 1] : undefined,
  };
}
