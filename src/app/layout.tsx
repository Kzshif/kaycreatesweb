import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novawebstudio05.netlify.app";
const SITE_DESC =
  "NovaWebStudio (NOVA05) gives any business an AI chatbot for their website — answering visitors and capturing leads 24/7 — plus an AI SEO studio that audits pages and writes content that ranks. One script tag, any platform.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NOVA05 — AI chatbots & SEO for any website",
    template: "%s · NOVA05",
  },
  description: SITE_DESC,
  applicationName: "NOVA05",
  keywords: [
    "AI chatbot for website",
    "website chatbot",
    "AI lead capture",
    "AI SEO tool",
    "SEO audit",
    "customer support chatbot",
    "embeddable chat widget",
    "small business AI",
  ],
  authors: [{ name: "NovaWebStudio" }],
  creator: "NovaWebStudio",
  publisher: "NovaWebStudio",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "NOVA05",
    url: SITE_URL,
    title: "NOVA05 — AI chatbots & SEO for any website",
    description: SITE_DESC,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOVA05 — AI chatbots & SEO for any website",
    description: SITE_DESC,
  },
  category: "technology",
};

// Structured data so answer engines (ChatGPT, Perplexity, Google AI Overviews)
// and search crawlers can state plainly what NOVA05 is, what it costs, and who makes it.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "NovaWebStudio",
      alternateName: "NOVA05",
      url: SITE_URL,
      description: SITE_DESC,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "NOVA05",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      name: "NOVA05",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESC,
      url: SITE_URL,
      offers: [
        { "@type": "Offer", name: "Launch", price: "29", priceCurrency: "GBP" },
        { "@type": "Offer", name: "Grow", price: "79", priceCurrency: "GBP" },
        { "@type": "Offer", name: "Scale", price: "199", priceCurrency: "GBP" },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
