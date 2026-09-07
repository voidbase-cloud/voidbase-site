// The site's tooltip is a plain DOM helper (src/lib/tooltip.js, kept from the SvelteKit site because it touches no
// framework). This hook attaches it to an element the React way: spread the returned ref onto the node.
import { useEffect, useRef } from "react";
// a plain JS helper carried over from the SvelteKit site (allowJs picks it up)
import tooltip from "@/lib/tooltip";

export interface TooltipOptions {
  text: string;
  position?: "top" | "right" | "bottom" | "left" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  delay?: number;
  hideOnClick?: boolean | null;
  class?: string;
}

export function useTooltip<T extends HTMLElement>(options: TooltipOptions | string | null) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !options) return;
    const handle = (tooltip as (n: HTMLElement, o: unknown) => { destroy(): void })(node, options);
    return () => handle.destroy();
  }, [ref, typeof options === "string" ? options : options?.text, typeof options === "string" ? "bottom" : options?.position]);
  return ref;
}
