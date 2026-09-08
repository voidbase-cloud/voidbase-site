import { useEffect, useState } from "react";
import { pageScroller, scrollPageToTop } from "@/lib/pageScroll";

export default function ScrollToTop() {
  const [active, setActive] = useState(false);

  // the document does not scroll on this site, so window.scrollY is 0 everywhere and this button never appeared
  useEffect(() => {
    const box = pageScroller();
    const onScroll = () => setActive(box.scrollTop > 200);
    onScroll();
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => box.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`btn btn-lg btn-circle btn-secondary scroll-to-top${active ? " scroll-top-active" : ""}`}
      aria-label="Go to top"
      onClick={() => scrollPageToTop("smooth")}
    >
      <i className="ri-arrow-up-line" />
    </button>
  );
}
