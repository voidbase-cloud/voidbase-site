import { useMemo } from "react";
import Prism from "prismjs";
import "prismjs/plugins/normalize-whitespace/prism-normalize-whitespace.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-dart.js";
import "@/scss/prism_dark.scss";
import "@/scss/prism_light.scss";

export interface CodeBlockProps {
  /** extra classes on the wrapper; named `class` because that is what the Svelte component exported */
  class?: string;
  theme?: "dark" | "light";
  content?: string;
  language?: string; // go, javascript, html, css
}

function highlight(code: string, language: string) {
  code = typeof code === "string" ? code : "";

  // @see https://prismjs.com/plugins/normalize-whitespace
  code = Prism.plugins.NormalizeWhitespace.normalize(code, {
    "remove-trailing": true,
    "remove-indent": true,
    "left-trim": true,
    "right-trim": true,
  });

  return Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language);
}

export default function CodeBlock({
  class: classes = "m-b-sm",
  theme = "dark",
  content = "",
  language = "javascript",
}: CodeBlockProps) {
  const formattedContent = useMemo(
    () => (typeof Prism !== "undefined" && content ? highlight(content, language) : ""),
    [content, language],
  );

  return (
    <div className={`code-wrapper ${classes} ${theme === "dark" ? "prism-dark" : "prism-light"}`}>
      <code dangerouslySetInnerHTML={{ __html: formattedContent }} />
    </div>
  );
}
