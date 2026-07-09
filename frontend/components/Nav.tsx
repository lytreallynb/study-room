"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth";
import CoinIcon from "./CoinIcon";

const LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/adventure", label: "Adventure" },
  { href: "/stats", label: "My desk" },
];

export default function Nav() {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/45 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          Study<span className="text-sun">Sync</span>
        </Link>

        {status === "authenticated" && (
          <div className="flex gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname.startsWith(l.href)
                    ? "font-bold text-ink"
                    : "text-muted hover:text-ink"
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
              <span
                className="flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 font-mono text-xs text-sun"
                title="Coins earned from focus and word practice"
              >
                <CoinIcon className="h-3.5 w-3.5" />
                {user.coins}
              </span>
              <span className="rounded-full bg-white/60 px-3 py-1 font-mono text-xs text-mint">
                lv {user.level}
              </span>
              <span className="hidden text-muted sm:inline">
                {user.display_name}
              </span>
              <button
                onClick={logout}
                className="text-muted hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link href="/login" className="text-muted hover:text-ink">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-sun px-4 py-1.5 font-bold text-white hover:brightness-110"
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
