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

/* --- the dawn window: a real pane with frame bars and a light streak.
       Pure CSS; children (e.g. a clock) sit on the glass. --- */
export function WindowPane({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`window-pane relative overflow-hidden ${className}`}>
      {/* muntins */}
      <div className="absolute inset-y-0 left-1/3 w-px bg-ink/15" />
      <div className="absolute inset-y-0 left-2/3 w-px bg-ink/15" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-ink/15" />
      {/* sill shadow */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-ink/10" />
      {children}
    </div>
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

/* --- empty state: an unlit desk waiting for someone --- */
export function EmptyDesk({ className = "h-24 w-48" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true">
      {/* wall shadow */}
      <ellipse cx="100" cy="88" rx="80" ry="7" fill="var(--ink)" opacity="0.06" />
      {/* desk: top face + front edge, slight perspective */}
      <path d="M40 62 L160 62 L154 72 L46 72 Z" fill="#D9C7A2" />
      <rect x="46" y="72" width="108" height="5" rx="1" fill="#C2AC83" />
      <path d="M52 77 l-2 12 M148 77 l2 12" stroke="#B29C74" strokeWidth="3" strokeLinecap="round" />
      {/* unlit lamp */}
      <path
        d="M66 62 V47 L74 42"
        stroke="var(--muted)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="75" cy="41" r="3" fill="var(--muted)" opacity="0.5" />
      {/* closed book */}
      <rect x="108" y="56" width="26" height="5" rx="1.2" fill="var(--mint)" opacity="0.55" />
    </svg>
  );
}
