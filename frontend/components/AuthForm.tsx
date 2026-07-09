"use client";

// Shared login / register form. On success routes to /rooms.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "../lib/auth";

interface Props {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: Props) {
  const { login, register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      router.replace("/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-night-line bg-night px-3.5 py-2.5 text-paper placeholder:text-ink-dim/60";

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl font-semibold text-paper">
        {mode === "register" ? "Take a seat" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-ink-dim">
        {mode === "register"
          ? "Pick a name for your desk. Your character is waiting."
          : "Your desk is where you left it."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        {mode === "register" && (
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Display name
            <input
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="momo"
              required
              maxLength={80}
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
          Email
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
          Password
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "8+ characters" : ""}
            required
            minLength={8}
          />
        </label>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-full bg-lamp py-2.5 font-bold text-night hover:brightness-110 disabled:opacity-50"
        >
          {busy
            ? "One moment"
            : mode === "register"
              ? "Create my desk"
              : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-dim">
        {mode === "register" ? (
          <>
            Already have a desk?{" "}
            <Link href="/login" className="text-lamp hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            First time here?{" "}
            <Link href="/register" className="text-lamp hover:underline">
              Take a seat
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
