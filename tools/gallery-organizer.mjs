import { createServer } from 'node:http';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const orderFile = join(projectRoot, 'src/content/gallery-order.json');
const shopFile = join(projectRoot, 'src/content/shop-items.json');
const imageDirectory = join(projectRoot, 'public/images/gallery-web');
const port = 4322;

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daisy Hatchet Gallery Organizer</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Danfo&display=swap');
:root{--ink:#29151f;--cream:#fffaf4;--pink:#f52f97;--lime:#b0fe3d}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--cream);font-family:'DM Sans',sans-serif}.bar{position:sticky;z-index:5;top:0;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:1rem clamp(1rem,4vw,3rem);color:var(--cream);background:rgba(41,21,31,.95);backdrop-filter:blur(12px)}h1{margin:0;font:400 clamp(1.8rem,4vw,3rem)/1 'Danfo',serif;letter-spacing:.01em}.actions{display:flex;align-items:center;gap:.7rem}button,a{min-height:2.75rem;padding:.65rem 1rem;border:1px solid rgba(255,255,255,.25);border-radius:999px;font:600 .75rem/1 'DM Sans',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}.save,.add{color:var(--ink);background:var(--lime);border-color:var(--lime)}.preview{display:grid;place-items:center;color:var(--cream);text-decoration:none}.intro{display:flex;justify-content:space-between;gap:2rem;padding:2.25rem clamp(1rem,4vw,3rem) 1rem}.intro p{max-width:42rem;margin:0;color:#66515b}.status{font-weight:600;color:#696a42}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:clamp(.8rem,2vw,1.5rem);padding:1.5rem clamp(1rem,4vw,3rem) 2rem}.tile{position:relative;margin:0;padding:.55rem;background:#fff;border:1px solid #e5dbe0;border-radius:.85rem;box-shadow:0 .5rem 1.5rem rgba(41,21,31,.07);cursor:grab;transition:transform .18s ease,box-shadow .18s ease}.tile:hover{transform:translateY(-3px);box-shadow:0 .9rem 2rem rgba(41,21,31,.12)}.tile.dragging{opacity:.35}.tile.drop-target{outline:3px solid var(--pink);outline-offset:3px}.tile img{width:100%;aspect-ratio:1;display:block;object-fit:cover;border-radius:.55rem}.meta{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.65rem .2rem .1rem}.number{font-weight:600}.moves{display:flex;gap:.3rem}.moves button{min-width:2rem;min-height:2rem;padding:.25rem;color:var(--ink);background:var(--cream);border-color:#d9ccd2}.moves .remove{width:auto;padding:.25rem .55rem;color:#9d285f;border-color:#e2b6ca}.moves button:disabled{opacity:.25;cursor:not-allowed}.bottom{padding:0 clamp(1rem,4vw,3rem) 5rem}.add{border:0}.picker{width:min(58rem,calc(100% - 2rem));max-height:calc(100dvh - 2rem);padding:0;border:0;border-radius:1rem;background:var(--cream);box-shadow:0 2rem 6rem rgba(41,21,31,.35)}.picker::backdrop{background:rgba(41,21,31,.72);backdrop-filter:blur(6px)}.picker-head{position:sticky;z-index:2;top:0;display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:var(--cream);border-bottom:1px solid #e5dbe0}.picker-head h2{margin:0;font-size:1.1rem}.picker-close{width:2.6rem;min-height:2.6rem;padding:0;color:var(--ink);background:#fff;border-color:#d9ccd2;font-size:1.4rem}.picker-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem;padding:1rem}.picker-option{min-height:0;padding:.25rem;background:#fff;border:2px solid transparent;border-radius:.65rem}.picker-option:hover,.picker-option:focus-visible{border-color:var(--pink)}.picker-option img{width:100%;aspect-ratio:1;display:block;object-fit:cover;border-radius:.4rem}.empty{padding:2rem;color:#66515b;text-align:center}@media(max-width:600px){.bar,.intro{align-items:flex-start;flex-direction:column}.actions{width:100%;flex-wrap:wrap}.actions>*{flex:1}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.picker-grid{grid-template-columns:repeat(3,minmax(0,1fr)}}
</style></head><body>
<header class="bar"><h1>Gallery Organizer</h1><div class="actions"><a class="preview" href="/shop">Manage shop</a><a class="preview" href="http://127.0.0.1:4321/gallery" target="_blank">Preview gallery ↗</a><button class="save" type="button">Save order</button></div></header>
<div class="intro"><p>Drag photos into place, add ready-to-use photos from the folder, or remove a photo. Saving updates the local website immediately; it does not publish anything.</p><span class="status" aria-live="polite">Loading…</span></div>
<main class="grid"></main><div class="bottom"><button class="add" type="button">+ Add photo</button></div>
<dialog class="picker" aria-label="Choose a gallery photo"><div class="picker-head"><h2>Add a photo</h2><button class="picker-close" type="button" aria-label="Close photo picker">×</button></div><div class="picker-grid"></div></dialog>
<script>
const grid=document.querySelector('.grid'),status=document.querySelector('.status'),save=document.querySelector('.save'),add=document.querySelector('.add'),picker=document.querySelector('.picker'),pickerGrid=document.querySelector('.picker-grid');let order=[],photos=[],dragged='';
const render=()=>{grid.innerHTML='';order.forEach((file,index)=>{const tile=document.createElement('figure');tile.className='tile';tile.draggable=true;tile.dataset.file=file;tile.innerHTML='<img src="/images/'+encodeURIComponent(file)+'" alt="Gallery photo '+(index+1)+'"><div class="meta"><span class="number">'+String(index+1).padStart(2,'0')+'</span><span class="moves"><button type="button" data-move="-1" aria-label="Move photo '+(index+1)+' earlier">←</button><button type="button" data-move="1" aria-label="Move photo '+(index+1)+' later">→</button><button class="remove" type="button" data-remove aria-label="Remove photo '+(index+1)+'">Remove</button></span></div>';tile.querySelector('[data-move="-1"]').disabled=index===0;tile.querySelector('[data-move="1"]').disabled=index===order.length-1;grid.append(tile)});};
const markChanged=()=>{status.textContent='Unsaved changes';status.style.color='#f52f97'};
const openPicker=()=>{const available=photos.filter(file=>!order.includes(file));pickerGrid.innerHTML=available.length?available.map((file,index)=>'<button class="picker-option" type="button" data-photo="'+file+'" aria-label="Add photo '+(index+1)+'"><img src="/images/'+encodeURIComponent(file)+'" alt="Photo option '+(index+1)+'"></button>').join(''):'<p class="empty">All available photos are already in the gallery.</p>';picker.showModal()};
grid.addEventListener('click',event=>{const tile=event.target.closest('.tile');if(!tile)return;if(event.target.closest('[data-remove]')){order=order.filter(file=>file!==tile.dataset.file);render();markChanged();return}const button=event.target.closest('[data-move]');if(!button)return;const from=order.indexOf(tile.dataset.file),to=from+Number(button.dataset.move);if(to<0||to>=order.length)return;[order[from],order[to]]=[order[to],order[from]];render();markChanged()});
grid.addEventListener('dragstart',event=>{const tile=event.target.closest('.tile');if(!tile)return;dragged=tile.dataset.file;tile.classList.add('dragging');event.dataTransfer.effectAllowed='move'});grid.addEventListener('dragend',()=>{dragged='';document.querySelectorAll('.tile').forEach(tile=>tile.classList.remove('dragging','drop-target'))});grid.addEventListener('dragover',event=>{event.preventDefault();const tile=event.target.closest('.tile');document.querySelectorAll('.drop-target').forEach(item=>item.classList.remove('drop-target'));if(tile&&tile.dataset.file!==dragged)tile.classList.add('drop-target')});grid.addEventListener('drop',event=>{event.preventDefault();const tile=event.target.closest('.tile');if(!tile||!dragged||tile.dataset.file===dragged)return;const from=order.indexOf(dragged),to=order.indexOf(tile.dataset.file);order.splice(to,0,order.splice(from,1)[0]);render();markChanged()});
add.addEventListener('click',openPicker);pickerGrid.addEventListener('click',event=>{const option=event.target.closest('[data-photo]');if(!option)return;order.push(option.dataset.photo);picker.close();render();markChanged();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});document.querySelector('.picker-close').addEventListener('click',()=>picker.close());picker.addEventListener('click',event=>{if(event.target===picker)picker.close()});
save.addEventListener('click',async()=>{save.disabled=true;status.textContent='Saving…';const response=await fetch('/api/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(order)});if(response.ok){status.textContent='Saved — refresh the gallery';status.style.color='#696a42'}else{status.textContent='Could not save';status.style.color='#b4235a'}save.disabled=false});
Promise.all([fetch('/api/order').then(response=>response.json()),fetch('/api/photos').then(response=>response.json())]).then(([saved,files])=>{order=saved;photos=files;render();status.textContent='Order is saved'}).catch(()=>status.textContent='Could not load photos');
</script></body></html>`;

const shopPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daisy Hatchet Shop Manager</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Danfo&display=swap');
:root{--ink:#29151f;--cream:#fffaf4;--pink:#f52f97;--lime:#b0fe3d}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--cream);font-family:'DM Sans',sans-serif}.bar{position:sticky;z-index:5;top:0;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:1rem clamp(1rem,4vw,3rem);color:var(--cream);background:rgba(41,21,31,.95);backdrop-filter:blur(12px)}h1{margin:0;font:400 clamp(1.8rem,4vw,3rem)/1 'Danfo',serif}.actions{display:flex;align-items:center;gap:.7rem}button,a{min-height:2.75rem;padding:.65rem 1rem;border:1px solid rgba(255,255,255,.25);border-radius:999px;font:600 .75rem/1 'DM Sans',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}.save,.add{color:var(--ink);background:var(--lime);border-color:var(--lime)}.preview{display:grid;place-items:center;color:var(--cream);text-decoration:none}.intro{display:flex;justify-content:space-between;gap:2rem;padding:2.25rem clamp(1rem,4vw,3rem) 1rem}.intro p{max-width:43rem;margin:0;color:#66515b}.status{font-weight:600;color:#696a42}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;padding:1.5rem clamp(1rem,4vw,3rem) 2rem}.card{margin:0;padding:.7rem;background:#fff;border:1px solid #e5dbe0;border-radius:.9rem;box-shadow:0 .5rem 1.5rem rgba(41,21,31,.07);cursor:grab}.card.dragging{opacity:.35}.card.drop-target{outline:3px solid var(--pink);outline-offset:3px}.image-picker{position:relative;width:100%;min-height:0;padding:0;overflow:hidden;background:#eee;border:0;border-radius:.6rem}.image-picker img{width:100%;aspect-ratio:1;display:block;object-fit:cover}.image-picker span{position:absolute;right:.65rem;bottom:.65rem;padding:.5rem .7rem;color:#fff;background:rgba(41,21,31,.82);border-radius:999px}.fields{display:grid;grid-template-columns:1fr 6.5rem;gap:.7rem;margin-top:.8rem}.field{display:grid;gap:.35rem;color:#66515b;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}.field:first-child,.url-field{grid-column:1/-1}input{width:100%;min-height:2.6rem;padding:.55rem .65rem;color:var(--ink);background:var(--cream);border:1px solid #d9ccd2;border-radius:.45rem;font:500 .95rem 'DM Sans',sans-serif}.card-footer{display:flex;align-items:center;justify-content:space-between;gap:.7rem;margin-top:.8rem}.available{display:flex;align-items:center;gap:.5rem;color:#66515b;font-size:.8rem}.available input{width:1.1rem;min-height:auto;accent-color:var(--pink)}.remove{min-height:2.2rem;padding:.45rem .7rem;color:#9d285f;background:transparent;border-color:#e2b6ca}.bottom{padding:0 clamp(1rem,4vw,3rem) 5rem}.add{border:0}.picker{width:min(58rem,calc(100% - 2rem));max-height:calc(100dvh - 2rem);padding:0;border:0;border-radius:1rem;background:var(--cream);box-shadow:0 2rem 6rem rgba(41,21,31,.35)}.picker::backdrop{background:rgba(41,21,31,.72);backdrop-filter:blur(6px)}.picker-head{position:sticky;z-index:2;top:0;display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:var(--cream);border-bottom:1px solid #e5dbe0}.picker-head h2{margin:0;font-size:1.1rem}.picker-close{width:2.6rem;min-height:2.6rem;padding:0;color:var(--ink);background:#fff;border-color:#d9ccd2;font-size:1.4rem}.picker-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem;padding:1rem}.picker-option{min-height:0;padding:.25rem;background:#fff;border:2px solid transparent;border-radius:.65rem}.picker-option:hover,.picker-option:focus-visible{border-color:var(--pink)}.picker-option.selected{border-color:var(--lime);box-shadow:0 0 0 2px var(--ink)}.picker-option img{width:100%;aspect-ratio:1;display:block;object-fit:cover;border-radius:.4rem}@media(max-width:700px){.bar,.intro{align-items:flex-start;flex-direction:column}.actions{width:100%;flex-wrap:wrap}.grid{grid-template-columns:1fr}.picker-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style></head><body>
<header class="bar"><h1>Shop Manager</h1><div class="actions"><a class="preview" href="/">Manage gallery</a><a class="preview" href="http://127.0.0.1:4321/shop" target="_blank">Preview shop ↗</a><button class="save" type="button">Save shop</button></div></header>
<div class="intro"><p>Edit arrangement names, prices, photos, and availability. Drag cards to change their order. Saving updates the local website only.</p><span class="status" aria-live="polite">Loading…</span></div>
<main class="grid"></main><div class="bottom"><button class="add" type="button">+ Add arrangement</button></div>
<dialog class="picker" aria-label="Choose an arrangement photo"><div class="picker-head"><h2>Choose a photo</h2><button class="picker-close" type="button" aria-label="Close photo picker">×</button></div><div class="picker-grid"></div></dialog>
<script>
const grid=document.querySelector('.grid'),status=document.querySelector('.status'),save=document.querySelector('.save'),add=document.querySelector('.add'),picker=document.querySelector('.picker'),pickerGrid=document.querySelector('.picker-grid');let items=[],photos=[],dragged='',editingId='';
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const markChanged=()=>{status.textContent='Unsaved changes';status.style.color='#f52f97'};
const render=()=>{grid.innerHTML='';items.forEach((item,index)=>{const card=document.createElement('article');card.className='card';card.draggable=true;card.dataset.id=item.id;card.innerHTML='<button class="image-picker" type="button" aria-label="Choose photo for '+esc(item.name)+'"><img src="/images/'+encodeURIComponent(item.image)+'" alt=""><span>Change photo</span></button><div class="fields"><label class="field">Arrangement name<input data-field="name" value="'+esc(item.name)+'"></label><label class="field">Price<input data-field="price" type="number" min="0" step="1" value="'+Number(item.price)+'"></label><label class="field url-field">Purchase website <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span><input data-field="purchaseUrl" type="url" placeholder="https://…" value="'+esc(item.purchaseUrl||'')+'"></label></div><div class="card-footer"><label class="available"><input data-field="available" type="checkbox" '+(item.available?'checked':'')+'> Available</label><button class="remove" type="button">Remove</button></div>';grid.append(card)});};
const openPicker=id=>{editingId=id;const item=items.find(entry=>entry.id===id);pickerGrid.innerHTML=photos.map((file,index)=>'<button class="picker-option '+(file===item.image?'selected':'')+'" type="button" data-photo="'+esc(file)+'" aria-label="Use photo '+(index+1)+'"><img src="/images/'+encodeURIComponent(file)+'" alt="Photo option '+(index+1)+'"></button>').join('');picker.showModal()};
grid.addEventListener('input',event=>{const card=event.target.closest('.card'),field=event.target.dataset.field;if(!card||!field)return;const item=items.find(entry=>entry.id===card.dataset.id);if(field==='available')item[field]=event.target.checked;else if(field==='price')item[field]=Number(event.target.value);else item[field]=event.target.value;if(field==='image')card.querySelector('img').src='/images/'+encodeURIComponent(event.target.value);markChanged()});
grid.addEventListener('click',event=>{const card=event.target.closest('.card');if(!card)return;if(event.target.closest('.image-picker')){openPicker(card.dataset.id);return}const button=event.target.closest('.remove');if(!button)return;items=items.filter(item=>item.id!==card.dataset.id);render();markChanged()});
pickerGrid.addEventListener('click',event=>{const option=event.target.closest('[data-photo]');if(!option)return;const item=items.find(entry=>entry.id===editingId);if(!item)return;item.image=option.dataset.photo;picker.close();render();markChanged()});document.querySelector('.picker-close').addEventListener('click',()=>picker.close());picker.addEventListener('click',event=>{if(event.target===picker)picker.close()});
grid.addEventListener('dragstart',event=>{const card=event.target.closest('.card');if(!card)return;dragged=card.dataset.id;card.classList.add('dragging');event.dataTransfer.effectAllowed='move'});grid.addEventListener('dragend',()=>{dragged='';document.querySelectorAll('.card').forEach(card=>card.classList.remove('dragging','drop-target'))});grid.addEventListener('dragover',event=>{event.preventDefault();const card=event.target.closest('.card');document.querySelectorAll('.drop-target').forEach(item=>item.classList.remove('drop-target'));if(card&&card.dataset.id!==dragged)card.classList.add('drop-target')});grid.addEventListener('drop',event=>{event.preventDefault();const card=event.target.closest('.card');if(!card||!dragged||card.dataset.id===dragged)return;const from=items.findIndex(item=>item.id===dragged),to=items.findIndex(item=>item.id===card.dataset.id);items.splice(to,0,items.splice(from,1)[0]);render();markChanged()});
add.addEventListener('click',()=>{items.push({id:'arrangement-'+Date.now(),name:'New arrangement',price:40,image:photos[0],available:true,purchaseUrl:''});render();markChanged();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
save.addEventListener('click',async()=>{save.disabled=true;status.textContent='Saving…';const response=await fetch('/api/shop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(items)});if(response.ok){status.textContent='Saved — refresh the shop';status.style.color='#696a42'}else{status.textContent='Could not save';status.style.color='#b4235a'}save.disabled=false});
Promise.all([fetch('/api/shop').then(r=>r.json()),fetch('/api/order').then(r=>r.json())]).then(([saved,files])=>{items=saved;photos=files;render();status.textContent='Shop is saved'}).catch(()=>status.textContent='Could not load shop');
</script></body></html>`;

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    if (request.method === 'GET' && url.pathname === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return response.end(page);
    }
    if (request.method === 'GET' && url.pathname === '/shop') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return response.end(shopPage);
    }
    if (request.method === 'GET' && url.pathname === '/api/order') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      return response.end(await readFile(orderFile, 'utf8'));
    }
    if (request.method === 'GET' && url.pathname === '/api/photos') {
      const photos = (await readdir(imageDirectory)).filter((file) => /\.(jpe?g)$/i.test(file)).sort((a, b) => a.localeCompare(b));
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      return response.end(JSON.stringify(photos));
    }
    if (request.method === 'GET' && url.pathname === '/api/shop') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      return response.end(await readFile(shopFile, 'utf8'));
    }
    if (request.method === 'GET' && url.pathname.startsWith('/images/')) {
      const file = basename(decodeURIComponent(url.pathname.slice('/images/'.length)));
      const image = await readFile(join(imageDirectory, file));
      response.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' });
      return response.end(image);
    }
    if (request.method === 'POST' && url.pathname === '/api/order') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 100_000) throw new Error('Request too large');
      }
      const next = JSON.parse(body);
      const photos = (await readdir(imageDirectory)).filter((file) => /\.(jpe?g)$/i.test(file));
      const valid = Array.isArray(next) && next.length <= photos.length && new Set(next).size === next.length && next.every((file) => typeof file === 'string' && photos.includes(file));
      if (!valid) {
        response.writeHead(400, { 'content-type': 'application/json' });
        return response.end('{"error":"Invalid gallery order"}');
      }
      await writeFile(orderFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      response.writeHead(200, { 'content-type': 'application/json' });
      return response.end('{"saved":true}');
    }
    if (request.method === 'POST' && url.pathname === '/api/shop') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 100_000) throw new Error('Request too large');
      }
      const next = JSON.parse(body);
      const photos = JSON.parse(await readFile(orderFile, 'utf8'));
      const validUrl = (value) => typeof value === 'string' && (value === '' || /^https?:\/\//i.test(value));
      const valid = Array.isArray(next) && next.length <= 100 && new Set(next.map((item) => item.id)).size === next.length && next.every((item) => item && typeof item.id === 'string' && item.id.length > 0 && typeof item.name === 'string' && item.name.trim().length > 0 && Number.isFinite(item.price) && item.price >= 0 && photos.includes(item.image) && typeof item.available === 'boolean' && validUrl(item.purchaseUrl ?? ''));
      if (!valid) {
        response.writeHead(400, { 'content-type': 'application/json' });
        return response.end('{"error":"Invalid shop data"}');
      }
      await writeFile(shopFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      response.writeHead(200, { 'content-type': 'application/json' });
      return response.end('{"saved":true}');
    }
    response.writeHead(404);
    response.end('Not found');
  } catch (error) {
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Gallery Organizer: http://127.0.0.1:${port}`);
});
