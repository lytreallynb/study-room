// Thin typed client for the FastAPI backend. Token lives in localStorage;
// every helper throws ApiError on a non-2xx response so pages can show the
// backend's own detail message.

import type {
  LeaderboardEntry,
  MyStats,
  Room,
  StudySession,
  Token,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:8001";

const TOKEN_KEY = "studysync_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- auth ---

export function register(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
}

export function login(email: string, password: string): Promise<Token> {
  return request<Token>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function me(): Promise<User> {
  return request<User>("/auth/me");
}

// --- rooms ---

export function listRooms(): Promise<Room[]> {
  return request<Room[]>("/rooms");
}

export function getRoom(roomId: string): Promise<Room> {
  return request<Room>(`/rooms/${roomId}`);
}

export function createRoom(
  name: string,
  capacity: number,
  isPublic: boolean,
): Promise<Room> {
  return request<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({ name, capacity, is_public: isPublic }),
  });
}

// --- sessions ---

export function startSession(roomId: string | null): Promise<StudySession> {
  return request<StudySession>("/sessions", {
    method: "POST",
    body: JSON.stringify({ room_id: roomId }),
  });
}

export function pauseSession(sessionId: string): Promise<StudySession> {
  return request<StudySession>(`/sessions/${sessionId}/pause`, {
    method: "POST",
  });
}

export function resumeSession(sessionId: string): Promise<StudySession> {
  return request<StudySession>(`/sessions/${sessionId}/resume`, {
    method: "POST",
  });
}

export function endSession(sessionId: string): Promise<StudySession> {
  return request<StudySession>(`/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export function listSessions(): Promise<StudySession[]> {
  return request<StudySession[]>("/sessions");
}

// --- stats ---

export function myStats(days = 30): Promise<MyStats> {
  return request<MyStats>(`/stats/me?days=${days}`);
}

export function leaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>(`/stats/leaderboard?limit=${limit}`);
}
