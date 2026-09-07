import { createHmac, timingSafeEqual, scryptSync } from 'node:crypto';
export const COOKIE = '__Host-dh_editor';
export function equal(a, b) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function configured() {
  return Boolean(process.env.EDITOR_PASSWORD_HASH && process.env.EDITOR_SESSION_SECRET && process.env.EDITOR_GITHUB_TOKEN);
}
function sign(value) {
  return createHmac('sha256', process.env.EDITOR_SESSION_SECRET).update(`${process.env.EDITOR_PASSWORD_HASH}:${value}`).digest('base64url');
}
export function verifyPassword(password) {
  const [salt, hash] = (process.env.EDITOR_PASSWORD_HASH || '').split(':');
  if (!salt || !hash || typeof password !== 'string' || password.length > 256) return false;
  return equal(scryptSync(password, salt, 64).toString('hex'), hash);
}
export function sessionCookie(clear = false) {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000);
  const value = clear ? '' : `${expiry}.${sign(expiry)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${clear ? 0 : 28800}`;
}
export function authenticated(request) {
  if (!configured()) return false;
  const value = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!value) return false;
  const [expiry, signature] = value.split('.');
  return /^\d{13}$/.test(expiry) && Number(expiry) > Date.now() && Number(expiry) <= Date.now() + 28800000 && equal(signature || '', sign(expiry));
}
export function sameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export const headers = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
export function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } }); }
export async function body(request, limit = 4_000_000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Send JSON data.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('No data received.');
  const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new Error('Too many photos at once. Publish a smaller batch.'); } chunks.push(Buffer.from(value)); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
