// Restrained visual primitives for the dawn study lounge. No scenery:
// these are pieces of the room itself: a window, a lamp mark, path nodes,
// a quiet empty state. Everything leans on CSS light and structure.

/* --- logo mark: a lit desk lamp, reduced to geometry --- */
export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="14.5" cy="9.5" r="3.2" fill="var(--sun)" opacity="0.35" />
      <path
        d="M6 20 h9 M10.5 20 V11 L15 7.5"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="15.4" cy="7.2" r="1.9" fill="var(--sun)" />
    </svg>
  );
}

/* --- adventure path node: an architectural marker, lit when reached --- */
export function PathNode({
  reached,
  current,
  className = "h-4 w-4",
}: {
  reached: boolean;
  current: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`} aria-hidden="true">
      <span
        className={`absolute inset-0 rotate-45 border ${
          reached
            ? "border-sun bg-sun"
            : "border-line bg-surface"
        }`}
      />
      {current && (
        <span className="anim-lampglow absolute -inset-1.5 rotate-45 border border-sun/50" />
      )}
    </span>
  );
}

/* --- empty state: an unlit seat, waiting --- */
export function EmptySeat({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-36 rounded-xl border border-dashed border-line ${className}`}
      aria-hidden="true"
    >
      <div className="relative h-16">
        <div className="absolute left-1/2 top-0 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-line" />
        <div className="absolute bottom-2.5 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border border-dashed border-line" />
      </div>
      <div className="border-t border-dashed border-line px-2.5 pb-2 pt-1.5 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
          empty seat
        </span>
      </div>
    </div>
  );
}
