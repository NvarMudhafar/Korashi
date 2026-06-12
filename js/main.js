/* ========================================================================
   KORASHI shared site script
   Orders are submitted on-site and saved to your Google Sheet
   (cash on delivery, no payment gateway).
   >>> PASTE YOUR APPS SCRIPT WEB APP URL BELOW, see README for the
       3-minute Google Sheet setup. Orders fail politely while it's "". <<<
   ======================================================================== */
const ORDER_ENDPOINT = "https://script.google.com/macros/s/AKfycbwoiDMC4HTvyNcM-zFj3mWWDRs1BNpb-leq83Igvg1W7vH6v48YODHxoRRwqrfl-OE39A/exec"; // e.g. "https://script.google.com/macros/s/AKfycb…/exec"

/* ------------------------------------------------------------------ data */
const PRODUCTS = [
  {
    id: "tin",
    name: "Ceremonial Matcha Tin",
    sub: "50 g · first harvest · stone-ground",
    price: 30000,
    tag: "Best seller",
    art: "art-olive",
  },
  {
    id: "whisk",
    name: "Bamboo Whisk Set",
    sub: "3-in-1 · whisk, scoop & chashaku",
    price: 20000,
    tag: "Handcrafted",
    art: "art-sand",
  },
  {
    id: "bowl",
    name: "Bowl Set",
    sub: "chawan bowl + whisk holder",
    price: 25000,
    tag: "Studio glazed",
    art: "art-gold",
  },
  {
    id: "ritual",
    name: "Full Ritual Set",
    sub: "tin, whisk set & bowl set, boxed",
    price: 75000,
    tag: "The complete ritual",
    art: "art-ink",
  },
];

const fmt = (n) => n.toLocaleString("en-US");

/* delivery fees by city (IQD) */
const SHIPPING = { Sulaymaniyah: 2500, Erbil: 4000, Duhok: 4000 };
const SHIPPING_DEFAULT = 5500;
const shippingFor = (city) => (city ? (SHIPPING[city] ?? SHIPPING_DEFAULT) : null);

/* --------------------------------------------------------- product art */
/* thin line-art in the brand-book illustration style */
const ART = {
  tin: `
  <svg viewBox="0 0 200 200" fill="none" stroke="#fffceb" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <ellipse cx="100" cy="58" rx="44" ry="12"/>
    <path d="M56 58v84c0 7 19.7 13 44 13s44-6 44-13V58"/>
    <path d="M56 96c0 7 19.7 13 44 13s44-6 44-13"/>
    <path d="M62 50c0-6 17-11 38-11s38 5 38 11"/>
    <path d="M78 122h44M86 132h28" stroke-width="2"/>
    <path d="M100 70c-7 5-7 14 0 18 7-4 7-13 0-18Z"/>
    <path d="M140 30c10 2 16 8 18 16M150 22c3 1 5 2 7 4" stroke-width="2"/>
  </svg>`,
  whisk: `
  <svg viewBox="0 0 200 200" fill="none" stroke="#11331e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M58 36v44c0 18 8 28 20 31M98 36v44c0 18-8 28-20 31"/>
    <path d="M70 36v42c0 14 3 22 8 26M86 36v42c0 14-3 22-8 26"/>
    <path d="M78 36v75"/>
    <rect x="68" y="111" width="20" height="26" rx="3"/>
    <path d="M126 134V58"/>
    <path d="M126 58c0-10 5-17 13-19 3 7 0 15-6 19h-7Z"/>
    <path d="M165 56v44"/>
    <path d="M154 112c0 14 4.5 24 11 24s11-10 11-24c0-7-4.5-12-11-12s-11 5-11 12Z"/>
  </svg>`,
  bowl: `
  <svg viewBox="0 0 200 200" fill="none" stroke="#11331e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M40 88h120c0 36-22 58-60 58s-60-22-60-58Z"/>
    <path d="M82 146h36v12H82z"/>
    <ellipse cx="100" cy="88" rx="44" ry="8" stroke-width="2"/>
    <path d="M84 56c0-8 8-8 8-16M104 60c0-8 8-8 8-16M94 44c0-6 6-6 6-12" stroke-width="2"/>
    <path d="M168 120c8 6 8 18 0 24M176 112c12 10 12 30 0 40" stroke-width="2" opacity=".6"/>
  </svg>`,
  ritual: `
  <svg viewBox="0 0 200 200" fill="none" stroke="#fffceb" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="22" y="28" width="156" height="144" rx="8"/>
    <rect x="34" y="40" width="132" height="120" rx="4" stroke-width="1.4" opacity=".55"/>
    <path d="M58 70v22c0 9 4 14 10 15.5M86 70v22c0 9-4 14-10 15.5M64.5 70v21c0 7 1.5 11 3.5 13M79.5 70v21c0 7-1.5 11-3.5 13M72 70v38"/>
    <rect x="66" y="108" width="12" height="14" rx="2"/>
    <ellipse cx="129" cy="78" rx="22" ry="6"/>
    <path d="M107 78v28c0 4 10 6.5 22 6.5s22-2.5 22-6.5V78"/>
    <path d="M76 134h48c0 14-9 22-24 22s-24-8-24-22Z"/>
    <ellipse cx="100" cy="134" rx="17" ry="3.4" stroke-width="1.6"/>
  </svg>`,
};

/* brandmark + wordmark: exact vectors extracted from the brand guideline PDF */
const MARK = (cls = "") => `
  <svg class="${cls}" viewBox="0 0 204.19 204" fill="currentColor" aria-hidden="true">
    <path d="M65.69 156.72H138.5V184.02H65.69ZM187.59 127.54C196.6 112.32 202.19 93.87 202.19 79.38L202.19 2.0L183.98 2.0L183.98 79.38C183.98 90.49 179.14 106.12 171.94 118.29C164.33 131.14 155.47 138.51 147.61 138.51L134.67 138.51L137.27 134.9C138.97 132.55 140.6 130.07 142.13 127.53C151.12 112.32 156.72 93.86 156.72 79.38L156.72 2.0L138.5 2.0L138.5 79.38C138.5 90.45 133.65 106.09 126.42 118.29C122.88 124.28 118.91 129.26 114.96 132.68L111.2 135.95L111.2 2.0L92.99 2.0L92.99 135.95L89.23 132.68C85.28 129.26 81.32 124.28 77.77 118.29C70.54 106.09 65.69 90.45 65.69 79.38L65.69 2.0L47.51 2.0L47.51 79.38C47.51 93.91 53.09 112.36 62.07 127.54C63.59 130.07 65.22 132.55 66.92 134.9L69.52 138.51L56.58 138.51C48.72 138.51 39.86 131.14 32.25 118.28C25.05 106.05 20.21 90.42 20.21 79.38L20.21 2.0L2.0 2.0L2.0 79.38C2.0 93.87 7.59 112.32 16.6 127.54C24.96 141.67 35.12 151.12 45.98 154.88L47.51 155.41L47.51 202.0L156.72 202.0L156.72 155.41L158.24 154.88C169.09 151.12 179.24 141.66 187.59 127.54Z"/>
  </svg>`;
const WORDMARK = () => `
  <svg viewBox="0 0 584.41 74" fill="currentColor" aria-hidden="true" role="img" aria-label="Korashi">
    <path d="M74.68 3.28L57.32 3.28L15.16 39.91L15.16 3.28L2.0 3.28L2.0 70.05L15.16 70.05L15.16 52.69L31.09 39.05L59.8 70.05L75.92 70.05L41.01 32.19L74.68 3.28Z"/><path d="M227.39 37.24L200.78 37.24L200.78 13.3L227.39 13.3C233.62 13.3 238.47 14.3 241.94 16.3C245.4 18.31 247.14 21.09 247.14 24.65L247.14 24.75C247.14 28.69 245.39 31.76 241.89 33.95C238.39 36.15 233.56 37.24 227.39 37.24M256.53 37.19C259.49 33.79 260.97 29.61 260.97 24.65L260.97 24.56C260.97 17.88 258.04 12.67 252.19 8.91C246.34 5.16 238.07 3.29 227.39 3.29L187.62 3.29L187.62 70.05L200.78 70.05L200.78 46.78L227.39 46.78C228.79 46.78 229.84 46.75 230.54 46.68L247.14 70.05L261.63 70.05L243.7 44.78C249.3 43.12 253.57 40.6 256.53 37.19Z"/><path d="M309.62 3.09L276.04 70.05L289.78 70.05L317.44 15.11L345.19 70.05L358.83 70.05L325.35 3.09L309.62 3.09Z"/><path d="M444.48 38.91C440.98 36.27 436.77 34.54 431.85 33.71C426.92 32.89 420.48 32.25 412.53 31.8C406.49 31.49 401.73 31.1 398.27 30.66C394.8 30.21 391.91 29.32 389.59 27.99C387.27 26.65 386.11 24.65 386.11 21.98L386.11 21.88C386.11 18.83 388.27 16.45 392.59 14.73C396.92 13.01 402.93 12.15 410.62 12.15C418.63 12.15 424.88 13.05 429.36 14.83C433.85 16.61 436.09 19.09 436.09 22.27L436.09 22.36L449.06 22.36L449.06 21.98C449.06 15.68 445.64 10.87 438.81 7.53C431.97 4.19 422.54 2.52 410.53 2.52C398.63 2.52 389.34 4.21 382.63 7.58C375.92 10.95 372.56 15.75 372.56 21.98L372.56 22.07C372.56 27.35 374.31 31.33 377.81 34.0C381.31 36.67 385.55 38.42 390.54 39.24C395.53 40.07 401.97 40.68 409.86 41.06C415.9 41.38 420.64 41.77 424.07 42.25C427.5 42.73 430.37 43.63 432.66 44.97C434.95 46.3 436.09 48.31 436.09 50.98L436.09 51.07C436.09 54.25 433.86 56.72 429.41 58.46C424.96 60.21 418.79 61.09 410.91 61.09C402.64 61.09 396.19 60.07 391.55 58.03C386.9 56.0 384.58 53.14 384.58 49.45L384.58 49.26L371.61 49.26L371.61 49.64C371.61 56.38 375.03 61.6 381.86 65.28C388.7 68.97 398.35 70.82 410.81 70.82C422.89 70.82 432.4 69.1 439.33 65.67C446.26 62.23 449.73 57.27 449.73 50.79L449.73 50.69C449.73 45.48 447.98 41.55 444.48 38.91Z"/><path d="M531.85 29.32L483.68 29.32L483.68 3.28L470.52 3.28L470.52 70.05L483.68 70.05L483.68 40.01L531.85 40.01L531.85 70.05L545.02 70.05L545.02 3.28L531.85 3.28L531.85 29.32Z"/><path d="M569.24 3.29H582.41V70.05H569.24ZZ"/><path d="M124.94 62.47C109.05 62.47 96.17 51.07 96.17 37.0C96.17 22.93 109.05 11.53 124.94 11.53C140.83 11.53 153.71 22.93 153.71 37.0C153.71 51.07 140.83 62.47 124.94 62.47M124.94 2.0C101.34 2.0 82.2 17.67 82.2 37.0C82.2 56.33 101.34 72.0 124.94 72.0C148.54 72.0 167.68 56.33 167.68 37.0C167.68 17.67 148.54 2.0 124.94 2.0Z"/>
  </svg>`;

/* ------------------------------------------------------------------ cart */
const cart = {
  read() {
    try { return JSON.parse(localStorage.getItem("korashi-cart")) || {}; }
    catch { return {}; }
  },
  write(c) {
    localStorage.setItem("korashi-cart", JSON.stringify(c));
    renderCart();
  },
  add(id, qty = 1) {
    const c = cart.read();
    c[id] = (c[id] || 0) + qty;
    cart.write(c);
  },
  set(id, qty) {
    const c = cart.read();
    if (qty <= 0) delete c[id]; else c[id] = qty;
    cart.write(c);
  },
  clear() { cart.write({}); },
  count() { return Object.values(cart.read()).reduce((a, b) => a + b, 0); },
  total() {
    return Object.entries(cart.read()).reduce((sum, [id, q]) => {
      const p = PRODUCTS.find((p) => p.id === id);
      return sum + (p ? p.price * q : 0);
    }, 0);
  },
};

/* ------------------------------------------------------- drawer (injected) */
function injectDrawer() {
  const el = document.createElement("div");
  el.innerHTML = `
  <div class="drawer-overlay" data-close-drawer></div>
  <aside class="drawer" aria-label="Shopping cart">
    <div class="drawer-head">
      <h3 class="drawer-title">Your Ritual</h3>
      <button class="drawer-close" data-close-drawer aria-label="Close cart">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
    </div>
    <div class="drawer-body">
      <div class="cart-view">
        <div class="cart-lines"></div>
        <div class="drawer-empty" hidden>
          <svg viewBox="0 0 204.19 204" fill="currentColor" opacity=".55">
            <path d="M65.69 156.72H138.5V184.02H65.69ZM187.59 127.54C196.6 112.32 202.19 93.87 202.19 79.38L202.19 2.0L183.98 2.0L183.98 79.38C183.98 90.49 179.14 106.12 171.94 118.29C164.33 131.14 155.47 138.51 147.61 138.51L134.67 138.51L137.27 134.9C138.97 132.55 140.6 130.07 142.13 127.53C151.12 112.32 156.72 93.86 156.72 79.38L156.72 2.0L138.5 2.0L138.5 79.38C138.5 90.45 133.65 106.09 126.42 118.29C122.88 124.28 118.91 129.26 114.96 132.68L111.2 135.95L111.2 2.0L92.99 2.0L92.99 135.95L89.23 132.68C85.28 129.26 81.32 124.28 77.77 118.29C70.54 106.09 65.69 90.45 65.69 79.38L65.69 2.0L47.51 2.0L47.51 79.38C47.51 93.91 53.09 112.36 62.07 127.54C63.59 130.07 65.22 132.55 66.92 134.9L69.52 138.51L56.58 138.51C48.72 138.51 39.86 131.14 32.25 118.28C25.05 106.05 20.21 90.42 20.21 79.38L20.21 2.0L2.0 2.0L2.0 79.38C2.0 93.87 7.59 112.32 16.6 127.54C24.96 141.67 35.12 151.12 45.98 154.88L47.51 155.41L47.51 202.0L156.72 202.0L156.72 155.41L158.24 154.88C169.09 151.12 179.24 141.66 187.59 127.54Z"/>
          </svg>
          <p>Your cart is empty.<br>The ritual awaits.</p>
        </div>
      </div>

      <form class="checkout-form" novalidate>
        <button type="button" class="back-link" data-back>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>
          Back to cart
        </button>
        <div class="field">
          <label for="ko-name">Full name</label>
          <input id="ko-name" name="name" autocomplete="name" placeholder="Your name">
          <p class="err">Please tell us your name.</p>
        </div>
        <div class="field">
          <label for="ko-phone">Phone (WhatsApp)</label>
          <input id="ko-phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxxx">
          <p class="err">Enter a valid Iraqi mobile number.</p>
        </div>
        <div class="field">
          <label for="ko-city">City</label>
          <select id="ko-city" name="city">
            <option value="">Choose your city…</option>
            <option>Baghdad</option><option>Erbil</option><option>Basra</option>
            <option>Mosul</option><option>Sulaymaniyah</option><option>Najaf</option>
            <option>Karbala</option><option>Duhok</option><option>Kirkuk</option>
            <option>Other</option>
          </select>
          <p class="err">Please choose a city.</p>
        </div>
        <div class="field">
          <label for="ko-address">Address / nearest landmark</label>
          <input id="ko-address" name="address" placeholder="District, street, landmark">
          <p class="err">We need an address to deliver.</p>
        </div>
        <div class="field">
          <label for="ko-notes">Notes <span style="opacity:.5;letter-spacing:.05em">(optional)</span></label>
          <textarea id="ko-notes" name="notes" placeholder="Anything we should know?"></textarea>
        </div>
      </form>

      <div class="order-success">
        <div class="seal">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fffceb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
        </div>
        <h4>Order sent!</h4>
        <p>We received your ritual order <span class="oid"></span> and will confirm it on WhatsApp shortly. Payment on delivery.</p>
        <button class="btn btn-ink" data-close-drawer>Keep browsing</button>
      </div>
    </div>
    <div class="drawer-foot">
      <div class="total-row mini sub-row" hidden><span class="lbl">Subtotal</span><span class="amt-mini subtotal-val">0 IQD</span></div>
      <div class="total-row mini ship-row" hidden><span class="lbl">Delivery</span><span class="amt-mini ship-val">0 IQD</span></div>
      <div class="total-row"><span class="lbl">Total</span><span class="amt"><span class="total-val">0</span> <small style="font-size:.55em">IQD</small></span></div>
      <p class="cod-note">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h18v10H3zM3 11h18M7 15h4"/></svg>
        Cash on delivery. Pay when your matcha arrives.
      </p>
      <button class="btn btn-gold drawer-cta" data-checkout>
        Checkout
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>
  </aside>
  <div class="toast" role="status">
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
    <span class="toast-msg">Added to your ritual</span>
  </div>`;
  document.body.append(...el.children);
}

const $ = (s, r = document) => r.querySelector(s);

function openDrawer() { document.body.classList.add("drawer-open"); }
function closeDrawer() {
  document.body.classList.remove("drawer-open");
  setTimeout(() => setDrawerMode("cart"), 450);
}
function setDrawerMode(mode) {
  const d = $(".drawer");
  d.classList.toggle("checkout", mode === "checkout");
  d.classList.toggle("done", mode === "done");
  $(".drawer-title").textContent =
    mode === "checkout" ? "Delivery Details" : mode === "done" ? "Shukran!" : "Your Ritual";
  setCtaLabel(mode);
  updateTotals();
}

/* subtotal + city delivery fee; the fee appears once checkout starts */
function updateTotals() {
  const sub = cart.total();
  const inCheckout = $(".drawer").classList.contains("checkout");
  const ship = inCheckout ? shippingFor($("#ko-city")?.value) : null;
  $(".sub-row").hidden = !inCheckout;
  $(".ship-row").hidden = !inCheckout;
  $(".subtotal-val").textContent = `${fmt(sub)} IQD`;
  $(".ship-val").textContent = ship == null ? "choose your city" : `${fmt(ship)} IQD`;
  $(".total-val").textContent = fmt(sub + (ship || 0));
}
function setCtaLabel(mode) {
  const cta = $(".drawer-cta");
  if (mode === "sending") {
    cta.innerHTML = `<span class="spinner" aria-hidden="true"></span> Sending your order…`;
  } else if (mode === "checkout") {
    cta.innerHTML = `Place order
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
  } else {
    cta.innerHTML = `Checkout
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  }
}

/* render cart lines + counters */
function renderCart() {
  const c = cart.read();
  const ids = Object.keys(c);
  const lines = $(".cart-lines");
  if (!lines) return;

  lines.innerHTML = ids.map((id) => {
    const p = PRODUCTS.find((p) => p.id === id);
    if (!p) return "";
    return `
    <div class="cart-line" data-id="${id}">
      <div class="thumb ${p.art}">${ART[id]}</div>
      <div class="info">
        <h4>${p.name}</h4>
        <div class="p">${fmt(p.price)} IQD</div>
        <button class="rm" data-rm="${id}">remove</button>
      </div>
      <div class="qty">
        <button data-dec="${id}" aria-label="Decrease">−</button>
        <output>${c[id]}</output>
        <button data-inc="${id}" aria-label="Increase">+</button>
      </div>
    </div>`;
  }).join("");

  $(".drawer-empty").hidden = ids.length > 0;
  $(".drawer-foot").style.display = ids.length ? "" : "none";
  updateTotals();

  document.querySelectorAll(".cart-count").forEach((b) => {
    const n = cart.count();
    b.textContent = n;
    b.classList.toggle("zero", n === 0);
  });
}

/* fly-to-cart animation */
function flyToCart(fromEl) {
  const target = $(".nav .cart-btn");
  if (!fromEl || !target) return;
  const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
  const dot = document.createElement("div");
  dot.className = "fly-dot";
  dot.style.left = a.left + a.width / 2 + "px";
  dot.style.top = a.top + a.height / 2 + "px";
  document.body.appendChild(dot);
  requestAnimationFrame(() => {
    dot.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.4)`;
    dot.style.opacity = "0";
  });
  setTimeout(() => dot.remove(), 750);
  const badge = $(".nav .cart-count");
  if (badge) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
}

let toastTimer;
function toast(msg) {
  const t = $(".toast");
  $(".toast-msg").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ------------------------------------------------------------- checkout */
function validPhone(v) {
  return /^(\+?964|0)?7\d{8,9}$/.test(v.replace(/[\s-]/g, ""));
}

let sendingOrder = false;

async function submitOrder() {
  if (sendingOrder) return;
  const form = $(".checkout-form");
  const data = Object.fromEntries(new FormData(form));
  let ok = true;
  const check = (name, valid) => {
    const f = form.querySelector(`[name="${name}"]`).closest(".field");
    f.classList.toggle("invalid", !valid);
    if (!valid) ok = false;
  };
  check("name", data.name.trim().length > 1);
  check("phone", validPhone(data.phone));
  check("city", !!data.city);
  check("address", data.address.trim().length > 3);
  if (!ok) return;

  if (!ORDER_ENDPOINT) {
    toast("Ordering isn't live yet. Message us on Instagram");
    return;
  }

  const orderId = "KOR-" + Date.now().toString(36).toUpperCase().slice(-5);
  const items = Object.entries(cart.read()).map(([id, q]) => {
    const p = PRODUCTS.find((p) => p.id === id);
    return { id, name: p.name, qty: q, price: p.price, line: p.price * q };
  });
  const subtotal = cart.total();
  const shipping = shippingFor(data.city);
  const payload = {
    orderId,
    placedAt: new Date().toISOString(),
    name: data.name.trim(),
    phone: data.phone.replace(/[\s-]/g, ""),
    city: data.city,
    address: data.address.trim(),
    notes: (data.notes || "").trim(),
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };

  sendingOrder = true;
  const cta = $(".drawer-cta");
  cta.disabled = true;
  setCtaLabel("sending");

  try {
    /* text/plain keeps it a "simple" request; Apps Script can't answer
       CORS preflights, but it happily parses the JSON body. */
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.ok === false) throw new Error(out.error || res.status);

    $(".order-success .oid").textContent = orderId;
    setDrawerMode("done");
    cart.clear();
    form.reset();
  } catch (err) {
    toast("Couldn't send your order. Please try again");
    setCtaLabel("checkout");
  } finally {
    sendingOrder = false;
    cta.disabled = false;
  }
}

/* ------------------------------------------------------------ behaviors */
function initNav() {
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  $(".burger")?.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    $(".mobile-menu").classList.toggle("open");
  });
  document.querySelectorAll(".mobile-menu a").forEach((a) =>
    a.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      $(".mobile-menu").classList.remove("open");
    })
  );
}

function initReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (e.target.dataset.delay || 0) + "ms";
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

/* product card factory (used by index + shop) */
function productCard(p, { stepper = false } = {}) {
  return `
  <article class="card reveal" data-id="${p.id}">
    <div class="card-art ${p.art}">
      <span class="halo"></span>
      ${ART[p.id]}
      <span class="card-tag">${p.tag}</span>
    </div>
    <div class="card-body">
      <h3>${p.name}</h3>
      <p class="sub">${p.sub}</p>
      <div class="card-foot">
        <span class="price">${fmt(p.price)} <small>IQD</small></span>
        ${stepper ? `
        <div class="qty">
          <button data-card-dec aria-label="Decrease">−</button>
          <output data-card-qty>1</output>
          <button data-card-inc aria-label="Increase">+</button>
        </div>` : ""}
      </div>
      <button class="add-btn" data-add="${p.id}" style="margin-top:.9rem;justify-content:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Add to cart
      </button>
    </div>
  </article>`;
}

function renderProductGrids() {
  document.querySelectorAll("[data-product-grid]").forEach((grid) => {
    const stepper = grid.hasAttribute("data-stepper");
    grid.innerHTML = PRODUCTS.map((p, i) => productCard(p, { stepper })).join("");
    grid.querySelectorAll(".card").forEach((c, i) => c.dataset.delay = i * 90);
  });
}

/* one delegated click handler */
function initClicks() {
  document.addEventListener("click", (e) => {
    const t = e.target;
    const closest = (s) => t.closest(s);

    if (closest("[data-open-cart]")) { e.preventDefault(); renderCart(); openDrawer(); }
    if (closest("[data-close-drawer]")) closeDrawer();
    if (closest("[data-back]")) setDrawerMode("cart");

    const add = closest("[data-add]");
    if (add) {
      const card = add.closest(".card");
      const qtyEl = card?.querySelector("[data-card-qty]");
      const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
      cart.add(add.dataset.add, qty);
      if (qtyEl) qtyEl.textContent = "1";
      flyToCart(add);
      toast("Added to your ritual");
    }

    const inc = closest("[data-inc]"); if (inc) cart.set(inc.dataset.inc, cart.read()[inc.dataset.inc] + 1);
    const dec = closest("[data-dec]"); if (dec) cart.set(dec.dataset.dec, (cart.read()[dec.dataset.dec] || 1) - 1);
    const rm  = closest("[data-rm]");  if (rm)  cart.set(rm.dataset.rm, 0);

    const cInc = closest("[data-card-inc]");
    if (cInc) { const o = cInc.parentElement.querySelector("[data-card-qty]"); o.textContent = Math.min(9, +o.textContent + 1); }
    const cDec = closest("[data-card-dec]");
    if (cDec) { const o = cDec.parentElement.querySelector("[data-card-qty]"); o.textContent = Math.max(1, +o.textContent - 1); }

    if (closest("[data-checkout]")) {
      const d = $(".drawer");
      if (d.classList.contains("checkout")) submitOrder();
      else if (cart.count() > 0) setDrawerMode("checkout");
      else toast("Your cart is empty");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("drawer-open")) closeDrawer();
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "ko-city") updateTotals();
  });
}

/* gentle mouse parallax for hero leaves */
function initParallax() {
  const hero = $(".hero");
  if (!hero || matchMedia("(pointer:coarse)").matches) return;
  hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
    hero.querySelectorAll(".leaf").forEach((l, i) => {
      const depth = (i % 3 + 1) * 8;
      l.style.translate = `${-x * depth}px ${-y * depth}px`;
    });
  });
}

/* marquee: duplicate content for seamless loop */
function initMarquee() {
  const track = $(".marquee-track");
  if (track) track.innerHTML += track.innerHTML;
}

/* place brandmarks */
function placeMarks() {
  document.querySelectorAll("[data-mark]").forEach((el) => {
    el.innerHTML = MARK(el.dataset.mark || "");
  });
  document.querySelectorAll("[data-wordmark]").forEach((el) => {
    el.innerHTML = WORDMARK();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectDrawer();
  placeMarks();
  renderProductGrids();
  renderCart();
  initNav();
  initClicks();
  initReveals();
  initParallax();
  initMarquee();
});
