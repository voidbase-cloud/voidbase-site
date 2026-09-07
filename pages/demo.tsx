// Ported from the SvelteKit site's (blank)/demo page: PocketBase's public demo dashboard in a full-height frame.
// It carries no site chrome, so it takes the blank layout instead of the root one.
import { useState } from "react";
import "@/scss/demo.scss";
// a plain JS helper carried over from the SvelteKit site (allowJs picks it up)
import CommonHelper from "@/lib/CommonHelper";

export const layout = "!blank";

export default function Demo() {
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  function copy(value: string) {
    (CommonHelper as { copyToClipboard(v: string): void }).copyToClipboard(value);
    setCopied((prev) => ({ ...prev, [value]: true }));
    setTimeout(() => setCopied((prev) => { const next = { ...prev }; delete next[value]; return next; }), 500);
  }

  const copyButton = (value: string) => (
    <i
      className={`link-hint txt-base ${copied[value] ? "ri-check-double-line" : "ri-file-copy-line"}`}
      title="Copy to clipboard"
      role="button"
      tabIndex={0}
      onClick={() => copy(value)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") copy(value); }}
    />
  );

  return (
    <div className="iframe-wrapper">
      <div className="alert">
        <div className="content txt-center">
          This is a demo of <a href="/">PocketBase</a> admin dashboard. The database resets every hour. Realtime data
          and file upload are disabled.
          <br />
          To login, use
          <div className="inline-flex flex-gap-0">
            Email: <strong>test@example.com</strong>
            {copyButton("test@example.com")}
          </div>
          and
          <div className="inline-flex flex-gap-0">
            Password: <strong>123456</strong>
            {copyButton("123456")}
          </div>
        </div>
      </div>

      <iframe
        src="https://pocketbase.io/_/#/login?demoEmail=test@example.com&demoPassword=123456"
        title="Demo dashboard"
        frameBorder="0"
      />
    </div>
  );
}
