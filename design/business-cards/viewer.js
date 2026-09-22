(() => {
  const faces=[...document.querySelectorAll('.face')];
  const dialog=document.createElement('dialog');
  dialog.className='card-viewer';dialog.setAttribute('aria-labelledby','viewer-title');
  dialog.innerHTML=`<div class="viewer-bar"><div class="viewer-heading"><h2 id="viewer-title"></h2><p id="viewer-side"></p></div><a class="viewer-download" download>Download SVG ↗</a><button class="viewer-close" aria-label="Close enlarged viewer">Close ×</button></div><div class="viewer-stage" tabindex="0" aria-label="Enlarged card. Scroll or drag when zoomed."><div class="viewer-canvas"><img class="viewer-art" draggable="false" alt=""></div></div><div class="viewer-bar viewer-bottom"><button class="viewer-prev" aria-label="Previous card face">←</button><span class="viewer-count" aria-live="polite"></span><button class="viewer-next" aria-label="Next card face">→</button><button class="viewer-fit">Fit</button><button class="viewer-minus" aria-label="Zoom out">−</button><span class="viewer-zoom" aria-live="polite">Fit</span><button class="viewer-plus" aria-label="Zoom in">+</button><span class="viewer-tip">Double-click to zoom · Drag to pan · Esc to close</span></div>`;
  document.body.append(dialog);
  const find=s=>dialog.querySelector(s), stage=find('.viewer-stage'), art=find('.viewer-art');
  let active=0,zoom=1,url=null,opener=null,oldOverflow='',drag=null,ratio=1;
  function resize(){
    const pad=innerWidth<=650?32:56,w=stage.clientWidth-pad,h=stage.clientHeight-pad;
    const fitWidth=Math.min(w,h*ratio);
    art.style.width=`${Math.max(1,fitWidth*zoom)}px`;art.style.height=`${Math.max(1,fitWidth*zoom/ratio)}px`;
    find('.viewer-zoom').textContent=zoom===1?'Fit':`${Math.round(zoom*100)}%`;
    stage.classList.toggle('is-zoomed',zoom>1);
    find('.viewer-minus').disabled=zoom===1;find('.viewer-plus').disabled=zoom===4;
  }
  function setZoom(value){zoom=Math.max(1,Math.min(4,value));resize();if(zoom===1){stage.scrollTop=0;stage.scrollLeft=0}}
  function show(index){
    active=(index+faces.length)%faces.length;const face=faces[active],svg=face.querySelector('svg'),section=face.closest('.concept'),link=face.closest('figure').querySelector('a[download]');
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([svg.outerHTML],{type:'image/svg+xml'}));
    const title=section.querySelector('h2').textContent,number=section.querySelector('.number').textContent;
    const side=face.closest('figure').querySelector('figcaption').firstChild.textContent.trim();
    find('#viewer-title').textContent=`${number} · ${title}`;find('#viewer-side').textContent=side;
    art.alt=`${title} — ${side}`;art.src=url;
    ratio=svg.viewBox.baseVal.width/svg.viewBox.baseVal.height;
    find('.viewer-download').href=url;find('.viewer-download').download=link.getAttribute('href');
    find('.viewer-count').textContent=`${active+1} / ${faces.length}`;setZoom(1);
  }
  function open(index,trigger){opener=trigger;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();show(index);find('.viewer-close').focus()}
  faces.forEach((face,i)=>{
    face.setAttribute('role','button');face.tabIndex=0;face.setAttribute('aria-haspopup','dialog');face.setAttribute('aria-label',`Enlarge ${face.querySelector('svg').getAttribute('aria-label')||'card'}`);
    face.addEventListener('click',()=>open(i,face));face.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i,face)}});
    const button=document.createElement('button');button.className='view-large';button.textContent='View larger';button.onclick=()=>open(i,button);
    face.closest('figure').querySelector('figcaption').insertBefore(button,face.closest('figure').querySelector('a'));
  });
  find('.viewer-close').onclick=()=>dialog.close();find('.viewer-prev').onclick=()=>show(active-1);find('.viewer-next').onclick=()=>show(active+1);
  find('.viewer-plus').onclick=()=>setZoom(zoom+.5);find('.viewer-minus').onclick=()=>setZoom(zoom-.5);find('.viewer-fit').onclick=()=>setZoom(1);
  art.ondblclick=()=>setZoom(zoom===1?2:1);
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(active-1)}if(e.key==='ArrowRight'){e.preventDefault();show(active+1)}if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom+.5)}if(e.key==='-'){e.preventDefault();setZoom(zoom-.5)}if(e.key==='0'){e.preventDefault();setZoom(1)}});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()});
  dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;if(url){URL.revokeObjectURL(url);url=null}opener?.focus()});
  stage.addEventListener('pointerdown',e=>{if(zoom<=1||e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:stage.scrollLeft,top:stage.scrollTop};stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');e.preventDefault()});
  stage.addEventListener('pointermove',e=>{if(drag){stage.scrollLeft=drag.left+drag.x-e.clientX;stage.scrollTop=drag.top+drag.y-e.clientY}});
  const endDrag=()=>{drag=null;stage.classList.remove('is-dragging')};stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
  window.addEventListener('resize',()=>{if(dialog.open)resize()});
})();
