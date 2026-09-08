// A new page starts at the top.
//
// The router swaps the page without touching the scroll box, so following a link from halfway down one page put you
// halfway down the next one. A link to an anchor is the exception: that one is asking for a particular place, and
// the layout's own hash handling takes it there.
import { useEffect } from "react";
import { useRouter } from "@void/react";
import { scrollPageToTop } from "@/lib/pageScroll";

export default function ScrollOnNavigate() {
  const path = useRouter().path;
  useEffect(() => {
    if (window.location.hash) return;
    scrollPageToTop();
  }, [path]);
  return null;
}
