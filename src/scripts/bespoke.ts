import paletteData from '@/content/bespoke-palette.json';
import {SIZES,selectionMessage,bouquetVariant,validatePalette,defaultSize} from '../../public/editor-assets/bespoke-model.js';
import {loadProducts,checkout} from '@/lib/shopify.mjs';
import {askFulfillment} from './fulfillment';
import {squish,shake,bump,tweenPrice,swapArrangement,entrance,paintBlooms,celebrate,pointIn,throwPaint,syncList} from './bouquet-motion';
const $ = <T extends HTMLElement = HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
let palette=paletteData, sizeId=defaultSize(paletteData.colors).id, selected:string[]=[], busy=false;
const button=$<HTMLButtonElement>('#bouquet-checkout');
const swatches=[...document.querySelectorAll<HTMLButtonElement>('[data-color]')];
// Reuse the arrangement drawing for the small and enlarged previews.
for (const target of ['#mini-art', '#expanded-art']) $(target).append(document.querySelector('.flower-art svg')!.cloneNode(true));
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
const mainArt = document.querySelector<SVGSVGElement>('.composition .flower-art svg')!;
// The bouquet drawing the visitor can see right now, if any.
function visibleArt() {
  if (previewDialog.open) return $('#expanded-art').querySelector('svg')!;
  const art = mainArt.getBoundingClientRect(), top = siteHeader.getBoundingClientRect().bottom;
  if (art.bottom - art.height * .35 > top && art.top + art.height * .35 < innerHeight) return mainArt;
  return miniPreview.classList.contains('is-visible') ? $('#mini-art').querySelector('svg')! : null;
}
// Spreads the chosen colors so neighboring blooms differ, the biggest blooms
// show every color first, and each color appears about equally often.
const slotCache=new Map<string,number[]>();
function colorSlot(bloom:SVGGElement,count:number){
  if(count<2)return 0;
  const group=bloom.closest('[data-arrangement]')!, key=`${group.getAttribute('data-arrangement')}:${count}`;
  if(!slotCache.has(key)){
    const blooms=[...group.querySelectorAll<SVGGElement>('.bloom')].map(b=>({i:Number(b.dataset.bloom),x:Number(b.dataset.x),y:Number(b.dataset.y),s:Number(b.dataset.s)})).sort((a,b)=>b.s-a.s);
    const slots:number[]=[], uses=Array(count).fill(0);
    for(const b of blooms){
      const cost=(slot:number)=>uses[slot]*10+blooms.reduce((sum,o)=>slots[o.i]===slot?sum+30*(90/Math.hypot(o.x-b.x,o.y-b.y))**2:sum,0);
      const slot=[...uses.keys()].reduce((best,slot)=>cost(slot)<cost(best)?slot:best,0);
      slots[b.i]=slot;uses[slot]++;
    }
    slotCache.set(key,slots);
  }
  return slotCache.get(key)![Number(bloom.dataset.bloom)];
}
let shownSize=sizeId, wasReady=false, wasCheckoutReady=false, lastCount=0, firstRender=true;
type Color=typeof palette.colors[number];
// `cheer` is when a celebration should start, timed so the bouquet's hop and
// petal toss burst out together with the blooms rather than after them.
function render(motion:{delay?:number,origin?:[number,number],cheer?:number}={}) {
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
  if(shownSize!==sizeId){swapArrangement(shownSize,sizeId);shownSize=sizeId;}
  paintBlooms(bloom=>colors[colorSlot(bloom,colors.length)]?.hex,motion);
  const dot=(c:Color)=>{const el=document.createElement('span');el.style.background=c.hex;return el;};
  syncList($('#palette-ribbon'),colors,c=>c.id,dot);
  syncList($('#mini-dots'),colors,c=>c.id,dot);
  $('#summary-size').textContent=`${size.name} · Bespoke Bouquet`;
  tweenPrice($('#summary-price'),size.price);
  syncList($('#chosen-colors'),colors,c=>c.id,c=>{const chip=document.createElement('button');chip.type='button';chip.className='color-chip';chip.textContent=`${c.name} ×`;chip.setAttribute('aria-label',`Remove ${c.name}`);chip.onclick=()=>{removeColor(c.id);swatches.find(s=>s.dataset.color===c.id)?.focus();};return chip;},(chip)=>{(chip as HTMLButtonElement).disabled=busy;});
  if(selected.length!==lastCount&&!firstRender)bump($('#color-count'));
  lastCount=selected.length;
  button.disabled=busy||!!message||!palette.enabled;
  // Celebrate the moment the palette becomes complete enough to order.
  const ready=!message&&selected.length>0;
  if(ready&&!wasReady&&!firstRender){const art=visibleArt();if(art)setTimeout(()=>celebrate(art,colors.map(c=>c.hex)),motion.cheer??Math.max(0,motion.delay??0)+140);}
  if(!button.disabled&&!wasCheckoutReady&&!firstRender)setTimeout(()=>squish(button,1.08),Math.max(0,motion.delay??0)+160);
  wasReady=ready;wasCheckoutReady=!button.disabled;firstRender=false;
  button.textContent=busy?'Opening checkout…':message?'Choose your colors':!palette.enabled?'Ordering opens soon':`Checkout · $${size.price} ↗`;
}
const paintOf=(id:string)=>swatches.find(s=>s.dataset.color===id)?.querySelector('.paint') ?? null;
const hexOf=(id:string)=>palette.colors.find(c=>c.id===id)?.hex ?? '#e3d8cd';
// Removing a color sends a drop back from the bouquet to its paint pot.
function removeColor(id:string){
  selected=selected.filter(c=>c!==id);
  $('#checkout-feedback').textContent='';
  const art=visibleArt(), paint=paintOf(id);
  if(art&&paint){const from=pointIn(art,205,180);throwPaint({x:from.x,y:from.y,width:22},paint.getBoundingClientRect(),hexOf(id),()=>squish(paint,1.1));}
  render();
}
swatches.forEach(s=>s.onclick=()=>{
  const id=s.dataset.color!;const size=SIZES.find(s=>s.id===sizeId)!;const paint=s.querySelector('.paint');
  if(selected.includes(id)){removeColor(id);return;}
  if(selected.length>=size.max){$('#palette-feedback').textContent=`${size.name} has room for ${size.max} colors. Remove one to try another.`;shake(paint);return;}
  selected.push(id);
  $('#checkout-feedback').textContent='';
  squish(paint);
  // A drop of the color arcs over to the bouquet, and the blooms change as it lands.
  const art=visibleArt();
  const delay=art&&paint?Math.max(0,throwPaint(paint.getBoundingClientRect(),pointIn(art,205,180),hexOf(id))-170):0;
  render({delay,origin:[205,180]});
});
document.querySelectorAll<HTMLInputElement>('[name=size]').forEach(input=>input.onchange=()=>{sizeId=input.value;$('#checkout-feedback').textContent='';squish(input.nextElementSibling,1.06);render({origin:[211,321],cheer:220});});
$('#clear-colors').onclick=()=>{selected=[];render({origin:[211,321]});swatches.find(s=>!s.disabled)?.focus();};
button.onclick=async()=>{
  const fulfillment=await askFulfillment();
  if(!fulfillment||busy)return;
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
    location.assign(await checkout(variant.id,fetch,[{key:'Bouquet size',value:size.name},{key:'Color palette',value:colors}],fulfillment));
  }catch(error){$('#checkout-feedback').textContent=error instanceof Error?error.message:'Checkout couldn’t open. Please try again.';busy=false;render();}
};
render();
entrance(mainArt);
