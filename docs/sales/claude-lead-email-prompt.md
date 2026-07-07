# nova05 — Lead research + cold email drafting (Claude prompt kit)

This kit turns `uk-lead-list.csv` (100 UK targets) into real, verified prospects and
tailored outreach drafts. It's built for **Claude with web access** (claude.ai) so it
can open each search link, confirm the real practice, pull *public* contact details,
and draft a bespoke email that references the live nova05 demo.

Live site to reference in every email:
- Home: https://kaycreatesweb-taupe.vercel.app
- Live demo (interactive receptionist): https://kaycreatesweb-taupe.vercel.app/demo
- Owner dashboard: https://kaycreatesweb-taupe.vercel.app/dashboard

---

## ⚠️ Read first — staying legal (UK GDPR + PECR)

Cold B2B email in the UK is allowed, but do it properly:

- **B2B only.** Email the *business* (e.g. `info@`, `reception@`, the website contact
  form) — not a named individual's personal inbox. Sole traders/partnerships have
  stronger protection, so prefer the generic practice address.
- **Only public data.** Use contact details the practice openly publishes on its own
  website / Google listing. Do **not** scrape, buy, or guess personal emails.
- **Relevance + legitimate interest.** The pitch must be genuinely relevant to their
  business (it is — front-desk cover for a clinic).
- **Easy opt-out.** Every email must offer a clear way to say "no more emails," and you
  must honour it immediately. Keep a suppression list.
- **Identify yourself.** Real sender name, business name (kaycreatesweb / nova05), and a
  reply address.
- **Don't fabricate.** Never invent a practice name, review, or "we noticed X" claim you
  haven't actually verified on their site.

If in doubt, send to the practice's own published enquiry address or use their website
contact form.

---

## STEP 1 — Research prompt (fill in the sheet)

Paste this into Claude (web access on), and attach or paste rows from
`uk-lead-list.csv`:

> You are helping me research B2B sales leads for **nova05**, an AI phone/chat
> receptionist for UK healthcare practices (dental, private GP, physiotherapy,
> veterinary). I'll give you rows from a CSV. Each row has a `google_maps_url` and a
> `search_query`.
>
> For each row, use web access to open the search and find **one real, currently-trading
> practice** that matches the sector and town. Then return a filled row with:
> - `practice_name` — the real business name
> - `website` — their official site
> - `public_phone` — the phone number they publish
> - `public_email_or_contact_form` — a **generic business** address (info@/reception@/
>   enquiries@) OR the URL of their website contact form. If only a form exists, put the
>   form URL and note "form only".
> - `notes` — one specific, true detail I could reference (e.g. "single-site, lists
>   Invisalign & implants", "no online booking", "emphasises out-of-hours pet advice").
>
> Rules: only use information the practice publishes publicly on its own site or Google
> listing. Do not invent details. If you can't confidently verify a practice for a row,
> set `status` to `skip` and say why. Prefer independent / small-group practices over big
> corporate chains (they buy centrally). Return the rows as CSV using the same columns.

Work in batches of ~10 rows so Claude can actually open each link carefully.

---

## STEP 2 — Email drafting prompt (one tailored email per verified lead)

Once a row has a real `practice_name`, `website`, and `notes`, paste this:

> You're drafting a short B2B cold email on behalf of **Kay** at **kaycreatesweb**
> (Newbury, UK), introducing **nova05** — an AI receptionist that answers a practice's
> phone and website chat 24/7, books appointments, takes messages, and hands off
> anything clinical. Pricing starts at **£29/month**; there's a free trial.
>
> First, open the live demo so your email is accurate:
> https://kaycreatesweb-taupe.vercel.app/demo
>
> Now write an email to this practice:
> - Practice: {{practice_name}} — {{sector}} in {{town}}
> - Website: {{website}}
> - True detail to reference: {{notes}}
>
> Requirements:
> - Subject line: under 55 characters, specific, no clickbait, no "Re:".
> - Body: 90–130 words. Warm, plain British English, no jargon, no hype.
> - Open with the *specific* true detail about them (from notes) — not a generic
>   compliment.
> - One clear problem (missed calls after hours / while with patients = lost bookings),
>   one clear promise (nova05 answers every call and books straight in).
> - Include the demo link and invite them to try it themselves in 30 seconds.
> - One low-friction CTA: a quick reply or a 10-minute call.
> - Sign off as Kay, kaycreatesweb, with a reply address and a one-line opt-out
>   ("Reply STOP and I won't email again.").
> - Do NOT invent stats, reviews, or details not given. If notes are thin, keep it
>   general rather than making something up.
>
> Output: `subject:` line, then the email body, then a 1-line first follow-up (to send
> ~4 days later if no reply).

---

## STEP 3 — Per-sector angle (optional sharpening)

If you want the emails sharper, tell Claude to lead with the sector's core pain:

- **Dental** — high-value private treatments (implants, Invisalign, hygiene plans); a
  missed new-patient call is £100s–£1000s lost.
- **Private GP** — self-pay patients expect an instant reply; evenings/weekends are when
  they call and nobody's there.
- **Physiotherapy** — clinician is hands-on with a patient all day, so the phone rings
  out and the diary stays half-empty.
- **Veterinary** — huge call volume, anxious owners, out-of-hours triage; reception is
  drowning and clients get voicemail.

---

## Suggested cadence (per lead)

1. Day 0 — tailored intro email (Step 2).
2. Day 4 — short one-line follow-up ("Did you get a chance to try the 30-second demo?").
3. Day 10 — final value nudge, then stop. Mark `status` = `contacted` / `replied` /
   `not_interested` in the CSV.

Keep volume low and quality high — a handful of genuinely tailored emails a day beats a
blast, stays the right side of PECR, and protects your sending reputation.
