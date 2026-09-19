# Bespoke Bouquet

Local review implementation, September 18, 2026. Not published.

## Customer experience

The shop features a dedicated entry to `/shop/bespoke/`. Customers choose Petite
($35, 1–2 colors), Classic ($50, 2–3), or Abundant ($65, 3–5). Named swatches
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

## Draft product prepared

Shopify product `gid://shopify/Product/8240863445045` is DRAFT, not for sale.
Expected handle: `bespoke-bouquet` (verify when activating).

- Petite: `gid://shopify/ProductVariant/46016367329333`, $35 USD
- Classic: `gid://shopify/ProductVariant/46016367362101`, $50 USD
- Abundant: `gid://shopify/ProductVariant/46016367394869`, $65 USD

Inventory is untracked; no flower stock quantities were assumed. No image was added.
The initial palette is explicitly a sample and `enabled` is false.

Before launch, confirm the owner's available colors, review the design, and confirm
the Shopify product's handle, fulfillment settings and sales-channel publication.
Only after the owner authorizes launch: activate/publish the product, enable the
confirmed palette, and publish the reviewed website through GitHub main/Netlify.
Verify real cart line attributes and checkout totals before completing launch.
No payment or real order has been created.

## Verification

17 automated tests cover selection boundaries, stale/unavailable colors, palette
validation and publication, checkout attributes and existing shop/gallery behavior.
Astro checks/build and mobile/desktop visual review completed. The palette's local
save was checked in the browser and its change verified in the bouquet preview.
Live checkout remains unavailable while the product is a draft.

Shopify schema validation passed for the extended cart mutation.
Reference: https://shopify.dev/docs/api/storefront/2026-07/input-objects/AttributeInput
