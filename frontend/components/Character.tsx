// One seat in the room: a study carrel with a chair, privacy panel, desk,
// reading lamp, and a name plate. The occupant is a minimal silhouette;
// their state is told by the furniture: a lit breathing lamp and an open
// book mean focus, steam over a mug means a break, a darkened pod means
// idle. Everything is HTML/CSS except the small figure silhouette.

import { characterLook, type CharacterLook } from "../lib/character";
import type { PresenceStatus } from "../lib/types";

const STATUS_LABEL: Record<PresenceStatus, string> = {
  focusing: "focusing",
  break: "on a break",
  idle: "idle",
};

/* Minimal head-and-shoulders silhouette; species reads from the ear line. */
function Figure({
  look,
  status,
}: {
  look: CharacterLook;
  status: PresenceStatus;
}) {
  const idle = status === "idle";
  const anim =
    status === "focusing"
      ? "anim-breathe"
      : status === "break"
        ? "anim-sway"
        : "anim-doze";
  const EYE = "#33424A";
  return (
    <svg viewBox="0 0 64 52" className={`h-14 w-16 ${anim}`} aria-hidden="true">
      {/* shoulders */}
      <path
        d={idle ? "M14 52 Q14 40 32 40 Q50 40 50 52 Z" : "M14 52 Q14 36 32 36 Q50 36 50 52 Z"}
        fill={look.body}
      />
      {look.species === "penguin" && (
        <path
          d={idle ? "M22 52 Q22 44 32 44 Q42 44 42 52 Z" : "M22 52 Q22 41 32 41 Q42 41 42 52 Z"}
          fill={look.belly}
        />
      )}
      {/* head */}
      <circle cx="32" cy={idle ? 26 : 21} r="12" fill={look.body} />
      {/* species ear line */}
      {(look.species === "cat" || look.species === "fox" || look.species === "owl") && (
        <>
          <path d={`M22 ${idle ? 18 : 13} l-2 -8 l8 4 Z`} fill={look.body} />
          <path d={`M42 ${idle ? 18 : 13} l2 -8 l-8 4 Z`} fill={look.body} />
        </>
      )}
      {look.species === "bear" && (
        <>
          <circle cx="23" cy={idle ? 16 : 11} r="4" fill={look.body} />
          <circle cx="41" cy={idle ? 16 : 11} r="4" fill={look.body} />
        </>
      )}
      {look.species === "rabbit" && (
        <>
          <ellipse cx="26" cy={idle ? 8 : 3} rx="3" ry="9" fill={look.body} />
          <ellipse cx="38" cy={idle ? 8 : 3} rx="3" ry="9" fill={look.body} />
        </>
      )}
      {look.species === "frog" && (
        <>
          <circle cx="25" cy={idle ? 15 : 10} r="4" fill={look.body} />
          <circle cx="39" cy={idle ? 15 : 10} r="4" fill={look.body} />
        </>
      )}
      {/* eyes: open dots, closed lines when idle */}
      {idle ? (
        <g stroke={EYE} strokeWidth="1.2" strokeLinecap="round">
          <path d={`M26 27 h4`} />
          <path d={`M34 27 h4`} />
        </g>
      ) : (
        <g fill={EYE} className="anim-blink">
          <circle cx="27.5" cy="22" r="1.7" />
          <circle cx="36.5" cy="22" r="1.7" />
        </g>
      )}
    </svg>
  );
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
  const focusing = status === "focusing";
  const onBreak = status === "break";
  const idle = status === "idle";

  return (
    <figure
      className={`relative w-32 transition-opacity duration-700 ${
        idle ? "opacity-60" : "opacity-100"
      }`}
      role="img"
      aria-label={`${displayName}, ${STATUS_LABEL[status]}`}
    >
      <div className="relative h-36">
        {/* privacy panel behind the desk */}
        <div className="pod-panel absolute inset-x-4 bottom-11 top-6" />

        {/* lamp cone falls across the work area while focusing */}
        {focusing && (
          <div className="pod-lampcone anim-lampglow absolute bottom-12 left-5 h-16 w-20" />
        )}

        {/* chair back peeking behind the occupant */}
        <div className="pod-chair absolute bottom-11 left-1/2 h-10 w-16 -translate-x-1/2" />

        {/* the occupant */}
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2">
          <Figure look={look} status={status} />
        </div>

        {/* reading lamp on the left desk edge */}
        <div className="absolute bottom-12 left-5 h-12 w-8" aria-hidden="true">
          <div className="absolute bottom-0 left-1 h-9 w-[2.5px] rounded-full bg-ink/60" />
          <div className="absolute left-1 top-1 h-[2.5px] w-5 rounded-full bg-ink/60" style={{ transform: "rotate(18deg)", transformOrigin: "0 50%" }} />
          <div
            className={`absolute right-0 top-2 h-2.5 w-3.5 rounded-sm ${
              focusing ? "bg-sun" : onBreak ? "bg-sun/50" : "bg-ink/50"
            } ${focusing ? "anim-lampglow" : ""}`}
            style={{ transform: "rotate(18deg)" }}
          />
        </div>

        {/* desk: lit pool, top, front */}
        <div className="absolute inset-x-1 bottom-6 h-6">
          {focusing && (
            <div className="pod-poollight anim-lampglow absolute -top-3 inset-x-2 h-4" />
          )}
          <div className="pod-desk-top absolute inset-x-0 top-0 h-2.5" />
          <div className="pod-desk-front absolute inset-x-1 bottom-0 top-2.5" />
        </div>

        {/* desk objects */}
        {focusing ? (
          /* open book: two leaves */
          <div className="absolute bottom-[46px] left-1/2 flex -translate-x-1/2" aria-hidden="true">
            <div className="h-2 w-4 rounded-l-sm bg-[#F0EBDC] shadow-[inset_-1px_0_0_#DAD2BC]" style={{ transform: "skewY(-6deg)" }} />
            <div className="h-2 w-4 rounded-r-sm bg-[#F0EBDC] shadow-[inset_1px_0_0_#DAD2BC]" style={{ transform: "skewY(6deg)" }} />
          </div>
        ) : (
          /* mug, steaming on a break */
          <div className="absolute bottom-[46px] right-7" aria-hidden="true">
            {onBreak && (
              <>
                <span className="steam-wisp absolute -top-3 left-0.5" />
                <span
                  className="steam-wisp absolute -top-3 left-2"
                  style={{ animationDelay: "1.2s" }}
                />
              </>
            )}
            <div className="h-2.5 w-3 rounded-[2px] bg-coral/85" />
          </div>
        )}

        {/* pod ground shadow */}
        <div className="absolute inset-x-4 bottom-4 h-2 rounded-full bg-ink/10 blur-[3px]" />
      </div>

      {/* name plate on the desk front */}
      <figcaption className="absolute inset-x-2 bottom-0 flex items-center justify-center gap-1.5 rounded-sm border border-ink/10 bg-surface px-1.5 py-0.5">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            focusing
              ? "status-lamp bg-sun"
              : onBreak
                ? "bg-mint"
                : "bg-muted/50"
          }`}
        />
        <span
          className={`truncate text-[11px] leading-4 ${
            isSelf ? "font-semibold text-ink" : "text-muted"
          }`}
        >
          {displayName}
          {isSelf ? " (you)" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
