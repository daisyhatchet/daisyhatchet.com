# Shopify return-to-shop redirect

Published September 12, 2026, with the owner's explicit approval for the Shopify redirect only.

- Active theme: Daisy Hatchet return to shop, ID 148536098869.
- Previous Horizon theme retained as an unpublished backup, ID 145582424117.
- Only change to the copied theme: insert `shopify-return-to-shop.liquid` contents immediately after `<head>` in `layout/theme.liquid`.
- Homepage, cart, product, collection, and collection-list pages redirect to https://daisyhatchet.com/shop/ outside the theme editor.
- Checkout, account, order-status, and app-proxy pages are excluded.
- Shopify theme checker passed. Published layout readback matched exactly; browser verified the homepage redirects to the production shop. All seven products still load and cart creation returns a checkout URL.
- The Netlify website was not published. Its production shop still uses Local Blooms purchase links until the website migration is separately published.

Rollback: republish the original Horizon theme from Shopify's theme library. The original layout is also saved in `shopify-horizon-original.liquid`.
