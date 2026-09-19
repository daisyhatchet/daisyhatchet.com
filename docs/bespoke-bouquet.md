# Bespoke Bouquet

Production release authorized September 19, 2026.

## Customer experience

The shop features a dedicated entry to `/shop/bespoke/`. Customers choose Petite
($35, 1–2 colors), Classic ($50, 2–3), or Abundant ($65, 3–4). Named swatches
color a stylized bouquet study; it is explicitly not an exact arrangement preview.
Selections survive size changes; an overfull palette must be edited before checkout.
Unavailable colors cannot be added. Sizes with too few available colors are disabled.

Before checkout the browser reloads the published palette and current Shopify
catalog, validates the selection and agreed USD price, then creates a cart carrying
`Bouquet size` and `Color palette` as line attributes. Normal shop purchases retain
their existing behavior. The generic catalog excludes the bespoke product so it
cannot bypass the builder through the site's ordinary product cards.

The selection rules apply to this site's builder. They are not Shopify-wide
checkout validation rules: other sales channels or direct API requests would need
separate Shopify checkout validation to enforce the same conditions. No stock
reservation is made for individual colors.

## Palette maintenance

`/editor/palette` uses the existing editor sign-in. Add or rename colors, choose
swatches with the color picker, reorder with arrows, and toggle availability.
Publishing changes only `src/content/bespoke-palette.json`, using the same stale-edit
and concurrent-update protections as the gallery. The palette supports up to 24
unique, named colors. Keep orders closed while preparing a palette.

Local review: start Astro, then run `node tools/preview-hosted-editor.mjs`.
If the standard ports are occupied, set `EDITOR_PREVIEW_PORT` and
`SITE_PREVIEW_ORIGIN` to the actual local addresses. This editor's **Save local draft**
writes only the local palette file and rejects stale writes. Refresh the bouquet
preview to see saved colors. It cannot publish. Local example:

```
EDITOR_PREVIEW_PORT=4325 SITE_PREVIEW_ORIGIN=http://127.0.0.1:4324 node tools/preview-hosted-editor.mjs
```

## Shopify product

Shopify product `gid://shopify/Product/8240863445045` is ACTIVE and published to the Online Store channel.
Verified handle: `bespoke-bouquet`.

- Petite: `gid://shopify/ProductVariant/46016367329333`, $35 USD
- Classic: `gid://shopify/ProductVariant/46016367362101`, $50 USD
- Abundant: `gid://shopify/ProductVariant/46016367394869`, $65 USD

Inventory is untracked; no flower stock quantities were assumed. Field note 24 is the featured Shopify image.
The owner saved seven available colors; the palette is enabled for launch.

The owner authorized activation and website publication. The final palette uses
Hot Gossip, Pinky Promise, Cherry Bomb, Orange Crush, Mellow Yellow, Vanilla Haze,
and Sour Apple. The existing Netlify/GitHub main publication flow is unchanged.
The live editor is `/editor/palette` behind the existing editor sign-in.

## Verification

17 automated tests cover selection boundaries, stale/unavailable colors, palette
validation and publication, checkout attributes and existing shop/gallery behavior.
Astro checks/build and mobile/desktop visual review completed. The palette's local
save was checked in the browser and its change verified in the bouquet preview.
Live Storefront cart checks passed for all three sizes: USD subtotals $35/$50/$65,
correct size and color line attributes, and physical delivery required. No payment
or order was submitted. Command-line fetching of checkout HTML returned HTTP 403;
this does not affect the successful cart API checks.

Shopify schema validation passed for the extended cart mutation.
Reference: https://shopify.dev/docs/api/storefront/2026-07/input-objects/AttributeInput
