"""Concept artwork, evaluated by build.py with its SVG drawing helpers."""
import qrcode

def qr(url,x,y,size=210):
    q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=1,border=4)
    q.add_data(url);q.make(fit=True);m=q.get_matrix();u=size/len(m)
    # Cancel shared module edges, leaving only the outlines of solid regions.
    # Integer grid coordinates keep adjoining modules exact at every SVG scale.
    edges=set()
    for i,row in enumerate(m):
        for j,dark in enumerate(row):
            if not dark: continue
            corners=[(j,i),(j+1,i),(j+1,i+1),(j,i+1)]
            for a,b in zip(corners,corners[1:]+corners[:1]):
                if (b,a) in edges: edges.remove((b,a))
                else: edges.add((a,b))
    following={}
    for a,b in edges: following.setdefault(a,set()).add(b)
    contours=[]
    while following:
        start=min(following);current=start;points=[start]
        while True:
            nxt=min(following[current]);following[current].remove(nxt)
            if not following[current]: del following[current]
            current=nxt
            if current==start: break
            points.append(current)
        contours.append('M'+'L'.join(f'{a} {b}' for a,b in points)+'Z')
    path=f'<path data-qr="merged" transform="translate({x} {y}) scale({u:.12f})" fill="{INK}" fill-rule="nonzero" d="{"".join(contours)}"/>'
    return rect(x,y,size,size,CREAM,rx=14)+path
def smallbrand(x,y,size=55,c=INK): return text('DAISY HATCHET',x,y,size,c,'display')
def hook(lines,x=60,y=160,size=114,c=INK,gap=None): return ''.join(text(s,x,y+i*(gap or size*.93),size,c,'display') for i,s in enumerate(lines))
def standard_back(title='Flowers with an edge.',bg=CREAM,c=INK):
    return smallbrand(60,90,67,c)+text(title,62,151,35,c)+eyebrow('GROWN IN PACIFICA, CALIFORNIA',62,230,c,size=24)+contacts(62,369,c,size=33,step=51)+qr('https://daisyhatchet.com/shop',752,293,238)+text('Find your flowers',871,554,28,c,anchor='middle')
def meta(idea,make,size='3.5 × 2 in',guides=None):
    cards[-1].update(idea=idea,make=make,size=size,guides=guides or ['', ''])

# Four arrangements-as-speaker hooks, developed as distinct advertising ideas.
f=hook(['I saw you','checking','me out…'],55,217,139,gap=127)+flower(888,432,96,INK,LIME,15)+smallbrand(60,552,45)
add('Caught looking','A tiny confession from the flowers. The most direct response to someone already admiring the arrangement.',f,standard_back('Like what you see? Find your own flowers.'),PINK,CREAM)
meta('Interrupt the glance → turn admiration into a visit. The arrangement is the speaker, and the card is its introduction.','Standard two-sided card. Easy to replenish beside any arrangement.')

f=hook(['I think','you’re','cute too.'],55,168,142,c=CREAM,gap=133)+flower(867,152,113,PINK,LIME,17)+eyebrow('DAISY HATCHET • PACIFICA',60,552,LIME,size=26)
b=hook(['Looks like we','have chemistry.'],60,128,86)+text('Let’s start with flowers.',63,300,37)+contacts(63,397,size=32,step=50)+qr('https://daisyhatchet.com/shop',769,335,214)
add('Mutual attraction','The bolder, cheekier sibling. A compliment makes the card feel worth picking up—and passing along.',f,b,INK,BLUSH)
meta('Reward the person looking with a small smile. This is the strongest playful line for cafés, salons, and boutiques.','Standard two-sided card. Plum front, hot-pink reverse.')

f=hook(['Wanna take','me home?'],55,207,129,gap=124)+flower(870,437,88,PINK,INK,15)+text('There’s more where I grew up.',61,424,40)+smallbrand(61,551,48)
b=hook(['Find your','own kind of wild.'],60,143,92,c=CREAM)+text('This arrangement is staying here.',62,324,32,CREAM)+text('Your next flowers start here:',62,370,32,CREAM)+text('daisyhatchet.com/shop',62,429,36,LIME)+text('jeneva@daisyhatchet.com',62,523,31,CREAM)+qr('https://daisyhatchet.com/shop',770,349,214)
add('Take me home','An irresistible invitation with a clear answer on the back: this display stays put; order your own seasonal flowers.',f,b,LIME,INK)
meta('Borrow the language of attraction, then make the buying route explicit. A direct sales concept rather than a generic contact card.','Standard two-sided card. Working QR opens the flower shop.')

f=rect(0,0,1050,600,CREAM)+hook(['We should see','more of','each other.'],56,152,105,gap=105)+f'<path d="M0 487C220 430 330 526 550 485S900 448 1050 480V600H0Z" fill="{PINK}"/>'+smallbrand(60,550,49)
b=standard_back('For your table. Your person. Just because.')
add('The second date','A relationship idea: the flowers you love at your favorite business could become a presence in your own life.',f,b,CREAM,BLUSH)
meta('Give people three occasions to return: their own home, a gift, or no occasion at all. No subscription promise is implied.','Standard two-sided card. The wave is lifted from the website’s visual language.')

# A card that carries the existing garden playlist, a genuinely useful digital keepsake.
f=hook(['You like','my vibe?'],55,173,137,c=CREAM)+text('Wait till you hear my playlist.',60,392,39,LIME)+smallbrand(60,548,48,CREAM)+circle(868,468,102,PINK)+circle(868,468,66,INK)+circle(868,468,31,PINK)+circle(868,468,9,INK)
b=hook(['Garden radio.'],60,113,94)+text('The music behind the flowers.',62,184,36)+qr('https://open.spotify.com/playlist/0Scv2njcunjMjeiL0gFAcn',63,248,269)+text('Scan. Listen. Grow along.',384,294,35)+text('Then find your flowers:',384,347,33)+text('daisyhatchet.com',384,403,39)+text('@daisy_hatchet_flowers',384,469,31)+text('jeneva@daisyhatchet.com',384,518,31)
add('Garden radio','A tiny mixtape from the arrangement. It connects to the real garden playlist already featured on the website.',f,b,INK,LAV)
meta('Give someone something enjoyable before asking them to buy. The playlist keeps the brand around after the flowers are out of sight.','Standard two-sided card. QR opens the existing Spotify playlist; the website remains prominent.')

# Die-cut viewfinder. Window is mirrored on the back so both sides align physically.
f=hook(['You have','good taste.'],55,180,95)+text('Frame a little',60,362,37)+text('something you love.',60,410,37)+smallbrand(60,548,45)
b=hook(['Keep the','inspiration.'],439,137,78)+text('See flowers you love?',442,302,31)+text('Send me your inspiration.',442,350,31)+contacts(442,424,size=30,step=48)
add('Bloom finder','A little window onto the arrangement. Hold the card up, frame a detail, and take a photo to remember the flowers.',f,b,BLUSH,CREAM)
for side,x in enumerate([686,64]):
    s=cards[-1]['svgs'][side]; mask=f'<defs><mask id="window-{side}"><rect width="1050" height="600" fill="white"/><rect x="{x}" y="105" width="300" height="355" rx="110" fill="black"/></mask></defs>'
    s=s.replace('>'+rect(0,0,1050,600,[BLUSH,CREAM][side]),'>'+mask+f'<g mask="url(#window-{side})">'+rect(0,0,1050,600,[BLUSH,CREAM][side]),1).replace('</svg>','</g></svg>')
    cards[-1]['svgs'][side]=s
meta('Turn passive looking into a playful interaction. A photo of the arrangement with the branded frame becomes a personal reminder.','Custom rounded window cut. The opening is shown transparent; back artwork mirrors its position. Prototype before ordering.')

# Perforated pair: a referral action built into the physical object.
f='';b=''
for i,bg in enumerate([PINK,LIME]):
    x=i*525;f+=rect(x,0,525,600,bg)+hook(['One for','you.'] if not i else ['One for','your','crush.'],x+40,151,77,gap=77)+flower(x+261,411,61,INK,CREAM,10)+text('DAISY',x+40,514,58,INK,'display')+text('HATCHET',x+40,565,58,INK,'display')
    b+=rect(x,0,525,600,CREAM if i==0 else BLUSH)+text('Flowers with',x+40,113,52,INK,'display')+text('an edge.',x+40,166,52,INK,'display')+qr('https://daisyhatchet.com/shop',x+147,220,230)+text('daisyhatchet.com',x+262,505,33,INK,anchor='middle')+text('Pacifica, California',x+262,553,28,INK,anchor='middle')
add('Pass it on','Two complete mini cards joined by a perforation. Keep one, tear one off, and give it to someone who loves flowers.',f,b,PINK,CREAM)
guide='<path d="M525 0V600" stroke="#007f84" stroke-width="3" stroke-dasharray="12 10"/>'
meta('Build a referral into the card itself. Each half keeps its own business name on the front, website, and working shop QR on the back.','Vertical perforation at the center. Each separated piece is 1.75 × 2 in. Tell the printer this must tear cleanly.',guides=[guide,guide])

# A writable occasion card that makes a future buying moment concrete.
f=hook(['Who deserves','flowers?'],55,173,118,c=CREAM)+text('Someone came to mind. Didn’t they?',61,385,36,CREAM)+smallbrand(60,548,51,CREAM)+flower(900,474,72,BLUSH,INK)
b=smallbrand(60,79,56)+text('A little reminder for later.',61,137,33)+text('Flowers for',62,213,30)+line(248,223,985,223,OLIVE)+text('Occasion / date',62,291,30)+line(294,301,985,301,OLIVE)+text('Their kind of color',62,369,30)+line(329,379,985,379,OLIVE)+text('Make it happen: daisyhatchet.com',62,465,35)+text('jeneva@daisyhatchet.com',62,531,31)
add('The flower reminder','A pocket-sized promise to someone. Three writable prompts turn a passing thought into an occasion worth remembering.',f,b,OLIVE,CREAM)
meta('Make the recipient imagine a real person and a real date. This is a useful reminder card, not a discount coupon.','Standard two-sided card. Use an uncoated, pen-friendly reverse; keep writing lines clear.')

# A fold-up counter sign: shown as two panels, with a separate outside print layout below.
f=hook(['I saw you','looking…'],55,211,131)+text('Go on. Take a card.',62,415,42)+smallbrand(62,548,51)
b=hook(['Bring this','feeling home.'],55,157,104,c=CREAM)+text('Seasonal flowers. Grown in Pacifica.',60,326,32,CREAM)+text('daisyhatchet.com',60,428,40,LIME)+text('Scan to find your flowers.',60,498,31,CREAM)+qr('https://daisyhatchet.com/shop',768,343,219)
add('The wingman','A small standing sign beside the arrangement, paired with a stack of takeaway cards. It does the asking before anyone picks one up.',f,b,PINK,INK)
meta('Separate attention from information: the standing headline catches the eye, while the card stack is clearly there to take.','Tent: flat 3.5 × 4 in, folded to two 3.5 × 2 in faces. Score at center. Panel previews are upright; the supplied fold sheet rotates the rear correctly.','3.5 × 2 in per panel')

# Long keepsake: genuine bookmark proportions, not a normal card with a new label.
f=eyebrow('A NOTE FROM THE FLOWERS',300,68,INK,'middle',21)+hook(['Let’s pick','this up','later.'],48,237,100,gap=98)+f'<path d="M300 1345C261 1220 363 978 300 779M306 1140Q168 1150 158 1030Q266 1049 306 1140M312 1024Q421 1009 433 894Q335 922 312 1024" fill="none" stroke="{INK}" stroke-width="7"/>'+flower(300,699,133,PINK,INK,18)+text('DAISY',300,1446,83,INK,'display','middle')+text('HATCHET',300,1524,83,INK,'display','middle')+text('daisyhatchet.com',300,1592,31,INK,anchor='middle')
b=hook(['Some things','are worth','coming','back to.'],47,177,84,c=CREAM,gap=90)+text('Good books.',49,643,36,CREAM)+text('Good company.',49,706,36,CREAM)+text('Fresh flowers.',49,769,36,LIME)+qr('https://daisyhatchet.com/shop',153,917,294)+contacts(300,1322,CREAM,'middle',29,61)+eyebrow('PACIFICA, CALIFORNIA',300,1585,LIME,'middle',22)
add('Pick this up later','A real bookmark with a flower’s invitation to reconnect. A useful object that lives on a bedside table instead of disappearing into a drawer.',f,b,BLUSH,INK,600,1650)
meta('Trade wallet convenience for staying power. Especially suited to a café or bookstore placement.','2 × 5.5 in bookmark. Standard rectangular cut, heavier stock. Larger than a business card.','2 × 5.5 in')

# Square conversational provenance card.
f=hook(['Ask me','where I','grew up.'],43,166,111,gap=107)+img('mark.png',490,454,210,183)+smallbrand(45,698,41)
b=hook(['Pacifica.'],43,132,117)+text('Locally grown by a',47,231,36)+text('locally grown local.',47,281,36)+text('Hi, I’m Jeneva.',47,381,41)+text('I grow the flowers you’re admiring.',47,435,31)+text('daisyhatchet.com',47,544,39)+text('jeneva@daisyhatchet.com',47,610,31)+text('@daisy_hatchet_flowers',47,666,31)
add('Local character','A conversation starter with a reveal on the reverse: these flowers came from a backyard in Pacifica, not somewhere anonymous.',f,b,CREAM,LAV,750,750)
meta('Make local provenance the memorable surprise. The square shape feels like a small art card and stands out in a stack.','2.5 × 2.5 in square card. Uses the original daisy-and-hatchet emblem.','2.5 × 2.5 in')

# Folded reveal: outside and inside spreads, folded size remains business-card size.
f=rect(0,0,1050,600,INK)+smallbrand(62,90,58,CREAM)+contacts(62,374,CREAM,size=35,step=58)+rect(1050,0,1050,600,PINK)+hook(['Wanna take','me home?'],1105,206,127)+text('Open for a little introduction.',1112,415,35)+smallbrand(1112,548,49)
b=rect(0,0,1050,600,CREAM)+hook(['I have','friends.'],55,201,143)+text('This arrangement is staying here.',62,422,37)+text('But there are more flowers to meet.',62,481,37)+rect(1050,0,1050,600,LIME)+hook(['Find your','flower crush.'],1109,141,109)+qr('https://daisyhatchet.com/shop',1792,327,234)+text('Seasonal flowers,',1112,387,34)+text('grown in Pacifica.',1112,438,34)+text('daisyhatchet.com/shop',1112,537,36)
add('The little reveal','A folded invitation with a punchline inside. “Wanna take me home?” opens to “I have friends.” Then the card introduces the shop.',f,b,INK,CREAM,2100,600)
fold='<path d="M1050 0V600" stroke="#007f84" stroke-width="3" stroke-dasharray="12 10"/>'
meta('Create a small moment of discovery. The physical opening delivers the joke and the next step together.','Flat 7 × 2 in, folded to 3.5 × 2 in. Score at center. First spread: back cover left, front cover right. Second spread: inside.','7 × 2 in flat',guides=[fold,fold])

exec((ROOT/'refinements.py').read_text())

# Re-save any postprocessed window artwork and deliver separate finish guides.
for c in cards:
    for i,side in enumerate(['front','back']):
        (ROOT/f'{c["slug"]}-{side}.svg').write_text(c['svgs'][i])
        if c['guides'][i]:
            guide_svg=c['svgs'][i].replace('</svg>',c['guides'][i]+'</svg>')
            (ROOT/f'{c["slug"]}-{side}-finish-guide.svg').write_text(guide_svg)

# Real tent outside sheet: rear above fold, inverted; front below fold.
tent=cards[8]
def inner(svg): return svg[svg.index('>')+1:svg.rindex('</svg>')]
tent_sheet=wrap('<g transform="translate(1050 600) rotate(180)">'+inner(tent['svgs'][1])+'</g><g transform="translate(0 600)">'+inner(tent['svgs'][0])+'</g>',CREAM,1050,1200,'The wingman — outside fold sheet')
(ROOT/'09-the-wingman-outside-fold-sheet.svg').write_text(tent_sheet)
(ROOT/'09-the-wingman-fold-guide.svg').write_text(tent_sheet.replace('</svg>','<path d="M0 600H1050" stroke="#007f84" stroke-width="3" stroke-dasharray="12 10"/></svg>'))
