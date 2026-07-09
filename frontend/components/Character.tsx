// The signature element: a member rendered as a small creature at a study
// desk. Focusing turns the desk lamp on (warm glow, open book, slow
// breathing); break dims the lamp and pours a coffee (steam, gentle sway);
// idle switches the lamp off and the creature dozes (zzz).

import { useId } from "react";

import { characterLook } from "../lib/character";
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
  const lampOn = status === "focusing";
  const lampDim = status === "break";

  const bodyAnim =
    status === "focusing"
      ? "anim-breathe"
      : status === "break"
        ? "anim-sway"
        : "anim-doze";

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
              status === "idle"
                ? "M38 84 Q38 62 60 62 Q82 62 82 84 Z"
                : "M38 84 Q38 56 60 56 Q82 56 82 84 Z"
            }
            fill={look.body}
          />
          {/* head */}
          <circle
            cx="60"
            cy={status === "idle" ? 50 : 42}
            r="17"
            fill={look.body}
          />
          {/* ears: tiny round nubs, offset by seed so bodies differ */}
          {look.seed % 3 === 0 && (
            <>
              <circle cx="47" cy={status === "idle" ? 37 : 29} r="5" fill={look.body} />
              <circle cx="73" cy={status === "idle" ? 37 : 29} r="5" fill={look.body} />
            </>
          )}
          {look.seed % 3 === 1 && (
            <>
              <path
                d={`M45 ${status === "idle" ? 40 : 32} l-4 -10 l9 4 Z`}
                fill={look.bodyDark}
              />
              <path
                d={`M75 ${status === "idle" ? 40 : 32} l4 -10 l-9 4 Z`}
                fill={look.bodyDark}
              />
            </>
          )}
          {/* eyes */}
          {status === "idle" ? (
            <g stroke="#3A3050" strokeWidth="1.8" strokeLinecap="round">
              <path d="M52 51 q3 2.5 6 0" fill="none" />
              <path d="M62 51 q3 2.5 6 0" fill="none" />
            </g>
          ) : (
            <g fill="#3A3050" className="anim-blink">
              <circle cx="54" cy="43" r="2.4" />
              <circle cx="66" cy="43" r="2.4" />
            </g>
          )}
          {/* blush */}
          <circle cx="48" cy={status === "idle" ? 55 : 47} r="3" fill={look.blush} />
          <circle cx="72" cy={status === "idle" ? 55 : 47} r="3" fill={look.blush} />
        </g>

        {/* zzz while dozing */}
        {status === "idle" && (
          <g
            fill="var(--muted)"
            fontFamily="var(--font-spline-mono), monospace"
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
        {(status === "break" || status === "idle") && (
          <g>
            <rect x="66" y="70" width="9" height="8" rx="1.5" fill="#C97F55" />
            <path
              d="M75 72 q4 0 4 2.5 q0 2.5 -4 2.5"
              fill="none"
              stroke="#C97F55"
              strokeWidth="1.5"
            />
            {status === "break" && (
              <g stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" fill="none">
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
