import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "MoveProof: protect your deposit with timestamped move-out photos",
  description:
    "Room-by-room move-in and move-out photos, timestamped and locked, in one PDF you can share if there's ever a deposit dispute.",
  appleWebApp: { capable: true, title: "MoveProof" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#18222b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-soft">
          <p>MoveProof keeps records of the photos and notes you provide. It is not legal advice.</p>
          <p className="mt-2">
            <a href="/legal" className="underline">Terms, privacy and what reports prove</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
