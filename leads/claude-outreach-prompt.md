# Claude Chat Prompt — Website Cold-Outreach Email Writer

Copy everything in the block below into a Claude chat, then paste one or more rows
from `uk-website-leads.csv` after it. Claude will write a personalised outreach
email for each lead.

---

```
You are writing cold outreach emails for Kay Creates Web, a UK web design studio
that builds fast, mobile-friendly websites for small businesses.

I will paste one or more leads below. Each lead includes: business name, sector,
location, their current web presence, and concrete evidence that they need a
website (e.g. "Facebook-only, 2.3k followers", "Yell listing with 47 reviews but
no website link", "domain expired").

For EACH lead, write one outreach email following these rules:

TONE & LENGTH
- 90-130 words. Plain, warm, human — like a local business owner writing to
  another, not an agency blast. No hype words ("unlock", "elevate", "supercharge"),
  no emoji, no exclamation marks.
- Subject line under 7 words, specific to their business (e.g. "A website for
  [Business Name]?" or something referencing their town/trade).

STRUCTURE
1. One opening line proving I actually looked at their business — reference the
   specific evidence given (their reviews, their Facebook page, their listing).
   Never generic ("I came across your business online").
2. One line naming the concrete cost of not having a site, tied to THEIR trade:
   tradespeople → job enquiries going to competitors who rank on Google;
   hospitality → commission lost to Just Eat / Booking.com instead of direct
   bookings; salons/PTs → no online booking means missed appointments;
   shops/producers → no click-and-collect or tourist traffic.
3. One-sentence offer: we build a simple, fast site (design, copy, hosting
   sorted) with one flat price and it's live within [X] days. Keep it concrete,
   no feature lists.
4. Soft close with a question, not a pitch: "Worth a quick chat?" / "Want me to
   send over an example of what it could look like?"
5. Sign-off with my name and a one-line studio signature.

COMPLIANCE (UK PECR/GDPR — do not skip)
- Include the studio's real name and contact details in the signature.
- Final line must be a plain opt-out sentence, e.g. "If you'd rather not hear
  from me again, just reply 'no thanks' and I won't email you twice."
- If the lead's business_type_guess is "sole trader", make the email even
  lighter-touch: a single short question, no pricing, since sole traders are
  treated like consumers under PECR.

OUTPUT FORMAT
For each lead output:
- Subject:
- Body:
- (one line) Why this angle: <10 words on the personalisation hook used>

Before writing, silently sanity-check the lead: if the evidence field doesn't
actually support "needs a website", flag it as SKIP with one line of reasoning
instead of writing the email.

Here are the leads:
[PASTE CSV ROWS OR LEAD DETAILS HERE]
```

---

## Tips for using it

- Paste 5-10 leads per chat message; quality drops if you dump all 100 at once.
- Fill in the `[X] days` turnaround and your signature details once at the top of
  the chat ("For all emails: turnaround is 10 days, sign as Kay, kay@...").
- Ask follow-ups like "make #3 more casual" or "rewrite #7 for a phone-first
  audience" — Claude keeps the lead context in the conversation.
- Send from a warmed-up domain, 20-30/day max, and honour opt-outs immediately.
