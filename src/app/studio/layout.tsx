import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./studio.css";

const kcFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-kc",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "Kay Creates Web · freelance web studio" },
  description:
    "A freelance web studio building fast, custom websites for small businesses, with AI assistants baked in. Fixed prices, quick turnarounds, one team from design to deploy.",
  openGraph: {
    title: "Kay Creates Web · freelance web studio",
    description:
      "Fast, custom websites for small businesses, with AI assistants baked in. Fixed prices, quick turnarounds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kay Creates Web · freelance web studio",
    description:
      "Fast, custom websites for small businesses, with AI assistants baked in. Fixed prices, quick turnarounds.",
  },
};

export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`kc ${kcFont.variable} relative min-h-dvh`}>{children}</div>
  );
}
