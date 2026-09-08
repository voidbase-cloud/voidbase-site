// The tree on the front page of the documentation.
//
// Two questions get people to the right page. What do you want to do, and then which shape of it. Everything else
// in these docs hangs off one of the five leaves below, so this is the only place that has to be read in order.
//
// The condition on each branch is written as the reader's own sentence, because someone choosing a backend knows
// what they want before they know what we call it.
import { Link } from "@void/react";

export interface Leaf {
  /** the reader's own words for what they want */
  when: string;
  href: string;
  title: string;
  /** the first command, where there is one */
  command?: string;
  /** why this one and not its sibling */
  because: string;
  soon?: boolean;
}

export interface Branch {
  question: string;
  detail: string;
  leaves: Leaf[];
}

export const BRANCHES: Branch[] = [
  {
    question: "I want one running",
    detail: "No code of your own. A working backend with an admin panel, in about a minute.",
    leaves: [
      {
        when: "on this machine, with nothing installed",
        href: "/docs/run/standalone",
        title: "Standalone executable",
        command: "./voidbase serve",
        because: "One file holding the server, the panel and the database. No npm, no build, no account.",
      },
      {
        when: "from a terminal, here or on Cloudflare",
        href: "/docs/run/npm",
        title: "With the npm CLI",
        command: "bun i -g @voidbase-cloud/voidbase",
        because:
          "Make, list and delete instances by name, on this machine or in your own Cloudflare account. The same commands either way.",
      },
      {
        when: "from a dashboard, with nothing to install",
        href: "/docs/run/cloud",
        title: "voidbase cloud",
        because: "Sign in, name it, and it is provisioned for you. Still experimental.",
        soon: true,
      },
    ],
  },
  {
    question: "I want to build on one",
    detail: "Your endpoints, your schema, your repository. Both of these deploy to your own Cloudflare account.",
    leaves: [
      {
        when: "as a backend my app talks to",
        href: "/docs/run/project",
        title: "A voidbase project",
        command: "voidbase init",
        because:
          "PocketBase's layout, so it drops into whatever stack you already have. Pick this if your frontend exists.",
      },
      {
        when: "as one application, site included",
        href: "/docs/run/stack",
        title: "The voidbase stack",
        command: "bunx void init",
        because:
          "Pages, typed routes and the backend in one project, deployed as a single Worker. Pick this if you are starting from nothing.",
      },
    ],
  },
];

export default function DecisionTree() {
  return (
    <div className="tree">
      {BRANCHES.map((b) => (
        <section key={b.question} className="tree-branch">
          <h2 className="tree-question">{b.question}</h2>
          <p className="tree-detail">{b.detail}</p>
          <ul className="tree-leaves">
            {b.leaves.map((l) => (
              <li key={l.href} className="tree-leaf">
                <span className="tree-when">{l.when}</span>
                <Link href={l.href} className="tree-card">
                  <span className="tree-card-head">
                    <strong>{l.title}</strong>
                    {l.soon && <em className="tree-soon">soon</em>}
                  </span>
                  <span className="tree-because">{l.because}</span>
                  {l.command && <code className="tree-command">{l.command}</code>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
