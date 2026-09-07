import { configured, verifyPassword, sessionCookie, sameOrigin, json, body } from '../lib/auth.mjs';
export default async request => {
  if (new URL(request.url).pathname !== '/api/editor/login') return json({error:'Not found'},404);
  if (request.method !== 'POST') return json({error:'Method not allowed'},405);
  if (!sameOrigin(request)) return json({error:'Open the editor on this website to sign in.'},403);
  if (!configured()) return json({error:'The editor is not configured yet.'},503);
  try {
    const {password} = await body(request, 2048);
    if (!verifyPassword(password)) return json({error:'That password is incorrect.'},401);
    return json({ok:true},200,{'set-cookie':sessionCookie()});
  } catch { return json({error:'Could not sign in. Try again.'},400); }
};
export const config = { path:'/api/editor/login', rateLimit:{windowLimit:5,windowSize:180,aggregateBy:['ip','domain']} };
