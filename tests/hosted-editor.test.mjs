import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync,createHash} from 'node:crypto';
import sharp from 'sharp';
import {sessionCookie,authenticated,verifyPassword} from '../netlify/lib/auth.mjs';
import login from '../netlify/functions/editor-login.mjs';
import dataHandler from '../netlify/functions/editor-data.mjs';
import publish from '../netlify/functions/editor-publish.mjs';
import photo from '../netlify/functions/editor-photo.mjs';
import {validateData} from '../netlify/lib/github.mjs';
process.env.EDITOR_PASSWORD_HASH='test-salt:'+scryptSync('test-password','test-salt',64).toString('hex');
process.env.EDITOR_SESSION_SECRET='test-session-secret-not-for-production';
process.env.EDITOR_GITHUB_TOKEN='test-token-not-for-production';
const origin='https://daisyhatchet.com';
function request(path,body,auth=true){return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',...(auth?{cookie:sessionCookie().split(';')[0]}:{})},body:body===undefined?undefined:JSON.stringify(body)});}
const item={id:'bouquet',name:'First Date',price:40,image:'existing.jpg',available:true,purchaseUrl:''};
function mockGit({stale=false,race=false}={}){
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  const path=url.split('daisyhatchet.com/')[1],body=options.body&&JSON.parse(options.body);calls.push({path,method:options.method,body});
  let result;
  if(path==='git/ref/heads/main')result={object:{sha:'head'}};
  else if(path==='git/commits/head')result={tree:{sha:'tree'}};
  else if(path==='git/trees/tree?recursive=1')result={tree:[{path:'src/content/shop-items.json',type:'blob',sha:stale?'newer':'data-sha'},{path:'public/images/gallery-web/existing.jpg',type:'blob',sha:'image-sha'},{path:'unrelated.txt',type:'blob',sha:'untouched'}]};
  else if(path==='git/blobs/data-sha'||path==='git/blobs/newer')result={content:Buffer.from(JSON.stringify([item])).toString('base64')};
  else if(path==='git/blobs')result={sha:'uploaded-image'};
  else if(path==='git/trees')result={sha:'new-tree'};
  else if(path==='git/commits')result={sha:'new-commit'};
  else if(path==='git/refs/heads/main'){if(race)return Response.json({message:'non-fast-forward'},{status:422});result={object:{sha:'new-commit'}};}
  else throw new Error('Unexpected GitHub call '+path);
  return Response.json(result);
 };return calls;
}
test('password, session tampering, expiry and password rotation',()=>{
 assert(verifyPassword('test-password'));assert(!verifyPassword('wrong'));
 assert(authenticated(request('/editor')));
 const r=request('/editor');r.headers.set('cookie',sessionCookie().split(';')[0]+'bad');assert(!authenticated(r));
 r.headers.set('cookie','__Host-dh_editor=1000000000000.invalid');assert(!authenticated(r));
 const before=request('/editor'),old=process.env.EDITOR_PASSWORD_HASH;process.env.EDITOR_PASSWORD_HASH+='changed';assert(!authenticated(before));process.env.EDITOR_PASSWORD_HASH=old;
});
test('authentication and same-origin checks stop mutations',async()=>{
 assert.equal((await publish(request('/api/editor/publish',{},false))).status,401);
 assert.equal((await dataHandler(request('/api/editor/data?kind=shop',undefined,false))).status,401);
 const r=request('/api/editor/publish',{});r.headers.set('origin','https://evil.example');assert.equal((await publish(r)).status,403);
 assert.equal((await login(request('/api/editor/login',{password:'wrong'},false))).status,401);
 const ok=await login(request('/api/editor/login',{password:'test-password'},false));assert.equal(ok.status,200);assert.match(ok.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
});
test('validation rejects paths, executable URLs and malformed data',()=>{
 assert.throws(()=>validateData('shop',[{...item,purchaseUrl:'javascript:alert(1)'}],['existing.jpg']));
 assert.throws(()=>validateData('gallery',['../secret'],['existing.jpg']));
 assert.throws(()=>validateData('shop',[null],[]));
 assert.throws(()=>validateData('shop',[item,item],['existing.jpg']));
});
test('uploads are decoded, resized, stripped and normalized',async()=>{
 const bytes=await sharp({create:{width:2400,height:1800,channels:3,background:'orange'}}).png().toBuffer();
 const result=await photo(request('/api/editor/photo',{image:bytes.toString('base64')}));assert.equal(result.status,200);const upload=await result.json();
 const decoded=Buffer.from(upload.content,'base64'),metadata=await sharp(decoded).metadata();assert.equal(metadata.format,'jpeg');assert(metadata.width<=1200);assert(metadata.height<=1600);assert(!metadata.exif);assert.equal(upload.name,`upload-${createHash('sha256').update(decoded).digest('hex')}.jpg`);
});
test('publish commits only selected data and referenced new photos',async()=>{
 const calls=mockGit();const bytes=await sharp({create:{width:10,height:10,channels:3,background:'orange'}}).jpeg().toBuffer();const name=`upload-${createHash('sha256').update(bytes).digest('hex')}.jpg`;
 const response=await publish(request('/api/editor/publish',{kind:'shop',sha:'data-sha',data:[{...item,image:name}],uploads:[{name,content:bytes.toString('base64')}]}));assert.equal(response.status,200);
 const tree=calls.find(c=>c.path==='git/trees').body;assert.equal(tree.base_tree,'tree');assert.deepEqual(tree.tree.map(e=>e.path),['public/images/gallery-web/'+name,'src/content/shop-items.json']);
 assert.deepEqual(calls.find(c=>c.path==='git/commits').body.parents,['head']);assert.equal(calls.at(-1).body.force,false);
});
test('stale data and concurrent branch update do not overwrite',async()=>{
 let calls=mockGit({stale:true});let response=await publish(request('/api/editor/publish',{kind:'shop',sha:'data-sha',data:[{...item,price:41}]}));assert.equal(response.status,409);assert(!calls.some(c=>c.method==='POST'||c.method==='PATCH'));
 calls=mockGit({race:true});response=await publish(request('/api/editor/publish',{kind:'shop',sha:'data-sha',data:[{...item,price:41}]}));assert.equal(response.status,409);assert.equal(calls.at(-1).body.force,false);
});
test('no-op publish creates no commit',async()=>{
 const calls=mockGit();const response=await publish(request('/api/editor/publish',{kind:'shop',sha:'data-sha',data:[item]}));assert.equal(response.status,200);assert(!calls.some(c=>c.method==='POST'||c.method==='PATCH'));
});
