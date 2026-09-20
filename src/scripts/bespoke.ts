import paletteData from '@/content/bespoke-palette.json';
import {SIZES,selectionMessage,bouquetVariant,validatePalette,defaultSize} from '../../public/editor-assets/bespoke-model.js';
import {loadProducts,checkout} from '@/lib/shopify.mjs';
const $ = <T extends HTMLElement = HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
let palette=paletteData, sizeId=defaultSize(paletteData.colors).id, selected:string[]=[], busy=false;
const button=$<HTMLButtonElement>('#bouquet-checkout');
const swatches=[...document.querySelectorAll<HTMLButtonElement>('[data-color]')];
// Reuse the arrangement drawing, with unique SVG references for each preview.
for (const [target, suffix] of [['#mini-art', 'mini'], ['#expanded-art', 'expanded']]) {
  const art = document.querySelector('.flower-art svg')!.cloneNode(true) as SVGElement;
  art.querySelector('#petal')!.id = `petal-${suffix}`;
  art.querySelectorAll('use').forEach(petal => petal.setAttribute('href', `#petal-${suffix}`));
  $(target).append(art);
}
const miniPreview = $('#mini-preview');
miniPreview.hidden = false;
miniPreview.inert = true;
const previewDialog = $<HTMLDialogElement>('#preview-dialog');
$('#mini-preview').onclick = () => previewDialog.showModal();
const siteHeader = $('.site-header');
const largePreview = $('.composition .flower-art');
const paletteStage = $('.palette-stage');
const mobilePreview = matchMedia('(max-width:760px)');
function updateMiniPreview() {
  const headerBottom = siteHeader.getBoundingClientRect().bottom;
  const stage = paletteStage.getBoundingClientRect();
  const drawing = largePreview.getBoundingClientRect();
  const visible = mobilePreview.matches
    && drawing.top + drawing.height * .5 <= headerBottom
    && stage.bottom > headerBottom + 124;
  miniPreview.classList.toggle('is-visible', visible);
  miniPreview.inert = !visible;
  miniPreview.setAttribute('aria-hidden', String(!visible));
  document.documentElement.style.setProperty('--bouquet-header-height', `${headerBottom}px`);
  miniPreview.style.left = `${stage.left}px`;
  miniPreview.style.width = `${stage.width}px`;
}
let previewFrame = 0;
function schedulePreviewUpdate() {
  if (previewFrame) return;
  previewFrame = requestAnimationFrame(() => { previewFrame = 0; updateMiniPreview(); });
}
addEventListener('scroll', schedulePreviewUpdate, {passive:true});
addEventListener('resize', schedulePreviewUpdate);
const previewResize = new ResizeObserver(schedulePreviewUpdate);
[siteHeader, largePreview, paletteStage].forEach(element => previewResize.observe(element));
updateMiniPreview();
function render() {
  const size=SIZES.find(s=>s.id===sizeId)!;
  const colors=selected.map(id=>palette.colors.find(c=>c.id===id)).filter((c): c is typeof palette.colors[number]=>!!c);
  const availableCount=palette.colors.filter(c=>c.available).length;
  const message=availableCount<size.min?'There aren’t enough colors for this size today. Please choose a smaller bouquet or check back soon.':selectionMessage(sizeId,selected,palette.colors);
  $('#size-story').textContent=size.description;
  $('#color-instruction').textContent=`Pick ${size.min}–${size.max} colors. Trust your eye.`;
  $('#color-count').textContent=`${selected.length} selected`;
  $('#palette-feedback').textContent=message || (selected.length<size.max?'Beautiful together. Keep it here, or add one more.':'Your color story is complete.');
  for(const swatch of swatches){const color=palette.colors.find(c=>c.id===swatch.dataset.color);swatch.disabled=busy || (!color?.available&&!selected.includes(swatch.dataset.color!));swatch.setAttribute('aria-pressed',String(selected.includes(swatch.dataset.color!)));}
  document.querySelectorAll<HTMLInputElement>('[name=size]').forEach(input=>{
    const option=SIZES.find(s=>s.id===input.value)!;
    input.checked=input.value===sizeId;
    input.disabled=busy||availableCount<option.min;
    $(`[data-size-help="${option.id}"]`).textContent=availableCount<option.min?'Resting for now':`${option.min}–${option.max} colors`;
  });
  $('#clear-colors').hidden=!selected.length;
  $<HTMLButtonElement>('#clear-colors').disabled=busy;
  $('#mini-title').textContent=`Your ${size.name}`;
  $('#mini-count').textContent=`${selected.length} of ${size.max} colors · pick ${size.min}–${size.max}`;
  $('#mini-dots').replaceChildren(...colors.map(c=>{const dot=document.createElement('span');dot.style.background=c.hex;return dot;}));
  $('#expanded-caption').textContent=colors.length?colors.map(c=>c.name).join(' + '):'A blank canvas. Make it yours.';
  $('#preview-dialog-title').textContent=`Your ${size.name}`;
  $('#art-title').textContent=`Your ${size.name}`;
  $('#art-caption').textContent=colors.length?colors.map(c=>c.name).join(' + '):'A blank canvas. Make it yours.';
  document.querySelectorAll<SVGElement>('[data-arrangement]').forEach(arrangement=>{
    arrangement.setAttribute('display',arrangement.dataset.arrangement===sizeId?'inline':'none');
    arrangement.querySelectorAll<SVGElement>('[data-bloom]').forEach((b,i)=>{
      b.style.fill=colors.length?colors[i%colors.length].hex:'#e3d8cd';
    });
  });
  $('#palette-ribbon').replaceChildren(...colors.map(c=>{const el=document.createElement('span');el.style.background=c.hex;return el;}));
  $('#summary-size').textContent=`${size.name} · Bespoke Bouquet`;
  $('#summary-price').textContent=`$${size.price}`;
  const chips=colors.map(c=>{const chip=document.createElement('button');chip.type='button';chip.className='color-chip';chip.textContent=`${c.name} ×`;chip.setAttribute('aria-label',`Remove ${c.name}`);chip.disabled=busy;chip.onclick=()=>{selected=selected.filter(id=>id!==c.id);render();swatches.find(s=>s.dataset.color===c.id)?.focus();};return chip;});
  $('#chosen-colors').replaceChildren(...chips);
  if(!chips.length)$('#chosen-colors').textContent='No colors chosen yet.';
  button.disabled=busy||!!message||!palette.enabled;
  button.textContent=busy?'Opening checkout…':message?'Choose your colors':!palette.enabled?'Ordering opens soon':`Checkout · $${size.price} ↗`;
}
swatches.forEach(s=>s.onclick=()=>{
  const id=s.dataset.color!;const size=SIZES.find(s=>s.id===sizeId)!;
  if(selected.includes(id))selected=selected.filter(c=>c!==id);
  else if(selected.length>=size.max){$('#palette-feedback').textContent=`${size.name} has room for ${size.max} colors. Remove one to try another.`;return;}
  else selected.push(id);
  $('#checkout-feedback').textContent='';render();
});
document.querySelectorAll<HTMLInputElement>('[name=size]').forEach(input=>input.onchange=()=>{sizeId=input.value;$('#checkout-feedback').textContent='';render();});
$('#clear-colors').onclick=()=>{selected=[];render();swatches.find(s=>!s.disabled)?.focus();};
button.onclick=async()=>{
  busy=true;render();$('#checkout-feedback').textContent='Checking your colors and bouquet availability…';
  try {
    const response=await fetch(`/bespoke-palette.json?check=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw Error('We couldn’t check the current palette. Please try again.');
    palette=validatePalette(await response.json());
    if(!palette.enabled)throw Error('Bespoke Bouquet orders are paused. Please check back soon.');
    const issue=selectionMessage(sizeId,selected,palette.colors);if(issue)throw Error(issue);
    const variant=bouquetVariant(await loadProducts(),sizeId);
    if(!variant)throw Error('This bouquet size isn’t available to order right now. Please try another size or check back soon.');
    const size=SIZES.find(s=>s.id===sizeId)!;
    const colors=selected.map(id=>palette.colors.find(c=>c.id===id)!.name).join(', ');
    location.assign(await checkout(variant.id,fetch,[{key:'Bouquet size',value:size.name},{key:'Color palette',value:colors}]));
  }catch(error){$('#checkout-feedback').textContent=error instanceof Error?error.message:'Checkout couldn’t open. Please try again.';busy=false;render();}
};
render();
