// The character system: small seaside animals rendered as inline SVG.
//
// DeskFigure     one person at a study desk, visibly doing their thing
//                (reading, coding, gaming, writing) while focusing,
//                sipping coffee on a break, dozing when idle.
// StandingFigure the same animal on its feet with a backpack, used as
//                the traveler marker on the adventure map.
// MiniDeskFigure a distant, simplified desk for room-card previews.
//
// Species and activity both derive deterministically from the user id in
// lib/character.ts, so everyone sees the same person the same way.

import { useId } from "react";

import {
  activityFor,
  characterLook,
  type Activity,
  type CharacterLook,
} from "../lib/character";
import type { RoomLayout, RoomProp } from "../lib/persona";
import type { PresenceStatus } from "../lib/types";

const EYE = "#31424c";
const DESK_TOP = "#c9a87c";
const DESK_LEG = "#a8865d";
const METAL = "#3e6472";
const PAPER_SHEET = "#f2ede0";
const PAPER_EDGE = "#d6cdb6";

/* Species-specific features drawn around a head centered at (60, headY). */
function SpeciesFeatures({
  look,
  headY,
  idle,
}: {
  look: CharacterLook;
  headY: number;
  idle: boolean;
}) {
  const earY = headY - 13;
  switch (look.species) {
    case "cat":
      return (
        <>
          <path d={`M46 ${earY} l-3 -12 l11 5 Z`} fill={look.body} />
          <path d={`M74 ${earY} l3 -12 l-11 5 Z`} fill={look.body} />
          <path d={`M48 ${earY - 1} l-1 -7 l6 3 Z`} fill={look.bodyDark} />
          <path d={`M72 ${earY - 1} l1 -7 l-6 3 Z`} fill={look.bodyDark} />
          <g stroke={look.bodyDark} strokeWidth="1" strokeLinecap="round">
            <line x1="41" y1={headY + 4} x2="48" y2={headY + 3} />
            <line x1="41" y1={headY + 7} x2="48" y2={headY + 6} />
            <line x1="79" y1={headY + 4} x2="72" y2={headY + 3} />
            <line x1="79" y1={headY + 7} x2="72" y2={headY + 6} />
          </g>
        </>
      );
    case "fox":
      return (
        <>
          <path d={`M45 ${earY + 1} l-6 -14 l13 6 Z`} fill={look.body} />
          <path d={`M75 ${earY + 1} l6 -14 l-13 6 Z`} fill={look.body} />
          <path d={`M46 ${earY} l-3 -8 l7 3.5 Z`} fill={look.bodyDark} />
          <path d={`M74 ${earY} l3 -8 l-7 3.5 Z`} fill={look.bodyDark} />
          <ellipse cx="60" cy={headY + 9} rx="9" ry="6.5" fill={look.belly} />
          <path d={`M58 ${headY + 6.5} l2 2 l2 -2 z`} fill={look.bodyDark} />
        </>
      );
    case "bear":
      return (
        <>
          <circle cx="47" cy={earY} r="6" fill={look.body} />
          <circle cx="73" cy={earY} r="6" fill={look.body} />
          <circle cx="47" cy={earY} r="3" fill={look.bodyDark} />
          <circle cx="73" cy={earY} r="3" fill={look.bodyDark} />
          <ellipse cx="60" cy={headY + 9} rx="8" ry="6" fill={look.belly} />
          <ellipse cx="60" cy={headY + 7} rx="2.6" ry="2" fill={look.bodyDark} />
        </>
      );
    case "penguin":
      return (
        <>
          <ellipse cx="60" cy={headY + 6} rx="11" ry="9" fill={look.belly} />
          <path
            d={`M56 ${headY + 3} q4 5 8 0 q-2 4.5 -4 4.5 q-2 0 -4 -4.5 Z`}
            fill="#d99a55"
          />
        </>
      );
    case "rabbit":
      return (
        <>
          <ellipse cx="51" cy={earY - 12} rx="5" ry="14" fill={look.body} />
          <ellipse cx="69" cy={earY - 12} rx="5" ry="14" fill={look.body} />
          <ellipse cx="51" cy={earY - 11} rx="2.4" ry="10" fill={look.belly} />
          <ellipse cx="69" cy={earY - 11} rx="2.4" ry="10" fill={look.belly} />
          <path d={`M58.5 ${headY + 5} l1.5 1.5 l1.5 -1.5 z`} fill="#c98a8a" />
        </>
      );
    case "frog":
      return (
        <>
          <circle cx="50" cy={earY + 2} r="6" fill={look.body} />
          <circle cx="70" cy={earY + 2} r="6" fill={look.body} />
          {idle ? (
            <g stroke={EYE} strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path d={`M47 ${earY + 2} q3 2 6 0`} />
              <path d={`M67 ${earY + 2} q3 2 6 0`} />
            </g>
          ) : (
            <g fill={EYE}>
              <circle cx="50" cy={earY + 2} r="2.2" />
              <circle cx="70" cy={earY + 2} r="2.2" />
            </g>
          )}
          <path
            d={`M54 ${headY + 7} q6 3.5 12 0`}
            stroke={look.bodyDark}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "seal":
      return (
        <>
          <ellipse cx="60" cy={headY + 8} rx="9" ry="6.5" fill={look.belly} />
          <ellipse cx="60" cy={headY + 5} rx="2.6" ry="2" fill={look.bodyDark} />
          <g fill={look.bodyDark}>
            <circle cx="50" cy={headY + 8} r="0.9" />
            <circle cx="47" cy={headY + 6} r="0.9" />
            <circle cx="70" cy={headY + 8} r="0.9" />
            <circle cx="73" cy={headY + 6} r="0.9" />
          </g>
        </>
      );
    case "owl":
      return (
        <>
          <path d={`M46 ${earY + 2} l-2 -9 l8 4 Z`} fill={look.body} />
          <path d={`M74 ${earY + 2} l2 -9 l-8 4 Z`} fill={look.body} />
          <circle cx="54" cy={headY + 1} r="6.5" fill={look.belly} />
          <circle cx="66" cy={headY + 1} r="6.5" fill={look.belly} />
          <path d={`M58 ${headY + 6} l2 3 l2 -3 z`} fill="#d99a55" />
        </>
      );
  }
}

/* Eyes: open (blinking), looking down at the desk, or closed asleep. */
function Eyes({
  headY,
  mode,
}: {
  headY: number;
  mode: "open" | "down" | "closed";
}) {
  if (mode === "closed") {
    return (
      <g stroke={EYE} strokeWidth="1.8" strokeLinecap="round">
        <path d={`M52 ${headY + 1} q3 2.5 6 0`} fill="none" />
        <path d={`M62 ${headY + 1} q3 2.5 6 0`} fill="none" />
      </g>
    );
  }
  const y = mode === "down" ? headY + 3.5 : headY + 1;
  return (
    <g fill={EYE} className="anim-blink">
      <circle cx="54" cy={y} r="2.4" />
      <circle cx="66" cy={y} r="2.4" />
    </g>
  );
}

/* --- activity props, drawn on or over the desk (desk top at y=78) --- */

function ReadingProps() {
  return (
    <g>
      {/* open book */}
      <path d="M44 78 l12 -3.5 l12 3.5 Z" fill={PAPER_SHEET} />
      <path d="M44 78 l12 -3.5 v-1.8 l-12 3.5 Z" fill={PAPER_EDGE} />
      <path d="M68 78 l-12 -3.5 v-1.8 l12 3.5 Z" fill={PAPER_EDGE} />
      {/* a page caught mid-flip */}
      <g className="anim-pageflip" style={{ transformOrigin: "56px 76px" }}>
        <path d="M56 76 l10.5 -3 v-1.6 l-10.5 3 Z" fill="#faf6ea" />
      </g>
      {/* paws holding the covers */}
      <ellipse cx="45" cy="76.5" rx="3" ry="2.2" fill="currentColor" />
      <ellipse cx="75" cy="76.5" rx="3" ry="2.2" fill="currentColor" />
    </g>
  );
}

function CodingProps({ glowId }: { glowId: string }) {
  return (
    <g>
      {/* light from the screen washing the face */}
      <ellipse
        cx="60"
        cy="58"
        rx="20"
        ry="14"
        fill={`url(#${glowId})`}
        className="anim-screenglow"
      />
      {/* laptop lid seen from behind, slightly open toward the character */}
      <path d="M44 78 L47 57 L73 57 L76 78 Z" fill={METAL} />
      <path d="M46.5 76 L49 59 L71 59 L73.5 76 Z" fill="#2f4d59" />
      {/* screen light leaking over the lid edge */}
      <rect
        x="47"
        y="55.6"
        width="26"
        height="2"
        rx="1"
        fill="#bcd8e2"
        className="anim-screenglow"
      />
      {/* keyboard deck in front, paws tapping */}
      <path d="M42 78 h36 l2.5 4 h-41 Z" fill="#35586600" />
      <g fill="currentColor">
        <ellipse className="anim-tap" cx="48" cy="79" rx="3.4" ry="2.4" />
        <ellipse className="anim-tap-late" cx="72" cy="79" rx="3.4" ry="2.4" />
      </g>
    </g>
  );
}

function GamingProps({ glowId }: { glowId: string }) {
  return (
    <g>
      {/* light from the little screen up onto the chin */}
      <ellipse
        cx="60"
        cy="60"
        rx="14"
        ry="9"
        fill={`url(#${glowId})`}
        className="anim-screenglow"
      />
      {/* handheld console held above the desk */}
      <g className="anim-tap" style={{ animationDuration: "1.1s" }}>
        <rect x="46" y="64" width="28" height="12" rx="4" fill={METAL} />
        <rect x="53" y="66.5" width="14" height="7" rx="1.5" fill="#9fc7d4" className="anim-screenglow" />
        <circle cx="49.5" cy="68" r="1.5" fill="#8fb4c0" />
        <circle cx="70.5" cy="67" r="1.2" fill="#c98f4a" />
        <circle cx="70.5" cy="70" r="1.2" fill="#8fae8c" />
        {/* paws gripping the sides */}
        <ellipse cx="45" cy="70" rx="3" ry="3.4" fill="currentColor" />
        <ellipse cx="75" cy="70" rx="3" ry="3.4" fill="currentColor" />
      </g>
    </g>
  );
}

function WritingProps() {
  return (
    <g>
      {/* notebook page */}
      <path d="M46 78 l4 -6 h22 l4 6 Z" fill={PAPER_SHEET} />
      <g stroke={PAPER_EDGE} strokeWidth="1">
        <line x1="52" y1="74.5" x2="70" y2="74.5" />
        <line x1="51" y1="76.5" x2="72" y2="76.5" />
      </g>
      {/* resting paw */}
      <ellipse cx="49" cy="77" rx="3" ry="2.2" fill="currentColor" />
      {/* writing paw + pencil traveling the line */}
      <g className="anim-penline">
        <line x1="63" y1="75.5" x2="68" y2="68" stroke="#b0793f" strokeWidth="2" strokeLinecap="round" />
        <path d="M62.2 76.8 l1.8 -2.4 l1.4 1 Z" fill="#4a3a2a" />
        <ellipse cx="66" cy="72" rx="3.2" ry="2.6" fill="currentColor" />
      </g>
    </g>
  );
}

function MugProps({ steaming }: { steaming: boolean }) {
  return (
    <g>
      <rect x="66" y="70" width="9" height="8" rx="1.5" fill="#b0793f" />
      <path
        d="M75 72 q4 0 4 2.5 q0 2.5 -4 2.5"
        fill="none"
        stroke="#b0793f"
        strokeWidth="1.5"
      />
      {steaming && (
        <g stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <path d="M69 66 q1.5 -2 0 -4" className="anim-tap" style={{ animationDuration: "2s" }} />
          <path d="M72.5 66 q-1.5 -2 0 -4" className="anim-tap-late" style={{ animationDuration: "2s" }} />
        </g>
      )}
    </g>
  );
}

export interface DeskFigureProps {
  userId: string;
  status: PresenceStatus;
  className?: string;
  /* Activity override, mostly for the marketing landing page. */
  activity?: Activity;
}

/* One person at their desk. viewBox 0 0 120 112, safe to size with width. */
export function DeskFigure({
  userId,
  status,
  className = "h-28 w-32",
  activity,
}: DeskFigureProps) {
  const look = characterLook(userId);
  const doing = activity ?? activityFor(userId);
  const uid = useId();
  const glowId = `${uid}-lamp`;
  const screenId = `${uid}-screen`;

  const idle = status === "idle";
  const focusing = status === "focusing";
  const onBreak = status === "break";
  const headY = idle ? 50 : 42;

  const bodyAnim = focusing
    ? doing === "gaming"
      ? "anim-gamelean"
      : "anim-breathe"
    : onBreak
      ? "anim-sway"
      : "anim-doze";

  return (
    <svg viewBox="0 0 120 112" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.4" />
          <stop offset="60%" stopColor="var(--sun)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={screenId}>
          <stop offset="0%" stopColor="#cfe6ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cfe6ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* pool of lamplight on the desk, behind everything */}
      {focusing && (
        <ellipse
          cx="56"
          cy="76"
          rx="40"
          ry="18"
          fill={`url(#${glowId})`}
          className="anim-lampglow"
        />
      )}
      {onBreak && (
        <ellipse cx="56" cy="76" rx="30" ry="13" fill={`url(#${glowId})`} opacity="0.35" />
      )}

      {/* the character, behind the desk */}
      <g className={bodyAnim}>
        <path
          d={
            idle
              ? "M38 84 Q38 62 60 62 Q82 62 82 84 Z"
              : "M38 84 Q38 56 60 56 Q82 56 82 84 Z"
          }
          fill={look.body}
        />
        {look.species === "penguin" && (
          <path
            d={
              idle
                ? "M46 84 Q46 68 60 68 Q74 68 74 84 Z"
                : "M46 84 Q46 62 60 62 Q74 62 74 84 Z"
            }
            fill={look.belly}
          />
        )}
        <circle cx="60" cy={headY} r="17" fill={look.body} />
        <SpeciesFeatures look={look} headY={headY} idle={idle} />
        {look.species !== "frog" && (
          <Eyes
            headY={headY}
            mode={
              idle
                ? "closed"
                : focusing && doing !== "gaming"
                  ? "down"
                  : "open"
            }
          />
        )}
        <circle cx="47" cy={headY + 6} r="3" fill="#00000018" />
        <circle cx="73" cy={headY + 6} r="3" fill="#00000018" />
      </g>

      {/* zzz while dozing */}
      {idle && (
        <g fill="var(--muted)" fontFamily="var(--font-sono), monospace" fontSize="10">
          <text x="82" y="38" className="anim-zzz">
            z
          </text>
          <text x="90" y="30" className="anim-zzz-late">
            z
          </text>
        </g>
      )}

      {/* desk */}
      <rect x="22" y="78" width="76" height="7" rx="2.5" fill={DESK_TOP} />
      <rect x="28" y="85" width="5" height="18" fill={DESK_LEG} />
      <rect x="87" y="85" width="5" height="18" fill={DESK_LEG} />

      {/* what they are doing: currentColor carries the paw color */}
      <g style={{ color: look.bodyDark }}>
        {focusing && doing === "reading" && <ReadingProps />}
        {focusing && doing === "coding" && <CodingProps glowId={screenId} />}
        {focusing && doing === "gaming" && <GamingProps glowId={screenId} />}
        {focusing && doing === "writing" && <WritingProps />}
        {(onBreak || idle) && <MugProps steaming={onBreak} />}
      </g>

      {/* desk lamp at the left edge, lit by state */}
      <g>
        <rect x="24" y="72" width="10" height="3" rx="1.5" fill={METAL} />
        <line x1="29" y1="72" x2="29" y2="59" stroke={METAL} strokeWidth="2.5" />
        <path d="M29 59 L37 53" stroke={METAL} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 50 L42 54 L37 60 L31 55 Z" fill={focusing ? "var(--sun)" : METAL} />
        {focusing && (
          <path
            d="M38 58 L50 77 L28 77 Z"
            fill="var(--sun)"
            opacity="0.12"
            className="anim-lampglow"
          />
        )}
        {onBreak && <circle cx="37" cy="56" r="2" fill="var(--sun)" opacity="0.5" />}
      </g>
    </svg>
  );
}

/* The same animal standing up with a backpack: the adventure traveler.
   viewBox 20 0 80 100. */
export function StandingFigure({
  userId,
  className = "h-16 w-14",
}: {
  userId: string;
  className?: string;
}) {
  const look = characterLook(userId);
  const headY = 38;
  return (
    <svg viewBox="20 0 80 100" className={className} aria-hidden="true">
      <ellipse cx="60" cy="94" rx="18" ry="3.5" fill="#00000014" />
      <g className="anim-walkbob">
        {/* backpack */}
        <rect x="30" y="58" width="12" height="18" rx="4" fill={look.bodyDark} />
        <rect x="33" y="62" width="6" height="4" rx="1.5" fill={look.belly} opacity="0.7" />
        {/* body */}
        <path d="M42 92 Q42 56 60 56 Q78 56 78 92 Z" fill={look.body} />
        {look.species === "penguin" && (
          <path d="M49 92 Q49 62 60 62 Q71 62 71 92 Z" fill={look.belly} />
        )}
        {/* feet */}
        <ellipse cx="52" cy="92" rx="5" ry="2.6" fill={look.bodyDark} />
        <ellipse cx="68" cy="92" rx="5" ry="2.6" fill={look.bodyDark} />
        {/* head */}
        <circle cx="60" cy={headY} r="15" fill={look.body} />
        <SpeciesFeatures look={look} headY={headY} idle={false} />
        {look.species !== "frog" && <Eyes headY={headY} mode="open" />}
        <circle cx="49" cy={headY + 6} r="2.6" fill="#00000018" />
        <circle cx="71" cy={headY + 6} r="2.6" fill="#00000018" />
      </g>
    </svg>
  );
}

/* The far-away animal shared by the mini scenes: body base at y=38,
   centered on x=30. Simplified ears so species still read at this size. */
function MiniAnimal({ look }: { look: CharacterLook }) {
  return (
    <>
      <path d="M18 38 Q18 26 30 26 Q42 26 42 38 Z" fill={look.body} />
      <circle cx="30" cy="20" r="8.5" fill={look.body} />
      {(look.species === "cat" || look.species === "fox") && (
        <>
          <path d="M24 14 l-2 -6 l6 3 Z" fill={look.body} />
          <path d="M36 14 l2 -6 l-6 3 Z" fill={look.body} />
        </>
      )}
      {look.species === "rabbit" && (
        <>
          <ellipse cx="26" cy="8" rx="2.4" ry="7" fill={look.body} />
          <ellipse cx="34" cy="8" rx="2.4" ry="7" fill={look.body} />
        </>
      )}
      {look.species === "bear" && (
        <>
          <circle cx="24" cy="13" r="3" fill={look.body} />
          <circle cx="36" cy="13" r="3" fill={look.body} />
        </>
      )}
    </>
  );
}

/* A tiny far-away desk for room-card previews. Deterministic from any
   string key, so a room's preview crowd is stable across visits. */
export function MiniDeskFigure({
  seedKey,
  lampOn = true,
  className = "h-10 w-12",
  delay = 0,
}: {
  seedKey: string;
  lampOn?: boolean;
  className?: string;
  delay?: number;
}) {
  const look = characterLook(seedKey);
  return (
    <svg viewBox="0 0 60 50" className={className} aria-hidden="true">
      {lampOn && <ellipse cx="30" cy="36" rx="18" ry="8" fill="var(--sun)" opacity="0.16" />}
      <g
        className="anim-breathe"
        style={{ animationDelay: `${delay}s` }}
      >
        <MiniAnimal look={look} />
      </g>
      <rect x="12" y="38" width="36" height="4" rx="1.5" fill={DESK_TOP} />
      <rect x="15" y="42" width="3" height="8" fill={DESK_LEG} />
      <rect x="42" y="42" width="3" height="8" fill={DESK_LEG} />
      {lampOn && <circle cx="16" cy="34" r="1.8" fill="var(--sun)" className="status-lamp" />}
    </svg>
  );
}

/* An empty desk, same perspective as MiniDeskFigure. */
export function MiniEmptyDesk({ className = "h-10 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 50" className={className} aria-hidden="true">
      <rect x="12" y="38" width="36" height="4" rx="1.5" fill={DESK_TOP} opacity="0.55" />
      <rect x="15" y="42" width="3" height="8" fill={DESK_LEG} opacity="0.55" />
      <rect x="42" y="42" width="3" height="8" fill={DESK_LEG} opacity="0.55" />
    </svg>
  );
}

/* ---- hallway room vignettes ----
   One SVG scene per room card: the room's furniture arranged by its
   persona layout, with whoever is inside seated at the tables. Empty
   tables stay warm-toned and nearly full opacity: waiting, not
   abandoned. viewBox 0 0 240 96, size with h-24 w-60. */

const VIGNETTE_SEATS: Record<RoomLayout, number[]> = {
  /* one long communal table */
  hall: [57, 99, 141, 183],
  /* two small tables; the first two arrivals take different tables */
  pairs: [50, 154, 86, 190],
  /* a single two-seat desk by the window */
  nook: [168, 204],
};

const VIGNETTE_TABLES: Record<RoomLayout, Array<{ x: number; w: number }>> = {
  hall: [{ x: 30, w: 180 }],
  pairs: [
    { x: 30, w: 76 },
    { x: 134, w: 76 },
  ],
  nook: [{ x: 148, w: 78 }],
};

export function RoomVignette({
  roomId,
  layout,
  count,
  className = "h-24 w-60",
}: {
  roomId: string;
  layout: RoomLayout;
  count: number;
  className?: string;
}) {
  const seats = VIGNETTE_SEATS[layout];
  const shown = Math.min(count, seats.length);
  return (
    <svg viewBox="0 0 240 96" className={className} aria-hidden="true">
      {/* lamplight pooling over whoever is in */}
      {Array.from({ length: shown }, (_, i) => (
        <ellipse
          key={`glow${i}`}
          cx={seats[i]}
          cy={68}
          rx={18}
          ry={8}
          fill="var(--sun)"
          opacity={0.16}
        />
      ))}
      {Array.from({ length: shown }, (_, i) => {
        const look = characterLook(`${roomId}:seat${i}`);
        return (
          <g key={`fig${i}`} transform={`translate(${seats[i] - 30} 35)`}>
            <g className="anim-breathe" style={{ animationDelay: `${i * 0.7}s` }}>
              <MiniAnimal look={look} />
            </g>
          </g>
        );
      })}
      {VIGNETTE_TABLES[layout].map((t, i) => (
        <g key={`table${i}`} opacity={shown > 0 ? 1 : 0.85}>
          <rect x={t.x} y={72} width={t.w} height={6} rx={2.5} fill={DESK_TOP} />
          <rect x={t.x + 6} y={78} width={4} height={14} fill={DESK_LEG} />
          <rect x={t.x + t.w - 10} y={78} width={4} height={14} fill={DESK_LEG} />
        </g>
      ))}
    </svg>
  );
}

/* ---- the one object someone left in the room ----
   Each hallway card gets a single prop from its persona; these position
   themselves inside the card preview. */

function MiniPlant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 56" className={className} aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        <path d="M20 40 Q18 28 10 22" stroke="#6f8f6c" strokeWidth="1.6" />
        <path d="M20 40 Q21 26 20 16" stroke="#8fae8c" strokeWidth="1.6" />
        <path d="M20 40 Q23 30 30 24" stroke="#7f9f7c" strokeWidth="1.6" />
      </g>
      <ellipse cx="10" cy="20" rx="4" ry="6" transform="rotate(-35 10 20)" fill="#8fae8c" />
      <ellipse cx="20" cy="13" rx="4" ry="7" fill="#9fbe9c" />
      <ellipse cx="31" cy="22" rx="4" ry="6" transform="rotate(33 31 22)" fill="#7f9f7c" />
      <path d="M12 40 h16 l-2 14 h-12 Z" fill="#b0793f" />
      <rect x="10.5" y="38.5" width="19" height="3.5" rx="1.5" fill="#c98a55" />
    </svg>
  );
}

function MiniShelf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 60" className={className} aria-hidden="true">
      {/* sides and shelves */}
      <rect x="4" y="4" width="3" height="52" fill={DESK_LEG} />
      <rect x="37" y="4" width="3" height="52" fill={DESK_LEG} />
      <rect x="4" y="4" width="36" height="3" fill={DESK_TOP} />
      <rect x="4" y="27" width="36" height="3" fill={DESK_TOP} />
      <rect x="4" y="53" width="36" height="3" fill={DESK_TOP} />
      {/* upper row of spines, one leaning */}
      <rect x="9" y="13" width="4" height="14" fill="#8fae8c" />
      <rect x="14" y="15" width="4" height="12" fill="#c98f63" />
      <rect x="19" y="12" width="5" height="15" fill="#9facb4" />
      <rect x="28" y="13" width="4" height="14" fill="#c8ae7e" transform="rotate(10 30 27)" />
      {/* lower row: spines and a flat stack */}
      <rect x="9" y="38" width="5" height="15" fill="#b09876" />
      <rect x="15" y="40" width="4" height="13" fill="#7f8e97" />
      <rect x="24" y="49" width="12" height="4" fill="#c8ae7e" />
      <rect x="25" y="45" width="10" height="4" fill="#8fae8c" />
    </svg>
  );
}

function MiniLamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 60" className={className} aria-hidden="true">
      {/* still switched on, waiting */}
      <ellipse
        cx="22"
        cy="28"
        rx="13"
        ry="11"
        fill="var(--sun)"
        opacity="0.15"
        className="anim-lampglow"
      />
      <rect x="21" y="26" width="2" height="14" fill={METAL} />
      <path d="M16 19 h12 l2.5 8 h-17 Z" fill="var(--sun)" />
      <circle cx="22" cy="28.5" r="1.6" fill="#f3debe" />
      <ellipse cx="22" cy="41" rx="10" ry="2.2" fill="var(--sun)" opacity="0.28" />
      <rect x="8" y="40" width="28" height="4" rx="1.5" fill={DESK_TOP} />
      <rect x="11" y="44" width="3" height="12" fill={DESK_LEG} />
      <rect x="30" y="44" width="3" height="12" fill={DESK_LEG} />
    </svg>
  );
}

function MiniArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 42" className={className} aria-hidden="true">
      {/* a small framed seascape hung on the wall, a touch crooked */}
      <g transform="rotate(-3 22 22)">
        <path d="M22 4 L14 11 M22 4 L30 11" stroke="#8f745c" strokeWidth="1.2" fill="none" />
        <circle cx="22" cy="4" r="1.3" fill="#8f745c" />
        <rect x="9" y="11" width="26" height="22" rx="1.5" fill="#8f745c" />
        <rect x="12" y="14" width="20" height="7" fill="#dcecf2" />
        <rect x="12" y="21" width="20" height="1" fill="#ffffffb0" />
        <rect x="12" y="22" width="20" height="8" fill="#8fb3c2" />
        <circle cx="26" cy="17.5" r="1.8" fill="#e8c894" />
      </g>
    </svg>
  );
}

export function RoomPropSprite({ prop }: { prop: RoomProp }) {
  switch (prop) {
    case "plant":
      return <MiniPlant className="absolute bottom-1 left-3 h-14 w-10" />;
    case "shelf":
      return <MiniShelf className="absolute bottom-1 left-3 h-14 w-11" />;
    case "lamp":
      return <MiniLamp className="absolute bottom-1 left-3 h-14 w-11" />;
    case "art":
      return <MiniArt className="absolute left-5 top-2.5 h-9 w-9" />;
  }
}
