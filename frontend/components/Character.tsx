// A person in the room: their animal at its desk, doing what they are
// actually doing (activity is stable per user), with a nameplate below.
// Focusing plays the activity animation, a break pours a coffee, idle dozes.

import { ACTIVITY_LABEL, activityFor, type Activity } from "../lib/character";
import type { PresenceStatus } from "../lib/types";
import { DeskFigure } from "./scene";

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
  /* True when this person just walked in: plays the entrance walk. */
  entering?: boolean;
  /* Activity override; the landing page uses it to stage a varied scene. */
  activity?: Activity;
}

export default function Character({
  userId,
  displayName,
  status,
  isSelf = false,
  entering = false,
  activity,
}: Props) {
  const label =
    status === "focusing"
      ? ACTIVITY_LABEL[activity ?? activityFor(userId)]
      : status === "break"
        ? "on a break"
        : "dozing off";

  return (
    <figure
      role="img"
      aria-label={`${displayName}, ${label}`}
      className={`flex w-32 flex-col items-center gap-0.5 ${
        entering ? "anim-walkin" : ""
      } ${status === "idle" ? "opacity-75" : ""}`}
    >
      <DeskFigure userId={userId} status={status} activity={activity} />
      <figcaption className="flex max-w-full flex-col items-center rounded-xl border border-white/50 bg-white/40 px-2.5 py-1 backdrop-blur-sm">
        <span className="flex max-w-full items-center gap-1.5 text-xs">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`}
          />
          <span
            className={`truncate ${isSelf ? "font-semibold text-ink" : "text-ink/75"}`}
          >
            {displayName}
            {isSelf ? " (you)" : ""}
          </span>
        </span>
        <span className="max-w-full truncate font-mono text-[10px] text-muted">
          {label}
        </span>
      </figcaption>
    </figure>
  );
}
