// The shape of the documentation: one list, read by the sidebar, the breadcrumbs, the section cards and the
// previous/next links, so adding a page means adding it here and nowhere else.
//
// The order is the order someone meets voidbase in. First connecting to an instance, which is the shortest thing
// anyone comes here to do. Then the ways to get one, which are four because they are aimed at four different people:
// somebody trying it out, somebody who wants instances but no code, somebody building a backend, somebody building
// a whole application. The last two have a shape worth explaining a directory at a time, so they are sections of
// their own rather than a single long page.

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
    href: "/docs/why",
    title: "Why voidbase",
    icon: "ri-question-line",
    summary: "Where this came from, and how it compares to the backends you already know.",
    children: [
      { href: "/docs/why", title: "Why another BaaS??!?!?", summary: "Fourteen years of backends, and the one question each of them answered better." },
      { href: "/docs/why/firebase", title: "Compared to Firebase", summary: "The one that started it, and the account the data lives in." },
      { href: "/docs/why/supabase", title: "Compared to Supabase", summary: "Postgres and an open licence, against a self-host that is one command." },
      { href: "/docs/why/pocketbase", title: "Compared to PocketBase", summary: "The same API. One machine, or no machine." },
      { href: "/docs/why/appwrite", title: "Compared to Appwrite", summary: "More services in the box, against less to operate." },
      { href: "/docs/why/convex", title: "Compared to Convex", summary: "Functions you write, against an API you get." },
      { href: "/docs/why/encore", title: "Compared to Encore", summary: "A framework for building a backend, against a backend." },
      { href: "/docs/why/roadmap", title: "What we are going to fix", summary: "The gaps the comparisons turned up, and the plan for each." },
    ],
  },
  {
    href: "/docs/connect/sdk",
    title: "Connect to an instance",
    icon: "ri-plug-line",
    summary: "Someone has given you an address. Here is how to use it.",
    children: [
      { href: "/docs/connect/sdk", title: "With the SDK", summary: "Read and write records, sign users in, subscribe to changes." },
      { href: "/docs/connect/admin-panel", title: "With the admin panel", summary: "Design collections, write API rules, browse data in a browser." },
    ],
  },
  {
    href: "/docs/run/standalone",
    title: "Run an instance",
    icon: "ri-server-line",
    summary: "An instance of your own, without writing anything.",
    children: [
      { href: "/docs/run/standalone", title: "Standalone executable", summary: "One file on your own machine or server. No npm, no build." },
      { href: "/docs/run/npm", title: "Instances from the CLI", summary: "Create, list and delete instances by name, locally or on Cloudflare." },
      { href: "/docs/run/cloud", title: "voidbase cloud", summary: "Instances without an account of your own. Experimental." },
    ],
  },
  {
    href: "/docs/run/project",
    title: "A voidbase project",
    icon: "ri-folder-3-line",
    summary: "A backend you extend: endpoints, hooks, schema, kept in a repository.",
    children: [
      { href: "/docs/run/project", title: "Create a project", summary: "Scaffold it, run it, extend it, and put it on Cloudflare." },
      { href: "/docs/run/project/hooks", title: "pb_hooks", summary: "Endpoints, event handlers and scheduled work, in JavaScript." },
      { href: "/docs/run/project/migrations", title: "pb_migrations", summary: "Schema as code, applied once, in order." },
      { href: "/docs/run/project/secrets", title: "pb_secrets", summary: "Configuration, and who is allowed to read each key." },
      { href: "/docs/run/project/public", title: "pb_public", summary: "Static files served from the same address as the API." },
      { href: "/docs/run/project/data", title: "pb_data", summary: "The database, the uploaded files and the generated typings." },
    ],
  },
  {
    href: "/docs/deploy/pipeline",
    title: "Deploy from your repository",
    icon: "ri-git-branch-line",
    summary: "Every change in version control, and a push is what ships it.",
    children: [
      { href: "/docs/deploy/pipeline", title: "Deploy on every push", summary: "Connect the repository once, and pushing to it is the deploy." },
      { href: "/docs/deploy/tracked", title: "What git tracks", summary: "Everything except the values of your secrets, and how those get there instead." },
    ],
  },
  {
    href: "/docs/run/stack",
    title: "The voidbase stack",
    icon: "ri-stack-line",
    summary: "Site and backend as one application, deployed as one Worker.",
    children: [
      { href: "/docs/run/stack", title: "Start a stack app", summary: "From an empty directory to a site with a backend inside it." },
      { href: "/docs/run/stack/hooks", title: "vb_hooks", summary: "Event handlers in TypeScript, one per file." },
      { href: "/docs/run/stack/migrations", title: "vb_migrations", summary: "Collections for the app, beside the app's own tables." },
      { href: "/docs/run/stack/secrets", title: "vb_secrets", summary: "One declaration serving the server, the build and the browser." },
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
