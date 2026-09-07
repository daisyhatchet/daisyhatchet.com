import {sameOrigin,json,sessionCookie} from '../lib/auth.mjs';
export default async request => {
  if(request.method!=='POST'||!sameOrigin(request))return json({error:'Not allowed'},403);
  return json({ok:true},200,{'set-cookie':sessionCookie(true)});
};
export const config={path:'/api/editor/logout'};
