"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth";

const LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/stats", label: "My desk" },
];

export default function Nav() {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-night-line">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-paper"
        >
          Study<span className="text-lamp">Sync</span>
        </Link>

        {status === "authenticated" && (
          <div className="flex gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname.startsWith(l.href)
                    ? "font-bold text-paper"
                    : "text-ink-dim hover:text-paper"
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4 text-sm">
          {status === "authenticated" && user ? (
            <>
              <span className="hidden text-ink-dim sm:inline">
                {user.display_name}
              </span>
              <button
                onClick={logout}
                className="text-ink-dim hover:text-paper"
              >
                Log out
              </button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link href="/login" className="text-ink-dim hover:text-paper">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-lamp px-4 py-1.5 font-bold text-night hover:brightness-110"
              >
                Take a seat
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
