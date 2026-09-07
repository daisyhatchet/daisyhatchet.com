import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {authenticated,sameOrigin,body,json} from '../lib/auth.mjs';
import {files,github,snapshot,readData,photos,validateData,Conflict} from '../lib/github.mjs';
export default async request=>{
  if(!authenticated(request))return json({error:'Please sign in again. Your edits are still in this tab.'},401);
  if(request.method!=='POST'||!sameOrigin(request))return json({error:'Not allowed'},403);
  try{
    const {kind,sha,data,uploads=[]}=await body(request);
    if(!Object.hasOwn(files,kind)||!Array.isArray(uploads)||uploads.length>10)throw new Error('Invalid publish request.');
    const state=await snapshot(),current=await readData(state,kind);
    if(current.sha!==sha)throw new Conflict('This content changed since you opened it. Copy any unsaved text, then reload the latest version.');
    const pending=[];
    for(const upload of uploads){
      if(typeof upload.content!=='string'||upload.content.length>2_000_000)throw new Error('Photo is too large.');
      const bytes=Buffer.from(upload.content,'base64');
      if(upload.name!==`upload-${createHash('sha256').update(bytes).digest('hex')}.jpg`)throw new Error('Invalid photo.');
      const meta=await sharp(bytes,{limitInputPixels:2_000_000}).metadata();
      if(meta.format!=='jpeg'||meta.width>1200||meta.height>1600)throw new Error('Re-upload this photo before publishing.');
      pending.push({name:upload.name,content:upload.content});
    }
    const clean=validateData(kind,data,[...photos(state),...pending.map(u=>u.name)]);
    const used=new Set(kind==='gallery'?clean:clean.map(i=>i.image));
    const tree=[];
    for(const upload of pending.filter(u=>used.has(u.name)&&!photos(state).includes(u.name))){
      const blob=await github('git/blobs','POST',{content:upload.content,encoding:'base64'});
      tree.push({path:`public/images/gallery-web/${upload.name}`,mode:'100644',type:'blob',sha:blob.sha});
    }
    const content=JSON.stringify(clean,null,2)+'\n';
    if(!tree.length&&JSON.stringify(clean)===JSON.stringify(current.data))return json({sha:current.sha,message:'Everything is already saved and published.'});
    tree.push({path:files[kind],mode:'100644',type:'blob',content});
    const nextTree=await github('git/trees','POST',{base_tree:state.tree,tree});
    const commit=await github('git/commits','POST',{message:`Update ${kind} from hosted editor`,tree:nextTree.sha,parents:[state.head]});
    await github('git/refs/heads/main','PATCH',{sha:commit.sha,force:false});
    const newSha=createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
    return json({sha:newSha,commit:commit.sha,message:'Sent to Netlify. Your update will appear on daisyhatchet.com shortly.'});
  }catch(error){return json({error:error.message||'Could not publish. Your edits are still in this tab.'},error instanceof Conflict?409:400);}
};
export const config={path:'/api/editor/publish',rateLimit:{windowLimit:10,windowSize:60,aggregateBy:['ip','domain']}};
