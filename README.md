# NovaWebStudio (NOVA05)

**AI chatbots & SEO for any website.** Businesses sign up, describe what they do,
and get two things:

1. **An embeddable AI chatbot** — one script tag on any website (WordPress,
   Shopify, Squarespace, Wix, custom). It answers visitors from the business's
   own knowledge 24/7 and captures leads (name + email) into an inbox with
   AI-drafted follow-up replies.
2. **An AI SEO Studio** — audit any page for a 0–100 score across ten checks
   with a Claude-written action plan and rewritten title/meta, plus an AI writer
   for keywords, metadata, and full blog posts.

Built with **Next.js (App Router)**, **SQLite**, and the **Claude API**
(`claude-opus-4-8`). No other runtime dependencies.

---

## What's in the box

### The widget (the product your customers' visitors see)

| Surface | What it does |
| --- | --- |
| `GET /widget.js` | Self-contained embeddable script — injects a chat bubble + panel, no iframe, no dependencies. `<script src="…/widget.js" data-bot="pk_…" async></script>` |
| `POST /api/widget/chat` | Public streaming (NDJSON) chat endpoint, CORS-open, identified by the bot's public key. Runs the Claude tool-use loop with `capture_lead`; logs conversations; meters usage against the workspace's plan (over limit → polite degradation, never an error to the visitor). |
| `GET /api/widget/config` | Public bot appearance (name / welcome / color) — knowledge and internal ids never leave the server. |

The landing page dogfoods the widget with a built-in `demo` bot that sells
NovaWebStudio itself.

### The app (`/app`, behind auth)

| Surface | What it does |
| --- | --- |
| **Overview** | Stat tiles, conversations + leads chart, SEO health dial, plan usage — and the **AI pulse briefing**: Claude reads your activity and writes what's working and what to do next. |
| **Chatbots** | Configure name/tone/goal/color, paste in business knowledge + FAQs, chat with a **live preview**, and copy the embed snippet. Bot count enforced per plan. |
| **Leads** | Every captured contact, with one-click **AI-drafted replies**; plus full conversation transcripts. |
| **SEO Studio** | URL audits (score ring + per-check results + AI action plan + suggested rewrites, history) and the AI writer (metadata JSON or streaming blog posts). |
| **Settings** | The business profile that feeds every AI surface. |
| **Plan & billing** | Launch $29 / Grow $79 / Scale $199, 14-day trial, monthly message metering, invoice history. Billing is simulated — swap `POST /api/billing` for Stripe Checkout in production. |

### API

| Route | What it does |
| --- | --- |
| `POST /api/auth/signup·login·logout` | Cookie-session auth (scrypt hashing, no extra deps). Signup creates the workspace, a starter bot, and seeds clearly-labeled sample activity. |
| `GET/PATCH /api/workspace` | Business profile. |
| `GET/POST/PATCH/DELETE /api/bots` | Bot CRUD (plan-limited). |
| `GET/PATCH /api/leads`, `POST /api/leads/suggest` | Lead inbox + AI reply drafts. |
| `GET /api/conversations` | Recent transcripts. |
| `POST /api/seo/audit`, `GET /api/seo/audit` | Run/list page audits (fetch + regex parse + heuristic score + AI plan; SSRF-guarded). |
| `POST /api/seo/generate` | `kind: "meta"` (JSON) or `kind: "post"` (streaming NDJSON). |
| `GET /api/analytics`, `GET /api/insights` | Chart series + the cached-per-day AI briefing (`?refresh=1`). |
| `GET/POST /api/billing` | Plan status, invoices, simulated plan switch. |

---

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (optional — see below)
npm run dev                  # http://localhost:3000
```

Production build: `npm run build && npm start`

### API key & "demo mode"

All AI surfaces call Claude (`claude-opus-4-8`) and need an `ANTHROPIC_API_KEY`.
**Without a key everything still works** — the chatbot falls back to a rule-based
responder (with real lead capture via email detection), audits fall back to
heuristic recommendations, and generators return labeled demo drafts. The UI
shows a `demo mode` badge; with a key it switches to `Claude · live`.

### Multi-tenancy & data

Each signup creates a **workspace** (the tenant). Bots, conversations, leads,
audits, usage, and invoices are all scoped by `workspaceId`; the widget only
ever sees a bot's **public key**. Everything persists in SQLite via
`better-sqlite3` (`src/lib/db.ts`) at `./data/kaycreatesweb.db` (override with
`DATABASE_PATH`). Schema is created automatically.

## Project structure

```
src/
  app/
    page.tsx                   # marketing landing (runs the demo widget)
    login/ signup/             # auth pages
    widget.js/route.ts         # the embeddable script
    app/                       # the SaaS app (auth-gated layout)
      page.tsx                 #   overview: chart + AI pulse briefing
      bots/ leads/ seo/ settings/ billing/
    api/
      widget/{chat,config}/    # public widget endpoints (CORS)
      bots/ leads/ leads/suggest/ conversations/
      seo/{audit,generate}/
      analytics/ insights/ workspace/ billing/
      auth/{signup,login,logout}/
  components/                  # Charts (hand-rolled SVG), AppShell, Bots, …
  lib/
    db.ts                      # SQLite handle + schema
    auth.ts                    # scrypt + cookie sessions
    workspaces.ts billing.ts   # tenants, plans, metering, invoices
    bots.ts                    # bot CRUD + system prompt + tools + fallback
    convos.ts                  # conversations, leads, analytics queries
    seo.ts                     # page fetch/parse/score + AI recommendations
    insights.ts                # AI pulse briefing (cached, with fallback)
    demo-bot.ts onboarding.ts tenant.ts ai.ts types.ts
```

## Notes & next steps

To take it to production: swap simulated billing for Stripe Checkout + webhooks,
move SQLite to Postgres, add website crawling so bots auto-learn from the
customer's site, email notifications for new leads, and rate limiting on the
public widget endpoints.
