"use client";

// The landing is a running room, seen in cross-section: a glass wall with
// drifting morning light and a sweeping clock, three occupied desks on the
// floor, and one vacant desk in the foreground that is yours to take.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Character from "../components/Character";
import Nav from "../components/Nav";
import { WallClock, WindowWall } from "../components/scene";
import { useAuth } from "../lib/auth";

/* The empty seat in the foreground: the way in. */
function VacantSeat() {
  return (
    <div className="relative w-40">
      <div className="relative h-24">
        {/* pulled-out chair, waiting */}
        <div className="pod-chair absolute bottom-7 left-[38%] h-10 w-14 -translate-x-1/2 rotate-[-7deg] opacity-90" />
        {/* desk */}
        <div className="absolute inset-x-0 bottom-2 h-7">
          <div className="pod-desk-top absolute inset-x-0 top-0 h-3" />
          <div className="pod-desk-front absolute inset-x-1 bottom-0 top-3" />
        </div>
        {/* unlit lamp */}
        <div className="absolute bottom-8 left-3 h-11 w-8" aria-hidden="true">
          <div className="absolute bottom-0 left-1 h-8 w-[2.5px] rounded-full bg-ink/50" />
          <div
            className="absolute left-1 top-1.5 h-[2.5px] w-5 rounded-full bg-ink/50"
            style={{ transform: "rotate(18deg)", transformOrigin: "0 50%" }}
          />
          <div
            className="absolute right-1 top-2.5 h-2.5 w-3.5 rounded-sm bg-ink/40"
            style={{ transform: "rotate(18deg)" }}
          />
        </div>
        <div className="absolute inset-x-5 bottom-0 h-2 rounded-full bg-ink/10 blur-[3px]" />
      </div>
      {/* the name plate is blank; the seat is yours */}
      <Link
        href="/register"
        className="mt-1 block rounded-lg bg-mint px-4 py-2 text-center text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(62,107,92,0.6)] hover:brightness-110"
      >
        Take a seat
      </Link>
    </div>
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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8">
        <section className="glass overflow-hidden rounded-2xl">
          {/* background: the glass wall, light on the move */}
          <div className="relative">
            <WindowWall className="h-44 sm:h-56" />
            {/* the clock hangs on the wall, over the frame */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <WallClock className="h-14 w-14 sm:h-16 sm:w-16" />
            </div>
          </div>

          {/* midground: the occupied row, desks on the floor */}
          <div className="room-floor relative px-4 pb-4 pt-8">
            <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-4 sm:gap-x-6">
              <Character userId="demo-momo" displayName="momo" status="focusing" />
              <Character userId="demo-juno" displayName="juno" status="break" />
              <Character userId="demo-pip" displayName="pip" status="idle" />
            </div>
          </div>

          {/* foreground: your vacant desk, closest to the viewer */}
          <div className="relative border-t border-line/60 bg-gradient-to-b from-paper to-[#e9e1cd] px-6 pb-7 pt-5">
            <div className="flex flex-col items-center gap-x-10 gap-y-3 sm:flex-row sm:justify-center">
              <p className="max-w-[210px] text-center font-display text-xl leading-snug text-ink sm:text-left">
                The corner desk is free.
              </p>
              <VacantSeat />
            </div>
            <Link
              href="/login"
              className="absolute bottom-3 right-4 text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              I already have a desk, log in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
