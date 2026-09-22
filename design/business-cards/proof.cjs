const fs=require('fs'),path=require('path'),sharp=require('sharp'),{execFileSync}=require('child_process');
(async()=>{
 const root=__dirname,out=path.join(root,'proof');fs.mkdirSync(path.join(out,'assets'),{recursive:true});
 const files=fs.readdirSync(root).filter(f=>/^(17|18|19|20|21|22)-.*-(front|back)\.svg$/.test(f)).sort();
 const cards=[];
 for(const f of files){
  const n=f.slice(0,2),side=f.endsWith('-front.svg')?'front':'back';
  await sharp(path.join(root,f),{density:144}).resize(1400,800).png().toFile(path.join(out,'assets',`${n}-${side}-rgb.png`));
  if(n==='22' && side==='front') await sharp(path.join(root,'22-brand-overlay.svg')).resize(1400,800).png().toFile(path.join(out,'assets','22-front-brand-mask.png'));
  if(side==='back'){
   const strengthened=fs.readFileSync(path.join(root,f),'utf8').replace(/(data-brand="crossed-emblem" opacity=")[^"]+"/g,(_,prefix)=>prefix+'0.35"');
   await sharp(Buffer.from(strengthened),{density:144}).resize(1400,800).png().toFile(path.join(out,'assets',`${n}-${side}-adjustment-source.png`));
  }
  if(side==='front')cards.push({id:n,title:f.slice(3,-10).replace('refined-—-','').replaceAll('-',' ')});
 }
 execFileSync(process.env.DAISY_PYTHON||'/Users/Dan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',[path.join(root,'proof_colors.py')]);
 const meta=JSON.parse(fs.readFileSync(path.join(out,'metadata.json'),'utf8'));
 let html=fs.readFileSync(path.join(root,'proof-template.html'),'utf8').replace('CARD_OPTIONS',cards.map(c=>`<option value="${c.id}">${c.id} · ${c.title}</option>`).join('')).replaceAll('PROFILE_NAME',meta.profile);
 fs.writeFileSync(path.join(out,'index.html'),html);
 console.log(`Updated ICC-managed CMYK comparison for ${files.length} card faces.`);
})().catch(e=>{console.error(e);process.exit(1)});
