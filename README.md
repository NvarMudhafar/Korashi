# Korashi — Static Site

A 3-page static website for the Korashi matcha brand (no build step, no backend).

- `index.html` — animated hero, the collection, ritual steps, story teaser
- `shop.html` — products with quantity steppers + ordering explainer
- `story.html` — brand story page
- Cart + checkout live in a drawer available on every page (`js/main.js`)

## ⚠️ One thing you must do before launch: connect your Google Sheet

Orders are placed entirely on the website and land as rows in a Google Sheet.
Until the endpoint below is configured, the "Place order" button shows a polite
"ordering isn't live yet" message. Setup takes ~3 minutes:

1. Go to [sheets.new](https://sheets.new) and create a spreadsheet
   (name it e.g. *Korashi Orders*).
2. In the sheet: **Extensions → Apps Script**. Delete the placeholder code and
   paste the whole contents of
   [google-apps-script/Code.gs](google-apps-script/Code.gs). Save (⌘S).
3. Click **Deploy → New deployment → ⚙️ Select type → Web app** and set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click **Deploy**, approve the permissions prompt (it's your own script —
   "unverified app" warning is normal: *Advanced → Go to … (unsafe)*),
   and copy the **Web app URL** (ends in `/exec`).
4. Open [js/main.js](js/main.js) and paste that URL on the first line:

   ```js
   const ORDER_ENDPOINT = "https://script.google.com/macros/s/AKfycb…/exec";
   ```

Every order then appears instantly in the **Orders** tab: timestamp, order ID,
name, phone, city, address, notes, items, total, and a **Status** column you
can use for fulfillment (NEW → confirmed → delivered…). Payment is cash on
delivery — no payment gateway involved.

Optional: in `Code.gs`, set `NOTIFY_EMAIL = "you@example.com"` to also get an
email for every order.

> If you ever edit `Code.gs` later, redeploy via
> **Deploy → Manage deployments → ✏️ → Version: New version** — the URL stays
> the same.

## Run locally

Any static server works, e.g.:

```sh
python3 -m http.server 4173
```

## Deploy

Drag the folder into Netlify / Vercel / Cloudflare Pages, or host it on any
static hosting — there is nothing to build.

## Brand

Colors, typography, logo and slogan ("Pure Harmony, Bold Energy") follow the
Korashi Brand Guideline PDF: deep green `#11331e`, olive `#647a3b`,
cream `#fffceb`, gold accents `#e7d4a7 / #d4b37b / #926e39`.

**Logo:** the brandmark and KORASHI wordmark are the *exact vectors* extracted
from the brand guideline PDF (`assets/korashi-brandmark.svg`,
`assets/korashi-wordmark.svg`, plus `assets/favicon.svg`).

**Typography:** the real brand fonts are embedded as woff2 in `assets/fonts/` —
Classy Vogue (headings), Gotham Medium (buttons/labels), Presicav Light
(overlines) and Bickham Script Pro Regular/Semibold (script accents) are the
full licensed fonts. Gotham *Book* (body text) is the one font still sourced
from the PDF's embedded subset; the few characters it lacks fall back
per-letter to Montserrat, which is visually seamless. If you obtain the full
Gotham Book file, convert it and swap the `@font-face` src in
`css/style.css`.
