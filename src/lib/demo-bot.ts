import type { Bot, Workspace } from "./types";

// The built-in demo bot embedded on our own marketing pages (botKey "demo").
// It sells NovaWebStudio — dogfooding the widget. Its conversations and leads
// are stored under the reserved workspace id "demo", never a tenant's.

export const DEMO_WORKSPACE: Workspace = {
  id: "demo",
  userId: "demo",
  name: "NovaWebStudio",
  website: "https://novawebstudio.netlify.app",
  about:
    "NovaWebStudio (brand: NOVA05) gives any business an AI chatbot for their website plus an AI SEO studio. The chatbot answers visitor questions 24/7 and captures leads; the SEO studio audits pages, scores them, and writes titles, meta descriptions, keywords, and blog posts.",
  plan: "scale",
  trialEndsAt: "2099-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const DEMO_BOT: Bot = {
  id: "demo",
  workspaceId: "demo",
  publicKey: "demo",
  name: "Nova",
  tone: "playful",
  goal: "leads",
  welcome:
    "Hey, I'm Nova ✦ — the exact AI assistant you'd get for your own site. Ask me anything about NOVA05, or just test how I'd treat one of your visitors.",
  knowledge: `Product: NovaWebStudio (NOVA05) — AI chatbots & SEO for any website.
What the chatbot does: answers visitor questions from the business's own knowledge, captures leads (name + email) into an inbox, works on any website with one script tag, customizable name/tone/color/goal.
What the SEO Studio does: audits any page (0-100 score across 10 checks: title, meta description, H1s, content depth, alt text, canonical, Open Graph, mobile viewport, internal links), writes prioritized fixes, and generates titles, meta descriptions, keywords, and full blog posts.
Pricing: Launch $29/mo (1 bot, 500 messages/mo, 5 SEO audits/mo). Grow $79/mo (3 bots, 3,000 messages, unlimited audits, AI blog writer, weekly pulse briefing) — most popular. Scale $199/mo (10 bots, 15,000 messages, white-label). Every plan starts with a 14-day free trial, no credit card.
Setup: sign up, describe your business, paste one script tag into your site — live in under 5 minutes. Works with any website platform (WordPress, Shopify, Squarespace, Wix, Webflow, Framer, custom).`,
  faq: [
    {
      q: "How do I install the chatbot on my website?",
      a: "One script tag — we give it to you after signup. Paste it before </body> on any platform (WordPress, Shopify, Squarespace, Wix, Webflow, Framer, custom code) and the chat bubble appears instantly.",
    },
    {
      q: "Do I need a credit card for the trial?",
      a: "Nope — every plan starts with a 14-day free trial, no credit card required.",
    },
    {
      q: "Can the bot answer questions about MY business?",
      a: "Yes — you paste in your business info, services, pricing, and FAQs, and the bot answers from that (and only that — it never invents details).",
    },
  ],
  color: "#f06595",
  createdAt: "2026-01-01T00:00:00.000Z",
};
