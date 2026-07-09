// A seat in the room: an avatar at a desk, read as presence, not a sticker.
// Focusing lights the lamp and opens the book; a break dims the lamp and
// pours a coffee; idle fades the seat and closes the eyes. Species (from
// lib/character.ts) shows only in the ear/beak silhouette and a muted coat.

import { useId } from "react";

import { characterLook, type CharacterLook } from "../lib/character";
import type { PresenceStatus } from "../lib/types";

const STATUS_LABEL: Record<PresenceStatus, string> = {
  focusing: "focusing",
  break: "on a break",
  idle: "idle",
};

const STATUS_DOT: Record<PresenceStatus, string> = {
  focusing: "bg-sun",
  break: "bg-mint",
  idle: "bg-muted/60",
};

const EYE = "#33424A";
const DESK_TOP = "#D9C7A2";
const DESK_EDGE = "#C2AC83";
const LAMP_METAL = "#4A5A60";

/* Ear/beak silhouettes only: enough to tell species apart at a glance. */
function SpeciesSilhouette({
  look,
  headY,
}: {
  look: CharacterLook;
  headY: number;
}) {
  const earY = headY - 12;
  switch (look.species) {
    case "cat":
      return (
        <>
          <path d={`M48 ${earY} l-2 -9 l9 4 Z`} fill={look.body} />
          <path d={`M72 ${earY} l2 -9 l-9 4 Z`} fill={look.body} />
        </>
      );
    case "fox":
      return (
        <>
          <path d={`M47 ${earY + 1} l-4 -11 l10 5 Z`} fill={look.body} />
          <path d={`M73 ${earY + 1} l4 -11 l-10 5 Z`} fill={look.body} />
          <ellipse cx="60" cy={headY + 8} rx="7.5" ry="5" fill={look.belly} />
        </>
      );
    case "bear":
      return (
        <>
          <circle cx="49" cy={earY + 1} r="4.5" fill={look.body} />
          <circle cx="71" cy={earY + 1} r="4.5" fill={look.body} />
          <ellipse cx="60" cy={headY + 8} rx="6.5" ry="4.5" fill={look.belly} />
        </>
      );
    case "penguin":
      return (
        <>
          <ellipse cx="60" cy={headY + 5} rx="9" ry="7.5" fill={look.belly} />
          <path d={`M57.5 ${headY + 3} l2.5 3 l2.5 -3 z`} fill="#C98F63" />
        </>
      );
    case "rabbit":
      return (
        <>
          <ellipse cx="53" cy={earY - 9} rx="3.6" ry="11" fill={look.body} />
          <ellipse cx="67" cy={earY - 9} rx="3.6" ry="11" fill={look.body} />
        </>
      );
    case "frog":
      return (
        <>
          <circle cx="52" cy={earY + 3} r="4.5" fill={look.body} />
          <circle cx="68" cy={earY + 3} r="4.5" fill={look.body} />
        </>
      );
    case "seal":
      return (
        <>
          <ellipse cx="60" cy={headY + 7} rx="7.5" ry="5" fill={look.belly} />
          <g fill={look.bodyDark} opacity="0.7">
            <circle cx="52" cy={headY + 7} r="0.8" />
            <circle cx="68" cy={headY + 7} r="0.8" />
          </g>
        </>
      );
    case "owl":
      return (
        <>
          <path d={`M49 ${earY + 2} l-1.5 -7 l6.5 3.5 Z`} fill={look.body} />
          <path d={`M71 ${earY + 2} l1.5 -7 l-6.5 3.5 Z`} fill={look.body} />
          <circle cx="55" cy={headY} r="5.5" fill={look.belly} />
          <circle cx="65" cy={headY} r="5.5" fill={look.belly} />
        </>
      );
  }
}

interface Props {
  userId: string;
  displayName: string;
  status: PresenceStatus;
  isSelf?: boolean;
}

export default function Character({
  userId,
  displayName,
  status,
  isSelf = false,
}: Props) {
  const look = characterLook(userId);
  const glowId = useId();
  const idle = status === "idle";
  const lampOn = status === "focusing";
  const headY = idle ? 46 : 40;

  const bodyAnim =
    status === "focusing"
      ? "anim-breathe"
      : status === "break"
        ? "anim-sway"
        : "anim-doze";

  return (
    <figure className="flex w-28 flex-col items-center gap-1.5">
      <svg
        viewBox="0 0 120 100"
        className="h-24 w-28"
        role="img"
        aria-label={`${displayName}, ${STATUS_LABEL[status]}`}
      >
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.32" />
            <stop offset="60%" stopColor="var(--sun)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* seat shadow grounds the figure in the room */}
        <ellipse cx="60" cy="92" rx="42" ry="5" fill="var(--ink)" opacity="0.07" />

        {/* lamplight on the desk */}
        {lampOn && (
          <ellipse
            cx="58"
            cy="72"
            rx="34"
            ry="16"
            fill={`url(#${glowId})`}
            className="anim-lampglow"
          />
        )}

        {/* the person at the desk */}
        <g className={bodyAnim} opacity={idle ? 0.72 : 1}>
          {/* shoulders */}
          <path
            d={
              idle
                ? "M42 74 Q42 58 60 58 Q78 58 78 74 Z"
                : "M42 74 Q42 53 60 53 Q78 53 78 74 Z"
            }
            fill={look.body}
          />
          {look.species === "penguin" && (
            <path
              d={
                idle
                  ? "M50 74 Q50 63 60 63 Q70 63 70 74 Z"
                  : "M50 74 Q50 58 60 58 Q70 58 70 74 Z"
              }
              fill={look.belly}
            />
          )}
          {/* head */}
          <circle cx="60" cy={headY} r="14" fill={look.body} />
          <SpeciesSilhouette look={look} headY={headY} />
          {/* eyes: calm, closed when idle; frogs look from their bumps */}
          {look.species === "frog" ? (
            idle ? (
              <g stroke={EYE} strokeWidth="1.3" strokeLinecap="round" fill="none">
                <path d={`M50 ${headY - 9} h4`} />
                <path d={`M66 ${headY - 9} h4`} />
              </g>
            ) : (
              <g fill={EYE}>
                <circle cx="52" cy={headY - 9} r="1.7" />
                <circle cx="68" cy={headY - 9} r="1.7" />
              </g>
            )
          ) : idle ? (
            <g stroke={EYE} strokeWidth="1.3" strokeLinecap="round" fill="none">
              <path d={`M52.5 ${headY + 1} h4`} />
              <path d={`M63.5 ${headY + 1} h4`} />
            </g>
          ) : (
            <g fill={EYE} className="anim-blink">
              <circle cx="54.5" cy={headY + 1} r="1.9" />
              <circle cx="65.5" cy={headY + 1} r="1.9" />
            </g>
          )}
        </g>

        {/* one quiet z while idle */}
        {idle && (
          <text
            x="80"
            y="34"
            fontFamily="var(--font-sono), monospace"
            fontSize="9"
            fill="var(--muted)"
            className="anim-zzz"
          >
            z
          </text>
        )}

        {/* desk: perspective top + front edge + legs */}
        <path d="M24 74 L96 74 L92 82 L28 82 Z" fill={DESK_TOP} />
        <rect x="28" y="82" width="64" height="4" rx="1" fill={DESK_EDGE} />
        <path
          d="M33 86 l-1.5 8 M87 86 l1.5 8"
          stroke="#B29C74"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* desk objects: open book when focusing, mug on break/idle */}
        {status === "focusing" && (
          <g>
            <path d="M50 74 l9 -2.5 l9 2.5 Z" fill="#F0EBDC" />
            <path d="M50 74 l9 -2.5 v-1.2 l-9 2.5 Z" fill="#DAD2BC" />
            <path d="M68 74 l-9 -2.5 v-1.2 l9 2.5 Z" fill="#DAD2BC" />
          </g>
        )}
        {status !== "focusing" && (
          <g>
            <rect x="66" y="67" width="7.5" height="7" rx="1.2" fill="var(--coral)" opacity="0.85" />
            <path
              d="M73.5 68.5 q3 0 3 2 t-3 2"
              fill="none"
              stroke="var(--coral)"
              strokeWidth="1.2"
              opacity="0.85"
            />
            {status === "break" && (
              <g
                stroke="var(--muted)"
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              >
                <path d="M68.5 64 q1.2 -1.6 0 -3.2" className="anim-steam" />
                <path d="M71.5 64 q-1.2 -1.6 0 -3.2" className="anim-steam-late" />
              </g>
            )}
          </g>
        )}

        {/* lamp: a thin brass reading light at the desk edge */}
        <g>
          <path
            d="M34 74 V56 L42 50"
            stroke={LAMP_METAL}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M40 46.5 L47 51 L43 56 Z"
            fill={lampOn ? "var(--sun)" : LAMP_METAL}
          />
          {lampOn && (
            <path
              d="M44 53 L54 73 L34 73 Z"
              fill="var(--sun)"
              opacity="0.1"
              className="anim-lampglow"
            />
          )}
        </g>
      </svg>

      <figcaption className="flex max-w-full items-center gap-1.5 text-xs">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
        <span
          className={`truncate ${isSelf ? "font-semibold text-ink" : "text-muted"}`}
        >
          {displayName}
          {isSelf ? " (you)" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
