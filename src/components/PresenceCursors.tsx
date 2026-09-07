// The live cursors over the hero preview: who else is on this page right now, moving in real time.
//
// It is this site's own backend doing it (voidbase's presence topic, docs/deploy.md), and the cost is bounded by
// the server, not by hope: only the newest three visitors hold a slot and may send anything, everyone else watches
// over the one realtime connection they already have. A visitor without a slot costs one hibernatable socket.
//
// Three things keep it from being annoying or expensive:
//   - joining waits (JOIN_AFTER_MS): a visitor who scrolls straight past never claims a slot, so the roster is not
//     churned by drive-by loads;
//   - beats are throttled (BEAT_MS) and only sent while the pointer is over the preview, with a heartbeat so a
//     still cursor keeps its slot;
//   - if the backend says presence is off (one variable, VOIDBASE_PRESENCE=0), or anything fails, the same three
//     cursors drift along a canned path instead. The section never looks broken and costs nothing.
import { useEffect, useMemo, useRef, useState } from "react";
import { vb, VB_URL } from "@/lib/vb";

const JOIN_AFTER_MS = 2000; // on the page this long before taking a slot
const BEAT_MS = 80; // ~12 a second while moving
const HEARTBEAT_MS = 4000; // keeps a still cursor's slot alive
const NAMES = ["Alan", "Jonny", "Copple", "Terry", "Ada", "Grace", "Linus", "Rasmus", "Yukihiro", "Bjarne"];
const COLORS = ["#5b8def", "#3ecf8e", "#f06a50", "#f1a10d", "#c46bf0", "#22b8cf"];

export interface PresenceMember { id: string; name: string; color: string; x: number; y: number }
interface PresenceState { enabled: boolean; members: PresenceMember[]; max?: number }

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]!;
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const url = (path: string) => `${VB_URL || ""}${path}`;

/** The canned fallback: three cursors on gentle Lissajous paths, so the page still shows the idea when nobody is here. */
function useCannedMembers(active: boolean): PresenceMember[] {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  useEffect(() => {
    if (!active) return;
    const cast = [
      { id: "c1", name: "Alan", color: COLORS[1]!, ax: 26, ay: 22, sx: 0.00042, sy: 0.00061, px: 12, py: 34 },
      { id: "c2", name: "Jonny", color: COLORS[0]!, ax: 22, ay: 18, sx: 0.00035, sy: 0.00048, px: 60, py: 26 },
      { id: "c3", name: "Copple", color: COLORS[2]!, ax: 18, ay: 20, sx: 0.00051, sy: 0.00039, px: 40, py: 62 },
    ];
    let raf = 0;
    const frame = (t: number) => {
      setMembers(cast.map((c) => ({ id: c.id, name: c.name, color: c.color, x: c.px + c.ax * Math.sin(t * c.sx), y: c.py + c.ay * Math.sin(t * c.sy) })));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return members;
}

export default function PresenceCursors() {
  const box = useRef<HTMLDivElement | null>(null);
  const [live, setLive] = useState<PresenceState | null>(null);
  const [me, setMe] = useState<PresenceMember | null>(null);
  const identity = useMemo(() => ({ id: Math.random().toString(36).slice(2, 12), name: pick(NAMES), color: pick(COLORS) }), []);
  const canned = useCannedMembers(live !== null && !live.enabled);

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

  // beat: only after the visitor has stayed, only while the pointer is over the preview, only if the server gave a slot
  useEffect(() => {
    if (!live?.enabled) return;
    const el = box.current;
    if (!el) return;
    let joined = false, holds = false, last = 0, timer = 0, beatAt = 0;
    let point: { x: number; y: number } | null = null;

    const send = async (op: "join" | "beat" | "leave") => {
      try {
        const r = await fetch(url("/api/presence"), {
          method: "POST", headers: { "content-type": "application/json" }, keepalive: op === "leave",
          body: JSON.stringify({ op, id: identity.id, name: identity.name, color: identity.color, x: point?.x ?? 50, y: point?.y ?? 50 }),
        });
        if (!r.ok) return;
        const s = (await r.json()) as PresenceState & { holdsSlot?: boolean };
        holds = !!s.holdsSlot;
        if (Array.isArray(s.members)) setLive((prev) => (prev ? { ...prev, members: s.members } : prev));
        setMe(holds ? { ...identity, x: point?.x ?? 50, y: point?.y ?? 50 } : null);
      } catch { /* a lost beat is a lost frame, nothing more */ }
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      point = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) return;
      setMe((prev) => (prev ? { ...prev, x: point!.x, y: point!.y } : prev));
      const now = performance.now();
      if (!joined || !holds || now - beatAt < BEAT_MS) return;
      beatAt = now;
      void send("beat");
    };

    // the wait: a visitor who is still here after JOIN_AFTER_MS takes a slot, the oldest one loses it
    timer = window.setTimeout(() => { joined = true; void send("join"); }, JOIN_AFTER_MS);
    const heartbeat = window.setInterval(() => { if (joined && holds && performance.now() - beatAt > HEARTBEAT_MS) { beatAt = performance.now(); void send("beat"); } }, HEARTBEAT_MS);
    const leave = () => { if (joined) void send("leave"); };

    el.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearTimeout(timer); window.clearInterval(heartbeat);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pagehide", leave);
      void last; leave();
    };
  }, [live?.enabled, identity]);

  const others = (live?.enabled ? live.members : canned).filter((m) => m.id !== identity.id);
  const shown = me ? [...others, me] : others;

  return (
    <div ref={box} className="presence-layer" aria-hidden="true">
      <div className="presence-avatars">
        {shown.map((m) => (
          <div key={m.id} className="presence-avatar" style={{ boxShadow: `0 0 0 2px var(--baseColor, #16161a), 0 0 0 4px ${m.color}` }} title={m.name}>
            {m.id === identity.id ? "You" : initials(m.name)}
          </div>
        ))}
      </div>
      {shown.map((m) => (
        <div key={m.id} className="presence-cursor" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" focusable="false">
            <path
              d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
              fill={m.color} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"
            />
          </svg>
          <span className="presence-name" style={{ backgroundColor: m.color }}>{m.id === identity.id ? "You" : m.name}</span>
        </div>
      ))}
    </div>
  );
}
