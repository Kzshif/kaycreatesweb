# FiveStar Local

Done-for-you Google review growth for UK local practices. £39/month, ~15
minutes of fulfilment per client per month. The full business plan lives in
[`docs/sales/fivestarlocal-playbook.md`](../docs/sales/fivestarlocal-playbook.md),
outreach templates in
[`docs/sales/fivestarlocal-outreach.md`](../docs/sales/fivestarlocal-outreach.md).

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | Marketing site, with a working demo of the rating page in the hero. |
| `review.html` | The product: the rating page patients land on after scanning a QR card. Configured entirely by URL parameters, so one deployment serves every client. |
| `cards.html` | Internal tool: generates printable A4 sheets of QR table cards per client. |
| `qrcode.js` | Vendored QR generator (qrcode-generator, MIT, Kazuhiko Arase). |

Pure static HTML. No build step, no dependencies, no backend, nothing to
maintain.

## Deploy (5 minutes)

Any static host works. On Vercel: create a new project from this repo and set
the **Root Directory** to `fivestarlocal/` (framework preset: Other). On
Netlify: drag the folder into the dashboard.

Then:

1. Register **fivestarlocal.co.uk** (checked available on 2026-07-07) and
   point it at the deployment.
2. Set up the `hello@fivestarlocal.co.uk` mailbox (or a forward) and, if you
   use a different address, search-and-replace `hello@fivestarlocal.co.uk` in
   `index.html`.

## Per-client setup

Build the client's review link:

```
https://your-domain/review.html?b=Practice+Name&g=PLACE_ID&e=manager@practice.co.uk
```

- `b` — business name shown on the page
- `g` — Google Place ID, or a full `https://search.google.com/local/writereview?placeid=...` link
- `e` — optional email offered for private feedback

Then open `cards.html`, fill in the same details, and print. Full checklist in
the playbook.

## Compliance

`review.html` shows the Google review button to **every** rater regardless of
the stars they tap. Do not change that: filtering who gets asked ("review
gating") violates Google's review policies. Private feedback is offered
alongside, never instead.
