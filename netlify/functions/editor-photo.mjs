import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {authenticated,sameOrigin,body,json} from '../lib/auth.mjs';
export default async request=>{
  if(!authenticated(request))return json({error:'Please sign in again.'},401);
  if(request.method!=='POST'||!sameOrigin(request))return json({error:'Not allowed'},403);
  try {
    const {image}=await body(request);
    if(typeof image!=='string'||image.length>3_500_000)throw new Error('Choose a smaller photo.');
    const input=Buffer.from(image,'base64');
    const result=await sharp(input,{limitInputPixels:25_000_000,animated:false}).rotate().resize({width:1200,height:1600,fit:'inside',withoutEnlargement:true}).toColourspace('srgb').jpeg({quality:85}).toBuffer();
    const name=`upload-${createHash('sha256').update(result).digest('hex')}.jpg`;
    return json({name,content:result.toString('base64')});
  }catch{return json({error:'This photo could not be opened. Try a JPEG, PNG, or WebP photo.'},400);}
};
export const config={path:'/api/editor/photo'};
