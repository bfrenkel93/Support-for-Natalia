import type { Metadata } from "next";
import { Spectral, Archivo } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

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

// Keep the whole site out of search engines.
export const metadata: Metadata = {
  title: "A private support page",
  description: "A private page for family and friends.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pull the browser-tab title from editable settings (best-effort).
  let title = "A private support page";
  try {
    const settings = await getSettings();
    if (settings.site_title) title = settings.site_title;
  } catch {
    // ignore — fall back to default title
  }

  return (
    <html lang="en" className={`${spectral.variable} ${archivo.variable}`}>
      <head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </head>
      <body className="min-h-screen bg-parchment">{children}</body>
    </html>
  );
}
