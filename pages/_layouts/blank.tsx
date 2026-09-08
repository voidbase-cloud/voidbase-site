// The chrome-free layout, the SvelteKit site's (blank) route group: no header, no footer, no content wrapper — the
// landing page renders PageHeader and PageFooter itself, inside its own hero markup.
import type { ReactNode } from "react";
import BetaBanner from "@/components/BetaBanner";
import ScrollOnNavigate from "@/components/ScrollOnNavigate";
import "@/scss/main.scss";
import "@/scss/beta.scss";

export default function BlankLayout({ children }: { children: ReactNode }) {
  // the banner is the one piece of chrome this layout keeps: "every page" has to include the landing page
  return (
    <>
      <ScrollOnNavigate />
      <BetaBanner />
      {children}
    </>
  );
}
