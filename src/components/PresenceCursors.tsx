// The live cursors on the landing page: who else is here right now, pointing at the same things you are.
//
// It is this site's own backend doing it (voidbase's presence topic, docs/deploy.md), and the cost is bounded by the
// server, not by hope: only the newest few visitors hold a slot and may send anything, everyone else watches over the
// one realtime connection they already have. A visitor without a slot costs one hibernatable socket.
//
// Four things keep it from being annoying or expensive:
//   - joining waits (JOIN_AFTER_MS): a visitor who scrolls straight past never claims a slot, so the roster is not
//     churned by drive-by loads;
//   - beats are throttled (BEAT_MS) and only sent by a visitor holding a slot, with a heartbeat so a still cursor
//     keeps it;
//   - only a device that can actually point takes a slot, so a phone never holds one it cannot use;
//   - if the backend says presence is off (one variable, VOIDBASE_PRESENCE=0), or anything fails, the same few
//     cursors drift along a canned path instead. The page never looks broken and costs nothing.
//
// Coordinates are percentages of the whole scrolling page, not of any one element, which is what makes "point at
// anything" work: a visitor pointing a third of the way down is drawn a third of the way down everyone else's page,
// however wide their window is. Which box that is has to be found rather than assumed -- this site scrolls an
// element inside the document rather than the document itself, so pageY and window.scrollY are both frozen at the
// top and would put every cursor on the hero forever. `scroller()` walks up from the layer to whatever actually
// scrolls, and falls back to the document for the ordinary case. The layer itself is fixed to the window and each
// cursor is placed by subtracting that scroll, so a remote cursor stays on the paragraph it was pointing at while
// you scroll past it.
//
// Your own cursor is drawn here too, and the real one is hidden (POINTER_QUERY devices only). That is deliberate: it
// is the same arrow everyone else sees, so the page shows you what you look like to them, whether or not you hold a
// slot. It follows the pointer on the event itself rather than through the smoothing loop, so it never lags, and it
// steps aside over text fields, where the system's I-beam says something the arrow cannot.
import { useEffect, useMemo, useRef, useState } from "react";
import { vb, VB_URL } from "@/lib/vb";

const JOIN_AFTER_MS = 2000; // on the page this long before taking a slot
const BEAT_MS = 80; // ~12 a second while moving
const HEARTBEAT_MS = 4000; // keeps a still cursor's slot alive
const SMOOTHING = 0.24; // how much of the way to the target a remote cursor travels each frame
const POINTER_QUERY = "(hover: hover) and (pointer: fine)"; // a mouse or trackpad, not a finger
const TEXT_FIELDS = "input, textarea, select, [contenteditable=true], [contenteditable=plaintext-only]";
const CLICKABLE = "a, button, summary, label, [role=button], [role=link], [role=tab], .btn, .clickable";
const NAMES = ["Alan", "Jonny", "Copple", "Terry", "Ada", "Grace", "Linus", "Rasmus", "Yukihiro", "Bjarne"];
const COLORS = ["#5b8def", "#3ecf8e", "#f06a50", "#f1a10d", "#c46bf0", "#22b8cf"];

export interface PresenceMember { id: string; name: string; color: string; x: number; y: number }
/** a cursor to draw: `viewport` marks the canned ones, which roam the window rather than the document */
type Cursor = PresenceMember & { viewport?: boolean };
interface PresenceState { enabled: boolean; members: PresenceMember[]; max?: number }

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const url = (path: string) => `${VB_URL || ""}${path}`;
const matches = (q: string) => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(q).matches;

/** The element that actually scrolls this page: the nearest scrollable ancestor of `from`, else the document. */
function scroller(from: Element | null): Element {
  for (let el = from; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const s = getComputedStyle(el);
    if (["auto", "scroll", "overlay"].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
  }
  return document.scrollingElement ?? document.documentElement;
}
/** Where that box is and how big it is. The document's own rect moves with the scroll, so it is pinned to 0,0. */
function metricsOf(el: Element): { el: Element; w: number; h: number; left: number; top: number } {
  const isDoc = el === document.scrollingElement || el === document.documentElement || el === document.body;
  const r = isDoc ? { left: 0, top: 0 } : el.getBoundingClientRect();
  return { el, w: Math.max(el.scrollWidth, 1), h: Math.max(el.scrollHeight, 1), left: r.left, top: r.top };
}

/** The canned fallback: a few cursors on gentle Lissajous paths, so the page still shows the idea when nobody is here. */
function useCannedMembers(active: boolean): Cursor[] {
  const [members, setMembers] = useState<Cursor[]>([]);
  useEffect(() => {
    if (!active) return;
    const cast = [
      { id: "c1", name: "Alan", color: COLORS[1]!, ax: 26, ay: 18, sx: 0.00042, sy: 0.00061, px: 30, py: 44 },
      { id: "c2", name: "Jonny", color: COLORS[0]!, ax: 22, ay: 15, sx: 0.00035, sy: 0.00048, px: 62, py: 32 },
      { id: "c3", name: "Copple", color: COLORS[2]!, ax: 18, ay: 16, sx: 0.00051, sy: 0.00039, px: 44, py: 62 },
    ];
    let raf = 0;
    const frame = (t: number) => {
      setMembers(cast.map((c) => ({ id: c.id, name: c.name, color: c.color, viewport: true, x: c.px + c.ax * Math.sin(t * c.sx), y: c.py + c.ay * Math.sin(t * c.sy) })));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return members;
}

export default function PresenceCursors() {
  const [live, setLive] = useState<PresenceState | null>(null);
  const [holdsSlot, setHoldsSlot] = useState<boolean | null>(null); // null until the server has answered once
  const [pointing, setPointing] = useState(false); // this device can point, so it gets an arrow of its own
  const identity = useMemo(() => ({ id: Math.random().toString(36).slice(2, 12), name: pick(NAMES), color: pick(COLORS) }), []);
  const canned = useCannedMembers(live !== null && !live.enabled);

  const layer = useRef<HTMLDivElement | null>(null);
  const box = useRef<{ el: Element; w: number; h: number; left: number; top: number } | null>(null);
  const own = useRef<HTMLDivElement | null>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const targets = useRef(new Map<string, Cursor>());
  const drawn = useRef(new Map<string, { x: number; y: number }>());

  // which box the percentages are of. It is measured rather than assumed, and measured again as the page settles:
  // images and fonts change its height after the first frame, and a window resize changes it again.
  useEffect(() => {
    const measure = () => { box.current = metricsOf(scroller(layer.current?.parentElement ?? null)); };
    measure();
    const settle = window.setInterval(measure, 500);
    window.addEventListener("resize", measure);
    return () => { window.clearInterval(settle); window.removeEventListener("resize", measure); };
  }, []);

  // does this device have a pointer to take over
  useEffect(() => {
    if (!matches(POINTER_QUERY)) return;
    setPointing(true);
    document.documentElement.classList.add("presence-pointer");
    return () => document.documentElement.classList.remove("presence-pointer");
  }, []);

  // is presence on, and who is here already
  useEffect(() => {
    let cancelled = false;
    fetch(url("/api/presence"), { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? (r.json() as Promise<PresenceState>) : { enabled: false, members: [] }))
      .then((s) => { if (!cancelled) setLive({ enabled: !!s.enabled, members: Array.isArray(s.members) ? s.members : [], max: s.max }); })
      .catch(() => { if (!cancelled) setLive({ enabled: false, members: [] }); });
    return () => { cancelled = true; };
  }, []);

  // watch: one realtime subscription, however many people are here
  useEffect(() => {
    if (!live?.enabled) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void vb().realtime
      .subscribe("presence", (msg: unknown) => {
        const data = msg as { members?: PresenceMember[] };
        if (Array.isArray(data?.members)) setLive((prev) => (prev ? { ...prev, members: data.members! } : prev));
      })
      .then((unsub) => { if (cancelled) void unsub(); else stop = () => void unsub(); })
      .catch(() => { /* watching is best effort: the roster still arrives on the next poll of the page */ });
    return () => { cancelled = true; stop?.(); };
  }, [live?.enabled]);

  // the pointer: your own arrow every frame it moves, and a beat for everyone else when you hold a slot
  useEffect(() => {
    if (!pointing) return;
    const root = document.documentElement;
    const enabled = !!live?.enabled;
    let joined = false, holds = false, timer = 0, beatAt = 0;
    let page: { x: number; y: number } | null = null;

    const send = async (op: "join" | "beat" | "leave") => {
      try {
        const r = await fetch(url("/api/presence"), {
          method: "POST", headers: { "content-type": "application/json" }, keepalive: op === "leave",
          body: JSON.stringify({ op, id: identity.id, name: identity.name, color: identity.color, x: page?.x ?? 50, y: page?.y ?? 50 }),
        });
        if (!r.ok) return;
        const s = (await r.json()) as PresenceState & { holdsSlot?: boolean };
        holds = !!s.holdsSlot;
        setHoldsSlot(holds);
        if (Array.isArray(s.members)) setLive((prev) => (prev ? { ...prev, members: s.members } : prev));
      } catch { /* a lost beat is a lost frame, nothing more */ }
    };

    const move = (e: PointerEvent) => {
      // your own arrow: straight from the event, so it sits exactly where the real one would have
      const node = own.current;
      if (node) {
        node.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        const el = e.target instanceof Element ? e.target : null;
        const overText = !!el?.closest(TEXT_FIELDS);
        node.classList.toggle("is-hidden", overText);
        node.classList.toggle("is-clickable", !overText && !!el?.closest(CLICKABLE));
        root.classList.toggle("presence-native-cursor", overText);
        if (!node.classList.contains("is-live")) node.classList.add("is-live");
      }
      if (!enabled) return;
      // everyone else's copy: where this is on the page, as a share of the box that scrolls
      const b = box.current;
      if (!b) return;
      page = { x: ((e.clientX - b.left + b.el.scrollLeft) / b.w) * 100, y: ((e.clientY - b.top + b.el.scrollTop) / b.h) * 100 };
      const now = performance.now();
      if (!joined || !holds || now - beatAt < BEAT_MS) return;
      beatAt = now;
      void send("beat");
    };

    // your arrow goes with the pointer when it leaves the window, and comes back with it
    const out = (e: PointerEvent) => { if (!e.relatedTarget) own.current?.classList.remove("is-live"); };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });

    let heartbeat = 0, leave = () => { /* nothing joined */ };
    if (enabled) {
      // the wait: a visitor who is still here after JOIN_AFTER_MS takes a slot, the one that joined first loses it
      timer = window.setTimeout(() => { joined = true; void send("join"); }, JOIN_AFTER_MS);
      heartbeat = window.setInterval(() => { if (joined && holds && performance.now() - beatAt > HEARTBEAT_MS) { beatAt = performance.now(); void send("beat"); } }, HEARTBEAT_MS);
      leave = () => { if (joined) void send("leave"); };
      window.addEventListener("pagehide", leave);
    }

    return () => {
      window.clearTimeout(timer); window.clearInterval(heartbeat);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pagehide", leave);
      root.classList.remove("presence-native-cursor");
      leave();
    };
  }, [pointing, live?.enabled, identity]);

  const others: Cursor[] = (live?.enabled ? live.members : canned).filter((m) => m.id !== identity.id);

  // what each remote cursor is heading for; the loop below walks it there
  useEffect(() => {
    const keep = new Set(others.map((m) => m.id));
    for (const m of others) targets.current.set(m.id, m);
    for (const id of [...targets.current.keys()]) if (!keep.has(id)) { targets.current.delete(id); drawn.current.delete(id); }
  }, [others]);

  // one loop places every remote cursor: document share -> this window, smoothed, so a 12-a-second beat still glides
  useEffect(() => {
    const reduce = matches("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const step = () => {
      const b = box.current;
      const sx = b ? b.el.scrollLeft : 0, sy = b ? b.el.scrollTop : 0;
      for (const [id, node] of nodes.current) {
        const t = targets.current.get(id);
        if (!t) continue;
        const toX = t.viewport || !b ? (t.x / 100) * window.innerWidth : (t.x / 100) * b.w + b.left - sx;
        const toY = t.viewport || !b ? (t.y / 100) * window.innerHeight : (t.y / 100) * b.h + b.top - sy;
        const at = drawn.current.get(id) ?? { x: toX, y: toY };
        const k = reduce ? 1 : SMOOTHING;
        at.x += (toX - at.x) * k; at.y += (toY - at.y) * k;
        drawn.current.set(id, at);
        node.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setNode = (id: string) => (el: HTMLDivElement | null) => { if (el) nodes.current.set(id, el); else { nodes.current.delete(id); drawn.current.delete(id); } };
  const roster = pointing ? [...others, { ...identity, x: 0, y: 0 }] : others;

  return (
    <div ref={layer} className="presence-layer" aria-hidden="true">
      {roster.length > 0 && (
        <div className="presence-avatars">
          {roster.map((m) => (
            <div key={m.id} className="presence-avatar" style={{ boxShadow: `0 0 0 2px #000, 0 0 0 4px ${m.color}` }} title={m.name}>
              {m.id === identity.id ? "You" : initials(m.name)}
            </div>
          ))}
        </div>
      )}

      {others.map((m) => (
        <div key={m.id} ref={setNode(m.id)} className="presence-cursor">
          <Arrow color={m.color} />
          <span className="presence-name" style={{ backgroundColor: m.color }}>{m.name}</span>
        </div>
      ))}

      {pointing && (
        <div ref={own} className="presence-cursor presence-cursor-own">
          <Arrow color={identity.color} />
          <span className="presence-name" style={{ backgroundColor: identity.color }}>
            You{live?.enabled && holdsSlot === false ? " · watching" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" focusable="false">
      <path
        d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
        fill={color} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}
