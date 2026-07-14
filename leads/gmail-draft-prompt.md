# Gmail Draft Prompt — paste into Claude (with Gmail connector)

This makes Claude create one **draft** per lead in your Gmail (it does NOT send).
You review each draft and hit send yourself.

## Before you paste — fill these in ONCE at the top of the chat

- **Your name:** Kay
- **Studio name:** Kay Creates Web
- **Reply email / signature contact:** kay@… (your real address)
- **Portfolio links (must be public):**
  - Live product site: `https://kaycreatesweb-taupe.vercel.app` (nova05)
  - Example websites page: `https://kaycreatesweb-taupe.vercel.app/websites`
    *(⚠️ only works once the branch is merged to main — until then use the
    temporary share link, or remove this line)*
- **Turnaround:** ~10 days
- **Attachments (optional):** your two demo videos — attach manually after the
  draft is created, Gmail-side. Filenames: `nova05intro.mp4`,
  `nova05gigfinal.mp4`.

---

## THE PROMPT (paste this block, then paste the lead list under it)

```
You have access to my Gmail. For each lead in the list at the bottom, create a
DRAFT email (do not send). I will review and send each one myself.

I run Kay Creates Web, a UK web design studio that builds fast, mobile-friendly
websites for local businesses — menus, online booking, galleries, click-and-
collect — for one flat price, live in about 10 days. My portfolio:
- nova05, a live AI-receptionist product I designed and built: [LIVE_SITE_LINK]
- Example site designs (café, trades, salon): [EXAMPLES_LINK]

For EACH lead, write the draft like this:

TO: the lead's email (skip the lead and note it if no email is given)
SUBJECT: under 7 words, specific to their business or town

BODY (90-130 words, plain and human — no hype words, no emoji, no exclamation
marks):
1. Open by referencing the SPECIFIC evidence in their row (their expired domain,
   their Facebook-only presence, their public "need a web designer" post, their
   reviews). Never generic. If they publicly posted asking for a website,
   acknowledge that directly ("saw you're looking for a web designer").
2. One line naming the concrete cost of their situation, tied to their trade:
   trades → job enquiries going to competitors who rank on Google; hospitality →
   commission lost to Booking.com/Just Eat vs direct bookings; salons → no online
   booking = missed appointments; shops → no click-and-collect/tourist orders;
   dead domain → anyone clicking their old link hits nothing right now.
3. One line: I build the whole thing — design, words, hosting — for one flat
   price agreed upfront, live in about 10 days. If their sector matches an
   example on my page, add: "here's the kind of site I mean: [EXAMPLES_LINK]".
4. Close with the free-mockup question: "Want me to mock up your homepage for
   free so you can see it first — no cost, no obligation?"
5. Sign off:
   Kay
   Kay Creates Web
   [MY_REPLY_EMAIL]
6. Final line, plain opt-out: "If you'd rather not hear from me, just reply 'no
   thanks' and I won't email again."

RULES:
- If business_type_guess is "sole trader": keep it to 2-3 sentences, one
  question, no pricing — lighter touch (UK PECR treats sole traders as
  individuals).
- If the evidence doesn't actually support "needs a website", make NO draft for
  that lead and list it as SKIPPED with one line why.
- Vary the wording between drafts — no two should read from a template.
- After creating all drafts, give me a summary table: business | subject line |
  the personalisation hook you used | skipped? so I can scan before sending.

Here are the leads:
[PASTE THE LEAD ROWS / CSV HERE]
```

---

## Sending discipline (so you don't get flagged)

- Send 20-30/day max from a warmed-up inbox; don't blast all 20 at once on a
  brand-new sending address.
- Review every draft before sending — check the name, town and the specific
  hook are right. Claude occasionally mis-reads a row.
- Honour any "no thanks" immediately and permanently.
- The free-mockup offer is real: when someone replies, come back to me and I'll
  build that lead's homepage mockup within minutes so you can send it same-day.
