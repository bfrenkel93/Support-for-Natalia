import type { Metadata } from "next";
import { Spectral, Archivo } from "next/font/google";
import "./globals.css";

// Editorial serif for headings & pull-quotes — calm, architectural, not romantic.
const spectral = Spectral({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

// Restrained modern grotesque for nav, labels, dates, buttons & body.
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

// Neutral default title so pages that don't set their own never inherit one
// family's branding. Each page (Natalia's home, every family page) sets its
// own title via generateMetadata; this is only the fallback.
export const metadata: Metadata = {
  title: "Family Grief Support",
  description: "A private page for family and friends.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spectral.variable} ${archivo.variable}`}>
      <body className="min-h-screen bg-parchment">{children}</body>
    </html>
  );
}
