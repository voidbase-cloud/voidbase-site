// `hl.bash`...`` marks a snippet for the build to highlight. Nothing here runs: the Vite plugin in
// scripts/highlight.ts replaces every one of these expressions with the finished block before the module is
// bundled, which is what puts the colours in the page's own chunk instead of in a highlighter the browser has to
// download. These functions exist so the editor knows the shape and so a missing plugin fails loudly.
export interface Block {
  language: string;
  /** what the block renders: highlighted code, or a rendered document when the language is markdown */
  html: string;
  /** the markdown source, so copying a document gives back the markdown rather than the rendered text */
  content?: string;
}

const uncompiled = (): Block => {
  throw new Error("hl`` was not compiled; scripts/highlight.ts is missing from the Vite plugins");
};

type Tag = (strings: TemplateStringsArray) => Block;

export const hl: Record<
  | "bash" | "sh" | "shell"
  | "js" | "javascript" | "ts" | "typescript"
  | "json" | "yaml" | "yml" | "systemd"
  | "go" | "dart"
  | "md" | "markdown"
  // no grammar to highlight: a file git reads, a file something else reads, and what the terminal printed
  | "gitignore" | "text" | "output",
  Tag
> = {
  bash: uncompiled,
  sh: uncompiled,
  shell: uncompiled,
  js: uncompiled,
  javascript: uncompiled,
  ts: uncompiled,
  typescript: uncompiled,
  json: uncompiled,
  yaml: uncompiled,
  yml: uncompiled,
  systemd: uncompiled,
  go: uncompiled,
  dart: uncompiled,
  md: uncompiled,
  markdown: uncompiled,
  gitignore: uncompiled,
  text: uncompiled,
  output: uncompiled,
};
