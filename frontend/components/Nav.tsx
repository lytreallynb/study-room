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
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
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
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-ink/5 text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 text-sm">
          {status === "authenticated" && user ? (
            <>
              <span
                className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-sun"
                title="Coins earned from focus and word practice"
              >
                <CoinIcon className="h-3.5 w-3.5" />
                {user.coins}
              </span>
              <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-mint">
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
                className="rounded-lg bg-mint px-4 py-1.5 font-semibold text-white hover:brightness-110"
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
