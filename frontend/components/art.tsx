// Hand-drawn SVG illustration library for the seaside study room.
// Everything shares one palette (sea slates, sand, warm sun) so scenes,
// icons, and characters read as a single world. All original artwork.

const SEA = "#7CC3D6";
const SEA_DEEP = "#5FA9BE";
const SAND = "#F0E4C8";
const CLOUD = "#FFFFFF";
const WOOD = "#C9A87C";
const RED = "#E2634D";
const SUNNY = "#F5B860";

/* --- the view from the study room window: island, lighthouse, sailboat --- */
export function SeasideScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 230"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* sun */}
      <circle cx="740" cy="52" r="26" fill={SUNNY} opacity="0.9" />
      <circle cx="740" cy="52" r="36" fill={SUNNY} opacity="0.25" />

      {/* clouds */}
      <g fill={CLOUD} opacity="0.85">
        <ellipse cx="150" cy="48" rx="34" ry="12" />
        <ellipse cx="176" cy="40" rx="22" ry="10" />
        <ellipse cx="470" cy="30" rx="28" ry="10" />
        <ellipse cx="492" cy="24" rx="16" ry="8" />
        <ellipse cx="640" cy="66" rx="24" ry="9" />
      </g>

      {/* birds */}
      <g stroke="#4A6E7E" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M330 88 q6 -6 12 0 q6 -6 12 0" />
        <path d="M372 72 q5 -5 10 0 q5 -5 10 0" />
      </g>

      {/* sea */}
      <rect x="0" y="150" width="900" height="80" fill={SEA} />
      <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" fill="none">
        <path d="M60 178 q14 -6 28 0" />
        <path d="M240 196 q14 -6 28 0" />
        <path d="M420 184 q14 -6 28 0" />
        <path d="M600 200 q14 -6 28 0" />
        <path d="M780 186 q14 -6 28 0" />
      </g>

      {/* island with palm */}
      <g>
        <ellipse cx="150" cy="152" rx="70" ry="16" fill={SAND} />
        <path d="M150 148 q-4 -34 2 -44" stroke="#A8865D" strokeWidth="6" fill="none" strokeLinecap="round" />
        <g fill="#6FAF78">
          <path d="M152 102 q22 -10 34 4 q-20 -2 -32 4 Z" />
          <path d="M152 102 q-22 -10 -34 4 q20 -2 32 4 Z" />
          <path d="M152 100 q4 -18 20 -22 q-10 14 -12 24 Z" />
          <path d="M152 100 q-4 -18 -20 -22 q10 14 12 24 Z" />
        </g>
        <circle cx="146" cy="108" r="3.4" fill="#C97F55" />
        <circle cx="156" cy="110" r="3.4" fill="#C97F55" />
      </g>

      {/* sailboat */}
      <g>
        <path d="M470 150 l14 -34 v34 Z" fill={CLOUD} />
        <path d="M488 150 l-2 -26 l16 26 Z" fill="#F7ECD2" />
        <line x1="484" y1="112" x2="484" y2="150" stroke="#A8865D" strokeWidth="2.5" />
        <path d="M462 150 h44 l-7 10 h-30 Z" fill={RED} />
      </g>

      {/* lighthouse on rocks */}
      <g>
        <ellipse cx="796" cy="154" rx="58" ry="14" fill="#93A3B0" />
        <ellipse cx="760" cy="158" rx="24" ry="9" fill="#7E909E" />
        <path d="M780 148 l6 -74 h20 l6 74 Z" fill={CLOUD} />
        <path d="M782 130 l1.5 -18 h29 l1.5 18 Z" fill={RED} transform="translate(-2 0)" />
        <path d="M784 104 l1 -12 h26 l1 -0.01 l1 12 Z" fill={RED} transform="translate(-2 0)" />
        <rect x="784" y="62" width="24" height="14" rx="3" fill="#3E6472" />
        <circle cx="796" cy="69" r="5" fill={SUNNY} className="anim-lampglow" />
        <path d="M792 56 h8 l4 8 h-16 Z" fill="#3E6472" />
        {/* light beam */}
        <path d="M801 64 L868 44 L868 84 Z" fill={SUNNY} opacity="0.25" className="anim-lampglow" />
      </g>

      {/* sand foreground */}
      <path d="M0 214 q220 -18 450 0 q230 18 450 0 V230 H0 Z" fill={SAND} />
    </svg>
  );
}

/* --- small logo mark: sun setting over a wave --- */
export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="10" r="6" fill={SUNNY} />
      <path
        d="M1 15 q3 -3.5 6 0 t6 0 t6 0 t6 0 V24 H1 Z"
        fill={SEA_DEEP}
      />
    </svg>
  );
}

/* --- adventure stop icons, keyed by stop index --- */
export function StopIcon({
  index,
  reached,
  className = "h-7 w-7",
}: {
  index: number;
  reached: boolean;
  className?: string;
}) {
  const main = reached ? "#EF8A47" : "#8FA9B5";
  const soft = reached ? "#F5B860" : "#B9CDD6";
  const icons = [
    // 0 window desk
    <g key="desk">
      <rect x="4" y="4" width="16" height="10" rx="1.5" fill={soft} />
      <path d="M6 12 q6 -8 12 0" fill={SEA} />
      <rect x="3" y="15" width="18" height="2.5" rx="1" fill={main} />
      <rect x="5" y="17.5" width="2" height="4" fill={main} />
      <rect x="17" y="17.5" width="2" height="4" fill={main} />
    </g>,
    // 1 boardwalk library
    <g key="books">
      <rect x="4" y="6" width="4.5" height="14" rx="1" fill={main} />
      <rect x="9.5" y="4" width="4.5" height="16" rx="1" fill={soft} />
      <rect x="15" y="8" width="4.5" height="12" rx="1" fill={main} transform="rotate(8 17 14)" />
    </g>,
    // 2 tide-pool cafe
    <g key="cafe">
      <path d="M5 9 h11 v7 a5 5 0 0 1 -11 0 Z" fill={soft} />
      <path d="M16 10.5 q4 0 4 3 t-4 3" fill="none" stroke={main} strokeWidth="1.8" />
      <path d="M8 6 q1.5 -2 0 -3.5 M12 6 q1.5 -2 0 -3.5" stroke={main} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>,
    // 3 harbor rooftop: anchor
    <g key="anchor" stroke={main} strokeWidth="2" fill="none" strokeLinecap="round">
      <circle cx="12" cy="5.5" r="2.5" />
      <line x1="12" y1="8" x2="12" y2="18" />
      <line x1="7" y1="11" x2="17" y2="11" />
      <path d="M5 15 q1 5 7 5 q6 0 7 -5" />
    </g>,
    // 4 cliff trail
    <g key="cliff">
      <path d="M3 20 L10 6 L14 13 L17 9 L21 20 Z" fill={soft} />
      <path d="M10 6 L14 13 L12.2 15 L8 12 Z" fill={main} />
    </g>,
    // 5 lighthouse
    <g key="lighthouse">
      <path d="M9 20 l1.5 -12 h3 l1.5 12 Z" fill={soft} />
      <rect x="9.5" y="11" width="5" height="2.4" fill={main} />
      <rect x="9" y="5.5" width="6" height="3.5" rx="1" fill={main} />
      <circle cx="12" cy="7.2" r="1.2" fill="#FFE9C9" />
      <path d="M10.5 4 h3 l1 1.5 h-5 Z" fill={main} />
    </g>,
    // 6 horizon point: sun on water
    <g key="horizon">
      <circle cx="12" cy="10" r="4.5" fill={soft} />
      <line x1="3" y1="15" x2="21" y2="15" stroke={main} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 18.5 q2 -2 4 0 t4 0 t4 0" stroke={main} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {icons[Math.min(index, icons.length - 1)]}
    </svg>
  );
}

/* --- empty-state: a quiet spot on the sand --- */
export function EmptyBeach({ className = "h-28 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      {/* sand */}
      <ellipse cx="80" cy="96" rx="72" ry="12" fill={SAND} />
      {/* umbrella */}
      <line x1="58" y1="34" x2="66" y2="90" stroke={WOOD} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 44 q32 -26 68 -6 q-18 -2 -34 2 q-16 4 -34 4 Z" fill={RED} />
      <path d="M24 44 q17 -14 35 -12 q-12 6 -18 12 Z" fill="#F0876E" />
      {/* deck chair */}
      <g stroke={WOOD} strokeWidth="3" strokeLinecap="round">
        <line x1="92" y1="62" x2="116" y2="78" />
        <line x1="116" y1="78" x2="138" y2="72" />
        <line x1="98" y1="88" x2="104" y2="70" />
        <line x1="128" y1="88" x2="124" y2="75" />
      </g>
      <path d="M92 60 L118 76 L140 70 L112 52 Z" fill={SEA} />
      {/* starfish */}
      <path
        d="M40 92 l2.6 5 l5.6 0.6 l-4 3.8 l1 5.4 l-5.2 -2.6 l-5.2 2.6 l1 -5.4 l-4 -3.8 l5.6 -0.6 Z"
        fill={SUNNY}
        transform="scale(0.7) translate(18 34)"
      />
    </svg>
  );
}
