import type { Metadata } from "next";
import { Fraunces, Karla, Spline_Sans_Mono } from "next/font/google";

import { AuthProvider } from "../lib/auth";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${fraunces.variable} ${karla.variable} ${splineMono.variable} h-full antialiased`}
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
