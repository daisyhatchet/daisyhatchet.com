"""A matching campaign set; the original concepts remain untouched."""
from fontTools.pens.boundsPen import BoundsPen

def headline_center(lines,sizes):
    font=fonts['display'];glyphs=font.getGlyphSet();cmap=font.getBestCmap()
    bounds=[]
    for index,(label,size) in enumerate(zip(lines,sizes)):
        scale=size/font['head'].unitsPerEm;baseline=174+126*index
        for char in label:
            pen=BoundsPen(glyphs);glyphs[cmap[ord(char)]].draw(pen)
            if pen.bounds:
                bounds.extend([baseline-pen.bounds[3]*scale,baseline-pen.bounds[1]*scale])
    return (min(bounds)+max(bounds))/2
flirty_editions=[
    ('Caught looking', ['I saw you','checking','me out…'], ['Like what','you see?'], 'Find your own kind of wild.'),
    ('Mutual attraction', ['I think','you’re','cute too.'], ['Looks like we','have chemistry.'], 'Let’s start with flowers.'),
    ('Take me home', ['Wanna','take me','home?'], ['There’s more','where I grew up.'], 'This one stays. Yours is waiting.'),
    ('The second date', ['We should','see more of','each other'], ['Let’s make','this a thing.'], 'For your table. Your person. Just because.'),
    ('The little reveal', ['Wanna','take me','home?'], ['I have','friends.'], 'Find your flower crush.'),
]
for name,headline,punchline,reply in flirty_editions:
    front_type=(text(headline[0],64,174,88,CREAM,'display')+text(headline[1],64,300,80,CREAM,'display')+text(headline[2],64,426,84,CREAM,'display')) if name=='The second date' else hook(headline,64,174,96,c=CREAM,gap=126)
    logo_y=headline_center(headline,[88,80,84] if name=='The second date' else [96]*3)-200
    f=front_type+seal(586,logo_y,400)+eyebrow('DAISY HATCHET • PACIFICA',64,536,LIME,size=25)
    b=emblem(444,18,620,INK,.10)+hook(punchline,64,136,84)+text(reply,64,286,32 if name=='The second date' else 35)+contact_grid(card_bg=PINK)
    add('Refined — '+name,'Matching flirty set · '+name+'.',f,b,INK,PINK)
    meta('One shared design, different conversations. Compare the front invitation and the reply on the back.','Plum front, hot-pink back, the larger supplied stamp, and identical contact details. Each stamp is centered vertically on the visible headline block. Second Date uses a smaller middle line. Rounded 3 mm corners.')
    c=cards[-1];c['radius']=36
    for side,s in enumerate(c['svgs']):
        ident=f'trim-{c["n"]}-{side}';p=s.index('>')+1
        defs=f'<defs><clipPath id="{ident}">'+rect(0,0,1050,600,'white',36)+'</clipPath></defs>'
        c['svgs'][side]=s[:p]+defs+f'<g clip-path="url(#{ident})">'+s[p:-6]+'</g></svg>'
    for side,s in zip(['front','back'],c['svgs']): (ROOT/f'{c["slug"]}-{side}.svg').write_text(s)

# Photograph-led member of the refined campaign; original option 13 is preserved.
brand_overlay=eyebrow('FLOWERS WITH AN EDGE',64,80,LIME,size=24)+hook(['Made you','look.'],64,268,128,c=CREAM,gap=116)+seal(814,64,172)+foot(CREAM)
f=img('field-note-02.jpg',0,-150,1050,750)+shade+brand_overlay
b=emblem(444,18,620,INK,.10)+hook(['Love these?','Find your own.'],64,136,84)+text('Your next flower crush is waiting.',64,286,35)+contact_grid(card_bg=PINK)
add('Refined — Made you look','Field Note 02 photography meets the refined campaign’s hot-pink reply.',f,b,INK,PINK)
meta('The photograph starts the conversation. The reverse shares the refined collection’s layout, palette, and contact details.','Original Field Note 02 crop, square photographic edges, and the stronger watermark in the adjusted CMYK edition.')
c=cards[-1];c['radius']=0
for side,s in zip(['front','back'],c['svgs']): (ROOT/f'{c["slug"]}-{side}.svg').write_text(s)
(ROOT/'22-brand-overlay.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1050 600" width="1050" height="600">'+brand_overlay+'</svg>')
