import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onScroll = () => setActive(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`btn btn-lg btn-circle btn-secondary scroll-to-top${active ? " scroll-top-active" : ""}`}
      aria-label="Go to top"
      onClick={() => { if (document.documentElement) document.documentElement.scrollTop = 0; }}
    >
      <i className="ri-arrow-up-line" />
    </button>
  );
}
