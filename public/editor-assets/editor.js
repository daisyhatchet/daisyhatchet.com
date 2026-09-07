export {};
const $=selector=>document.querySelector(selector);
const kind=location.pathname.includes('/gallery')?'gallery':'shop';
let data=[],photos=[],sha='',dirty=false,busy=false,selection=null,uploads=new Map(),dragged=-1;
const grid=$('#grid'),statusEl=$('#status');
const photoURL=name=>uploads.has(name)?`data:image/jpeg;base64,${uploads.get(name)}`:`https://raw.githubusercontent.com/daisyhatchet/daisyhatchet.com/main/public/images/gallery-web/${encodeURIComponent(name)}`;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function changed(){dirty=true;statusEl.textContent='Unpublished changes';}
function lock(value){busy=value;grid.inert=value;for(const id of ['publish','add','upload','logout','reload'])$('#'+id).disabled=value;}
async function api(path,options={}){
  const response=await fetch('/api/editor/'+path,options);
  if(response.status===401){if(!$('#auth').open)$('#auth').showModal();throw new Error('Sign in again, then retry. Your edits are still here.');}
  if(response.status===429)throw new Error('Please wait a few minutes before trying again.');
  let result;try{result=await response.json();}catch{throw new Error('The server did not respond. Your edits are still in this tab.');}
  if(!response.ok){if(response.status===409)$('#reload').hidden=false;throw new Error(result.error||'Could not complete the request.');}return result;
}
const post=(path,payload)=>api(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
function render(){
  grid.innerHTML=data.map((item,index)=>{
    const image=kind==='gallery'?item:item.image;
    const content=kind==='gallery'?`<img src="${photoURL(image)}" alt="Gallery photo ${index+1}"><p>Photo ${index+1}</p>`:
      `<button class="image-picker" data-action="photo" aria-label="Choose photo for ${esc(item.name)}"><img src="${photoURL(image)}" alt=""><span>Change photo</span></button><div class="fields"><label class="field">Arrangement name<input data-field="name" value="${esc(item.name)}" maxlength="150"></label><label class="field">Price<input data-field="price" type="number" min="0" max="100000" step="0.01" value="${item.price}"></label><label class="field url-field">Purchase website (optional)<input data-field="purchaseUrl" type="url" value="${esc(item.purchaseUrl||'')}" placeholder="https://…"></label></div><label class="available"><input data-field="available" type="checkbox" ${item.available?'checked':''}>Available</label>`;
    return `<article class="card ${kind==='gallery'?'gallery-card':''}" draggable="true" data-index="${index}">${content}<div class="reorder"><button data-action="up" aria-label="Move earlier" ${index===0?'disabled':''}>←</button><button data-action="down" aria-label="Move later" ${index===data.length-1?'disabled':''}>→</button><button class="remove" data-action="remove">Remove</button></div></article>`;
  }).join('');
}
function move(from,to){if(to<0||to>=data.length||from===to)return;data.splice(to,0,data.splice(from,1)[0]);render();changed();}
grid.addEventListener('input',event=>{const card=event.target.closest('[data-index]'),field=event.target.dataset.field;if(!card||!field)return;data[Number(card.dataset.index)][field]=field==='available'?event.target.checked:field==='price'?Number(event.target.value):event.target.value;changed();});
grid.addEventListener('click',event=>{const card=event.target.closest('[data-index]'),button=event.target.closest('[data-action]');if(!card||!button)return;const i=Number(card.dataset.index);switch(button.dataset.action){case 'up':move(i,i-1);break;case 'down':move(i,i+1);break;case 'remove':data.splice(i,1);render();changed();break;case 'photo':openPicker(i);}});
grid.addEventListener('dragstart',event=>{if(event.target.closest('input'))return event.preventDefault();const card=event.target.closest('[data-index]');if(card)dragged=Number(card.dataset.index);});
grid.addEventListener('dragover',event=>event.preventDefault());grid.addEventListener('drop',event=>{event.preventDefault();const card=event.target.closest('[data-index]');if(card&&dragged>=0)move(dragged,Number(card.dataset.index));dragged=-1;});grid.addEventListener('dragend',()=>dragged=-1);
function openPicker(index=null){selection=index;const available=kind==='gallery'?photos.filter(p=>!data.includes(p)):photos;$('#picker-grid').innerHTML=available.map(p=>`<button class="picker-option" data-photo="${esc(p)}"><img src="${photoURL(p)}" alt="Choose photo" loading="lazy"></button>`).join('')||'<p>No unused photos. Use Upload photo to add one.</p>';$('#picker').showModal();}
$('#close-picker').onclick=()=>$('#picker').close();
$('#picker-grid').onclick=event=>{const button=event.target.closest('[data-photo]');if(!button)return;if(kind==='gallery')data.push(button.dataset.photo);else data[selection].image=button.dataset.photo;$('#picker').close();render();changed();};
$('#add').onclick=()=>{if(kind==='gallery')return openPicker();if(!photos.length){statusEl.textContent='Upload a photo first.';return;}data.push({id:'arrangement-'+crypto.randomUUID(),name:'New arrangement',price:40,image:photos[0],available:true,purchaseUrl:''});render();changed();grid.lastElementChild?.scrollIntoView({behavior:'smooth'});};
$('#upload').onclick=()=>$('#file').click();
async function smallJPEG(file){
  if(file.size>30_000_000)throw new Error('Choose a photo smaller than 30 MB.');
  let image;try{image=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('Your browser cannot open this photo. Export it as JPEG or choose a JPEG, PNG, or WebP photo.');}
  const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);image.close();return canvas.toDataURL('image/jpeg',.88).split(',')[1];
}
$('#file').onchange=async()=>{const file=$('#file').files[0];if(!file)return;lock(true);statusEl.textContent='Preparing photo…';try{const image=await smallJPEG(file);const result=await post('photo',{image});uploads.set(result.name,result.content);if(!photos.includes(result.name))photos.push(result.name);if(kind==='gallery'){if(!data.includes(result.name))data.push(result.name);}else{data.push({id:'arrangement-'+crypto.randomUUID(),name:'New arrangement',price:40,image:result.name,available:true,purchaseUrl:''});}render();changed();statusEl.textContent='Photo ready. Publish when you’re finished.';}catch(error){statusEl.textContent=error.message;}finally{$('#file').value='';lock(false);}};
$('#publish').onclick=async()=>{
  if([...grid.querySelectorAll('input')].some(input=>!input.reportValidity()))return;
  lock(true);statusEl.textContent='Publishing…';
  try{const used=new Set(kind==='gallery'?data:data.map(i=>i.image));const payload={kind,sha,data,uploads:[...uploads].filter(([name])=>used.has(name)).map(([name,content])=>({name,content}))};if(JSON.stringify(payload).length>3_900_000)throw new Error('Too many new photos at once. Remove some and publish a smaller batch.');const result=await post('publish',payload);sha=result.sha;dirty=false;statusEl.textContent=result.message;$('#reload').hidden=true;}catch(error){statusEl.textContent=error.message;}finally{lock(false);}
};
async function load(){lock(true);statusEl.textContent='Loading latest content…';try{const result=await api('data?kind='+kind);data=result.data;sha=result.sha;photos=result.photos;uploads.clear();dirty=false;render();statusEl.textContent='Up to date';$('#reload').hidden=true;}catch(error){statusEl.textContent=error.message;$('#reload').hidden=false;}finally{lock(false);if(!sha){$('#publish').disabled=$('#add').disabled=$('#upload').disabled=true;}}}
$('#reload').onclick=()=>{if(dirty&&!confirm('Discard the edits in this tab and load the latest published content?'))return;load();};
$('#logout').onclick=async()=>{if(dirty&&!confirm('Sign out and discard unpublished edits?'))return;try{await post('logout',{});dirty=false;location.reload();}catch(error){statusEl.textContent=error.message;}};
$('#auth-form').onsubmit=async event=>{event.preventDefault();try{await post('login',{password:$('#password').value});$('#password').value='';$('#auth').close();statusEl.textContent='Signed in. You can retry your last action.';if(!sha)load();}catch(error){$('#auth-error').textContent=error.message;}};
$('#cancel-auth').onclick=()=>$('#auth').close();
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();}});
for(const link of document.querySelectorAll('[data-editor]')){if(link.dataset.editor===kind)link.setAttribute('aria-current','page');link.onclick=event=>{if(busy||(dirty&&!confirm('Leave this editor and discard unpublished changes?')))event.preventDefault();else dirty=false;};}
$('#add').textContent=kind==='gallery'?'+ Add photo':'+ Add arrangement';$('#live-link').href=kind==='gallery'?'/gallery/':'/shop/';$('#intro').textContent=kind==='gallery'?'Add photos and drag them into order. Publish updates the live gallery.':'Edit arrangements, upload photos, and drag cards into order. Publish updates the live shop.';
const menuButton=$('#menu-toggle'),navigation=$('#editor-navigation'),mobile=matchMedia('(max-width: 900px)');
function setMenu(open,restoreFocus=false){
  const expanded=mobile.matches&&open;
  navigation.classList.toggle('is-open',expanded);
  $('#menu-backdrop').classList.toggle('is-open',expanded);
  document.body.classList.toggle('editor-menu-open',expanded);
  menuButton.setAttribute('aria-expanded',String(expanded));
  navigation.inert=mobile.matches&&!expanded;
  if(expanded)$('#menu-close').focus();else if(restoreFocus)menuButton.focus();
}
menuButton.onclick=()=>setMenu(true);
$('#menu-close').onclick=()=>setMenu(false,true);
$('#menu-backdrop').onclick=()=>setMenu(false,true);
window.addEventListener('keydown',event=>{
  if(!navigation.classList.contains('is-open'))return;
  if(event.key==='Escape')setMenu(false,true);
  if(event.key==='Tab'){
    const items=[...navigation.querySelectorAll('a,button:not(:disabled)')],first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
mobile.addEventListener('change',()=>setMenu(false));
navigation.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
setMenu(false);
load();
