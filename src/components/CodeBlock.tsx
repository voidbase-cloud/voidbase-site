// A code block: highlighted by Shiki, marked with the language it is in, and copyable in one click.
//
// Shiki never reaches the browser. Grammars are large, these pages are prerendered, and the highlighted markup is
// already in the HTML the visitor downloads, so shipping the highlighter too would pay twice for one result: it was
// 640KB of grammar in the client bundle when it did. Highlighting therefore happens under `import.meta.env.SSR`,
// which Vite replaces with `false` in the client build, leaving the branch dead and the imports only it reaches
// unreachable, so the bundler drops them. The highlighter is built on first use rather than at module scope, because
// a top-level call is a side effect no bundler may remove.
//
// What the client renders instead is the same code without colour. React does not reconcile children set through
// dangerouslySetInnerHTML, so the server's markup survives hydration untouched. It would not survive a re-render,
// which is why the block is memoised and the copy button is its own component: a parent re-rendering for its own
// reasons, or the button's own state changing, must not reach the markup. A caller that shows one of several
// snippets renders them all and hides the rest (pages/index.tsx) rather than changing one block's language.
//
// Markdown is not code and is not treated as it. A block whose language is markdown is parsed and rendered as
// formatted text, because showing someone a document as a syntax-highlighted blob invites them to read it as
// something to run.
import { memo, useState } from "react";
import { marked } from "marked";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bashLang from "shiki/langs/bash.mjs";
import dartLang from "shiki/langs/dart.mjs";
import goLang from "shiki/langs/go.mjs";
import jsLang from "shiki/langs/javascript.mjs";
import jsonLang from "shiki/langs/json.mjs";
import tsLang from "shiki/langs/typescript.mjs";
import shikiTheme from "shiki/themes/vitesse-dark.mjs";
import bashIcon from "thesvg/bash";
import dartIcon from "thesvg/dart";
import goIcon from "thesvg/go";
import jsIcon from "thesvg/javascript";
import jsonIcon from "thesvg/json";
import mdIcon from "thesvg/markdown";
import tsIcon from "thesvg/typescript";
import "@/scss/code.scss";

type Highlighter = { codeToHtml(code: string, o: { lang: string; theme: string }): string };
let highlighter: Highlighter | null = null;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** highlighted on the server, plain in the browser, because the browser already has the server's answer */
function highlight(code: string, grammar: string): string {
  if (!import.meta.env.SSR) return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  // built on first use rather than at module scope: a top-level call is a side effect the client build cannot drop
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      themes: [shikiTheme],
      langs: [bashLang, dartLang, goLang, jsLang, jsonLang, tsLang],
      engine: createJavaScriptRegexEngine(),
    }) as unknown as Highlighter;
  }
  return highlighter.codeToHtml(code, { lang: grammar, theme: "vitesse-dark" });
}

/**
 * An icon may define a gradient and reference it by id. Ids are document-wide, so two icons that both call one "b"
 * collide, and a page with several blocks paints one icon with another's gradient. None of the five below does this
 * today, but the next one added might, and the failure is silent. Namespacing costs one pass over a short string.
 */
function scopeIds(svg: string, key: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${key}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
    // one gradient inheriting another's stops is written as an xlink:href, which is a reference like any other
    .replace(/href="#([^"]+)"/g, `href="#${key}-$1"`);
}

// JSON's own mark is a black-to-white gradient, drawn for a white page: half of it vanishes on a dark block. Its
// mono variant carries no fill, so it takes the colour `.code-lang` sets and reads at any size. The rest are drawn
// light or in their own brand colour and are left alone.
const jsonMark = { svg: jsonIcon.variants.mono };

/** what a language is called here, what it is called in Shiki, and the mark that says so at a glance */
const LANGS: Record<string, { label: string; grammar: string; icon: { svg: string } }> = {
  bash: { label: "shell", grammar: "bash", icon: bashIcon },
  sh: { label: "shell", grammar: "bash", icon: bashIcon },
  shell: { label: "shell", grammar: "bash", icon: bashIcon },
  javascript: { label: "javascript", grammar: "javascript", icon: jsIcon },
  js: { label: "javascript", grammar: "javascript", icon: jsIcon },
  typescript: { label: "typescript", grammar: "typescript", icon: tsIcon },
  ts: { label: "typescript", grammar: "typescript", icon: tsIcon },
  json: { label: "json", grammar: "json", icon: jsonMark },
  go: { label: "go", grammar: "go", icon: goIcon },
  dart: { label: "dart", grammar: "dart", icon: dartIcon },
};
const MARKDOWN = new Set(["markdown", "md"]);

export interface CodeBlockProps {
  /** extra classes on the wrapper; named `class` because that is what the Svelte component exported */
  class?: string;
  content?: string;
  language?: string;
  /** a name for what this block is: a filename, or where the output came from */
  title?: string;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`code-copy${done ? " is-done" : ""}`}
      title="Copy to clipboard"
      onClick={() => {
        // the clipboard needs a secure context and permission; if either is missing, say nothing and do nothing
        void navigator.clipboard?.writeText(text).then(
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

/**
 * Most of these blocks are written as indented template literals, so the code arrives wearing the indentation of the
 * JSX around it. Removing the indent every line shares keeps whatever the code's own nesting was, and dropping the
 * blank first and last lines keeps the backtick on its own line from becoming an empty row in the block.
 */
function dedent(raw: string): string {
  const lines = raw.replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[0]!.trim()) lines.shift();
  while (lines.length && !lines.at(-1)!.trim()) lines.pop();
  const shared = lines
    .filter((l) => l.trim())
    .reduce((least, l) => Math.min(least, l.length - l.trimStart().length), Infinity);
  return lines.map((l) => l.slice(Number.isFinite(shared) ? shared : 0).trimEnd()).join("\n");
}

function CodeBlock({ class: classes = "m-b-sm", content = "", language = "javascript", title }: CodeBlockProps) {
  const code = dedent(content);

  // markdown is a document, so it is rendered as one. Same reasoning as the highlighter: the parse happens on the
  // server, whose output is already in the page the visitor has.
  if (MARKDOWN.has(language)) {
    // an if, not a ternary: the bundler eliminates a dead statement reliably and a dead expression less so
    let html = "";
    if (import.meta.env.SSR) html = marked.parse(code, { async: false, gfm: true, breaks: false }) as string;
    return (
      <figure className={`code-block is-markdown ${classes}`}>
        <div className="code-tools">
          <span className="code-lang" dangerouslySetInnerHTML={{ __html: scopeIds(mdIcon.svg, "md") }} title="Markdown" />
          <CopyButton text={code} />
        </div>
        {title && <figcaption className="code-title">{title}</figcaption>}
        <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />
      </figure>
    );
  }

  const lang = LANGS[language] ?? LANGS.javascript!;
  const html = highlight(code, lang.grammar);

  return (
    <figure className={`code-block ${classes}`}>
      <div className="code-tools">
        <span className="code-lang" dangerouslySetInnerHTML={{ __html: scopeIds(lang.icon.svg, lang.label) }} title={lang.label} />
        <CopyButton text={code} />
      </div>
      {title && <figcaption className="code-title">{title}</figcaption>}
      <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

// The highlighted markup only exists on the server: on the client this component renders the plain text instead, so
// a re-render would swap colour for no colour. Its props are strings, so a shallow compare is exact, and a parent
// re-rendering for its own reasons leaves every block it contains untouched.
export default memo(CodeBlock);
