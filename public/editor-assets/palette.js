import {validatePalette,SIZES} from './bespoke-model.js';
const $=s=>document.querySelector(s), local=document.body.dataset.local==='true';
let data={enabled:false,colors:[]},sha='',dirty=false,busy=false;
if(local){$('#local-note').hidden=false;$('#save').textContent='Save local draft';$('#preview-link').href=document.body.dataset.previewOrigin+'/shop/bespoke/';$('#publish-note').textContent='Save, then refresh the bouquet preview to see your palette. The live website is unchanged.';}
const status=message=>$('#status').textContent=message;
function controls(){ $('#save').disabled=busy||!dirty;$('#add').disabled=busy||!sha||data.colors.length>=24;$('#enabled').disabled=busy||!sha;$('#reload').disabled=busy;$('#colors').querySelectorAll('button,input').forEach(el=>el.disabled=busy||el.dataset.boundary==='true'); }
function changed(){dirty=true;controls();overview();status('Unsaved palette changes.');}
function overview(){
 const available=data.colors.filter(c=>c.available);$('#color-strip').replaceChildren(...available.map(c=>{const s=document.createElement('span');s.style.background=c.hex;s.title=c.name;s.setAttribute('aria-label',c.name);return s;}));
 $('#size-availability').textContent=available.length?`${available.length} colors available. ${SIZES.filter(s=>available.length>=s.min).map(s=>s.name).join(', ')} can be composed.`:'No available colors. All bouquet sizes will be unavailable.';
}
function render(){
 $('#enabled').checked=data.enabled;$('#colors').replaceChildren();
 data.colors.forEach((color,index)=>{
 const row=document.createElement('div');row.className='color-row'+(color.available?'':' is-resting');
 const swatch=document.createElement('input');swatch.type='color';swatch.value=color.hex;swatch.setAttribute('aria-label',`Swatch for ${color.name||'new color'}`);swatch.oninput=()=>{color.hex=swatch.value;changed();};
 const label=document.createElement('label');label.className='name';label.textContent='Color name';const name=document.createElement('input');name.type='text';name.value=color.name;name.maxLength=40;name.oninput=()=>{color.name=name.value;changed();};label.append(name);
 const available=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=color.available;check.onchange=()=>{color.available=check.checked;row.classList.toggle('is-resting',!check.checked);changed();};available.append(check,'Available');
 const actions=document.createElement('div');actions.className='row-actions';
 for(const [text,delta] of [['↑',-1],['↓',1],['Remove',0]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',`${delta===-1?'Move earlier':delta===1?'Move later':'Remove'}: ${color.name||'new color'}`);b.dataset.boundary=String((delta===-1&&index===0)||(delta===1&&index===data.colors.length-1));b.onclick=()=>{if(delta){data.colors.splice(index,1);data.colors.splice(index+delta,0,color);}else data.colors.splice(index,1);render();changed();const next=$('#colors').children[Math.min(delta?index+delta:index,data.colors.length-1)];(next?.querySelector('input[type=text]')||$('#add')).focus();};actions.append(b);}
 row.append(swatch,label,available,actions);$('#colors').append(row);
 });overview();controls();
}
async function api(path,options){const r=await fetch(path,options);const result=await r.json();if(r.status===401){$('#auth').showModal();throw Error('Sign in again, then retry. Your edits are still here.');}if(!r.ok)throw Error(result.error||'Could not save. Your changes are still here.');return result;}
async function load(){busy=true;controls();try{const result=await api('/api/editor/data?kind=palette');data=validatePalette(result.data);sha=result.sha;dirty=false;render();status(local?'Local palette loaded.':'Saved palette loaded.');}catch(e){status(e.message);}finally{busy=false;controls();}}
$('#enabled').onchange=()=>{data.enabled=$('#enabled').checked;changed();};
$('#add').onclick=()=>{data.colors.push({id:crypto.randomUUID(),name:'',hex:'#d6a3b7',available:true});render();changed();$('#colors').lastElementChild.querySelector('input[type=text]').focus();};
$('#reload').onclick=()=>{if(!dirty||confirm('Discard unsaved changes and reload the saved palette?'))load();};
$('#save').onclick=async()=>{
 try{data=validatePalette(data);}catch(e){status(e.message);return;}
 busy=true;controls();status(local?'Saving local draft…':'Publishing palette…');
 try{const result=await api('/api/editor/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'palette',sha,data})});sha=result.sha;dirty=false;status(result.message);}catch(e){status(e.message);}finally{busy=false;controls();}
};
$('#auth-form').onsubmit=async e=>{e.preventDefault();try{await api('/api/editor/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#password').value})});$('#password').value='';$('#auth').close();status('Signed in. You can retry saving your palette.');}catch(e){$('#auth-error').textContent=e.message;}};
$('#cancel-auth').onclick=()=>$('#auth').close();
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();}});
load();
