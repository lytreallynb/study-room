"use client";

// Live presence for one room over Socket.IO.
//
// Protocol (see backend/app/realtime/server.py):
//   connect with auth={token}, then emit join_room -> we get a full
//   "room_snapshot"; everyone else gets a "presence_update" join delta.
//   Status changes and leaves arrive as further "presence_update" events.
//   A heartbeat every 20s keeps us under the server's 45s staleness TTL.
//   socket.io reconnects automatically; on every (re)connect we re-join and
//   receive a fresh snapshot, which is the reconnect-recovery path.

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { REALTIME_URL, getToken } from "./api";
import type { Member, PresenceStatus } from "./types";

const HEARTBEAT_MS = 20_000;

interface PresenceUpdate {
  room_id: string;
  event: "join" | "status" | "leave";
  member?: Member;
  user_id?: string;
}

interface RoomSnapshot {
  room_id: string;
  members: Member[];
}

export type PresenceConnState = "connecting" | "live" | "error";

export function useRoomPresence(roomId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [connState, setConnState] = useState<PresenceConnState>("connecting");
  const [roomError, setRoomError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const statusRef = useRef<PresenceStatus>("focusing");

  useEffect(() => {
    const token = getToken();
    // No token: RequireAuth is about to redirect; stay in "connecting".
    if (!token) return;

    const socket = io(REALTIME_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Initial join and reconnect recovery share one path: join again and
      // let the snapshot replace whatever state we had.
      socket.emit("join_room", { room_id: roomId, status: statusRef.current });
    });

    socket.on("room_snapshot", (snap: RoomSnapshot) => {
      if (snap.room_id !== roomId) return;
      setMembers(snap.members);
      setConnState("live");
      setRoomError(null);
    });

    socket.on("presence_update", (update: PresenceUpdate) => {
      if (update.room_id !== roomId) return;
      setMembers((prev) => {
        if (update.event === "leave") {
          return prev.filter((m) => m.user_id !== update.user_id);
        }
        const member = update.member;
        if (!member) return prev;
        const without = prev.filter((m) => m.user_id !== member.user_id);
        const next = [...without, member];
        next.sort((a, b) => a.joined_at - b.joined_at);
        return next;
      });
    });

    socket.on("error", (payload: { detail?: string }) => {
      if (payload?.detail) setRoomError(payload.detail);
    });

    socket.on("connect_error", () => setConnState("error"));
    socket.on("disconnect", () => setConnState("connecting"));

    const beat = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat", { room_id: roomId });
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(beat);
      socket.emit("leave_room", { room_id: roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const setStatus = useCallback(
    (status: PresenceStatus) => {
      statusRef.current = status;
      socketRef.current?.emit("set_status", { room_id: roomId, status });
    },
    [roomId],
  );

  return { members, connState, roomError, setStatus };
}
