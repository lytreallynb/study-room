// The signature element: a member rendered as a small animal at a study
// desk. Focusing turns the desk lamp on (warm glow, open book, slow
// breathing); break dims the lamp and pours a coffee (steam, gentle sway);
// idle switches the lamp off and the creature dozes (zzz).
//
// The species (cat/fox/bear/penguin/rabbit/frog/seal/owl) comes
// deterministically from the user id via lib/character.ts.

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
  idle: "bg-muted",
};

const EYE = "#3A3050";

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
            fill="#F0A24A"
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
          <path d={`M58.5 ${headY + 5} l1.5 1.5 l1.5 -1.5 z`} fill="#D08080" />
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
          <path d={`M58 ${headY + 6} l2 3 l2 -3 z`} fill="#F0A24A" />
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
  const lampDim = status === "break";
  const headY = idle ? 50 : 42;

  const bodyAnim =
    status === "focusing"
      ? "anim-breathe"
      : status === "break"
        ? "anim-sway"
        : "anim-doze";

  // Frogs carry their eyes on the head bumps; everyone else on the face.
  const faceEyes = look.species !== "frog";

  return (
    <figure className="flex w-32 flex-col items-center gap-1">
      <svg
        viewBox="0 0 120 110"
        className="h-28 w-32"
        role="img"
        aria-label={`${displayName}, ${STATUS_LABEL[status]}`}
      >
        <defs>
          {/* soft radial pool so the lamp reads as light, not a solid shape */}
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.4" />
            <stop offset="60%" stopColor="var(--sun)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* pool of lamplight on the desk, behind everything */}
        {lampOn && (
          <ellipse
            cx="56"
            cy="76"
            rx="40"
            ry="18"
            fill={`url(#${glowId})`}
            className="anim-lampglow"
          />
        )}
        {lampDim && (
          <ellipse
            cx="56"
            cy="76"
            rx="30"
            ry="13"
            fill={`url(#${glowId})`}
            opacity="0.35"
          />
        )}

        {/* character (torso + head), sits behind the desk */}
        <g className={bodyAnim}>
          {/* torso */}
          <path
            d={
              idle
                ? "M38 84 Q38 62 60 62 Q82 62 82 84 Z"
                : "M38 84 Q38 56 60 56 Q82 56 82 84 Z"
            }
            fill={look.body}
          />
          {/* penguins wear their belly on the torso too */}
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
          {/* head */}
          <circle cx="60" cy={headY} r="17" fill={look.body} />
          <SpeciesFeatures look={look} headY={headY} idle={idle} />
          {/* eyes */}
          {faceEyes &&
            (idle ? (
              <g stroke={EYE} strokeWidth="1.8" strokeLinecap="round">
                <path d={`M52 ${headY + 1} q3 2.5 6 0`} fill="none" />
                <path d={`M62 ${headY + 1} q3 2.5 6 0`} fill="none" />
              </g>
            ) : (
              <g fill={EYE} className="anim-blink">
                <circle cx="54" cy={headY + 1} r="2.4" />
                <circle cx="66" cy={headY + 1} r="2.4" />
              </g>
            ))}
          {/* blush */}
          <circle cx="47" cy={headY + 6} r="3" fill="#00000018" />
          <circle cx="73" cy={headY + 6} r="3" fill="#00000018" />
        </g>

        {/* zzz while dozing */}
        {idle && (
          <g
            fill="var(--muted)"
            fontFamily="var(--font-sono), monospace"
            fontSize="10"
          >
            <text x="82" y="38" className="anim-zzz">
              z
            </text>
            <text x="90" y="30" className="anim-zzz-late">
              z
            </text>
          </g>
        )}

        {/* desk */}
        <rect x="22" y="78" width="76" height="7" rx="2.5" fill="#C9A87C" />
        <rect x="28" y="85" width="5" height="18" fill="#A8865D" />
        <rect x="87" y="85" width="5" height="18" fill="#A8865D" />

        {/* on the desk: book while focusing, mug while on break */}
        {status === "focusing" && (
          <g>
            <path d="M46 78 l10 -3 l10 3 Z" fill="#E9E2D0" />
            <path d="M46 78 l10 -3 v-1.5 l-10 3 Z" fill="#D6CDB6" />
            <path d="M66 78 l-10 -3 v-1.5 l10 3 Z" fill="#D6CDB6" />
          </g>
        )}
        {(status === "break" || idle) && (
          <g>
            <rect x="66" y="70" width="9" height="8" rx="1.5" fill="#C97F55" />
            <path
              d="M75 72 q4 0 4 2.5 q0 2.5 -4 2.5"
              fill="none"
              stroke="#C97F55"
              strokeWidth="1.5"
            />
            {status === "break" && (
              <g
                stroke="var(--muted)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              >
                <path d="M69 66 q1.5 -2 0 -4" className="anim-steam" />
                <path d="M72.5 66 q-1.5 -2 0 -4" className="anim-steam-late" />
              </g>
            )}
          </g>
        )}

        {/* desk lamp, kept at the desk's left edge so the arm never crosses
            the character */}
        <g>
          <rect x="24" y="72" width="10" height="3" rx="1.5" fill="#3E6472" />
          <line x1="29" y1="72" x2="29" y2="59" stroke="#3E6472" strokeWidth="2.5" />
          <path d="M29 59 L37 53" stroke="#3E6472" strokeWidth="2.5" strokeLinecap="round" />
          {/* shade: small wedge hanging off the arm */}
          <path
            d="M34 50 L42 54 L37 60 L31 55 Z"
            fill={lampOn ? "var(--sun)" : "#3E6472"}
          />
          {/* light cone falling onto the desk */}
          {lampOn && (
            <path
              d="M38 58 L50 77 L28 77 Z"
              fill="var(--sun)"
              opacity="0.12"
              className="anim-lampglow"
            />
          )}
          {lampDim && <circle cx="37" cy="56" r="2" fill="var(--sun)" opacity="0.5" />}
        </g>
      </svg>

      <figcaption className="flex max-w-full items-center gap-1.5 text-xs">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
        <span
          className={`truncate ${isSelf ? "font-bold text-ink" : "text-muted"}`}
        >
          {displayName}
          {isSelf ? " (you)" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
