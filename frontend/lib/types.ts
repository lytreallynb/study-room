// Mirrors the FastAPI response schemas in backend/app/schemas.

export interface User {
  id: string;
  email: string;
  display_name: string;
  coins: number;
  level: number;
  xp: number;
  character_config: Record<string, unknown>;
  created_at: string;
}

export interface Reward {
  coins_earned: number;
  xp_earned: number;
  level: number;
  leveled_up: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Room {
  id: string;
  name: string;
  owner_id: string;
  capacity: number;
  is_public: boolean;
  created_at: string;
  // Live member count (only present on the list endpoint).
  occupancy?: number;
}

export type SessionStatus = "active" | "paused" | "ended";

export interface StudySession {
  id: string;
  user_id: string;
  room_id: string | null;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  last_resumed_at: string | null;
  focus_seconds: number;
}

export interface SessionEnd extends StudySession {
  reward: Reward;
}

export interface PracticeCard {
  id: string;
  term: string;
  pos: string;
  definition: string;
  translation: string;
  example: string;
  // Leitner box 1..5 if reviewed before, null for a brand-new card.
  box: number | null;
}

export interface ReviewResult {
  word_id: string;
  box: number;
  due_at: string;
  correct_count: number;
  wrong_count: number;
  reward: Reward;
}

export interface DailyStat {
  date: string;
  total_focus_seconds: number;
  sessions_count: number;
  completion_rate: number;
}

export interface MyStats {
  total_focus_seconds: number;
  total_sessions: number;
  days: DailyStat[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  focus_seconds: number;
}

// Presence member as broadcast by the realtime service.
export type PresenceStatus = "focusing" | "break" | "idle";

export interface Member {
  user_id: string;
  display_name: string;
  character: Record<string, unknown>;
  status: PresenceStatus;
  joined_at: number;
  last_seen: number;
}
