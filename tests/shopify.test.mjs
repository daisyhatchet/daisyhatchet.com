import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProducts, checkout, orderProducts, formatPrice} from '../src/lib/shopify.mjs';

test('catalog follows pagination and preserves existing display order', async () => {
  const cursors = [];
  const products = await loadProducts(async (_, options) => {
    const {after} = JSON.parse(options.body).variables;
    cursors.push(after);
    return Response.json({data:{products:{nodes:after ? [{id:'a'}] : [{id:'b'}],pageInfo:{hasNextPage:!after,endCursor:after ? null : 'page-2'}}}});
  });
  assert.deepEqual(cursors,[null,'page-2']);
  assert.deepEqual(orderProducts(products,['a','b']).map(p=>p.id),['a','b']);
  assert.equal(formatPrice({amount:'25.50',currencyCode:'USD'}),'$25.50');
});

test('API failure never silently falls back to obsolete products', async () => {
  await assert.rejects(loadProducts(async()=>new Response('',{status:503})),/temporarily unavailable/);
  await assert.rejects(loadProducts(async()=>Response.json({errors:[{message:'locked'}]})),/could not be loaded/);
});

test('checkout sends the chosen Shopify variant and uses its returned checkout URL',async()=>{
  const url='https://daisy-hatchet.myshopify.com/checkouts/test';
  const result=await checkout('gid://shopify/ProductVariant/123',async(_,options)=>{
    assert.equal(JSON.parse(options.body).variables.variantId,'gid://shopify/ProductVariant/123');
    assert(!Object.keys(options.headers).some(key=>key.toLowerCase().includes('token')));
    return Response.json({data:{cartCreate:{cart:{checkoutUrl:url,totalQuantity:1},userErrors:[]}}});
  });
  assert.equal(result,url);
});

test('checkout blocks unavailable items, empty carts and unexpected redirects',async()=>{
  const response=cartCreate=>async()=>Response.json({data:{cartCreate}});
  await assert.rejects(checkout('x',response({cart:null,userErrors:[{message:'Sold out'}]})),/Sold out/);
  await assert.rejects(checkout('x',response({cart:{checkoutUrl:'https://daisy-hatchet.myshopify.com/checkouts/test',totalQuantity:0},userErrors:[]})),/no longer available/);
  await assert.rejects(checkout('x',response({cart:{checkoutUrl:'https://example.com',totalQuantity:1},userErrors:[]})),/could not be opened/);
});
