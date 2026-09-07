export const files = {shop:'src/content/shop-items.json',gallery:'src/content/gallery-order.json'};
const repo = 'daisyhatchet/daisyhatchet.com';
export class Conflict extends Error {}
export async function github(path, method = 'GET', data) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    method, headers:{Authorization:`Bearer ${process.env.EDITOR_GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','content-type':'application/json'},
    body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    if ([409,422].includes(response.status)) throw new Conflict('Someone published another update. Reload the latest content before publishing again.');
    throw new Error('GitHub could not complete the request. Your edits are still in this tab.');
  }
  return response.json();
}
export async function snapshot() {
  const ref = await github('git/ref/heads/main');
  const commit = await github(`git/commits/${ref.object.sha}`);
  const tree = await github(`git/trees/${commit.tree.sha}?recursive=1`);
  if(tree.truncated)throw new Error('The photo library is too large to load.');
  return {head:ref.object.sha, tree:commit.tree.sha, entries:tree.tree};
}
export async function readData(state, kind) {
  const entry=state.entries.find(e=>e.path===files[kind]);
  if(!entry)throw new Error('Editor data is missing.');
  const blob=await github(`git/blobs/${entry.sha}`);
  return {sha:entry.sha,data:JSON.parse(Buffer.from(blob.content,'base64').toString('utf8'))};
}
export function photos(state) {return state.entries.filter(e=>e.type==='blob'&&/^public\/images\/gallery-web\/[^/]+\.(jpe?g|png|webp)$/i.test(e.path)).map(e=>e.path.split('/').pop());}
export function validateData(kind,data,available) {
  if(!Array.isArray(data)||data.length>200)throw new Error('Invalid editor data.');
  if(kind==='gallery') {
    if(new Set(data).size!==data.length||!data.every(v=>typeof v==='string'&&available.includes(v)))throw new Error('Choose valid gallery photos.');
  } else {
    if(!data.every(v=>v&&typeof v.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v.id)&&typeof v.name==='string'&&v.name.trim().length>0&&v.name.length<=150&&Number.isFinite(v.price)&&v.price>=0&&v.price<=100000&&typeof v.available==='boolean'&&available.includes(v.image)&&typeof(v.purchaseUrl??'')==='string'&&(()=>{if(!v.purchaseUrl)return true;try{return ['https:','http:'].includes(new URL(v.purchaseUrl).protocol)}catch{return false}})()))throw new Error('Check the arrangement names, prices, photos, and purchase links.');
    if(new Set(data.map(v=>v.id)).size!==data.length)throw new Error('Duplicate arrangement. Reload the editor.');
    data=data.map(({id,name,price,image,available,purchaseUrl=''})=>({id,name:name.trim(),price,image,available,purchaseUrl}));
  }
  return data;
}
