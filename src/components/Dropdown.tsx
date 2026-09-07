// The dropdown the header's responsive menu uses. It replaces the SvelteKit site's Toggler with the same markup and
// classes, so `_dropdown.scss` styles it unchanged: a trigger that toggles `.active` on itself and on the panel,
// closing on outside click, on Esc, and on any click inside (the panel is a list of links).
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface DropdownProps {
  /** the button that opens it; rendered as-is, with `active` and aria-expanded managed here */
  trigger: (props: { active: boolean; onClick: (e: React.MouseEvent) => void; "aria-expanded": boolean }) => ReactNode;
  /** classes for the panel, e.g. "dropdown dropdown-lg dropdown-right dropdown-nowrap" */
  className?: string;
  children: ReactNode;
}

export default function Dropdown({ trigger, className = "dropdown", children }: DropdownProps) {
  const [active, setActive] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setActive(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [active]);

  return (
    <div className="dropdown-wrapper" ref={wrap}>
      {trigger({ active, "aria-expanded": active, onClick: (e) => { e.preventDefault(); e.stopPropagation(); setActive((v) => !v); } })}
      {active && (
        <div className={`${className} active`} onClick={() => setActive(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
