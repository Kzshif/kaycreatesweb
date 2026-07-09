import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novawebstudio05.netlify.app";

// Public, indexable marketing routes. The authed app and API are intentionally
// excluded (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/chatbot", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/receptionist", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/websites", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/seo", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/qr", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
