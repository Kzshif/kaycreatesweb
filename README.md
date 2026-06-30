# FrontDesk AI

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

## Project structure

```
src/
  app/
    page.tsx              # marketing landing
    demo/page.tsx         # live receptionist
    dashboard/page.tsx    # staff queue
    api/chat/route.ts     # streaming Claude + tool-use loop
    api/events/route.ts   # read / action captured events
  components/              # Chat, Dashboard, site chrome
  lib/
    receptionist.ts       # system prompt + tools + executor
    verticals.ts          # per-specialty configuration
    store.ts              # in-memory capture store (swap for a DB in prod)
    fallback.ts           # no-key rule-based receptionist
    types.ts
```

## Notes & next steps

This is a working demo. To take it to production you'd swap the in-memory store
(`src/lib/store.ts`) for a database, wire the booking tool to a real scheduling
system / EHR, and connect a telephony provider (e.g. Twilio) so Robin answers an
actual phone line instead of a web chat.
