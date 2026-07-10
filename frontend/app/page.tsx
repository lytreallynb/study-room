"use client";

// One screen: a headline, two actions, and the room itself, live, resting
// on a single line of oak. Whitespace does the rest.

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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-16 pt-10">
        <div className="relative text-center">
          {/* the lamp over the door: the same strip every lit thing carries */}
          <div
            className="lamp-strip anim-lampglow mx-auto w-16"
            aria-hidden="true"
          />
          <div
            className="lamp-pool pointer-events-none absolute inset-x-0 top-0 h-40"
            aria-hidden="true"
          />
          <h1 className="relative mt-10 font-display text-5xl font-medium leading-tight tracking-tight text-ink sm:text-6xl">
            The room is <em className="italic">open</em>.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted">
            Sit down with people who are really studying.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-mint px-6 py-2.5 font-semibold text-white shadow-[0_10px_24px_-12px_rgba(91,114,101,0.7)] transition-[filter] hover:brightness-110"
            >
              Take a seat
            </Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-2.5 font-medium text-ink/70 transition-colors hover:text-ink"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* the room, live: three desks under their lamps on one oak line */}
        <div className="relative mt-16 sm:mt-20">
          <div className="relative flex flex-wrap items-end justify-center gap-4 sm:gap-8">
            <Character
              userId="demo-momo"
              displayName="momo"
              status="focusing"
              activity="reading"
            />
            <Character
              userId="demo-juno"
              displayName="juno"
              status="focusing"
              activity="coding"
            />
            <Character userId="demo-pip" displayName="pip" status="break" />
          </div>
          {/* the surface the seats rest on */}
          <div className="mx-auto mt-6 max-w-xl" aria-hidden="true">
            <div className="h-px bg-white/70" />
            <div className="mx-8 h-2 rounded-[50%] bg-ink/[0.08] blur-[2px]" />
          </div>
        </div>
      </main>
    </div>
  );
}
