# FrontDesk AI

**A vertical AI receptionist as a service** for dental, medical, physiotherapy, and
veterinary practices. "Robin" answers every call, books appointments, takes
messages, and answers the questions a front desk fields all day — then a layer of
AI intelligence (triage, daily briefings, a data copilot, drafted replies) turns
what it captured into your team's game plan.

Built with **Next.js (App Router)**, **SQLite**, and the **Claude API**
(`claude-opus-4-8`). No other runtime dependencies.

---

## What's in the box

### Public site

| Surface | Route | What it does |
| --- | --- | --- |
| **Marketing site** | `/` | Hero, how-it-works, AI features, per-vertical breakdown, pricing wired to signup. |
| **Live receptionist demo** | `/demo` | Chat with Robin exactly like a phone call, no signup. Streams responses token-by-token and uses tools to book, message, and arrange callbacks. |
| **Demo dashboard** | `/dashboard` | The public demo's captured events (tenant data never appears here). |

### The SaaS app (`/app`, behind auth)

| Surface | What it does |
| --- | --- |
| **Overview** | Stat tiles, conversations-per-day chart, "why people call" intent chart, usage vs. plan — and the **AI daily briefing**: Claude reads your activity and writes what's urgent, what's trending, and what to do first. |
| **Inbox** | Everything Robin captured for *your* practice, pre-triaged (urgency 1–5, sentiment, intent) and sorted so the critical items float. One click gets an **AI-drafted reply** ready to send. |
| **Copilot** | A streaming Claude agent with query tools over your own data — "who should I call back first?", "are refill requests trending up?" — answers with names and numbers. |
| **Test console** | Talk to *your* receptionist (your hours, services, FAQs, greeting). Conversations are metered against your plan. |
| **Settings** | Teach Robin your practice: name, specialty, hours, services, FAQs, greeting. |
| **Plan & billing** | Starter $149 / Practice $399 / Group $899, 14-day trial, usage metering with limits enforced in the chat API, invoice history. Billing is simulated — swap `POST /api/billing` for Stripe Checkout in production. |

### API

| Route | What it does |
| --- | --- |
| `POST /api/chat` | Streaming Claude agentic loop (tool use). `scope: "practice"` runs the caller's own configured receptionist, metered + limit-enforced; otherwise the public demo. |
| `POST /api/copilot` | Streaming Copilot with `query_events` / `get_stats` tools scoped to the tenant. |
| `GET /api/insights` | Cached-per-day AI briefing (`?refresh=1` to regenerate). |
| `POST /api/events/suggest` | AI-drafted reply for one inbox item. |
| `GET /api/analytics` | Daily series, intent breakdown, stats, plan status. |
| `GET/PATCH /api/events` | Read / action captured events (tenant-scoped with a session, demo otherwise). |
| `GET/PATCH /api/practice` | Read / update the receptionist configuration. |
| `GET/POST /api/billing` | Plan status + invoices; simulated plan switch. |
| `POST /api/auth/signup·login·logout` | Cookie-session auth (scrypt password hashing, no extra deps). |
| `POST /api/voice`, `/api/voice/respond` | Twilio Voice — Robin answers a real phone line (public demo brain). |

---

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (optional — see below)
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

### API key & "demo mode"

All AI surfaces call Claude (`claude-opus-4-8`) and need an `ANTHROPIC_API_KEY`.
**Without a key, every surface still works** — the receptionist falls back to a
rule-based responder, the briefing/copilot/replies fall back to deterministic
data-grounded versions, and the UI shows a `demo mode` badge. Set the key to get
the real experience (the badge switches to `Claude · live`).

### Multi-tenancy & data

Sign up (`/signup`) to create a user + practice. Each practice is a tenant:
captured events, usage, analytics, and AI features are scoped by `practiceId`.
Rows with a NULL `practiceId` belong to the public demo, so tenant data never
leaks into unauthenticated surfaces. New practices are seeded with a week of
sample activity so the dashboard and charts are alive from the first login.

Everything persists in **SQLite** via `better-sqlite3` (`src/lib/db.ts`) at
`./data/frontdesk.db` (override with `DATABASE_PATH`; `:memory:` for ephemeral).
Schema is created and migrated automatically.

## Answering a real phone line (Twilio)

Point a Twilio number's **"A call comes in"** webhook at
`POST https://your-app.example.com/api/voice?vertical=dental` and Robin answers
actual calls — see `src/lib/twilio.ts`. Set `PUBLIC_BASE_URL` and
`TWILIO_AUTH_TOKEN` (enables request-signature validation).

## Project structure

```
src/
  app/
    page.tsx                    # marketing landing
    demo/  dashboard/           # public demo surfaces
    login/ signup/              # auth pages
    app/                        # the SaaS app (auth-gated layout)
      page.tsx                  #   overview: charts + AI briefing
      inbox/ copilot/ console/ settings/ billing/
    api/
      chat/ copilot/ insights/  # streaming + AI endpoints
      events/ events/suggest/
      analytics/ practice/ billing/
      auth/{signup,login,logout}/
      voice/ voice/respond/     # Twilio
  components/                   # Charts (hand-rolled SVG), AppShell, Inbox, …
  lib/
    db.ts                       # SQLite handle + schema/migrations
    auth.ts                     # scrypt + cookie sessions
    practices.ts                # tenants; practice → receptionist config
    billing.ts                  # plans, usage metering, simulated invoices
    triage.ts                   # instant urgency/sentiment/intent scoring
    insights.ts                 # AI daily briefing (cached, with fallback)
    receptionist.ts             # system prompt + tools + executor
    store.ts                    # tenant-scoped capture store + analytics queries
    converse.ts fallback.ts twilio.ts verticals.ts types.ts
```

## Notes & next steps

To take it to production: swap simulated billing for Stripe Checkout + webhooks,
move SQLite to Postgres, add email (magic-link auth, briefing digests), wire the
booking tool to a real scheduling system / EHR, and put the per-call Twilio
transcript state in Redis for multi-instance deployments.
