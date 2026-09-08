// The card at the bottom of every documentation page: the file this page is, and the two ways to change it.
//
// Every page under /docs is one file under pages/, and the mapping is mechanical, so the card can work out its own
// source rather than each page having to declare it. GitHub's /edit/ URL forks the repository for you if you do not
// already have one, opens the file in an editor, and turns Propose changes into a pull request, so the whole
// suggest-a-fix path is one link for someone who has never touched the repository.
import { useState } from "react";
import { SITE } from "@/lib/env";

/** the repository the site lives in, which is not the one voidbase itself lives in */
export const SITE_REPO = "https://github.com/voidbase-cloud/voidbase-site";

/** "/docs/run/npm" is pages/docs/run/npm.tsx, and "/docs" is the index beside them */
export function sourceFor(path: string): string {
  const clean = path.replace(/\/+$/, "") || "/docs";
  return clean === "/docs" ? "pages/docs/index.tsx" : `pages${clean}.tsx`;
}

export const editUrl = (file: string): string => `${SITE_REPO}/edit/master/${file}`;
export const issueUrl = (file: string, path: string): string =>
  `${SITE_REPO}/issues/new?title=${encodeURIComponent(`docs: ${path}`)}&body=${encodeURIComponent(
    `Page: https://voidbase.cloud${path}\nFile: ${file}\n\nWhat is wrong, missing, or confusing:\n\n`,
  )}`;

export default function EditThisPage({ path }: { path: string }) {
  const file = sourceFor(path);
  const [copied, setCopied] = useState(false);

  return (
    <section className="edit-page">
      <div className="edit-page-head">
        <i className="ri-git-pull-request-line" />
        <div>
          <strong>Found something wrong on this page?</strong>
          <p>
            Fix it yourself. The link below opens this file in GitHub's editor and forks the repository for you if
            you need one, and your change becomes a pull request without leaving the browser.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`edit-page-file${copied ? " is-copied" : ""}`}
        title="Copy the path"
        onClick={() => {
          // the clipboard needs a secure context and permission: if either is missing, say nothing and do nothing
          navigator.clipboard?.writeText(file).then(
            () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
            () => undefined,
          );
        }}
      >
        <code>{file}</code>
        <i className={copied ? "ri-check-line" : "ri-file-copy-line"} />
      </button>

      <div className="edit-page-actions">
        <a href={editUrl(file)} className="btn btn-sm btn-secondary" target="_blank" rel="noreferrer noopener">
          <i className="ri-pencil-line" />
          <span className="txt">Improve this page</span>
        </a>
        <a href={issueUrl(file, path)} className="btn btn-sm btn-hint" target="_blank" rel="noreferrer noopener">
          <i className="ri-error-warning-line" />
          <span className="txt">Report it instead</span>
        </a>
        <a href={SITE.discussionsUrl} className="btn btn-sm btn-hint" target="_blank" rel="noreferrer noopener">
          <i className="ri-question-answer-line" />
          <span className="txt">Ask a question</span>
        </a>
      </div>
    </section>
  );
}
