// A presence tile: one person at their desk, told with light instead of
// drawings. The top of the tile is the light falling on their desk (warm
// while focusing, sage on a break, unlit when idle), the monogram is who,
// the plate below is the name and status. No furniture, no mascots.

import { characterLook } from "../lib/character";
import type { PresenceStatus } from "../lib/types";

const STATUS_LABEL: Record<PresenceStatus, string> = {
  focusing: "focusing",
  break: "on a break",
  idle: "idle",
};

const LIGHT_FIELD: Record<PresenceStatus, string> = {
  focusing: "tile-light-focus",
  break: "tile-light-break",
  idle: "tile-light-idle",
};

const STATUS_DOT: Record<PresenceStatus, string> = {
  focusing: "status-lamp bg-sun",
  break: "bg-mint",
  idle: "bg-muted/40",
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
  const focusing = status === "focusing";
  const idle = status === "idle";
  const initial = (displayName.trim().charAt(0) || "?").toUpperCase();

  return (
    <figure
      role="img"
      aria-label={`${displayName}, ${STATUS_LABEL[status]}`}
      className={`glass w-36 rounded-xl transition-[opacity,border-color] duration-500 hover:border-ink/20 ${
        idle ? "opacity-55" : "opacity-100"
      }`}
    >
      {/* the light on their desk */}
      <div
        className="relative h-20 overflow-hidden rounded-t-[11px]"
        aria-hidden="true"
      >
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${LIGHT_FIELD[status]} ${
            focusing ? "anim-lampglow" : ""
          }`}
        />
        {/* the lamp itself: the brand strip, lit by state */}
        <div
          className={`absolute left-1/2 top-0 w-12 -translate-x-1/2 ${
            focusing
              ? "lamp-strip"
              : status === "break"
                ? "lamp-strip-dim"
                : "lamp-strip-off"
          }`}
        />
        {/* a break reads as warm air rising, nothing more */}
        {status === "break" && (
          <div className="absolute bottom-4 right-5">
            <span className="steam-wisp absolute bottom-1 left-0" />
            <span
              className="steam-wisp absolute bottom-1 left-1.5"
              style={{ animationDelay: "1.3s" }}
            />
            <span className="absolute -bottom-0.5 left-0 h-[3px] w-[9px] rounded-full bg-muted/40" />
          </div>
        )}
        {/* monogram, sitting in the light */}
        <span
          className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-[42%] items-center justify-center rounded-full font-display text-xl text-ink/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_3px_rgba(36,41,43,0.12)]"
          style={{ backgroundColor: look.body }}
        >
          {initial}
        </span>
      </div>

      {/* the name plate */}
      <figcaption className="border-t border-line px-2.5 pb-2 pt-1.5 text-center">
        <span
          className={`block truncate text-[13px] leading-5 ${
            isSelf ? "font-semibold text-ink" : "text-ink/80"
          }`}
        >
          {displayName}
          {isSelf ? " (you)" : ""}
        </span>
        <span className="mt-0.5 flex items-center justify-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-700 ${STATUS_DOT[status]}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {STATUS_LABEL[status]}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
