"use client";

// Client-side auth state. The JWT lives in localStorage; on mount we validate
// it against /auth/me. Pages that need auth call useAuth() and redirect when
// status settles to "anonymous".

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as api from "./api";
import type { User } from "./types";

type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!api.getToken()) {
      // Settle to anonymous without a doomed request (async to satisfy the
      // no-setState-in-effect rule).
      Promise.resolve().then(() => {
        if (!cancelled) setStatus("anonymous");
      });
      return () => {
        cancelled = true;
      };
    }
    api
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // Only a rejected token means logged out; a network error or 5xx
        // must not delete a still-valid token.
        if (err instanceof api.ApiError && err.status === 401) {
          api.clearToken();
        }
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await api.login(email, password);
    api.setToken(token.access_token);
    const u = await api.me();
    setUser(u);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await api.register(email, password, displayName);
      const token = await api.login(email, password);
      api.setToken(token.access_token);
      const u = await api.me();
      setUser(u);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
