# FrontDesk AI

> **Also in this repo:** [`fivestarlocal/`](fivestarlocal/) — FiveStar Local, a
> zero-maintenance Google review growth service (static site + playbook) that
> sells to the same clinic lead list. See
> [`docs/sales/fivestarlocal-playbook.md`](docs/sales/fivestarlocal-playbook.md).

**A vertical AI receptionist as a service** for dental, medical, physiotherapy, and
veterinary practices. "Robin" answers every call, books appointments, takes
messages, and answers the questions a front desk fields all day — then drops
everything it captured into a staff dashboard.

Built with **Next.js (App Router)** and the **Claude API** (`claude-opus-4-8`).

---

## What's in the box

| Surface | Route | What it does |
| --- | --- | --- |
| **Marketing site** | `/` | Hero, how-it-works, per-vertical breakdown, features, pricing. |
| **Live receptionist** | `/demo` | Chat with Robin exactly like a phone call. Streams responses token-by-token and uses tools to book, message, and arrange callbacks. |
| **Staff dashboard** | `/dashboard` | Everything Robin captured — appointments, messages, callbacks — in one live-updating queue you can action. |
| **Chat API** | `POST /api/chat` | Server-side Claude agentic loop (streaming + tool use), returns newline-delimited JSON events. |
| **Voice webhooks** | `POST /api/voice`, `POST /api/voice/respond` | Twilio Voice integration — Robin answers a real phone line, transcribes the caller, and speaks back. |
| **Events API** | `GET/PATCH /api/events` | Reads and actions captured events. |

### The "vertical" in vertical SaaS

Each specialty ships pre-configured with the services, scheduling language, hours,
and FAQs that practice actually handles — see `src/lib/verticals.ts`:

- 🦷 **Dental** — Brightwater Dental
- 🩺 **Family medicine** — Cedar Park Family Medicine
- 🏃 **Physical therapy** — Kinetic Physical Therapy
- 🐾 **Veterinary** — Maple Street Veterinary

### What Robin can do

Robin runs a real tool-use loop. Tools live in `src/lib/receptionist.ts`:

- `book_appointment` — collects name, contact, service, and preferred time.
- `take_message` — captures messages and triages urgency (refills, billing, symptoms).
- `request_callback` — schedules a staff callback.

It is prompted to **never give clinical advice** — anything clinical becomes a
high-priority message for a licensed provider.

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

The live receptionist calls Claude (`claude-opus-4-8`) and needs an
`ANTHROPIC_API_KEY`. **Without a key, the app still works** — it falls back to a
small rule-based receptionist (`src/lib/fallback.ts`) so you can click through the
whole product, and the chat header shows a `demo mode` badge. Set the key to get
the real, fully conversational experience (the badge switches to `Claude · live`).

---

## How the chat works

`POST /api/chat` takes the conversation + the selected vertical and runs the
agentic loop server-side (`src/app/api/chat/route.ts`):

1. Build the practice-specific system prompt.
2. Stream Claude's reply with `client.messages.stream(...)`, forwarding text deltas.
3. If Claude calls a tool, execute it (which writes to the store), stream a tool
   marker to the UI, feed the result back, and continue.
4. Emit a final `done` event noting whether the turn ran `live` or in `fallback`.

The browser reads the newline-delimited JSON stream and renders text, tool chips,
and the streaming cursor in real time (`src/components/Chat.tsx`).

## Answering a real phone line (Twilio)

Robin isn't limited to web chat — point a Twilio number at the voice webhook and
it answers actual calls. The voice and chat surfaces share the same brain
(`src/lib/converse.ts`), so bookings made by phone land in the same dashboard.

1. Deploy the app somewhere Twilio can reach, and set `PUBLIC_BASE_URL` plus
   `TWILIO_AUTH_TOKEN` (the token enables request-signature validation).
2. In the Twilio console, set the number's **"A call comes in"** webhook to:
   `POST https://your-app.example.com/api/voice?vertical=dental`
   (swap `vertical` for `medical`, `physio`, or `vet`).

Flow: `/api/voice` greets the caller and opens a `<Gather input="speech">`; Twilio
transcribes the caller and POSTs it to `/api/voice/respond`, which runs the
receptionist, speaks the reply, and listens again until the caller says goodbye.
Per-call transcripts are kept in memory keyed by Twilio's `CallSid`.

## Data persistence

Captured events are stored in **SQLite** via `better-sqlite3`
(`src/lib/store.ts`), so they survive restarts. The database lives at
`./data/frontdesk.db` by default — override with `DATABASE_PATH` (use `:memory:`
for an ephemeral store). The schema is created and seeded automatically on first
run. Swap this module for your production database or EHR/PMS integration without
touching the rest of the app — the exported functions are the only contract.

## Project structure

```
src/
  app/
    page.tsx              # marketing landing
    demo/page.tsx         # live receptionist
    dashboard/page.tsx    # staff queue
    api/chat/route.ts            # streaming Claude + tool-use loop
    api/events/route.ts          # read / action captured events
    api/voice/route.ts           # Twilio: greet the caller
    api/voice/respond/route.ts   # Twilio: converse + speak the reply
  components/                     # Chat, Dashboard, site chrome
  lib/
    receptionist.ts              # system prompt + tools + executor
    converse.ts                  # non-streaming receptionist (used by voice)
    verticals.ts                 # per-specialty configuration
    store.ts                     # SQLite-backed capture store
    twilio.ts                    # TwiML builders, call state, signature check
    fallback.ts                  # no-key rule-based receptionist
    types.ts
```

## Notes & next steps

A working demo with a persistent store and live phone answering. To take it
further you'd wire the booking tool to a real scheduling system / EHR, move the
per-call transcript state into shared storage (Redis) for multi-instance
deployments, and add authentication to the staff dashboard.
