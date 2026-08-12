# Shopify Store — Backend/Manual Setup Notes (Week 1)

**Author**: Backend Architect
**Scope**: Sprint Roadmap Week 1 — *"Backend Architect (Shopify store setup...)"* —
covers Task 1.1/1.2 groundwork (product page + cart exist on a real dev
store). **Does NOT cover Task 1.3 (payment/checkout integration)** — that's
explicitly Week 2 scope per the roadmap, and Shopify Payments requires
business/banking verification that shouldn't block Week 1's "store exists
with a product page and cart" done-criteria.

---

## Important — read before doing anything

**I (Backend Architect / this agent) do not have access to a Shopify
account, admin panel, or any live Shopify environment.** I cannot create the
dev store, upload theme files, or add the product myself — Shopify has no
API surface reachable from this codebase/session for store provisioning, and
even if it did, doing so would require credentials I'm not given and
shouldn't be given.

**What follows is a precise instruction set for a human (founder, DevOps
Automator, or whoever holds/creates the Shopify account) to execute by hand
in the real Shopify admin.** Nothing below has been performed. Treat this
file as a checklist to run through, not a record of completed work.

---

## Step 1 — Create the Shopify dev store

*(Per `sprint-roadmap.md` Week 1: "DevOps Automator ... Shopify dev store
provisioned" — this may already be owned by DevOps Automator; coordinate
before duplicating a store.)*

1. Go to https://www.shopify.com/partners (or use an existing Shopify
   Partner account) and sign in — or create a Partner account if none
   exists yet.
2. From the Partner dashboard: **Stores → Add store → Create development
   store**.
3. Store purpose: select "Test/build an app or theme" (not a live client
   store) — this is the correct type for a pre-launch dev environment.
4. Name it something identifiable, e.g. `diy-display-kit-dev` (avoid the
   final production store name at this stage — dev stores are cheap to
   throw away, production naming can wait).
5. Once created, confirm you can reach `https://<store-name>.myshopify.com/admin`.

## Step 2 — Upload the theme skeleton

*(Depends on Frontend Developer's theme scaffold, per Week 1 roster:
"Frontend Developer (Shopify theme scaffold...)". At the time this note was
written, no theme files existed yet in this repo's working tree — check with
Frontend Developer for the current state before proceeding.)*

1. In the target repo, confirm the theme scaffold exists with, at minimum,
   `templates/product.json` and `sections/main-product.liquid` (these are
   the two files Task 1.1 names explicitly).
2. Install the Shopify CLI (`npm install -g @shopify/cli @shopify/theme`) if
   not already available.
3. From the theme directory: `shopify theme dev --store=<store-name>.myshopify.com`
   to preview locally against the dev store, or `shopify theme push` to
   upload the theme directly.
4. In the Shopify admin: **Online Store → Themes**, confirm the pushed theme
   appears and publish it (or keep it unpublished/"Add as new theme" while
   iterating, then publish once Task 1.1's acceptance criteria are visibly
   met).
5. **Disable navigation to any catalog/collection view** per Task 1.1's
   explicit note (single-product store — no product browsing UI). In
   **Online Store → Navigation**, remove/hide any "All products" or
   collection links from the main menu.

## Step 3 — Add the single product

Per Task 1.1's acceptance criteria and the spec's product definition.

1. **Products → Add product.**
2. **Title**: `Round SPI Display Kit` (or the founder's preferred product
   name — not specified in the spec, confirm before final publish).
3. **Description**: use the spec's kit-contents language verbatim as the
   factual baseline, then let Frontend/Growth polish the marketing copy on
   top of it — don't let marketing copy drift from what's actually shipped:

   > ESP32 + round SPI display (e.g. GC9A01) + cables + USB-C + 3D-printed
   > enclosure + screws. Fast, colorful output (clocks, gauges, animated
   > widgets, live-data dashboards).

4. **Price**: **not specified anywhere in the spec, task list, or
   architecture docs I have access to.** Do not publish a placeholder number
   as if it were final — this is a founder/business decision (component
   cost + margin + shipping absorption), not an engineering one. Enter a
   clearly-marked draft price (e.g. use Shopify's "Draft" product status,
   which hides it from the live store) until the founder confirms a real
   number, then switch status to "Active."
5. **Photos**: upload real product photography once available (from the
   physical prototype build happening in parallel this week per the
   roadmap). Do not use stock/placeholder images in anything that could go
   live — if photos aren't ready yet, leave the product in Draft status
   rather than publishing with fake imagery.
6. **Inventory**: under the product's Inventory section, enable "Track
   quantity," set an initial stock count (coordinate with Task 4.4's
   physical-component inventory process — don't set a number disconnected
   from what 4.1/4.4 actually determine is buildable), and enable "Continue
   selling when out of stock" = **OFF** (this is what makes Task 1.5's
   oversell guard work using Shopify's native inventory system rather than
   custom code).
7. **SKU**: assign a real SKU string now even if inventory numbers are
   provisional — needed for Task 4.4's component-tracking process to
   reference something stable.
8. Confirm "Add to cart" / "Buy" button appears and is clickable on the
   storefront preview (Task 1.1's acceptance criterion) — this works
   automatically once the product is Active with stock > 0; verify it
   after Step 4 below regardless.
9. Check mobile responsiveness by previewing the product page on a phone or
   Shopify's built-in mobile preview — Task 1.1 and the task list's Quality
   Requirements both call this out explicitly.

## Step 4 — What NOT to do this week

- **Do not configure a payment gateway (Shopify Payments or Stripe) yet.**
  That is Task 1.3, explicitly scheduled for **Week 2** in
  `sprint-roadmap.md`. Setting it up now risks starting Shopify's business
  verification clock before the founder has finalized business details, and
  isn't needed to hit Week 1's "product page and cart exist" done-criteria.
- Do not enable checkout/publish the store live to the public internet with
  real pricing until Task 1.3 (payment) is actually wired up — a store with
  no working payment path but a live "Buy" button is a bad customer
  experience if anyone stumbles onto it early. Keep the store
  password-protected (**Online Store → Preferences → Password protection**,
  on by default for new dev stores) until launch-ready.
- Do not add a product catalog, collections, or multiple SKUs — explicitly
  out of scope per the task list's scope-discipline note (single SKU only).

## Handback

Once Steps 1-3 are complete, this satisfies the Week 1 done-criteria
*"Shopify dev store exists with a real product page and cart"* from
`sprint-roadmap.md`. Task 1.2 (cart/quantity selector, cart persists through
checkout) should be spot-checked at that point too — Shopify's default cart
drawer/page covers this out of the box once a product is Active, per
`architecture-stack-proposal.md`'s "all included out of the box" note; it
generally doesn't need custom theme work beyond what Step 2 already
uploads.

---

# Week 2 — Payment, Shipping, Inventory Enforcement

**Scope**: Sprint Roadmap Week 2 — Tasks 1.3 (checkout/payment), 1.4
(shipping cost handling), 1.5 (inventory deduction + oversell guard).
**Same caveat as Week 1, restated because it still applies**: **I (Backend
Architect / this agent) still do not have access to a Shopify account, admin
panel, or any live Shopify environment.** Everything below is a precise
instruction set for a human (founder, DevOps Automator, or whoever holds the
Shopify admin credentials) to execute by hand. Nothing below has been
performed, tested, or verified against a real store by me. Do not report
Task 1.3/1.4/1.5 as done based on this document alone — Evidence Collector
still needs to see it actually working on the dev store (test order,
declined-card test, oversell test) before it counts as evidence per
`sprint-roadmap.md`'s Phase 4 gate criteria.

Per the locked stack decision (`architecture-stack-proposal.md`), none of
Tasks 1.3-1.5 involve writing backend code — commerce is bought/configured
through Shopify's admin, not built. The only code-adjacent artifact touched
this week is confirming that Frontend Developer's Week 1 theme code
(`sections/main-product.liquid`) actually gets the admin state it assumes —
see Task 1.5 below, that's the one place config and code intersect.

## Task 1.3 — Enable Shopify Payments (founder-confirmed provider)

Per `architecture-stack-proposal.md`, the founder confirmed **Shopify
Payments** (not a direct Stripe integration) as the payment provider. Shopify
Payments is Stripe under the hood, so this is the lowest-friction path — no
separate Stripe account/API keys to manage, it's entirely a Shopify admin
flow.

1. **Settings → Payments** in the Shopify admin.
2. Under "Shopify Payments," click **Activate Shopify Payments** (or
   "Complete account setup" if a prior partial setup exists).
3. Fill in the required business/banking details Shopify asks for: business
   type (sole proprietor / LLC / etc.), business address, tax ID (EIN or
   SSN depending on business type), and a bank account/routing number for
   payouts. **These are real business/legal details only the founder can
   provide** — do not fabricate placeholder values to "get past" this step;
   an account activated with wrong legal/banking info can require support
   intervention to fix later.
4. Shopify may run identity/business verification after submission — this
   can take anywhere from minutes to a few business days depending on the
   business type. **Start this step early in the week**, not the day
   checkout needs to be demoed, since the verification clock is outside the
   team's control (this is exactly why Week 1's setup doc explicitly
   deferred this step rather than starting it prematurely).
5. Once active, Shopify Payments becomes the default payment method shown
   at checkout automatically — no theme code changes needed; Shopify's
   checkout is a Shopify-hosted page, not part of the Liquid theme.
6. **Enable test/sandbox verification before going live.** Shopify Payments
   supports test orders on a store still in a non-published/password-
   protected state (per Week 1's Step 4, the store should still be
   password-protected at this point). In **Settings → Payments**, if the
   store isn't yet accepting live payments, Shopify shows a **"Manage" →
   test order flow** option, or you can generate a real low-value test
   order and refund it — check current Shopify docs at setup time for the
   exact test-mode UI, since Shopify periodically moves this control.
7. **Verify Task 1.3's acceptance criteria explicitly, don't assume them**:
   - Place one successful test order using a valid test card
     (`4242 4242 4242 4242`, any future expiry, any CVC, is Shopify's
     documented test success card when in test mode) → confirm an order
     appears in **Orders** with status "paid."
   - Place one test order using Shopify's documented always-declines test
     card number (check current Shopify docs for the exact number at setup
     time — these are periodically updated) → confirm checkout shows a
     clear inline decline error to the customer **and** confirm no order
     record was created in **Orders** for that attempt. This is the
     explicit "failed payment ... does not create a false order" acceptance
     criterion — don't skip this test, it's the one most likely to hide a
     real bug if Shopify's checkout is customized later.
   - Confirm the order confirmation page appears immediately after the
     successful test order (email confirmation is Task 1.6, next week —
     but the confirmation *page* is part of Task 1.3's "order confirmation
     ... is triggered on success" criterion and should already work now).

## Task 1.4 — Shipping: flat-rate setup (simplest workable approach)

Per the task list's Task 1.4 note (*"simplest workable approach ... flat rate
... satisfies MVP scope"*) and `architecture-stack-proposal.md`'s shipping
row (*"Flat-rate is also a one-click config if calculated rates aren't
needed for MVP"*), this uses a single flat rate rather than carrier-calculated
rates. Calculated multi-carrier rates are explicitly listed as a fast-follow
cut candidate in `sprint-roadmap.md`'s Risk section if time gets tight —
don't build anything smarter than flat-rate under normal circumstances
either.

1. **Settings → Shipping and delivery** in the Shopify admin.
2. The single SKU store needs only the default **"General" shipping
   profile** — do not create a second custom shipping profile; that's
   multi-product/multi-rate complexity this store doesn't have.
3. Under the General profile, find (or create) a **shipping zone** covering
   the country/region the founder actually ships to. **Which
   country/region(s) to ship to is not specified anywhere in the spec, task
   list, or architecture docs** — same category of gap as Week 1's price
   placeholder. Confirm with the founder before finalizing; do not silently
   assume "domestic only" or "worldwide" without asking, since it directly
   affects tax/customs handling downstream.
4. Click **Add rate** within that zone → choose the rate type that is a
   flat amount (not "Use carrier or app to calculate rates") → give it a
   customer-facing name, e.g. `Standard Shipping` → enter the flat price.
   **Price is a founder/business decision (packaging + carrier cost +
   whatever subsidy the founder wants to absorb into the product price),
   not an engineering one — do not invent a number.** Leave it unset /
   flag to founder rather than publishing a placeholder shipping cost.
5. Leave weight-based or price-based rate conditions off unless the founder
   specifically wants tiered shipping — a single flat rate satisfies all
   three of Task 1.4's acceptance criteria on its own:
   - Shipping address collected — native to Shopify checkout, no config
     needed beyond having at least one shipping zone that matches the
     customer's address (if no zone matches, checkout blocks the order with
     "we don't ship to your region," which is correct behavior, not a bug).
   - Shipping cost shown and added to total before payment — automatic once
     step 4 is saved; the flat rate appears as a selectable option on the
     checkout's shipping step.
   - Order record stores the shipping method/cost — automatic; Shopify's
     order object always records the selected shipping line item, visible
     in **Orders → [order] → Shipping**.
6. **Verify**: open the storefront preview, add the product to cart, proceed
   through checkout to the shipping step, confirm the flat rate name/price
   appears and updates the order total. No code change is required in
   `shopify-theme/` for this — checkout is Shopify-hosted, outside the
   theme's Liquid templates entirely.
7. **Do not** set up carrier accounts, label purchase, or calculated rates
   this week — that's Task 4.5 (Shipping/carrier setup), a separate,
   later, operational task about *fulfilling* orders, not about *quoting*
   shipping cost at checkout. Task 1.4 only needs a cost to display and
   record; Task 4.5 is what turns a paid order into an actual shipped
   package with a label.

## Task 1.5 — Inventory tracking + "deny" oversell policy

This is the one Week 2 admin step that a piece of already-written code
directly depends on, so get it exactly right — see the cross-reference
below.

1. **Products → Round SPI Display Kit → Inventory** section.
2. Confirm **"Track quantity"** is enabled (should already be set from Week
   1's Step 3, item 6 — re-verify, don't assume it survived any theme
   re-push or product edit since then) and that the stock count reflects
   whatever Task 4.4's physical-component inventory process currently says
   is real/buildable stock — coordinate with whoever owns 4.4 before
   changing the number.
3. **Confirm the "Continue selling when out of stock" checkbox is
   UNCHECKED.** This is the load-bearing setting for Task 1.5's oversell
   guard and for Task 2.6/Week 1's already-written theme code — see below.
4. Save.

### Why this exact checkbox state matters — cross-reference to existing code

`shopify-theme/sections/main-product.liquid` (built Week 1) already contains
this conditional, written *in anticipation* of this admin setting being
configured correctly:

```liquid
{% if current_variant.inventory_management == 'shopify' and current_variant.inventory_policy == 'deny' %}
  {% assign max_qty = current_variant.inventory_quantity %}
{% else %}
  {% assign max_qty = nil %}
{% endif %}
```

Shopify's admin checkbox and the Liquid property it sets are named with
inverted polarity from each other, which is an easy way to configure this
wrong without noticing:

- Checkbox **checked** ("Continue selling when out of stock") → Shopify sets
  `inventory_policy` = `"continue"` on the variant → oversold orders are
  allowed → the theme's conditional above evaluates **false** → `max_qty` is
  `nil` → the quantity selector has no stock-aware cap and the low-stock
  notice never shows, even though the admin has "Track quantity" on and a
  real stock number set. The page will look and behave exactly like an
  untracked product — nothing errors, nothing looks broken, it just silently
  isn't enforcing the oversell guard the code was written for.
- Checkbox **unchecked** (the correct MVP setting) → Shopify sets
  `inventory_policy` = `"deny"` → the conditional evaluates **true** →
  `max_qty` is capped to real stock, the low-stock notice appears at ≤10
  units, and — separately from the theme code — **Shopify's own checkout
  enforces the deny policy at the platform level**, refusing to complete an
  order that would oversell the last unit(s), including under concurrent
  checkout attempts.

In other words: the Liquid code in `main-product.liquid` was written
correctly in Week 1, but it is **inert/decorative until this Week 2 admin
setting is applied** — the code reads `inventory_policy`, it doesn't set it.
This admin step is what makes that code path actually do something, not an
independent parallel safeguard.

### Verifying Task 1.5's acceptance criteria

1. **Basic deduction**: note current stock count, place one test order for
   quantity 1, confirm stock count in **Products → Inventory** decrements by
   exactly 1.
2. **Out-of-stock state**: temporarily set stock to 0 (or place test orders
   down to 0), reload the storefront product page, confirm the "Add to
   cart" control is disabled and a "Sold out" state shows instead — this is
   native Shopify theme behavior once stock hits 0 with `inventory_policy:
   deny`, but confirm it visually rather than assuming.
3. **Concurrency/oversell guard**: this is the acceptance criterion most
   likely to be skipped because it's awkward to test manually — do it
   anyway before treating Task 1.5 as done. Set stock to 1, open two
   separate browser sessions (or one normal + one incognito window),
   proceed both to the payment step for the same last unit, and complete
   payment in both at nearly the same time. With `inventory_policy: deny`,
   Shopify's checkout is expected to let only one complete and block/error
   the other (typically "this item is no longer available" or similar at
   the payment step) — confirm this is what actually happens on the dev
   store, don't take Shopify's documentation's word for it as a substitute
   for the Reality Check Gate's evidence requirement
   (`sprint-roadmap.md`'s gate criteria explicitly list "Inventory oversell
   guard (Task 1.5) tested under a concurrent/last-unit scenario").
4. Reset stock to the real Task 4.4-coordinated number once testing is
   done — don't leave it at a test-artifact value.

## Handback (Week 2)

Once the above is complete and verified on the dev store, this satisfies
Week 2's done-criteria from `sprint-roadmap.md`: *"Checkout, payment,
shipping cost, and inventory deduction work end-to-end on the dev store with
a real test order."* Hand off to Evidence Collector for independent
verification against Tasks 1.3/1.4/1.5's acceptance criteria — this document
describes the steps to take, it is not itself the evidence that they were
taken and worked.
