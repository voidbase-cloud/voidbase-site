// The chrome-free layout, the SvelteKit site's (blank) route group: no header, no footer, no content wrapper — the
// landing page renders PageHeader and PageFooter itself, inside its own hero markup.
import type { ReactNode } from "react";
import "@/scss/main.scss";

export default function BlankLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
