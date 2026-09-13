# Shopify migration — September 12, 2026

The website remains on Netlify. Shopify holds the products and will handle checkout.
No website publication, domain change, or store privacy change was made during this migration.

## Imported and verified

All seven arrangements were imported as **DRAFT**, with one default variant each,
their original prices in USD, and copies of their existing photos hosted by Shopify.
The catalog was empty before import. All seven records were read back and checked.

| Arrangement | Price | Shopify product ID | Variant ID |
| --- | ---: | --- | --- |
| First Date | $60 | 8237025361973 | 45995155193909 |
| Sex and Candy | $50 | 8237025394741 | 45995155226677 |
| Volcano Girl | $45 | 8237025427509 | 45995155259445 |
| Sugar Town | $35 | 8237025493045 | 45995155324981 |
| Sorry My Dog Bit You | $30 | 8237025558581 | 45995155390517 |
| Here Comes the Sun | $30 | 8237025591349 | 45995155423285 |
| Candy Says | $25 | 8237025624117 | 45995155456053 |

The source contained no descriptions, SKUs, stock counts, delivery rules, customer
records, or order history. None were invented or imported from Local Blooms.
Inventory is untracked, matching the old available/not-available catalog rather
than implying a quantity of zero. To sell limited batches, enable inventory tracking
and enter the actual stock in Shopify. Draft or archive a product to hide it.

## Website behavior

- `/shop` fetches Shopify's current published products in the browser using the
  tokenless Storefront API, version `2026-07`. No Admin credentials are needed in the site.
- Prices, images, availability, variants, and new products come from Shopify on each visit.
- The seven existing products keep their order through `src/content/shopify-order.json`;
  new products follow them in creation order.
- Purchase creates a one-item Shopify cart and opens its returned checkout URL.
  Checkout errors leave the visitor on the shop page with a retryable message.
- Multi-variant products get a selector. Products exceeding 20 variants open the
  Shopify product page to show all options.
- Shopify failures display an error and retry button; they never expose stale
  purchase links or silently substitute the imported snapshot.
- `/editor/shop` redirects to Shopify products. `/editor` defaults to the gallery.
  Old shop write endpoints return 410 without contacting GitHub.
- The original `src/content/shop-items.json` remains as a rollback reference; the
  website no longer reads it. Do not edit it for ongoing product management.

## Local review

Run `pnpm dev --host 127.0.0.1`, then open
`http://127.0.0.1:4321/shop/?preview=imported`.
This displays the imported snapshot with a clear draft-preview label and prevents
checkout. The snapshot and preview switch are excluded from production builds.
`/shop/` without that parameter exercises the real Shopify connection.

## Remaining launch prerequisites

The live Storefront API returned HTTP 400 with **Online Store channel is locked**.
The plugin remains authenticated and can manage products. The owner has now signed in to Shopify admin. Preferences confirms password
protection is on and its switch is disabled until the business address is saved.
The required form is open under Settings > Subscription confirmation > Add business address.
Payments shows “Complete setup”; payment onboarding is not complete.
The general shipping profile currently offers US Express $15, Standard $8 below $70,
and free Standard at $70 or more. An international zone has no rates. These are
existing defaults, not confirmed flower-delivery policies. The owner has been asked
to choose pickup and/or local delivery before changing fulfillment settings.

Do not publish this website version yet. Before launch:

1. Resolve Storefront API access. Tokenless access requires an unlocked Online
   Store; authenticated Storefront access through an appropriate sales channel is
   an alternative. Do not remove password protection or change the store's audience
   without the owner's separate explicit instruction.
2. Confirm the intended pickup/delivery/shipping arrangements and that payment
   setup is complete. These settings are not present in the old website catalog.
3. When authorized to launch, activate the seven imported products and publish them
   to the channel used by the storefront, with availability in the intended market.
4. Verify the real Storefront API returns all seven correct products and that a
   cart reaches checkout with the correct product, currency, price, and delivery
   options. Stop before payment; no real order has been placed by this migration.
5. Obtain the owner's production publication instruction, then publish the reviewed
   website changes through GitHub main/Netlify as required by AGENTS.md.

## Validation

- Storefront products query and cartCreate mutation passed Shopify's schema validator.
- `node --test tests/*.test.mjs`: catalog pagination, order, currency formatting,
  API failure, checkout errors/redirects, retired editor writes, and gallery regressions.
- `pnpm build`: Astro checks and production build.
- Browser review: seven cards and Shopify-hosted images; draft button feedback;
  mobile layout without horizontal overflow.
- Real checkout remains unverified until the store access issue and draft status
  are resolved. Unit tests use mocked responses and are not a payment test.

References: [Storefront API](https://shopify.dev/docs/api/storefront/2026-07),
[cart creation](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage).

## Fulfillment update

The owner reports the business address has been added and explicitly chose local
pickup plus local delivery, with no nationwide shipping. The domestic shipping
zone and its three default rates were removed and saved in Shopify. The remaining
international zone has no rates, so it does not offer shipping.

Pickup and local delivery were both off. Pickup configuration offers processing
times of 1, 2, 4, or 24 hours, 2–4 days, or 5+ days. No timing was assumed or saved.
Awaiting the owner's delivery ZIP codes/radius, delivery fee, minimum order, pickup
processing time, and pickup instructions before enabling these methods. The
Payments page is open for the owner to choose Complete setup.

### Saved local delivery zones

Local delivery is now enabled and the saved status was verified in Shopify.
Both zones use exact ZIP codes, not a radius or a broad wildcard, and retain no
minimum order.

- Free: 94044 (Pacifica).
- $10: 94014 and 94015 (all Daly City, explicitly confirmed by the owner),
  94018 (El Granada), 94019 (Half Moon Bay), 94037 (Montara), 94038 (Moss Beach).
- Other ZIP codes are excluded, including San Mateo, San Bruno, Burlingame,
  South San Francisco, and other bayside communities.

City/ZIP mapping was checked against Daly City library addresses and San Mateo
County/city facilities pages. ZIP boundaries are the checkout eligibility boundary;
they are not a street-by-street geographic polygon.

Pickup remains off pending the owner's expected processing time and instructions.
Payment setup and store launch checks remain outstanding.

### Saved pickup settings

Pickup is now enabled and saved at the existing location. The owner requested
next-day porch pickup; Shopify's selected processing-time option is “Usually ready
in 24 hours.” Ready-for-pickup instructions say: “Your flowers are ready! Please
collect your order directly from the porch at the pickup address shown. Bring your
order confirmation.” This notification is sent when staff mark an order ready.

The owner plans to text when ready. Shopify's native SMS only supports order
confirmation, not ready-for-pickup updates. Automatic pickup texts require a
transactional SMS app, which has not been installed. Manual texting is possible
when a customer supplies a mobile number. Checkout currently allows phone OR email,
and shipping-address phone is not included; phone collection for all pickup
customers is therefore not guaranteed. Do not promise automated SMS in site copy.
Reference: https://help.shopify.com/en/manual/fulfillment/setup/notifications/sms-notifications

### Email notification decision

The owner chose ready-for-pickup email instead of SMS. Checkout contact method
has been changed from phone-or-email to Email so every new order includes an email
address. Staff must mark the order ready and send the pickup notification; it is
not sent merely because 24 hours elapse. No SMS app is required for this workflow.

### Product descriptions copied from Local Blooms

At the owner's request, all seven matching Local Blooms product descriptions were
copied verbatim into Shopify descriptionHtml, preserving paragraph and line breaks.
All seven were read back from Shopify and checked against the source. Source URLs
and the original HTML are saved in `docs/migrations/local-blooms-descriptions.json`.
This supersedes the earlier note that descriptions had not been imported. No website
display changes or publication were made; presentation will be decided separately.

## Production launch — September 12, 2026

The owner authorized turning on the real shop. All seven products are active, the Shopify storefront password is removed, and Shopify Payments test mode is disabled. Order email notifications go to jeneva@daisyhatchet.com; the previous Gmail notification recipient is off and iPhone notifications remain enabled. Shopify's return-to-shop redirect is published (see migrations/shopify-redirect-published.md).

The website migration includes live Shopify product loading and checkout, product descriptions, responsive image lightboxes, and retirement of the old shop editor in favor of Shopify. Production builds exclude imported preview data. Build and 12 tests passed before publication. No real purchase was made by the assistant.
