"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../lib/auth";
import { LogoMark } from "./art";
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
    <header className="glass-strong sticky top-0 z-20">
      <nav className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:gap-x-6 sm:py-0">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <LogoMark />
          <span>
            Study<span className="italic text-sun">Sync</span>
          </span>
        </Link>

        {status === "authenticated" && (
          <div className="flex gap-1 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-md px-2.5 py-1 font-medium transition-colors ${
                  pathname.startsWith(l.href)
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
                {pathname.startsWith(l.href) && (
                  <span
                    className="lamp-strip absolute -bottom-0.5 left-1/2 w-5 -translate-x-1/2"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 text-sm">
          {status === "authenticated" && user ? (
            <>
              <span
                className="flex items-center gap-1.5 rounded-full border border-white/60 bg-surface px-3 py-1 font-mono text-xs text-sun"
                title="Coins earned from focus and word practice"
              >
                <CoinIcon className="h-3.5 w-3.5" />
                {user.coins}
              </span>
              <span className="rounded-full border border-white/60 bg-surface px-3 py-1 font-mono text-xs text-mint">
                lv {user.level}
              </span>
              <span className="hidden text-muted sm:inline">
                {user.display_name}
              </span>
              <button onClick={logout} className="text-muted hover:text-ink">
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
                className="rounded-full bg-mint px-4 py-1.5 font-semibold text-white hover:brightness-110"
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
