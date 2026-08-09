import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
  weight: ["400", "600", "700"],
  adjustFontFallback: false,
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
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`}>
      <head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </head>
      <body className="min-h-screen bg-cream">{children}</body>
    </html>
  );
}
