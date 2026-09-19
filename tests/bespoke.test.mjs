import test from 'node:test';
import assert from 'node:assert/strict';
import {SIZES,selectionMessage,validatePalette,bouquetVariant} from '../public/editor-assets/bespoke-model.js';
import {checkout} from '../src/lib/shopify.mjs';
const colors=Array.from({length:7},(_,i)=>({id:`color-${i}`,name:`Color ${i}`,hex:'#ffffff',available:i<6}));
test('all size boundaries, unavailable colors and duplicate selections',()=>{
 for(const size of SIZES){
   for(let count=0;count<=6;count++)assert.equal(selectionMessage(size.id,colors.slice(0,count).map(c=>c.id),colors)==='',count>=size.min&&count<=size.max,`${size.id} with ${count} colors`);
 }
 assert.match(selectionMessage('classic',['color-0','color-6'],colors),/no longer available/);
 assert.match(selectionMessage('petite',['color-0','color-0'],colors),/no longer available/);
 assert.match(selectionMessage('petite',['deleted'],colors),/no longer available/);
 assert.match(selectionMessage('unknown',[],colors),/Choose a bouquet size/);
});
test('palette maintenance validates availability, unique names and safe swatches',()=>{
 assert.equal(validatePalette({enabled:true,colors}).colors.length,7);
 for(const invalid of [{enabled:true,colors:[]},{enabled:false,colors:[{...colors[0],hex:'red; url(x)'}]},{enabled:true,colors:[colors[0],colors[0]]},{enabled:true,colors:[colors[0],{...colors[1],name:' color 0 '} ]},{enabled:true,colors:[{...colors[0],name:''}]}])assert.throws(()=>validatePalette(invalid));
 assert.deepEqual(validatePalette({enabled:false,colors:[]}),{enabled:false,colors:[]});
});
test('checkout only accepts matching available size with the agreed USD price',()=>{
 const v={id:'variant',title:'Classic',availableForSale:true,price:{amount:'50.00',currencyCode:'USD'}};
 const p={handle:'bespoke-bouquet',availableForSale:true,variants:{nodes:[v]}};
 assert.equal(bouquetVariant([p],'classic'),v);
 assert.equal(bouquetVariant([p],'petite'),null);
 assert.equal(bouquetVariant([{...p,availableForSale:false}],'classic'),null);
 assert.equal(bouquetVariant([{...p,variants:{nodes:[{...v,price:{amount:'65',currencyCode:'USD'}}]}}],'classic'),null);
 assert.equal(bouquetVariant([{...p,variants:{nodes:[{...v,availableForSale:false}]}}],'classic'),null);
});
test('the customer color story travels on the actual Shopify cart line',async()=>{
 const attributes=[{key:'Bouquet size',value:'Classic'},{key:'Color palette',value:'Apricot, Lilac'}];
 await checkout('chosen-variant',async(_,options)=>{
 const body=JSON.parse(options.body);assert.deepEqual(body.variables,{variantId:'chosen-variant',attributes});assert.match(body.query,/attributes: \$attributes/);
 return Response.json({data:{cartCreate:{cart:{checkoutUrl:'https://daisy-hatchet.myshopify.com/checkouts/test',totalQuantity:1},userErrors:[]}}});
 },attributes);
});
