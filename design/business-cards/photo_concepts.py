"""Photography-led directions using photographs already on the website."""
# 13: full-bleed photograph; the gradient protects the headline without boxing it in.
shade='<defs><linearGradient id="photo-shade"><stop offset="0" stop-color="#29151f" stop-opacity=".87"/><stop offset=".58" stop-color="#29151f" stop-opacity=".42"/><stop offset="1" stop-color="#29151f" stop-opacity="0"/></linearGradient></defs><rect width="1050" height="600" fill="url(#photo-shade)"/>'
f=img('field-note-02.jpg',0,-150,1050,750)+shade+eyebrow('FLOWERS WITH AN EDGE',64,80,LIME,size=24)+hook(['Made you','look.'],64,268,128,c=CREAM,gap=116)+seal(814,64,172)+foot(CREAM)
b=smallbrand(64,96,62)+text('Love these? Find your own flowers.',64,160,34)+eyebrow('SEASONAL • LOCAL • A LITTLE WILD',64,232,size=24)+line(64,276,986,276,INK)+contact_grid(card_bg=BLUSH)
add('Made you look','The flowers are the entire canvas. A dramatic bouquet photograph and a short headline do the work together.',f,b,INK,BLUSH)
meta('Let the product create the attraction. The photograph makes the promise tangible before the headline speaks.','Standard two-sided card. Full-bleed Field note 02 photograph from the gallery (cream dahlia and pink bouquet); crisp square corners suit the photographic treatment.')

# 14: a photographic keepsake with a generous white frame and logo overlapping its edge.
f=img('photo-41.jpg',40,40,520,716)+seal(394,657,158)+hook(['Your next','flower crush.'],48,869,65,gap=71)+text('daisyhatchet.com',300,1000,30,anchor='middle')
b=hook(['Keep a','little wild.'],48,139,75,gap=82)+text('Flowers for your table.',48,322,33)+text('Or your favorite person.',48,368,33)+qr('https://daisyhatchet.com/shop',165,448,270)+contacts(300,786,INK,'middle',30,57)+smallbrand(48,999,38)
add('The keepsake print','A portrait flower photograph with the feel of a small art print. A quiet frame gives the pink backdrop and pale blooms room to shine.',f,b,CREAM,LAV,600,1050)
meta('Give someone a tiny photograph worth leaving on a desk or pinning up. The image earns its place; the contact information lives on the reverse.','2 × 3.5 in portrait card. Uses the existing pale bouquet on a pink backdrop photograph. Rounded 3 mm outer corners.','2 × 3.5 in')

# 15: three distinct palettes become a pocket portfolio, not three background decorations.
f=img('photo-12.jpg',40,40,314,360)+img('photo-24.jpg',368,40,314,360)+img('photo-0.jpg',696,40,314,360)+text('Find your kind of wild.',64,503,74,INK,'display')+text('Seasonal flowers · Pacifica, California',64,554,30)
b=hook(['A little different.','Every time.'],64,145,72,c=CREAM,gap=86)+seal(824,64,162)+text('Discover what’s flowering now.',64,286,34,CREAM)+contact_grid(CREAM,card_bg=INK)
add('The pocket portfolio','Three real arrangements, three very different moods. A small collection shows the range of the flowers at a glance.',f,b,CREAM,INK)
meta('Help someone find their taste through examples: vivid orange, soft cream, or deep burgundy. The visual variety is the concept.','Standard two-sided card, square corners. Each photograph has its own consistent frame; original image resolution is sufficient for these small panels.')

# 16: documentary proof of the grower, with the photograph given most of the surface.
f=img('photo-38.jpg',416,0,634,600)+brand(48,146,66,CREAM,gap=62)+text('Grown',48,344,72,CREAM,'display')+text('here.',48,413,72,CREAM,'display')+text('Pacifica, California',48,484,28,CREAM)+eyebrow('CUT BY HAND',48,550,LIME,size=22)
b=hook(['I’m Jeneva.'],64,140,93)+seal(820,64,166,gray=True)+text('These are my backyard flowers.',64,222,35)+line(64,276,986,276,OLIVE)+contact_grid()
add('The hands behind it','A close-up of hands tending the garden gives “locally grown” something real to point to. The olive side panel reads like a farm label.',f,b,OLIVE,CREAM)
meta('Build a connection to the grower through documentary photography. This is about the care and place behind the arrangement.','Standard two-sided card, square corners. Uses the website’s garden photograph IMG_3174.jpg; the hands stay central in the crop.')

for c in cards[12:]:
    c['radius']=36 if c['n']==14 else 0
    if c['radius']:
        for side,s in enumerate(c['svgs']):
            ident=f'trim-{c["n"]}-{side}';p=s.index('>')+1
            defs=f'<defs><clipPath id="{ident}">'+rect(0,0,c['w'],c['h'],'white',36)+'</clipPath></defs>'
            c['svgs'][side]=s[:p]+defs+f'<g clip-path="url(#{ident})">'+s[p:-6]+'</g></svg>'
    for side,s in zip(['front','back'],c['svgs']):(ROOT/f'{c["slug"]}-{side}.svg').write_text(s)
