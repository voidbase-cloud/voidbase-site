// Where this site actually scrolls.
//
// It is not the document. Void mounts the app into #app, that element carries the overflow, and the document itself
// never moves: window.scrollY is 0 on every page at every position. Anything written against the window here does
// nothing, quietly, which is how the back-to-top button came to be permanently invisible and the router came to
// leave you halfway down the next page.
//
// The box is found by walking up from the content rather than by name, so a layout change cannot silently break it,
// and the sidebar (which scrolls too) can never be mistaken for it.

/** the scrolling ancestor of `from`, or the document if nothing between here and the root scrolls */
export function scrollerOf(from: Element | null): Element {
  for (let el = from; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const s = getComputedStyle(el);
    if (["auto", "scroll", "overlay"].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
  }
  return document.scrollingElement ?? document.documentElement;
}

/** the box the page itself scrolls in */
export function pageScroller(): Element {
  const content = document.querySelector(".page-content-wrapper, .landing-hero, .page-footer");
  return scrollerOf(content ?? document.getElementById("app"));
}

export function scrollPageToTop(behavior: ScrollBehavior = "auto"): void {
  pageScroller().scrollTo({ top: 0, behavior });
}
