import {authenticated,json} from '../lib/auth.mjs';
import {files,snapshot,readData,photos} from '../lib/github.mjs';
export default async request => {
  if(!authenticated(request))return json({error:'Please sign in again.'},401);
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const kind=new URL(request.url).searchParams.get('kind');
  if(kind==='shop')return json({error:'Products are now managed in Shopify.',url:'https://admin.shopify.com/store/daisy-hatchet/products'},410);
  if(!Object.hasOwn(files,kind))return json({error:'Unknown editor'},400);
  try {const state=await snapshot();return json({...await readData(state,kind),photos:photos(state)});}catch{return json({error:'Could not load the latest content from GitHub. Please try again.'},502);}
};
export const config={path:'/api/editor/data'};
