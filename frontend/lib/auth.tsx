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
    // Without a stored token this 401s immediately and settles to anonymous.
    api
      .me()
      .then((u) => {
        setUser(u);
        setStatus("authenticated");
      })
      .catch(() => {
        api.clearToken();
        setStatus("anonymous");
      });
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
