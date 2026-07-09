"use client";

// Landing: a lights-off study hall with three demo desks showing exactly what
// presence looks like inside a room. Logged-in users go straight to /rooms.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Character from "../components/Character";
import Nav from "../components/Nav";
import { useAuth } from "../lib/auth";

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/rooms");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-dim">
          the study hall is open all night
        </p>
        <h1 className="mt-4 max-w-2xl text-center font-display text-4xl font-semibold leading-tight text-paper sm:text-6xl">
          Nobody studies well
          <br />
          <span className="text-lamp">alone at 2am.</span>
        </h1>
        <p className="mt-6 max-w-md text-center text-ink-dim">
          Join a room, switch your lamp on, and study next to people who are
          really there. When you take a break, everyone sees the coffee come
          out.
        </p>

        {/* three live desks: the product, demonstrated */}
        <div className="mt-12 flex flex-wrap items-end justify-center gap-2 rounded-2xl border border-night-line bg-night-raised/50 px-6 py-8">
          <Character userId="demo-momo" displayName="momo" status="focusing" />
          <Character userId="demo-juno" displayName="juno" status="break" />
          <Character userId="demo-pip" displayName="pip" status="idle" />
        </div>

        <div className="mt-12 flex gap-4">
          <Link
            href="/register"
            className="rounded-full bg-lamp px-7 py-3 font-bold text-night hover:brightness-110"
          >
            Take a seat
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-night-line px-7 py-3 font-bold text-paper hover:border-ink-dim"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
