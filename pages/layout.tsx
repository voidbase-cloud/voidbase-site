// The site chrome, around every page: header, content wrapper, footer, back-to-top. The landing page opts out with
// its own layout (pages/_layouts/blank.tsx), the way the SvelteKit site's (blank) group did.
import { useEffect, type ReactNode } from "react";
import "@/scss/main.scss";
import PageFooter from "@/components/PageFooter";
import PageHeader from "@/components/PageHeader";
import ScrollToTop from "@/components/ScrollToTop";

export default function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // scroll to the hash element by hand: content rendered after the initial paint can misplace the browser's anchor
    const timeout = setTimeout(() => {
      const anchor = window.location.hash && document.getElementById(window.location.hash.substring(1));
      if (!anchor) return;
      const parentAccordion = anchor.closest<HTMLElement>(".accordion-header");
      if (parentAccordion) parentAccordion.click();
      else anchor.scrollIntoView({ behavior: "auto" });
      document.documentElement.classList.add("smooth-scroll");
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <PageHeader compact />
      <main className="wrapper wrapper-lg page-content-wrapper">{children}</main>
      <PageFooter />
      <ScrollToTop />
    </>
  );
}
