import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nova05.vercel.app";

// Explicitly welcome AI answer-engine crawlers (AEO): a blocked bot means that
// platform can never cite you. See the AEO skill's bot-access matrix.
export default function robots(): MetadataRoute.Robots {
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "Amazonbot",
    "cohere-ai",
    "CCBot",
    "Bingbot",
  ];
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiCrawlers.map((ua) => ({ userAgent: ua, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
