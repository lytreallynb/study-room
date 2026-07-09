import type { Metadata } from "next";
import { Baloo_2, Nunito, Sono } from "next/font/google";

import { AuthProvider } from "../lib/auth";
import "./globals.css";

// Rounded, sun-warmed type for a seaside room: Baloo 2 carries headings
// (chunky, friendly), Nunito carries body text (soft humanist), and Sono, a
// soft monospace, carries the timer and stat numerals.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const sono = Sono({
  variable: "--font-sono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "StudySync",
  description:
    "A seaside study room where you focus together: take a desk by the water, switch your lamp on, and see who else is studying right now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} ${sono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ambient surf on the horizon, behind everything */}
        <div className="wave-layer wave-back" aria-hidden="true" />
        <div className="wave-layer wave-front" aria-hidden="true" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
