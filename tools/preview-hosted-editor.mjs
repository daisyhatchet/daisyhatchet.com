import {validatePalette} from '../public/editor-assets/bespoke-model.js';
// Local-only review server. It never calls GitHub and cannot publish.
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash,scryptSync,randomBytes} from 'node:crypto';
import {editorHTML,paletteHTML} from '../netlify/lib/pages.mjs';
import photo from '../netlify/functions/editor-photo.mjs';
import {sessionCookie} from '../netlify/lib/auth.mjs';
const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.EDITOR_PREVIEW_PORT||4323);
const previewOrigin=`http://127.0.0.1:${port}`;
process.env.EDITOR_PASSWORD_HASH='preview:'+scryptSync('preview','preview',64).toString('hex');
process.env.EDITOR_SESSION_SECRET=randomBytes(32).toString('hex');
process.env.EDITOR_GITHUB_TOKEN='local-preview-only';
let setup=null;
const server=createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,previewOrigin);
 if(['/editor/shop','/editor/shop/'].includes(url.pathname)){res.writeHead(302,{location:'https://admin.shopify.com/store/daisy-hatchet/products'});res.end();return;}
 if(url.pathname==='/setup'&&req.method==='GET'){
   res.setHeader('content-type','text/html');res.end(`<!doctype html><meta name="viewport" content="width=device-width"><title>Choose editor password</title><style>body{font:18px system-ui;max-width:650px;margin:50px auto;padding:20px}input,button,textarea{font:inherit;padding:12px;display:block;box-sizing:border-box;width:100%;margin:14px 0}textarea{height:100px}button{cursor:pointer}</style><h1>Choose your editor password</h1><p>This setup runs only on your computer. Use a unique password with at least 14 characters. The password itself will not be saved.</p><form id="form"><input type="password" id="password" autocomplete="new-password" minlength="14" maxlength="256" placeholder="New admin password" required><input type="password" id="repeat" autocomplete="new-password" placeholder="Repeat password" required><button>Create secure settings</button></form><p id="status"></p><script>form.onsubmit=async e=>{e.preventDefault();if(password.value!==repeat.value){status.textContent='Passwords do not match.';return;}const r=await fetch('/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:password.value})});password.value=repeat.value='';status.textContent=r.ok?'Ready. Tell Codex your password is set.':'Could not prepare settings.';};</script>`);return;
 }
 if(url.pathname==='/setup'&&req.method==='POST'){
   if(req.headers.origin!==previewOrigin){res.writeHead(403);return res.end();}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)throw Error('Too large');}
   const {password}=JSON.parse(body);if(typeof password!=='string'||password.length<14||password.length>256)throw Error('Invalid password');
   const salt=randomBytes(16).toString('hex');setup={EDITOR_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex'),EDITOR_SESSION_SECRET:randomBytes(32).toString('hex')};res.end('Ready');return;
 }
 if(url.pathname==='/setup/settings'){
   // Never returned to third-party pages or written to disk.
   if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);return res.end();}
   res.setHeader('cache-control','no-store');res.setHeader('content-type','application/json');res.end(JSON.stringify(setup?{ready:true}: {ready:false}));return;
 }
 if(url.pathname==='/setup/export'&&req.method==='GET'){
   if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);return res.end();}
   res.setHeader('content-type','text/html');res.setHeader('cache-control','no-store');res.end(setup?`<h1>Netlify editor settings</h1><p>Keep these settings private.</p>${Object.entries(setup).map(([k,v])=>`<label>${k}<textarea readonly>${v}</textarea></label>`).join('')}`:'Choose a password first.');return;
 }
 if(url.pathname.startsWith('/api/editor/')){
   res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');
   if(url.pathname.endsWith('/data')){
     const kind=url.searchParams.get('kind');const file=kind==='palette'?'bespoke-palette.json':kind==='gallery'?'gallery-order.json':'shop-items.json';const content=await readFile(root+'/src/content/'+file,'utf8');
     const {readdir}=await import('node:fs/promises');const photos=(await readdir(root+'/public/images/gallery-web')).filter(n=>/\.(jpe?g|png|webp)$/i.test(n));res.end(JSON.stringify({sha:createHash('sha1').update(content).digest('hex'),data:JSON.parse(content),photos}));return;
   }
   let bytes=[];for await(const chunk of req)bytes.push(chunk);const body=Buffer.concat(bytes);
   if(url.pathname.endsWith('/publish')&&req.headers.origin===url.origin){
     const input=JSON.parse(body.toString());
     if(input.kind==='palette'){
       const file=root+'/src/content/bespoke-palette.json',previous=await readFile(file,'utf8');
       if(input.sha!==createHash('sha1').update(previous).digest('hex')){res.writeHead(409);res.end(JSON.stringify({error:'The local palette changed. Reload before saving.'}));return;}
       const content=JSON.stringify(validatePalette(input.data),null,2)+'\n';await writeFile(file,content);
       res.end(JSON.stringify({sha:createHash('sha1').update(content).digest('hex'),message:'Local draft saved. Refresh the bouquet preview to see it.'}));return;
     }
   }
   if(url.pathname.endsWith('/photo')){const request=new Request(url,{method:'POST',headers:{origin:url.origin,'content-type':'application/json',cookie:sessionCookie().split(';')[0]},body});const result=await photo(request);res.writeHead(result.status);res.end(await result.text());return;}
   res.writeHead(403);res.end(JSON.stringify({error:'This is a local review. Publishing is disabled here.'}));return;
 }
 let file;
 if(url.pathname.startsWith('/editor-assets/'))file=root+'/public'+url.pathname;
 else if(url.pathname.startsWith('/editor'))file=root+'/netlify/lib/editor.html';
 else{res.writeHead(404);return res.end('Not found');}
 if(!resolve(file).startsWith(root+'/'))throw Error('Invalid path');
 let content=file.endsWith('/netlify/lib/editor.html')?(url.pathname.replace(/\/$/,'')==='/editor/palette'?paletteHTML.replace('<body>',`<body data-local="true" data-preview-origin="${process.env.SITE_PREVIEW_ORIGIN||'http://127.0.0.1:4321'}">`):editorHTML):await readFile(file);if(extname(file)==='.html')content=content.toString().replace('Loading your latest content…','Local preview — nothing here publishes.').replace('<h1>Daisy Hatchet Editor</h1>','<h1>Editor preview</h1>').replace('<button class="save" id="publish" disabled>Save and publish</button>','<button class="save" id="publish" disabled>Save and publish (preview)</button>');
 res.setHeader('content-type',extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':'text/html');res.end(content);
 }catch{res.writeHead(400);res.end('Could not complete request.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Hosted editor local preview: ${previewOrigin}/editor/palette`));
