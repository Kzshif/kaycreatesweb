import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kaycreatesweb-reception.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "kaycreatesweb — the AI receptionist for UK clinics",
    template: "%s · kaycreatesweb",
  },
  description:
    "kaycreatesweb is an AI receptionist for UK dental, GP, physiotherapy, and veterinary practices. It answers every call 24/7, books appointments, takes and triages messages, and answers patient questions — from £29/month. Based in Newbury, UK.",
  keywords: [
    "AI receptionist",
    "AI receptionist for clinics",
    "dental practice phone answering",
    "GP surgery virtual receptionist",
    "veterinary answering service UK",
    "AI phone answering for practices",
    "Newbury",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "kaycreatesweb",
    title: "kaycreatesweb — the AI receptionist for UK clinics",
    description:
      "Answers every call 24/7, books appointments, and takes messages for dental, GP, physio, and veterinary practices across the UK. From £29/month.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "kaycreatesweb — the AI receptionist for UK clinics",
    description:
      "An AI receptionist that answers every call 24/7 for UK dental, GP, physio, and veterinary practices. From £29/month.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-night font-sans text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
