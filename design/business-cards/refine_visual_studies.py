"""Apply the supplied identity to the earlier visual studies as well."""
import re, shutil, xml.etree.ElementTree as ET
V=ROOT/'visual-studies'; baseline=V/'source-artwork';baseline.mkdir(exist_ok=True)
NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
def parse_part(s):return ET.fromstring('<svg xmlns="'+NS+'">'+s+'</svg>')[0]
for path in V.glob('*.svg'):
    saved=baseline/path.name
    if not saved.exists():shutil.copyfile(path,saved)
    root=ET.fromstring(saved.read_text());n=int(path.name[:2]);front=path.name.endswith('-front.svg')
    for parent in list(root.iter()):
        for node in list(parent):
            label=node.get('aria-label','')
            if not contact_kind(label): continue
            glyph=node.find('{'+NS+'}path')
            if glyph is None: continue
            match=re.search(r'translate\(([-.\d]+) ([-.\d]+)\) scale\(([-.\d]+)',glyph.get('transform',''))
            if not match: continue
            x,y,scale=map(float,match.groups());size=scale*fonts['body']['head'].unitsPerEm
            anchor='middle' if n in [2,7] else 'start'
            if anchor=='middle': x=float(root.get('viewBox').split()[2])/2
            replacement=parse_part(text(label,x,y,size,node.get('fill',INK),anchor=anchor))
            parent.insert(list(parent).index(node),replacement);parent.remove(node)
    if n==4 and front:
        for image_node in root.iter('{'+NS+'}image'):
            image_node.set('href', 'data:image/jpeg;base64,'+base64.b64encode((ROOT/'assets'/'gallery-bouquet.jpg').read_bytes()).decode())
    for parent in list(root.iter()):
        for node in list(parent):
            petals=node.findall('{'+NS+'}ellipse')
            if len(petals)!=8:continue
            i=list(parent).index(node);parent.remove(node)
            if n==5 and front:continue
            match=re.search(r'translate\(([-.\d]+) ([-.\d]+)\)',node.get('transform',''))
            if match:
                x,y=map(float,match.groups());r=abs(float(petals[0].get('cy')))/.52
                size=max(160,r*2)
                parent.insert(i,parse_part(seal(x-size/2,y-size/2,size,gray=n==3)))
    if n==5 and front:
        root.insert(1,parse_part(emblem(-20,-60,1140,PINK,1)))
    if n==7 and front:
        for node in list(root):
            if node.tag=='{'+NS+'}path' and node.get('d','').startswith('M305 821'):
                root.remove(node)
        root.insert(1,parse_part(emblem(150,650,300,PINK,1)))
    # Original line-art seal stays intact on the quiet second and sixth concepts.
    if n in [1,3,5,7]:
        w,h=map(float,root.get('viewBox').split()[2:]);ident=f'bonus-trim-{n}-{int(front)}'
        defs=ET.Element('{'+NS+'}defs');clip=ET.SubElement(defs,'{'+NS+'}clipPath',{'id':ident})
        clip.append(parse_part(rect(0,0,w,h,'white',36)))
        g=ET.Element('{'+NS+'}g',{'clip-path':f'url(#{ident})'})
        for node in list(root):root.remove(node);g.append(node)
        root.append(defs);root.append(g)
    path.write_text(ET.tostring(root,encoding='unicode'))
gallery=V/'index.html';saved_html=baseline/'index.html'
if not saved_html.exists():shutil.copyfile(gallery,saved_html)
s=saved_html.read_text()
def replace_face(m):return m[1]+(V/m[4]).read_text()+m[3]
s=re.sub(r'(<div class="face">)(.*?)(</div><figcaption>.*?href="([^"]+\.svg)")',replace_face,s,flags=re.S)
s=s.replace('</style>','.face{background:transparent;box-shadow:none;filter:drop-shadow(0 10px 10px #29151f18)}</style>')
s=s.replace('The homepage bouquet', 'The gallery sunflower bouquet')
s=s.replace('daisy repeat','crossed-emblem backdrop').replace('One oversized daisy grows between the brand and the Pacifica sign-off.','The supplied round seal and crossed emblem sit between the brand and Pacifica sign-off.')
s=s.replace('with a cream oval wordmark','with a cream oval wordmark').replace('daisy_hatchet_flowers. No phone','daisy_hatchet_flowers. No phone')
s=s.replace('</head>', '<style>'+(ROOT/'viewer.css').read_text()+'</style></head>').replace('</body>', '<script>'+(ROOT/'viewer.js').read_text()+'</script></body>')
gallery.write_text(s)
