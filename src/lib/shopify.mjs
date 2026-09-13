export const SHOP_DOMAIN = 'daisy-hatchet.myshopify.com';
export const ENDPOINT = `https://${SHOP_DOMAIN}/api/2026-07/graphql.json`;

// Tokenless Storefront API. Never put an Admin API credential in this module.
export const PRODUCTS_QUERY = `query ShopProducts($after: String) {
  products(first: 20, after: $after, sortKey: CREATED_AT) {
    nodes {
      id title handle descriptionHtml availableForSale
      featuredImage { url altText }
      variants(first: 20) {
        nodes { id title availableForSale price { amount currencyCode } }
        pageInfo { hasNextPage }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export const CHECKOUT_MUTATION = `mutation ShopCheckout($variantId: ID!) {
  cartCreate(input: {lines: [{merchandiseId: $variantId, quantity: 1}]}) {
    cart { checkoutUrl totalQuantity }
    userErrors { field message }
  }
}`;

export async function storefront(query, variables = {}, fetcher = fetch) {
  const response = await fetcher(ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Shopify is temporarily unavailable. Please try again.');
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error('The shop could not be loaded. Please try again.');
  return result.data;
}

export async function loadProducts(fetcher = fetch) {
  const products = [];
  let after = null;
  do {
    const data = await storefront(PRODUCTS_QUERY, {after}, fetcher);
    products.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    const cursor = data.products.pageInfo.endCursor;
    if (!cursor || cursor === after) throw new Error('The shop could not be loaded. Please try again.');
    after = cursor;
  } while (true);
  return products;
}

export function orderProducts(products, order) {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...products].sort((a, b) => (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity));
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: price.currencyCode, minimumFractionDigits: Number(price.amount) % 1 ? 2 : 0}).format(Number(price.amount));
}

export async function checkout(variantId, fetcher = fetch) {
  const data = await storefront(CHECKOUT_MUTATION, {variantId}, fetcher);
  const result = data.cartCreate;
  if (result.userErrors.length) throw new Error(result.userErrors.map(error => error.message).join(' '));
  if (!result.cart || result.cart.totalQuantity !== 1) throw new Error('This arrangement is no longer available. Please refresh the shop.');
  const url = new URL(result.cart.checkoutUrl);
  if (url.protocol !== 'https:' || ![SHOP_DOMAIN, 'checkout.shopify.com'].includes(url.hostname)) throw new Error('Checkout could not be opened. Please try again.');
  return url.href;
}
