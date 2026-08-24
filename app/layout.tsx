import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/marketing/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "VISITRADE — L'intelligence du marché, réunie au même endroit";
const description =
  "Analysez les marchés en temps réel, explorez plusieurs scénarios et prenez de meilleures décisions grâce aux données et à l'IA. Outil d'analyse et d'aide à la décision — pas de promesse de gains.";

export const metadata: Metadata = {
  metadataBase: new URL("https://visitrade.app"),
  title: {
    default: title,
    template: "%s",
  },
  description,
  applicationName: "VISITRADE",
  keywords: [
    "trading",
    "analyse de marché",
    "crypto",
    "IA",
    "scénarios de marché",
    "scanner",
    "bitcoin",
  ],
  authors: [{ name: "VISITRADE" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "VISITRADE",
    title,
    description,
    url: "https://visitrade.app",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-base text-ink antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
