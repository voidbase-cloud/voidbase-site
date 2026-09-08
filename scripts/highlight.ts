// A Vite plugin that highlights code where it is written, at build time.
//
// The site is prerendered, so the server can highlight every block and the visitor downloads the result. That is
// true right up until the router navigates: it renders the next page in the browser, where a highlighter that only
// ran on the server produces plain text. Shipping the highlighter to fix that costs 98KB gzipped; shipping its
// output costs 12KB for every block on the site. So the output is what ships.
//
// The transform is textual and deliberately dumb: it finds `hl.<language>` followed by a template literal, runs
// Shiki over the string, and replaces the whole expression with the object the block renders. Nothing parses JSX,
// and a template with a `${}` in it is a build error rather than a silent miss, because a snippet that cannot be
// resolved at build time is a snippet that would arrive uncoloured. What is left in the module is a string, so it
// lands in that page's own chunk and no page pays for another page's code.
import { marked } from "marked";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bashLang from "shiki/langs/bash.mjs";
import dartLang from "shiki/langs/dart.mjs";
import goLang from "shiki/langs/go.mjs";
import jsLang from "shiki/langs/javascript.mjs";
import jsonLang from "shiki/langs/json.mjs";
import tsLang from "shiki/langs/typescript.mjs";
import yamlLang from "shiki/langs/yaml.mjs";
import shikiTheme from "shiki/themes/vitesse-dark.mjs";
import type { Plugin } from "vite";

const THEME = "vitesse-dark";

/** what an author may write after `hl.`, and the grammar it means */
const GRAMMARS: Record<string, string> = {
  bash: "bash",
  sh: "bash",
  shell: "bash",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  go: "go",
  dart: "dart",
  md: "markdown",
  markdown: "markdown",
};

let highlighter: { codeToHtml(code: string, o: { lang: string; theme: string }): string } | null = null;
function highlight(code: string, grammar: string): string {
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      themes: [shikiTheme],
      langs: [bashLang, dartLang, goLang, jsLang, jsonLang, tsLang, yamlLang],
      engine: createJavaScriptRegexEngine(),
    }) as unknown as typeof highlighter;
  }
  return highlighter!.codeToHtml(code, { lang: grammar, theme: THEME });
}

/**
 * A snippet is written as an indented template literal, so it arrives wearing the indentation of the code around it.
 * Removing the indent every line shares keeps whatever nesting the snippet itself has, and dropping the blank first
 * and last lines stops the backtick on its own line from becoming an empty row.
 */
export function dedent(raw: string): string {
  const lines = raw.replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[0]!.trim()) lines.shift();
  while (lines.length && !lines.at(-1)!.trim()) lines.pop();
  const shared = lines
    .filter((l) => l.trim())
    .reduce((least, l) => Math.min(least, l.length - l.trimStart().length), Infinity);
  return lines.map((l) => l.slice(Number.isFinite(shared) ? shared : 0).trimEnd()).join("\n");
}

const lineOf = (src: string, at: number) => src.slice(0, at).split("\n").length;

/** where the template literal opened at `open` closes, respecting escapes and refusing substitutions */
function closes(src: string, open: number, id: string): number {
  for (let i = open + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") { i++; continue; }
    if (c === "`") return i;
    if (c === "$" && src[i + 1] === "{") {
      throw new Error(`${id}:${lineOf(src, i)}: a hl\`\` snippet cannot interpolate, because it is compiled before it runs`);
    }
  }
  throw new Error(`${id}:${lineOf(src, open)}: unterminated hl\`\` snippet`);
}

export function compile(src: string, id: string): string | null {
  if (!src.includes("hl.")) return null;
  const re = /\bhl\.([A-Za-z0-9_]+)\s*`/g;
  let out = "";
  let read = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const grammar = GRAMMARS[m[1]!];
    if (!grammar) {
      throw new Error(`${id}:${lineOf(src, m.index)}: hl.${m[1]} is not a language this build can highlight`);
    }
    const open = re.lastIndex - 1;
    const end = closes(src, open, id);
    // the body is a template literal with no substitutions, so JavaScript's own reading of it is the right one
    const text = dedent(new Function(`return \`${src.slice(open + 1, end)}\``)() as string);
    const html = grammar === "markdown"
      ? (marked.parse(text, { async: false, gfm: true, breaks: false }) as string)
      : highlight(text, grammar);
    // markdown keeps its source, because copying a rendered document gives you the document and not the markdown
    const block = grammar === "markdown"
      ? { language: grammar, html, content: text }
      : { language: grammar, html };
    out += src.slice(read, m.index) + JSON.stringify(block);
    read = end + 1;
    re.lastIndex = read;
  }
  return read ? out + src.slice(read) : null;
}

export function highlightPlugin(): Plugin {
  return {
    name: "voidbase-site:highlight",
    // before anything rewrites the source, so what this reads is what the author wrote
    enforce: "pre",
    transform(src, id) {
      if (!/\.(t|j)sx?$/.test(id) || id.includes("/node_modules/")) return null;
      // the old shape passed raw text and highlighted it at render time, which is the bug this replaced: a block
      // written that way is silently plain after a client-side navigation. Catch it here rather than in the browser.
      if (/<CodeBlock[^>]*\scontent=/.test(src) && !id.endsWith("/components/CodeBlock.tsx")) {
        throw new Error(`${id}: <CodeBlock content={...}> no longer exists; write the snippet as hl.<language>\`...\``);
      }
      const out = compile(src, id);
      return out === null ? null : { code: out, map: null };
    },
  };
}
