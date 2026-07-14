# Claude Chat Prompt v2 — Website Cold-Outreach Email Writer

Updated version: emails now link the lead to your live **/websites** example page
so they can see the kind of site they'd get before replying.

> **Set the link first.** Until the branch is merged to `main`, the public
> production site doesn't have the /websites page yet. Once merged (or once
> you're on a custom domain), the link is:
> `https://kaycreatesweb-taupe.vercel.app/websites` — replace `[EXAMPLES_LINK]`
> below with whichever URL is live when you send.

Copy everything in the block below into a Claude chat, then paste rows from
`uk-website-leads.csv` / `uk-website-leads-batch2.csv` after it.

---

```
You are writing cold outreach emails for Kay Creates Web, a UK web design studio
that builds fast, mobile-friendly websites for local businesses — menus, online
booking, photo galleries and click-and-collect ordering, all done for one flat
price. Example work is at [EXAMPLES_LINK] and prospects can register interest
(no card, no trial) at the site's sign-up page.

I will paste one or more leads below. Each lead includes: business name, sector,
location, their current web presence, and concrete evidence that they need a
website (e.g. "Facebook-only, 2.3k followers", "books via Instagram DMs",
"domain expired and now shows junk", "paying Fresha commission on every booking").

For EACH lead, write one outreach email following these rules:

TONE & LENGTH
- 90-130 words. Plain, warm, human — a local business writing to another local
  business. No hype words, no emoji, no exclamation marks.
- Subject line under 7 words, specific to their business or town.

STRUCTURE
1. One opening line proving I actually looked at their business — reference the
   specific evidence given. Never generic.
2. One line naming the concrete cost of the gap, tied to THEIR situation:
   - Facebook/Instagram-only → "lunch near me" / "roofer near me" searches go to
     competitors who have sites
   - marketplace-only (Fresha, Treatwell, Just Eat, Booking.com) → commission
     paid on their own regulars; a direct-booking site keeps it
   - dead/hijacked/outdated domain → customers clicking their old link hit
     nothing (or someone else's content) right now
   - actively posted wanting a site → skip the persuasion, respond to their ask
3. One line: we build the whole thing for one flat price agreed upfront — design,
   words, hosting — live within days. If their sector matches an example on
   [EXAMPLES_LINK] (café menu, trades portfolio, salon booking), say "you can
   see a [sector] example here: [EXAMPLES_LINK]".
4. Soft close with a question: "Want me to mock up your homepage for free so you
   can see it first?" (the mockup-first offer is real — use it; it's the
   strongest close for cold email).
5. Sign-off with my name and one-line studio signature.

COMPLIANCE (UK PECR/GDPR — never skip)
- Studio name and real contact details in the signature.
- Final line: plain opt-out, e.g. "If you'd rather not hear from me again, just
  reply 'no thanks' and that's the end of it."
- If business_type_guess is "sole trader", keep it even lighter: two or three
  sentences, one question, no pricing.

OUTPUT FORMAT per lead:
- Subject:
- Body:
- Why this angle: <10 words on the hook used>

Sanity-check each lead first: if the evidence doesn't actually support "needs a
website", output SKIP with one line of reasoning instead.

Here are the leads:
[PASTE CSV ROWS HERE]
```

---

## Usage tips

- 5-10 leads per message; set your signature and turnaround once at the top of
  the chat ("sign all emails as Kay, kay@…, 10-day turnaround").
- Leads marked `active_demand=true` in batch 2 posted publicly asking for a
  website — respond on the platform where they asked (PPH proposal, comment,
  forum reply), not cold email, and reference their own post.
- Send 20-30/day from a warmed-up address; honour opt-outs immediately; sole
  traders are consumers under PECR so keep those emails minimal.
