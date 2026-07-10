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
        <div className="text-center">
          <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            The room is open.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted">
            Sit down with people who are really studying.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-mint px-6 py-2.5 font-semibold text-white transition-[filter] hover:brightness-110"
            >
              Take a seat
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 font-medium text-muted transition-colors hover:text-ink"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* the room, live: three desks under their lamps on one oak line */}
        <div className="relative mt-16 sm:mt-20">
          {/* daylight falling on the desks */}
          <div
            className="lamp-pool pointer-events-none absolute -top-12 left-1/2 h-24 w-[110%] max-w-xl -translate-x-1/2"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-end justify-center gap-4 sm:gap-8">
            <Character userId="demo-momo" displayName="momo" status="focusing" />
            <Character userId="demo-juno" displayName="juno" status="break" />
            <Character userId="demo-pip" displayName="pip" status="idle" />
          </div>
          {/* the desk: one line of oak with its shadow */}
          <div className="mx-auto mt-5 max-w-xl" aria-hidden="true">
            <div className="h-[3px] rounded-full bg-wood/70" />
            <div className="mx-6 h-2 rounded-[50%] bg-ink/[0.07] blur-[2px]" />
          </div>
        </div>
      </main>
    </div>
  );
}
