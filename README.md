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
name, phone, city, address, notes, items, total (delivery fee included), and a
**Status** column you can use for fulfillment (NEW → confirmed → delivered…).
Payment is cash on delivery, no payment gateway involved.

**Delivery fees** are added to the total at checkout based on the chosen city
(edit the `SHIPPING` map at the top of [js/main.js](js/main.js) to change them):

| City | Fee |
| --- | --- |
| Sulaymaniyah | 2,500 IQD |
| Erbil, Duhok | 4,000 IQD |
| All other cities | 5,500 IQD |

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

## Deploy (Cloudflare Pages, free)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages →
   Create → Pages → Upload assets**.
2. Name the project (e.g. `korashi`), drag this folder in, **Deploy**.
3. In the project: **Custom domains → Set up a custom domain** → enter your
   domain. DNS + HTTPS are configured automatically since the domain is on
   Cloudflare.

To ship updates later, open the project → **Create new deployment** and drag
the folder again. There is nothing to build.

## Brand

Colors, typography, logo and slogan ("Pure Harmony, Bold Energy") follow the
Korashi Brand Guideline PDF: deep green `#11331e`, olive `#647a3b`,
cream `#fffceb`, gold accents `#e7d4a7 / #d4b37b / #926e39`.

**Logo:** the brandmark and KORASHI wordmark are the *exact vectors* extracted
from the brand guideline PDF (`assets/korashi-brandmark.svg`,
`assets/korashi-wordmark.svg`, plus `assets/favicon.svg`).

**Typography:** all brand fonts are the full licensed files, embedded as woff2
in `assets/fonts/`: Classy Vogue (headings), Gotham Book (body), Gotham Medium
(buttons/labels), Presicav Light (overlines) and Bickham Script Pro
(script accents).
