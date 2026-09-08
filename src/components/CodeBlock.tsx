// A code block: the markup the build produced, marked with the language it is in, and copyable in one click.
//
// Nothing is highlighted here. `hl.<language>`...`` in the page is replaced at build time by scripts/highlight.ts
// with the finished markup, so this component only ever renders a string it was handed. That is what makes it
// correct after a client-side navigation, where the page is rendered in the browser and a server-only highlighter
// would have had nothing to say; and it keeps Shiki out of both bundles, because the highlighter only runs in the
// build.
//
// Copying reads the text back out of the rendered code, so the raw snippet does not have to ship alongside its
// highlighted twin. A markdown block is the exception: what it renders is a document, and copying a document should
// give back the markdown, so those blocks carry their source.
import { useRef, useState } from "react";
import type { Block } from "@/lib/hl";
import bashIcon from "thesvg/bash";
import dartIcon from "thesvg/dart";
import goIcon from "thesvg/go";
import jsIcon from "thesvg/javascript";
import jsonIcon from "thesvg/json";
import mdIcon from "thesvg/markdown";
import tsIcon from "thesvg/typescript";
import yamlIcon from "thesvg/yaml";
import "@/scss/code.scss";

/**
 * An icon may define a gradient and reference it by id. Ids are document-wide, so two icons that both call one "b"
 * collide, and a page with several blocks paints one icon with another's gradient. Namespacing costs one pass over
 * a short string and makes the collision impossible.
 */
function scopeIds(svg: string, key: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${key}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
    // one gradient inheriting another's stops is written as an xlink:href, which is a reference like any other
    .replace(/href="#([^"]+)"/g, `href="#${key}-$1"`);
}

// JSON's and YAML's own marks are drawn for a white page: one is a black-to-white gradient, the other a red glyph
// that goes muddy on black. Their mono variants carry no fill, so they take the colour `.code-lang` sets.
const MARKS: Record<string, { svg: string }> = {
  bash: bashIcon,
  javascript: jsIcon,
  typescript: tsIcon,
  json: { svg: jsonIcon.variants.mono },
  yaml: { svg: yamlIcon.variants.mono },
  go: goIcon,
  dart: dartIcon,
  markdown: mdIcon,
};

export interface CodeBlockProps extends Block {
  /** extra classes on the wrapper; named `class` because that is what the Svelte component exported */
  class?: string;
  /** a name for what this block is: a filename, or where the output came from */
  title?: string;
}

function CopyButton({ text, from }: { text?: string; from: React.RefObject<HTMLDivElement | null> }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`code-copy${done ? " is-done" : ""}`}
      title="Copy to clipboard"
      onClick={() => {
        // the clipboard needs a secure context and permission; if either is missing, say nothing and do nothing
        void navigator.clipboard?.writeText(text ?? from.current?.textContent ?? "").then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          },
          () => undefined,
        );
      }}
    >
      <i className={done ? "ri-check-line" : "ri-file-copy-line"} aria-hidden="true" />
      <span>{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function CodeBlock({ language, html, content, class: classes = "m-b-sm", title }: CodeBlockProps) {
  const body = useRef<HTMLDivElement>(null);
  const markdown = language === "markdown";
  const mark = MARKS[language] ?? MARKS.javascript!;

  return (
    <figure className={`code-block${markdown ? " is-markdown" : ""} ${classes}`}>
      <div className="code-tools">
        <span className="code-lang" dangerouslySetInnerHTML={{ __html: scopeIds(mark.svg, language) }} title={language} />
        <CopyButton text={content} from={body} />
      </div>
      {title && <figcaption className="code-title">{title}</figcaption>}
      <div ref={body} className={markdown ? "md-body" : "code-body"} dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
