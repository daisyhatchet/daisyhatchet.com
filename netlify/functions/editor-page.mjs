import { loginHTML, editorHTML } from '../lib/pages.mjs';
import { authenticated } from '../lib/auth.mjs';
export default async request => {
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  const loggedIn=authenticated(request);
  const html=loggedIn?editorHTML:loginHTML;
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow','x-frame-options':'DENY','x-content-type-options':'nosniff','referrer-policy':'same-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data: https://raw.githubusercontent.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
};
export const config={path:['/editor','/editor/','/editor/shop','/editor/shop/','/editor/gallery','/editor/gallery/']};
