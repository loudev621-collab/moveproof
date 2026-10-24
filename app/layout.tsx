import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Doorstamp: California AB 2801 move-in and move-out photo records",
  description:
    "Room-by-room move-in and move-out photos for California renters and landlords, timestamped and locked. No app to download. Renters pay once per move; landlords are free.",
  appleWebApp: { capable: true, title: "Doorstamp" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#18222b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-soft">
          <p>Doorstamp keeps records of the photos and notes you provide. It is not legal advice.</p>
          <p className="mt-2">
            <a href="/legal" className="underline">Terms, privacy and what reports prove</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
