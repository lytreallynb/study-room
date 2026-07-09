import type { Metadata } from "next";
import { Newsreader, Schibsted_Grotesk, Sono } from "next/font/google";

import { AuthProvider } from "../lib/auth";
import "./globals.css";

// Library-at-dawn type: Newsreader (a quiet literary serif) carries
// headings, Schibsted Grotesk carries the interface, and Sono, a soft
// monospace, carries the timer and stat numerals.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sono = Sono({
  variable: "--font-sono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "StudySync",
  description:
    "A quiet study room by the water: take a desk, switch your lamp on, and work next to people who are really there.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${schibsted.variable} ${sono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
