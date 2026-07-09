"use client";

// The landing is the room itself: a dawn window, a shared desk, three seats
// already occupied. No pitch, no feature list; walking in explains it.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Character from "../components/Character";
import Nav from "../components/Nav";
import { WindowPane } from "../components/art";
import { useAuth } from "../lib/auth";

function WallClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    let cancelled = false;
    // First paint lands async (client time is unknowable at SSR anyway).
    Promise.resolve().then(() => {
      if (!cancelled) setNow(fmt());
    });
    const t = setInterval(() => setNow(fmt()), 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);
  // Fixed-width slot so hydration and updates never shift the window.
  return (
    <span className="inline-block min-w-[4.5ch] font-mono text-4xl text-ink/80 sm:text-5xl">
      {now ?? ""}
    </span>
  );
}

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/rooms");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
        {/* the room */}
        <section className="glass overflow-hidden rounded-2xl">
          {/* dawn window with the wall clock on the glass */}
          <WindowPane className="flex h-44 flex-col items-center justify-center gap-1 sm:h-52">
            <WallClock />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink/50">
              the room is open
            </p>
          </WindowPane>

          {/* the shared desk: three seats, three states */}
          <div className="well flex flex-wrap items-end justify-center gap-1 px-4 pb-5 pt-6 sm:gap-4">
            <Character userId="demo-momo" displayName="momo" status="focusing" />
            <Character userId="demo-juno" displayName="juno" status="break" />
            <Character userId="demo-pip" displayName="pip" status="idle" />
          </div>

          {/* the reception counter */}
          <div className="flex flex-col items-center gap-4 border-t border-line/70 px-6 py-6 sm:flex-row sm:justify-between">
            <p className="font-display text-lg text-ink">
              A quiet desk is waiting.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-mint px-5 py-2.5 font-semibold text-white hover:brightness-110"
              >
                Take a seat
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-line bg-surface px-5 py-2.5 font-semibold text-ink hover:border-muted"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* one quiet line under the room; that is all the marketing */}
        <p className="mt-6 text-center text-sm text-muted">
          Study together in real time. Focus is measured, words are kept,
          the road gets longer.
        </p>
      </main>
    </div>
  );
}
