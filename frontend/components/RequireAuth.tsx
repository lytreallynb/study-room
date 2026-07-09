"use client";

// Gate for authenticated pages: waits for the token check, then either
// renders children or bounces to /login.

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "../lib/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 items-center justify-center text-muted">
        Unlocking the study hall...
      </main>
    );
  }
  return <>{children}</>;
}
