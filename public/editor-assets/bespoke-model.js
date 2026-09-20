export const SIZES = [
  {id:'petite',name:'Petite',price:35,min:1,max:2,description:"love them a little"},
  {id:'classic',name:'Classic',price:50,min:2,max:3,description:"¯\\_(ツ)_/¯"},
  {id:'abundant',name:'Abundant',price:65,min:3,max:4,description:"love them a lot"},
];
export function defaultSize(colors) {
  const count=colors.filter(color=>color.available).length;
  return [...SIZES].reverse().find(size=>count>=size.min) || SIZES[0];
}
export function validatePalette(value) {
  if (!value || typeof value.enabled !== 'boolean' || !Array.isArray(value.colors) || value.colors.length > 24) throw Error('Use up to 24 colors.');
  const ids = new Set(), names = new Set();
  const colors = value.colors.map(c => {
    if (!c || typeof c.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.trim().length > 40 || !/^#[0-9a-f]{6}$/i.test(c.hex) || typeof c.available !== 'boolean') throw Error('Each color needs a name, a valid swatch, and an availability setting.');
    if (ids.has(c.id) || names.has(c.name.trim().toLowerCase())) throw Error('Give each color a different name.');
    ids.add(c.id); names.add(c.name.trim().toLowerCase());
    return {id:c.id,name:c.name.trim(),hex:c.hex.toLowerCase(),available:c.available};
  });
  if (value.enabled && !colors.some(c=>c.available)) throw Error('Make at least one color available before opening orders.');
  return {enabled:value.enabled,colors};
}
export function selectionMessage(sizeId, selected, colors) {
  const size = SIZES.find(s=>s.id===sizeId);
  if (!size) return 'Choose a bouquet size.';
  if (new Set(selected).size !== selected.length || selected.some(id=>!colors.some(c=>c.id===id && c.available))) return 'One of your colors is no longer available. Please update your palette.';
  if (selected.length < size.min) return `Choose ${size.min-selected.length} more color${size.min-selected.length===1?'':'s'} to complete your ${size.name}.`;
  if (selected.length > size.max) return `Remove ${selected.length-size.max} color${selected.length-size.max===1?'':'s'} for ${size.name}, or choose a larger bouquet.`;
  return '';
}
export function bouquetVariant(products, sizeId) {
  const size = SIZES.find(s=>s.id===sizeId);
  const product = products.find(p=>p.handle==='bespoke-bouquet');
  if (!size || !product?.availableForSale) return null;
  return product.variants.nodes.find(v=>v.title.toLowerCase()===size.id && v.availableForSale && v.price.currencyCode==='USD' && Number(v.price.amount)===size.price) || null;
}
