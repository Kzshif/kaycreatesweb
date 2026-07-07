# FiveStar Local — business playbook

**The business in one line:** local practices live or die by their Google
reviews, almost none of them systematically ask for reviews, and you sell the
fix as a £39/month done-for-you service that takes ~15 minutes per client per
month to run.

This is the "one last business": no AI, no code to maintain, no inventory, and
it sells to the exact same lead list as the nova05 receptionist
(`docs/sales/uk-lead-list.csv`).

---

## Why this niche

- **High demand.** Every local business owner already knows reviews matter.
  You never have to explain the problem — they feel it every time a competitor
  outranks them on the map.
- **Low competition.** Big reputation platforms (Birdeye, Podium) charge
  £200–400+/month and chase multi-location groups. Almost nobody serves a
  single UK dental or physio practice at £39/month with printed cards and a
  human on the phone.
- **Easiest cold pitch you will ever send.** You open with a fact about *them*
  ("you have 31 reviews, the practice up the road has 210"). It is personal,
  verifiable in ten seconds, and slightly uncomfortable. That gets replies.
- **Near-zero fulfilment.** One deployed website serves every client. Per
  client you generate a link, print four cards, and send one short report a
  month.
- **It feeds your other business.** Every FiveStar client is a warm lead for
  the nova05 AI receptionist, and vice versa. Same buyer, same trust, second
  invoice.

## What you sell

| Plan | Price | What they get |
| --- | --- | --- |
| Starter kit | £149 one-off | Review link + rating page, 4 printed QR table cards posted, print file, team ask-script |
| Growth | £39/month (setup included) | Starter kit + monthly report, local comparison, reply templates, free reprints |

Guarantee: if no new reviews arrive in their first month, that month is free.
(Costs you nothing to honour and removes the last objection.)

Push everyone to Growth. £39 × 25 clients = £975/month recurring for roughly a
day of work per month total.

## Fulfilment: new client checklist (~15 minutes)

1. Get their **Google Place ID**: search the practice at
   https://developers.google.com/maps/documentation/places/web-service/place-id
   or copy the "write a review" link from their Google Business Profile.
2. Open `cards.html` on your deployed site, enter their name + Place ID,
   choose "Review funnel page", add their private-feedback email.
3. Print 4 cards on 250gsm card stock (any print shop, ~£5) and post them.
4. Email the client their review link (`review.html?b=...&g=...&e=...`) with
   the one-line team script:
   *"If you were happy today, the card on the desk takes 30 seconds."*
5. Note their current review count and rating in your client sheet.

## Fulfilment: monthly (~10 minutes per client)

1. Open their Google profile. Note new reviews and rating.
2. Fill the one-page report: reviews gained, rating trend, their count vs the
   3 nearest competitors (search "[sector] near [town]" and read the map pack).
3. Draft a short reply for each new review (thank happy ones by first name,
   acknowledge and take offline any unhappy ones). Paste into the report.
4. Send it. Invoice via Stripe subscription so billing runs itself.

## Compliance (this is what makes you the credible option)

- **Never gate.** Everyone who taps a rating gets the same Google button.
  The private-feedback email is offered *alongside*, never *instead*.
  Review gating violates Google's policy and (in the US) the FTC acted on it;
  selling the compliant version is a feature, say so in the pitch.
- **Never incentivise.** No discounts or freebies for reviews.
- **Never write reviews.** Not for clients, not "just to seed it".
- Healthcare note: patients volunteering a public review is fine; the practice
  should not disclose patient information when replying. Your reply templates
  already handle this (never confirm someone was a patient in a reply to a
  negative review; invite them to contact the practice directly).

## Getting the first 10 clients

1. Work `docs/sales/uk-lead-list.csv` — same towns, same buyers. Before each
   email, spend 60 seconds on their Google profile and note their review count
   and their busiest competitor's count. That's your opening line.
2. Use the outreach templates in `docs/sales/fivestarlocal-outreach.md`.
3. Walk-ins work unusually well for this one: print a sample card with *their*
   name on it (cards.html, two minutes) and hand it to the practice manager.
   A physical, personalised sample beats any email.
4. Cross-sell: every nova05 receptionist prospect gets a P.S. about reviews;
   every FiveStar client hears about the receptionist at month two.

## Costs

- Hosting: £0 (static site on Vercel/Netlify free tier).
- Domain: **fivestarlocal.co.uk is available** (~£10/year).
- Printing + postage: ~£6 per new client, covered many times by setup fee.
- Everything else is your time.

## Scaling levers (later, optional)

- Raise price to £59/month for new clients once you have testimonials.
- Sell to other verticals with the same assets: salons, barbers, garages,
  opticians, letting agents. Nothing changes except the card headline.
- A print shop can drop-ship cards so you never touch paper.
- If reporting ever feels heavy, that's the signal you have enough clients to
  justify automating it — not before.
