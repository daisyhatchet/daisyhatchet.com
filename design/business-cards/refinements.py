"""Second design pass: supplied seals, emblem compositions, grid and finishing."""
import itertools
_serial=itertools.count()
def seal(x,y,size=216,gray=False):
    # Keep the complete outer ring: pink on the color seal, black on grayscale.
    # Both supplied logos share the same 35–1245 outer-circle bounds.
    offset,diameter=35,1210
    scale=size/diameter; ident=f'seal-{next(_serial)}'
    return f'<g data-brand="supplied-seal" transform="translate({x-offset*scale} {y-offset*scale}) scale({scale})"><defs><clipPath id="{ident}"><circle cx="640" cy="640" r="{diameter/2}"/></clipPath></defs><g clip-path="url(#{ident})">'+img('logo-gray.png' if gray else 'logo-color.png',0,0,1280,1280)+'</g></g>'
def emblem(x,y,w=640,c=INK,opacity=.13):
    ident=f'emblem-{next(_serial)}';h=w*776/907
    return f'<g data-brand="crossed-emblem" opacity="{opacity}"><defs><mask id="{ident}" maskUnits="userSpaceOnUse" x="{x}" y="{y}" width="{w}" height="{h}" style="mask-type:alpha">'+img('mark.png',x,y,w,h)+f'</mask></defs><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" mask="url(#{ident})"/></g>'
def foot(c=INK,y=536): return smallbrand(64,y,44,c)
def contact_grid(c=INK,card_bg=CREAM):
    qr_y=304 if card_bg==CREAM else 288
    return contacts(64,376,c,size=33,step=52)+qr('https://daisyhatchet.com/shop',752,qr_y,234)+text('Find your flowers',869,563,27,c,anchor='middle')
def replace(n,f,b,bg1,bg2):
    c=cards[n-1];c['svgs']=[wrap(f,bg1,c['w'],c['h'],c['name']+' front'),wrap(b,bg2,c['w'],c['h'],c['name']+' back')]
def back_intro(title,bg=CREAM):
    return smallbrand(64,96,62)+text(title,64,160,33)+eyebrow('GROWN IN PACIFICA, CALIFORNIA',64,232,size=24)+line(64,276,986,276,BLUSH)+contact_grid(card_bg=bg)

# 01: bright lime linework behind the plum headline, with a consistent 64-unit spine.
f=emblem(410,-22,740,LIME,1)+hook(['I saw you','checking','me out…'],64,160,132,gap=116)+seal(762,344,224)+foot()
replace(1,f,back_intro('Like what you see? Find your own flowers.'),PINK,CREAM)

# 02: seal balances the heading; the verso gets the quiet oversized line drawing.
f=hook(['I think','you’re','cute too.'],64,174,136,c=CREAM,gap=126)+seal(666,48,320)+eyebrow('DAISY HATCHET • PACIFICA',64,536,LIME,size=25)
b=emblem(444,18,620,INK,.10)+hook(['Looks like we','have chemistry.'],64,136,84)+text('Let’s start with flowers.',64,286,35)+contact_grid(card_bg=PINK)
replace(2,f,b,INK,PINK)

# 03: full-width headline, compact supporting line and a lower-right seal.
f=hook(['Wanna take','me home?'],64,206,124,gap=116)+text('There’s more where I grew up.',64,408,35)+foot()+seal(786,348,200)
b=emblem(540,-45,680,LIME,1)+hook(['Find your','own kind of wild.'],64,144,88,c=CREAM)+text('This arrangement is staying here.',64,320,31,CREAM)+text('Your next flowers start here:',64,364,31,CREAM)+text('daisyhatchet.com/shop',64,420,35,LIME)+text('jeneva@daisyhatchet.com',64,536,31,CREAM)+qr('https://daisyhatchet.com/shop',752,334,234)
replace(3,f,b,LIME,INK)

# 04: a large hot-pink botanical drawing, deliberately square and editorial.
f=emblem(436,-20,725,PINK,1)+hook(['We should see','more of','each other.'],64,160,102,gap=108)+f'<path d="M0 488C210 444 371 526 571 486S910 460 1050 484V600H0Z" fill="{PINK}"/>'+foot()
replace(4,f,back_intro('For your table. Your person. Just because.',bg=BLUSH),CREAM,BLUSH)

# 05: logo as the label of a record. The concentric grooves keep the music idea intact.
f=hook(['You like','my vibe?'],64,180,130,c=CREAM)+text('Wait till you hear my playlist.',64,376,36,LIME)+foot(CREAM)
for r in [132,120,108]: f+=f'<circle cx="856" cy="438" r="{r}" fill="none" stroke="{LAV}" stroke-width="2" opacity=".55"/>'
f+=seal(769,351,174)
b=hook(['Garden radio.'],64,128,91)+text('The music behind the flowers.',64,192,34)+line(64,228,986,228,INK)+qr('https://open.spotify.com/playlist/0Scv2njcunjMjeiL0gFAcn',64,268,264)+text('Scan. Listen. Grow along.',384,306,34)+text('Then find your flowers:',384,358,32)+text('daisyhatchet.com',384,410,37)+text('@daisy_hatchet_flowers',384,484,31)+text('jeneva@daisyhatchet.com',384,536,31)
replace(5,f,b,INK,LAV)

# 06: keep the window geometry mirrored and protect its breathing room.
f=hook(['You have','good taste.'],64,176,90)+text('Frame a little',64,340,35)+text('something you love.',64,388,35)+foot()
b=hook(['Keep the','inspiration.'],428,152,77)+text('See flowers you love?',428,304,31)+text('Send me your inspiration.',428,348,31)+contacts(428,432,size=31,step=52)
replace(6,f,b,BLUSH,CREAM)
for side,x in enumerate([686,64]):
    s=cards[5]['svgs'][side];p=s.index('>')+1
    mask=f'<defs><mask id="window-{side}" style="mask-type:luminance"><rect width="1050" height="600" fill="white"/><rect x="{x}" y="105" width="300" height="355" rx="110" fill="black"/></mask></defs>'
    cards[5]['svgs'][side]=s[:p]+mask+f'<g mask="url(#window-{side})">'+s[p:-6]+'</g></svg>'

# 07: the seals take over the branding, with matching baselines in both mini cards.
f='';b=''
for i,bg in enumerate([PINK,LIME]):
    x=i*525
    f+=rect(x,0,525,600,bg)+hook(['One for','you.'] if i==0 else ['One for','your crush.'],x+48,144,65,gap=76)+seal(x+159,304,208,gray=i==1)+text('Keep me.' if i==0 else 'Pass me on.',x+262,552,31,anchor='middle')
    b+=rect(x,0,525,600,CREAM if i==0 else BLUSH)+text('Flowers with',x+48,112,49,INK,'display')+text('an edge.',x+48,164,49,INK,'display')+qr('https://daisyhatchet.com/shop',x+146,228,234)+text('daisyhatchet.com',x+262,520,33,anchor='middle')+text('Pacifica, California',x+262,560,27,anchor='middle')
replace(7,f,b,PINK,CREAM)

# 08: field-note discipline: a single aligned writing column and a small grayscale seal.
f=emblem(580,-22,596,LIME,1)+hook(['Who deserves','flowers?'],64,184,113,c=CREAM)+text('Someone came to mind.',64,374,35,CREAM)+text('Didn’t they?',64,422,35,CREAM)+foot(CREAM)+seal(802,362,184,gray=True)
b=smallbrand(64,96,54)+text('A little reminder for later.',64,152,32)
for label,y in [('Flowers for',224),('Occasion / date',304),('Their kind of color',384)]:b+=text(label,64,y,30)+line(344,y+8,986,y+8,OLIVE)
b+=text('Make it happen: daisyhatchet.com',64,480,34)+text('jeneva@daisyhatchet.com',64,536,31)
replace(8,f,b,OLIVE,CREAM)

# 09: the tent keeps square score-line corners and a watermark instead of a second icon.
f=emblem(530,-60,650,LIME,1)+hook(['I saw you','looking…'],64,208,126)+text('Go on. Take a card.',64,408,40)+foot()
b=hook(['Bring this','feeling home.'],64,152,100,c=CREAM)+text('Seasonal flowers. Grown in Pacifica.',64,320,31,CREAM)+text('daisyhatchet.com',64,424,39,LIME)+text('Scan to find your flowers.',64,492,30,CREAM)+qr('https://daisyhatchet.com/shop',752,334,234)
replace(9,f,b,PINK,INK)

# 10: a tall botanical plate, not a new flower invented around the round logo.
f=eyebrow('A NOTE FROM THE FLOWERS',300,80,INK,'middle',21)+hook(['Let’s pick','this up','later.'],48,238,98,gap=104)+emblem(-85,586,760,PINK,1)+seal(177,1238,246)+text('daisyhatchet.com',300,1570,32,anchor='middle')
b=hook(['Some things','are worth','coming','back to.'],48,180,83,c=CREAM,gap=94)+line(48,558,552,558,LAV)+text('Good books.',48,650,35,CREAM)+text('Good company.',48,714,35,CREAM)+text('Fresh flowers.',48,778,35,LIME)+qr('https://daisyhatchet.com/shop',156,910,288)+contacts(300,1320,CREAM,'middle',31,62)+eyebrow('PACIFICA, CALIFORNIA',300,1570,LIME,'middle',22)
replace(10,f,b,BLUSH,INK)

# 11: a deliberate large crop of the crossed artwork and its contrasting brand seal.
f=emblem(166,92,730,OLIVE,.18)+hook(['Ask me','where I','grew up.'],48,166,109,gap=110)+seal(491,490,211,gray=True)+smallbrand(48,700,37)
b=hook(['Pacifica.'],48,136,113)+text('Locally grown by a',48,232,35)+text('locally grown local.',48,282,35)+line(48,326,702,326,INK)+text('Hi, I’m Jeneva.',48,400,39)+text('I grow the flowers you’re admiring.',48,452,30)+text('daisyhatchet.com',48,552,38)+text('jeneva@daisyhatchet.com',48,620,31)+text('@daisy_hatchet_flowers',48,674,31)
replace(11,f,b,CREAM,LAV)

# 12: a branded inside-back panel and a watermark that rewards opening the card.
f=rect(0,0,1050,600,INK)+seal(64,64,206)+contacts(64,380,CREAM,size=34,step=56)+rect(1050,0,1050,600,PINK)+emblem(1554,-40,670,LIME,1)+hook(['Wanna take','me home?'],1114,208,122)+text('Open for a little introduction.',1114,408,34)+smallbrand(1114,536,44)
b=rect(0,0,1050,600,CREAM)+emblem(368,-36,730,OLIVE,.13)+hook(['I have','friends.'],64,200,137)+text('This arrangement is staying here.',64,424,35)+text('But there are more flowers to meet.',64,480,35)+rect(1050,0,1050,600,LIME)+hook(['Find your','flower crush.'],1114,152,103)+qr('https://daisyhatchet.com/shop',1802,334,234)+text('Seasonal flowers,',1114,384,33)+text('grown in Pacifica.',1114,432,33)+text('daisyhatchet.com/shop',1114,536,34)
replace(12,f,b,INK,CREAM)

# A real 3 mm corner radius in the SVG geometry, carried through both faces.
for c in cards:
    c['radius']=36 if c['n'] in [1,2,3,5,6,8,10,11] else 0
    if c['radius']:
        for side,s in enumerate(c['svgs']):
            ident=f'trim-{c["n"]}-{side}';p=s.index('>')+1
            definition=f'<defs><clipPath id="{ident}">'+rect(0,0,c['w'],c['h'],'white',36)+'</clipPath></defs>'
            c['svgs'][side]=s[:p]+definition+f'<g clip-path="url(#{ident})">'+s[p:-6]+'</g></svg>'
        c['make']+=' Rounded outer corners: 3 mm radius.'
    else:c['make']+=' Square outer corners.'
    c['edition']='Refined with supplied logo · September 2026'
