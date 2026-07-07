import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nova05.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/demo", "/dashboard"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
