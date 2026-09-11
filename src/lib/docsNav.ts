// The shape of the documentation: one list, read by the sidebar, the breadcrumbs, the section cards and the
// previous/next links, so adding a page means adding it here and nowhere else.
//
// The order is an argument. What this is, why it exists, then which page to read next, then the pages themselves.
// "Run an instance" holds every way of getting one, from a single downloaded file to a repository that deploys
// itself, because from the reader's side those are one question with six answers rather than four sections.
//
// A node with children is a group and not a page: its own href points at whichever child is its front door, and the
// reading order walks the children instead. That is what lets a group nest inside a group without the pager, the
// breadcrumbs or the previous/next links needing to know how deep anything is.

export interface DocsLink {
  href: string;
  title: string;
  /** one line under the title on the section's index, and the page's meta description */
  summary?: string;
  icon?: string;
  children?: DocsLink[];
  /**
   * Which band of the sidebar this section belongs to. The sidebar draws a rule wherever the band changes, so the
   * grouping is a property of the section rather than a divider entry sitting in the list pretending to be a page.
   */
  group?: Group;
}

/** what a reader is doing, in the order they tend to do it */
export type Group = "about" | "using" | "extending" | "project";

export const DOCS_NAV: DocsLink[] = [
  {
    href: "/docs",
    title: "Introduction",
    group: "about",
    icon: "ri-home-2-line",
    summary: "What voidbase is, what it is made of, and what these pages assume.",
  },
  {
    href: "/docs/why",
    title: "Why voidbase",
    group: "about",
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
    ],
  },
  {
    href: "/docs/start",
    title: "Where to start",
    group: "using",
    icon: "ri-signpost-line",
    summary: "What an instance is, and which of the six ways of getting one you want.",
    children: [
      { href: "/docs/start", title: "Which one do I want?", summary: "Three questions, and the page that answers them for you." },
      { href: "/docs/instance", title: "What is an instance", summary: "What one is made of, the shapes it comes in, and what decides between them." },
      {
        href: "/docs/run/standalone",
        title: "Start immediately",
        summary: "A backend in about a minute, with nothing of yours in version control yet.",
        children: [
          { href: "/docs/run/standalone", title: "The standalone executable", summary: "One file on your own machine or server. No npm, no build." },
          { href: "/docs/run/npm", title: "The npm CLI", summary: "Create, list and delete instances by name, locally or on Cloudflare." },
          { href: "/docs/run/cloud", title: "voidbase cloud", summary: "Instances without an account of your own. Experimental." },
        ],
      },
      {
        href: "/docs/run/binary",
        title: "Start with version control",
        summary: "The repository first, and the instance built out of what is in it.",
        children: [
          { href: "/docs/run/binary", title: "A tracked directory", summary: "Hooks, schema and configuration in git, served by the executable. No npm." },
          { href: "/docs/run/project", title: "A voidbase project", summary: "The same directory with npm, which is what reaches Cloudflare." },
          { href: "/docs/run/stack", title: "A voidbase stack", summary: "Site and backend as one application, deployed as one Worker." },
        ],
      },
      {
        href: "/docs/track/binary",
        title: "Add version control later",
        summary: "You already have one running. This is how its schema and hooks become a repository.",
        children: [
          { href: "/docs/track/binary", title: "Into a tracked directory", summary: "Stay on your own machine, with no npm, and put what defines it in git." },
          { href: "/docs/track/project", title: "Into a voidbase project", summary: "The npm layout, which is the one that deploys to Cloudflare." },
          { href: "/docs/track/stack", title: "Into a voidbase stack", summary: "Fold it into a Void application and ship both as one Worker." },
        ],
      },
      {
        href: "/docs/deploy/pipeline",
        title: "Deploy on every push",
        summary: "A push is the deploy. The common setup, then the one for your shape.",
        children: [
          { href: "/docs/deploy/pipeline", title: "How a push becomes a deploy", summary: "Connect the repository once, and pushing to it is the deploy." },
          { href: "/docs/deploy/tracked", title: "What git tracks", summary: "Everything except the values of your secrets, and how those get there instead." },
          { href: "/docs/cicd/binary", title: "For a tracked directory", summary: "No Cloudflare in the loop. Check the directory, then move it to your server." },
          { href: "/docs/cicd/project", title: "For a voidbase project", summary: "Workers Builds, preview instances, and the secrets the build is allowed to read." },
          { href: "/docs/cicd/stack", title: "For a voidbase stack", summary: "One artifact holding the site and the backend, and what that changes." },
        ],
      },
    ],
  },
  {
    href: "/docs/run/project/hooks",
    title: "Reference",
    group: "using",
    icon: "ri-book-2-line",
    summary: "The directories an instance reads, one page each.",
    children: [
      { href: "/docs/run/project/hooks", title: "pb_hooks", summary: "Endpoints, event handlers and scheduled work, in JavaScript." },
      { href: "/docs/run/project/migrations", title: "pb_migrations", summary: "Schema as code, applied once, in order." },
      { href: "/docs/run/project/secrets", title: "pb_secrets", summary: "Configuration, and who is allowed to read each key." },
      { href: "/docs/run/project/public", title: "pb_public", summary: "Static files served from the same address as the API." },
      { href: "/docs/run/project/data", title: "pb_data", summary: "The database, the uploaded files and the generated typings." },
      { href: "/docs/run/stack/hooks", title: "vb_hooks", summary: "Event handlers in TypeScript, one per file." },
      { href: "/docs/run/stack/migrations", title: "vb_migrations", summary: "Collections for the app, beside the app's own tables." },
      { href: "/docs/run/stack/secrets", title: "vb_secrets", summary: "One declaration serving the server, the build and the browser." },
    ],
  },
  {
    href: "/docs/connect/sdk",
    title: "Use the instance",
    group: "using",
    icon: "ri-plug-line",
    summary: "You have an address. Here is how to read and write through it.",
    children: [
      { href: "/docs/connect/sdk", title: "With the SDK", summary: "Read and write records, sign users in, subscribe to changes." },
      { href: "/docs/connect/admin-panel", title: "With the admin panel", summary: "Design collections, write API rules, browse data in a browser." },
    ],
  },
  {
    href: "/docs/templates",
    title: "Templates",
    group: "extending",
    icon: "ri-file-copy-2-line",
    summary: "Start from somebody's working project, from GitHub, the CLI or the cloud page, or publish your own.",
  },
  {
    href: "/docs/plugins",
    title: "Plugins",
    group: "extending",
    icon: "ri-puzzle-line",
    summary: "What a plugin is, the sixteen that ship and their knobs, and how one is installed.",
  },
  {
    href: "/docs/marketplace",
    title: "Marketplace",
    group: "extending",
    icon: "ri-store-2-line",
    summary: "Templates and plugins other people wrote, and how to publish your own.",
    children: [
      { href: "/docs/marketplace", title: "What it is", summary: "What is listed, what you can install, and how a listing arrives and leaves." },
      { href: "/docs/marketplace/templates", title: "Publish a template", summary: "What makes one, what the audit checks, and how to submit it." },
      { href: "/docs/marketplace/plugins", title: "Publish a plugin", summary: "A repository with a plugin.json: what the marketplace builds, audits and serves." },
      { href: "/docs/marketplace/getting-paid", title: "Getting paid", summary: "Nothing is sold through the marketplace; what an instance can charge for, and what is promised." },
    ],
  },
  {
    href: "/docs/pricing",
    title: "Pricing",
    group: "project",
    icon: "ri-price-tag-3-line",
    summary: "Free. What that means, and how a free backend pays for itself.",
  },
  {
    href: "/docs/sponsor",
    title: "Support voidbase",
    group: "project",
    icon: "ri-hand-coin-line",
    summary: "Sponsorship, what it pays for, and what it will never buy.",
  },
  {
    href: "/docs/acknowledgments",
    title: "Acknowledgments",
    group: "project",
    icon: "ri-heart-3-line",
    summary: "The projects voidbase is built out of, and the people who wrote them.",
  },
  {
    href: "/docs/roadmap",
    title: "Roadmap",
    group: "project",
    icon: "ri-road-map-line",
    summary: "What is coming, and what is deliberately not.",
  },
  {
    href: "/docs/contribute",
    title: "How to contribute",
    group: "project",
    icon: "ri-git-pull-request-line",
    summary: "Where help matters most, and how to fix a page in about a minute.",
  },
];

/** Every page, in reading order, which is what previous and next walk. A group is walked into, never listed. */
const flatten = (links: DocsLink[]): DocsLink[] => links.flatMap((l) => (l.children?.length ? flatten(l.children) : [l]));
export const DOCS_PAGES: DocsLink[] = flatten(DOCS_NAV);

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
export const samePath = (a: string, b: string) => normalize(a) === normalize(b);

/** whether `path` is this link or anything under it, at any depth */
export function contains(link: DocsLink, path: string): boolean {
  return samePath(link.href, path) || !!link.children?.some((c) => contains(c, path));
}

/** the chain of groups from the top-level section down to the page, which is what the breadcrumbs read */
function trailTo(links: DocsLink[], path: string): DocsLink[] {
  for (const link of links) {
    if (link.children?.length) {
      const deeper = trailTo(link.children, path);
      if (deeper.length) return [link, ...deeper];
    }
    if (samePath(link.href, path)) return [link];
  }
  return [];
}

/** where a path sits in the documentation: its section, its page, its trail, and what is either side of it */
export function locate(path: string): { section?: DocsLink; page?: DocsLink; trail: DocsLink[]; prev?: DocsLink; next?: DocsLink } {
  const trail = trailTo(DOCS_NAV, path);
  const at = DOCS_PAGES.findIndex((p) => samePath(p.href, path));
  return {
    section: trail[0] ?? DOCS_NAV.find((s) => contains(s, path)),
    page: DOCS_PAGES[at],
    trail,
    prev: at > 0 ? DOCS_PAGES[at - 1] : undefined,
    next: at >= 0 ? DOCS_PAGES[at + 1] : undefined,
  };
}
