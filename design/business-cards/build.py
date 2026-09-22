"""Regenerate the SVG concepts and offline review gallery. Requires fonttools."""
from pathlib import Path
import base64, html, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent
INK, CREAM, PINK, BLUSH, OLIVE, LIME, LAV = '#29151f', '#fffaf4', '#f52f97', '#f7d5df', '#696a42', '#b0fe3d', '#b9a3c7'
fonts = {n: TTFont(ROOT/'assets'/f) for n,f in [('display','Danfo.ttf'),('body','DM-Sans.ttf')]}
def contact_kind(s):
    if s in ['daisyhatchet.com', 'daisyhatchet.com/shop']: return 'web'
    if s == 'jeneva@daisyhatchet.com': return 'email'
    if s == '@daisy_hatchet_flowers': return 'instagram'
    return None
def contact_icon(kind,x,y,size,color):
    shapes={
        'web':'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
        'email':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
        'instagram':'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>'
    }
    return f'<g data-contact-icon="{kind}" transform="translate({x} {y}) scale({size/24})" fill="none" stroke="{color}" color="{color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+shapes[kind]+'</g>'
def text(s,x,y,size=36,color=INK,font='body',anchor='start',spacing=0):
    kind=contact_kind(s) if font=='body' else None
    if kind=='instagram': s=s.removeprefix('@')
    f=fonts[font]; gs=f.getGlyphSet(); cmap=f.getBestCmap(); scale=size/f['head'].unitsPerEm
    advance=sum(gs[cmap[ord(c)]].width*scale+spacing for c in s)-spacing
    icon_size=size*.86; icon_space=size*1.22 if kind else 0
    advance+=icon_space
    if anchor=='middle': x-=advance/2
    if anchor=='end': x-=advance
    out=f'<g fill="{color}" aria-label="{html.escape(s)}"><title>{html.escape(s)}</title>'
    if kind:
        # Center against the lowercase body, rather than the capital-height box.
        # All three icons share the same visual center in their 24-unit grid.
        lowercase_height=f['OS/2'].sxHeight*scale
        icon_top=y-lowercase_height/2-icon_size/2
        out+=contact_icon(kind,x,icon_top,icon_size,color)
        x+=icon_space
    for c in s:
        glyph=gs[cmap[ord(c)]]; pen=SVGPathPen(gs); glyph.draw(pen)
        out+=f'<path transform="translate({x:.3f} {y}) scale({scale:.6f} {-scale:.6f})" d="{pen.getCommands()}"/>'
        x+=glyph.width*scale+spacing
    return out+'</g>'
def rect(x,y,w,h,c,rx=0): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}"/>'
def line(x1,y1,x2,y2,c=INK,w=2): return f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{c}" stroke-width="{w}"/>'
def circle(x,y,r,c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def img(name,x,y,w,h):
    mime='image/jpeg' if name.endswith('jpg') else 'image/png'
    data=base64.b64encode((ROOT/'assets'/name).read_bytes()).decode()
    return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice" href="data:{mime};base64,{data}"/>'
def flower(x,y,r,c,center=INK,turn=0):
    a=f'<g transform="translate({x} {y}) rotate({turn})">'
    for i in range(8): a+=f'<ellipse cx="0" cy="{-r*.52}" rx="{r*.24}" ry="{r*.50}" fill="{c}" transform="rotate({i*45})"/>'
    return a+circle(0,0,r*.23,center)+'</g>'
def brand(x,y,size=150,c=INK,gap=None,anchor='start'):
    return text('DAISY',x,y,size,c,'display',anchor)+text('HATCHET',x,y+(gap or size*.83),size,c,'display',anchor)
def eyebrow(s,x,y,c=INK,anchor='start',size=30): return text(s,x,y,size,c,anchor=anchor,spacing=3)
def contacts(x=65,y=385,c=INK,anchor='start',size=34,step=51):
    return ''.join(text(s,x,y+i*step,size,c,anchor=anchor) for i,s in enumerate(['daisyhatchet.com','jeneva@daisyhatchet.com','@daisy_hatchet_flowers']))
def wrap(body,bg,w=1050,h=600,label=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w/300}in" height="{h/300}in" viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(label)}">'+rect(0,0,w,h,bg)+body+'</svg>'

cards=[]
def add(name,desc,front,back,bg1,bg2,w=1050,h=600):
    n=len(cards)+1; slug=f'{n:02d}-'+name.lower().replace(' ','-')
    svgs=[wrap(front,bg1,w,h,name+' front'),wrap(back,bg2,w,h,name+' back')]
    for side,svg in zip(['front','back'],svgs): (ROOT/f'{slug}-{side}.svg').write_text(svg)
    cards.append(dict(n=n,name=name,desc=desc,slug=slug,svgs=svgs,w=w,h=h))

exec((ROOT/'concepts.py').read_text())
exec((ROOT/'photo_concepts.py').read_text())
exec((ROOT/'mockups.py').read_text())
exec((ROOT/'flirty_set.py').read_text())

fontdata=base64.b64encode((ROOT/'assets'/'DM-Sans.ttf').read_bytes()).decode()
sections=[]
for c in cards:
    labels=['outside spread','inside spread'] if c['n']==12 else ['front panel','rear panel'] if c['n']==9 else ['front','back']
    demo_html='<details class=use-demo><summary>See how it works</summary>'+c['demo']+'<p>Illustration of the physical idea; artwork and dimensions are shown above.</p></details>' if 'demo' in c else ''
    guide_links=' '.join(f'<a href="{c["slug"]}-{side}-finish-guide.svg" download>{side.title()} finishing guide ↗</a>' for i,side in enumerate(['front','back']) if c['guides'][i])
    if c['n']==9: guide_links='<a href="09-the-wingman-outside-fold-sheet.svg" download>Outside fold sheet ↗</a> · <a href="09-the-wingman-fold-guide.svg" download>Fold guide ↗</a>'
    previews=''.join(f'<figure><div class="face">{s}</div><figcaption>{labels[i]} <a href="{c["slug"]}-{side}.svg" download data-card="{c["n"]}" data-side="{i}">Download SVG ↗</a></figcaption></figure>' for i,(side,s) in enumerate(zip(['front','back'],c['svgs'])))
    sections.append(f'<section id="option-{c["n"]}" class="concept {"portrait" if c["w"]==600 else ""}"><div class="concept-heading"><span class="number">{c["n"]:02d}</span><div><h2>{c["name"]}</h2><p>{c["desc"]}</p></div><button class="save" data-save="{c["n"]}" aria-pressed="false">♡ Shortlist</button></div><div class="pair">{previews}</div>{demo_html}<div class="concept-notes"><p><strong>The idea</strong><br>{c["idea"]}</p><p><strong>{c["size"]} · Making it</strong><br>{c["make"]}<br><span class="guide-links">{guide_links}</span></p></div></section>')
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daisy Hatchet — Twelve flower-flirting card concepts</title><style>
@font-face{font-family:DM;src:url(data:font/ttf;base64,FONTDATA)}
*{box-sizing:border-box}body{margin:0;background:#f1ece5;color:#29151f;font-family:DM,Arial,sans-serif}header{background:#29151f;color:#fffaf4;padding:64px max(24px,calc((100vw - 1240px)/2)) 45px}header .kicker{color:#b0fe3d;font-size:12px;text-transform:uppercase;letter-spacing:.18em}h1{font-size:clamp(36px,5vw,64px);font-weight:400;line-height:1.08;letter-spacing:-.04em;max-width:840px;margin:24px 0}header p{max-width:720px;line-height:1.6;color:#d2c4cc;font-size:16px}.palette{display:flex;gap:8px;margin-top:28px}.palette i{display:block;width:28px;height:28px;border-radius:50%}nav{position:sticky;top:0;background:#fffaf4f5;backdrop-filter:blur(10px);border-bottom:1px solid #d8cdd1;z-index:2;display:flex;justify-content:center;gap:8px;padding:15px;flex-wrap:wrap}nav a,nav button{font:inherit;font-size:13px;padding:8px 14px;border:1px solid #d8cdd1;border-radius:30px;text-decoration:none;background:transparent;color:inherit;cursor:pointer}nav a:hover,nav button:hover{background:#f7d5df}main{max-width:1320px;padding:12px 40px 60px;margin:auto}.concept{padding:48px 0 50px;border-bottom:1px solid #d4c9cb;scroll-margin-top:90px}.concept-heading{display:flex;gap:22px;align-items:start;margin-bottom:25px}.number{font-size:14px;padding-top:8px;color:#696a42}h2{font-size:28px;font-weight:400;letter-spacing:-.03em;margin:0 0 8px}.concept p{font-size:14px;line-height:1.5;margin:0;max-width:730px;color:#66545c}.save{margin-left:auto;white-space:nowrap;border:1px solid #baaeb4;border-radius:24px;padding:10px 15px;color:#29151f;background:transparent;cursor:pointer}.save[aria-pressed=true]{background:#f52f97;border-color:#f52f97}.pair{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start}figure{margin:0}.face{box-shadow:0 14px 26px -18px #29151f66}svg{width:100%;height:auto;display:block}figcaption{font-size:11px;text-transform:uppercase;letter-spacing:.14em;display:flex;justify-content:space-between;margin-top:16px;color:#796570}figcaption a{color:inherit;text-transform:none;letter-spacing:0}.portrait .pair{max-width:750px;margin:auto;gap:55px}.concept-notes{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:26px;padding-top:22px;border-top:1px solid #ded4d6}.concept-notes strong{color:#29151f;font-weight:600}.face{background:repeating-conic-gradient(#e5ded5 0% 25%,#f5efe7 0% 50%) 50%/20px 20px}.portrait .pair{max-width:590px}.concept:last-of-type .pair{grid-template-columns:1fr}.concept:last-of-type .face{max-width:100%}.use-demo{margin-top:25px;font-size:14px}.use-demo summary{cursor:pointer;text-decoration:underline;text-underline-offset:4px}.use-demo svg{max-width:760px;margin:20px auto 10px}.use-demo p{text-align:center;margin:auto}.guide-links{display:inline-block;margin-top:10px}.guide-links a{color:#696a42;margin-right:10px}.notes{padding:40px 0;max-width:900px;font-size:14px;line-height:1.7}.notes h2{font-size:23px}.notes p{color:#66545c}.hidden{display:none}footer{padding:25px 40px;border-top:1px solid #d4c9cb;font-size:12px;color:#796570;text-align:center}@media(max-width:750px){header{padding:40px 24px}main{padding:0 20px 30px}.pair{grid-template-columns:1fr;gap:28px}.concept-notes{grid-template-columns:1fr}.concept-heading{gap:12px;flex-wrap:wrap}.save{margin-left:30px}.portrait .pair{max-width:340px}.concept{scroll-margin-top:145px}nav{gap:5px}nav a,nav button{padding:7px 11px}}@media print{nav,.save,figcaption a{display:none}header{padding:30px}main{padding:0}.concept{break-inside:avoid;padding:30px 0}.face{box-shadow:none}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body><header><div class="kicker">Daisy Hatchet / Design study / September 2026</div><h1>Let the flowers<br>make the first move.</h1><p>Twelve ideas for the moment someone falls for an arrangement. Flirty introductions, useful keepsakes, and clever paper formats—built from your website’s own branding. Tap the hearts to keep a shortlist.</p><div class="palette">SWATCHES</div></header><nav>NAV<button id="filter">Show shortlisted</button></nav><main>SECTIONS<div class="notes"><h2>Designed to hold in your hand.</h2><p><a href="visual-studies/index.html">Bonus: eight earlier visual directions ↗</a> — including photography, the original emblem, and quieter brand-led options.</p><p>Most options begin with a 3.5 × 2 inch business card. Special formats, folds, and cuts are explained under each concept. All fronts and backs are shown; the last option is shown as outside and inside spreads. Artwork is shown at the finished trim edge, with no simulated foil, embossing, or paper texture. All lettering is converted to vector outlines, so the SVG files keep their appearance without installed fonts. The supplied round logos and crossed daisy-and-hatchet emblem are embedded images. Rounded card shapes are included in the artwork where specified. QR codes lead to your shop or your existing garden playlist.</p><p>These are design proofs. After you choose a direction, the selected card should receive printer-specific bleed, color conversion, and a physical proof. Bright pink and acid green will look softer in ordinary CMYK print; specialty inks can be discussed with the printer. Contact details: Jeneva, jeneva@daisyhatchet.com, and @daisy_hatchet_flowers. No phone number or street address has been invented.</p><p><strong>My starting picks:</strong> 01 as the strongest all-round takeaway, 03 for the clearest buying invitation, and 12 for the most delightful physical reveal. Pair any of them with the standing sign in 09.</p></div></main><footer>Private local design study · Website unchanged · No production publication</footer><script>
let shortlist=[];try{shortlist=JSON.parse(localStorage.getItem('dh-card-shortlist')||'[]')}catch{}let filtering=false;function update(){document.querySelectorAll('[data-save]').forEach(b=>{const yes=shortlist.includes(+b.dataset.save);b.setAttribute('aria-pressed',yes);b.textContent=yes?'♥ Shortlisted':'♡ Shortlist'});document.querySelectorAll('.concept').forEach(s=>s.classList.toggle('hidden',filtering&&!shortlist.includes(+s.id.split('-')[1])));document.getElementById('filter').textContent=filtering?'Show all twelve':`Show shortlisted (${shortlist.length})`};document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const n=+b.dataset.save;shortlist=shortlist.includes(n)?shortlist.filter(x=>x!==n):[...shortlist,n];try{localStorage.setItem('dh-card-shortlist',JSON.stringify(shortlist))}catch{}update()});document.getElementById('filter').onclick=()=>{filtering=!filtering;update()};document.querySelectorAll('[data-card]').forEach(a=>a.onclick=e=>{e.preventDefault();const svg=a.closest('figure').querySelector('svg').outerHTML;const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download=a.getAttribute('href');link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});update();
</script></body></html>'''
families = [
    ('flirty-refined', 'The refined flirty set', 'Five matching headline cards plus Made You Look with Field Note 02 photography. All share the refined hot-pink back and contact layout. Original designs are preserved below.', [17,18,19,20,21,22], 18),
    ('photography', 'Let the flowers speak', 'Lead with real photographs: a dramatic full-bleed bouquet, a keepsake print, a pocket portfolio, or the hands behind the flowers.', [13,14,15,16], 13),
    ('flirty', 'The flirty analogies', 'The arrangement speaks like someone who caught your eye. Choose the line and delivery after choosing this overall idea.', [1,2,3,4,12], 1),
    ('interaction', 'An invitation to play', 'Turn looking into doing: frame a flower through a cut-out window and capture a detail you love.', [6], 6),
    ('sharing', 'A reason to share', 'Make the card a small social gesture. A tear-apart pair gives someone a reason to introduce a friend to the flowers.', [7], 7),
    ('keepsakes', 'Something worth keeping', 'Give the card a useful second life: a reminder for a future gift or a bookmark that stays close at hand.', [8,10], 10),
    ('music', 'A little of the garden’s world', 'Offer an experience beyond the arrangement. The garden playlist becomes a small gift from the grower.', [5], 5),
    ('local', 'The story behind the flowers', 'Lead with real provenance and the person behind the work: Jeneva, her backyard, and Pacifica.', [11], 11),
]
grouped=[]
for idx,(slug,title,desc,ids,representative) in enumerate(families):
    thumb=base64.b64encode(cards[representative-1]['svgs'][0].encode()).decode()
    count=f'{len(ids)} variations' if len(ids)>1 else '1 execution'
    grouped.append(f'<details class="family" id="family-{slug}"><summary><img class="family-thumb" src="data:image/svg+xml;base64,{thumb}" alt="Representative artwork for {html.escape(title)}"><div><span class="family-label">Concept {chr(65+idx)} · {count}</span><h2>{title}</h2><p>{desc}</p><span class="family-action">Explore this concept <span aria-hidden="true">↘</span></span></div></summary><div class="family-content">'+''.join(sections[n-1] for n in ids)+'</div></details>')
support='<details class="family support" id="family-display"><summary><div><span class="family-label">Supporting format · works with any concept</span><h2>How it sits beside the arrangement</h2><p>The standing sign is a way to display the idea and invite people to take a card. It can carry whichever concept you choose.</p><span class="family-action">See the counter sign ↘</span></div></summary><div class="family-content">'+sections[8]+'</div></details>'
grouped_html='<div class="review-intro"><h2>Choose the idea first.</h2><p>The new refined flirty set comes first, followed by the seven original concept families. Open one to compare its executions, fronts and backs, and physical formats. The original option numbers are preserved so your shortlist still works.</p></div><div class="family-grid">'+''.join(grouped)+'</div>'+support
page=page.replace('Twelve flower-flirting card concepts','Daisy Hatchet — Card concepts and refined flirty set').replace('Let the flowers<br>make the first move.','One flirty family.<br>Six ways to say it.').replace('Twelve ideas for the moment someone falls for an arrangement. Flirty introductions, useful keepsakes, and clever paper formats—built from your website’s own branding. Tap the hearts to keep a shortlist.','Compare the underlying ideas first, then the variations within each. The flirty lines belong to one family; a folded reveal is a delivery option within that family.').replace('the last option is shown as outside and inside spreads','option 12 is shown as outside and inside spreads').replace('.concept:last-of-type', '#option-12')
group_css='''
.review-intro{padding:38px 0 24px}.review-intro p{max-width:800px;color:#66545c;line-height:1.6}.family-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.family{border:1px solid #d4c9cb;border-radius:12px;overflow:hidden;background:#fffaf4;scroll-margin-top:95px}.family>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:175px 1fr;gap:22px;padding:28px;align-items:start}.family>summary::-webkit-details-marker{display:none}.family>summary:hover{background:#f7e8e9}.family>summary:focus-visible{outline:3px solid #f52f97;outline-offset:-4px}.family-thumb{width:175px;height:150px;object-fit:contain;align-self:center}.family-label{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#696a42;margin-bottom:13px}.family h2{font-size:25px;line-height:1.15}.family>summary p{font-size:14px;line-height:1.55;color:#66545c;margin:12px 0}.family-action{font-size:13px;text-decoration:underline;text-underline-offset:4px}.family[open]{grid-column:1/-1}.family[open]>summary{border-bottom:1px solid #d4c9cb;background:#f7d5df}.family[open]>summary p{max-width:820px}.family-content{padding:0 30px}.family-content .concept:last-child{border-bottom:0}.support{margin-top:28px;background:transparent}.support>summary{grid-template-columns:1fr}.support p{max-width:850px}.family-content .concept{scroll-margin-top:100px}@media(max-width:1000px){.family>summary{grid-template-columns:1fr}.family-thumb{width:100%;height:150px}}@media(max-width:750px){.family-grid{grid-template-columns:1fr}.family>summary{padding:22px}.family-content{padding:0 16px}.family{scroll-margin-top:155px}}@media print{.family-grid{display:block}.family-content{padding:0}.family{margin-bottom:20px}}
'''
page=page.replace('</style>',group_css+'\n.face{background:transparent;box-shadow:none;filter:drop-shadow(0 10px 10px #29151f18)}\n</style>')
# Filtering opens the families containing selected cards and hides empty families.
page=page.replace("document.getElementById('filter').textContent=", "document.querySelectorAll('.family').forEach(f=>{const match=!!f.querySelector('.concept:not(.hidden)');f.classList.toggle('hidden',filtering&&!match);if(filtering&&match)f.open=true});document.getElementById('filter').textContent=")
page=page.replace('Show all twelve','Show all concepts')
page=page.replace('update();\n</script>', '''update();
function revealHash(){const el=document.getElementById(location.hash.slice(1));if(!el)return;const family=el.matches('.family')?el:el.closest('.family');if(family)family.open=true;requestAnimationFrame(()=>el.scrollIntoView({block:'start'}))}
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{const el=document.querySelector(a.getAttribute('href'));if(el)el.open=true}));window.addEventListener('hashchange',revealHash);if(location.hash)revealHash();
</script>''')
page=page.replace('FONTDATA',fontdata).replace('SWATCHES',''.join(f'<i style="background:{c}" title="{c}"></i>' for c in [PINK,BLUSH,LIME,OLIVE,LAV,CREAM])).replace('NAV',''.join(f'<a href="#family-{slug}">{label}</a>' for slug,label in [('flirty-refined','Refined set'),('photography','Photos'),('flirty','Flirty'),('interaction','Play'),('sharing','Share'),('keepsakes','Keep'),('music','Listen'),('local','Local')])).replace('SECTIONS',grouped_html)
page=page.replace('<div class="family-content">'+sections[16], '<div class="family-content"><p style="padding-top:24px"><a href="proof/index.html">Compare screen colors with a CMYK simulation ↗</a></p>'+sections[16])
page=page.replace('</head>', '<style>'+(ROOT/'viewer.css').read_text()+'</style></head>').replace('</body>', '<script>'+(ROOT/'viewer.js').read_text()+'</script></body>')
(ROOT/'index.html').write_text(page)
exec((ROOT/'refine_visual_studies.py').read_text())
print(f'Wrote {len(cards)*2} SVG faces and self-contained review gallery.')

# Keep print comparisons synchronized with the current refined artwork.
import subprocess
subprocess.run(['node',str(ROOT/'proof.cjs')],check=True)
