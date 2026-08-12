# Shopify Theme — DIY Display Kit (single SKU)

Minimal Shopify Online Store 2.0 theme skeleton for the single-product
store. Stack confirmed in `project-docs/architecture-stack-proposal.md`;
UX/IA source of truth is `project-docs/ux-foundation.md` (§1, E-commerce
Store).

## Status: Week 1 scaffold (Tasks 1.1 and 1.2 only)

This covers the sprint roadmap's Week 1 targets — **1.1 (Product page)**
and **1.2 (Cart / order summary)** — as Shopify theme *configuration/code*.
It has **not been uploaded to or tested against a real Shopify store**,
which is explained below.

## This cannot be fully verified without a real Shopify account

Shopify themes don't run standalone — Liquid is rendered server-side by
Shopify's platform against a real store's product/inventory/cart data.
There is no local way to fully execute this code. To actually see and test
it, someone with a Shopify account needs to:

1. Create a (free trial or paid) Shopify **development store**.
2. Install the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)
   (`npm install -g @shopify/cli @shopify/theme`), or upload this directory
   as a `.zip` via Admin → Online Store → Themes → Add theme.
3. From this directory: `shopify theme dev --store <your-dev-store>.myshopify.com`
   to preview it live against real (or Shopify's placeholder) product data.
4. Add one product in the store admin (the kit: *"ESP32 + round SPI display
   + cables + USB-C + 3D-printed enclosure + screws"*) so `main-product.liquid`
   has real data to render against — the section will not show meaningful
   content against an empty store.

None of that was possible in this environment (no Shopify account, no
network access to Shopify's platform), so **nothing in this theme has been
rendered or clicked through yet.** Treat every Liquid tag/object reference
below as "written to the current Shopify Liquid reference and Online
Store 2.0 conventions, not verified against a live store."

## What's scaffolded (real code, not description)

- `layout/theme.liquid` — base HTML shell, loads `header-group` section
  group, renders `content_for_layout`, loads `assets/theme.css` /
  `assets/theme.js`.
- `sections/header.liquid` + `sections/header-group.json` — shop
  name/logo and a cart link with live item count. **No navigation menu, no
  search, no category links** — deliberate, per the UX doc's "one product,
  one path" principle. This is the concrete implementation of "disable
  navigation to any catalog/collection view" from Task 1.1's file list.
- `sections/hero.liquid` + `templates/index.json` — homepage is a single
  CTA into the one product (via a Shopify product-picker setting, so it
  works from the theme editor without a hardcoded handle), not a catalog
  landing page.
- `sections/main-product.liquid` + `templates/product.json` — product name,
  description, price, photo(s), quantity selector (default 1, capped to
  available stock when Shopify inventory tracking + "deny oversell" policy
  is on), working Add to Cart form, and a stock-aware Sold Out state that
  disables the CTA instead of leaving a dead button. Low-stock is shown as
  an optional notice per the UX doc ("not required," included anyway since
  it's cheap). "Notify me when back in stock" is explicitly **not**
  built — flagged as out of MVP scope in `ux-foundation.md` Open Question #4.
- `sections/main-cart.liquid` + `templates/cart.json` — cart **page**
  (not a slide-out drawer — see note below) implementing the Cart / Order
  Summary step: line item(s), inline-editable quantity (capped to stock),
  running total, explicit "Proceed to Checkout" button. Empty-cart state
  handled. Uses Shopify's native `{% form 'cart', cart %}` with
  `updates[{{ item.key }}]` inputs, so quantity updates work via a plain
  form POST — no custom JS/AJAX cart wiring required for it to function.
- `assets/theme.css` — plain, mobile-first CSS covering header, hero,
  product, and cart states (including sold-out/low-stock/empty-cart
  styling) so Task 1.1's "mobile responsive" criterion has real substance,
  not just a claim.
- `config/settings_schema.json` — minimal valid theme settings schema
  (theme info block + a note explaining the deliberate absence of
  catalog-related settings).

### Cart drawer vs. cart page — a real trade-off, not an oversight

The task asked for "a cart drawer **or** cart page section" — either
satisfies the IA doc. This scaffold builds the **page** version because it
works correctly with zero client-side JavaScript (native form submit +
page reload). A slide-out drawer would need Shopify's Ajax Cart API
(`/cart/add.js`, `/cart/change.js`, `/cart/update.js`) and JS to keep the
drawer's contents in sync without a full reload — that's meaningfully more
code and more that could silently break without a live store to test
against. `assets/theme.js` is left as a placeholder hook if that's wanted
later; nothing in this scaffold depends on it running.

## What's Week 2+ scope — NOT built here

- **Checkout / payment (Task 1.3).** The cart's "Proceed to Checkout"
  button submits to Shopify's own hosted checkout — Shopify owns that
  entire flow (shipping address form, Shopify Payments integration,
  order creation) once a store is live. No custom checkout code is
  written or should be written here; that's the whole point of the
  Shopify choice in `architecture-stack-proposal.md`.
- **Shipping cost display/config (Task 1.4)** — configured in Shopify
  Admin → Settings → Shipping, not in theme code.
- **Inventory deduction (Task 1.5)** — Shopify handles stock decrement and
  oversell prevention natively once inventory tracking is turned on for
  the product in Admin; `main-product.liquid` and `main-cart.liquid` here
  only *read* and *respect* that state (capping quantity, showing Sold
  Out) — they don't implement the deduction logic itself, because Shopify
  already owns it.
- **Order confirmation email (Task 1.6)** — Shopify's built-in
  notification, configurable in Admin → Settings → Notifications; no
  theme code needed unless the email template itself is customized later.
- **Order admin view (Task 1.7)** — this is Shopify's built-in Orders
  admin; no custom build needed unless a different internal tool is
  wanted later.
- Locale/translation files (`locales/`) — not included; Shopify will
  generate defaults on theme install, or add real translations later if
  multi-language is ever needed (not in spec).
- `config/settings_data.json` — intentionally omitted; Shopify generates
  this automatically the first time the theme is customized in Admin, so
  a hand-written stub would likely be stale/wrong on first real use.

## Honesty check

Every Liquid object/tag used here (`product.selected_or_first_available_variant`,
`item.variant.inventory_policy`, `{% form 'cart', cart %}`, `{% sections %}`,
etc.) is written against Shopify's current documented Liquid reference and
Online Store 2.0 JSON template conventions as of this writing — but "written
correctly per the docs" and "confirmed working in a live store" are
different claims, and only the first one is true right now. The first real
test (per the instructions in this README's opening section) should happen
before this is considered done for Task 1.1/1.2's acceptance criteria.
