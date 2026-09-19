import palette from '@/content/bespoke-palette.json';
export function GET() { return new Response(JSON.stringify(palette), {headers:{'Content-Type':'application/json','Cache-Control':'no-cache'}}); }
