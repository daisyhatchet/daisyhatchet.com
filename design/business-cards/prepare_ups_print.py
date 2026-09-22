"""Build individual CMYK card-side PDFs to the downloaded UPS template geometry.

Keep text, contact icons, and QR codes vector. Rasterize only background artwork.
"""
from pathlib import Path
import sys,io,re,json,copy,subprocess,runpy,hashlib,shutil
import xml.etree.ElementTree as ET
sys.path.insert(0,'/tmp/daisy-fonttools')
from PIL import Image,ImageCms,ImageDraw
import numpy as np
from fontTools.svgLib.path import parse_path
from fontTools.pens.basePen import BasePen
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,ArrayObject,FloatObject,DictionaryObject,DecodedStreamObject,NumberObject,TextStringObject

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent.parent
TEMP=REPO/'tmp/pdfs/ups-build';TEMP.mkdir(parents=True,exist_ok=True)
OUT=REPO/'output/pdf/daisyhatchet-ups';OUT.mkdir(parents=True,exist_ok=True)
NS='{http://www.w3.org/2000/svg}'
ET.register_namespace('',NS[1:-1])
# Exact guide coordinates extracted from the supplier's single-card PDF.
PAGE=(259.994,151.994);BLEED=3.997;TRIM=(252,144);SCALE=.24
SAFETY=(8.249,8.249,251.745,143.745)
PROFILE=Path('/System/Library/ColorSync/Profiles/Generic CMYK Profile.icc')
ctx=runpy.run_path(str(ROOT/'proof_colors.py'))
to_print=ctx['to_print'];adjust=ctx['adjusted_separations']
icc=PROFILE.read_bytes()

def color(value):
    if value in [None,'none']:return None
    if value=='white':value='#ffffff'
    if value=='black':value='#000000'
    if len(value)==4:value='#'+''.join(v*2 for v in value[1:])
    if value.lower()=='#f52f97':return (0,1,0,0)
    if value.lower()=='#b0fe3d':return (.3,0,1,0)
    rgb=tuple(int(value[i:i+2],16) for i in (1,3,5))
    sample=Image.new('RGB',(1,1),rgb)
    return tuple(v/255 for v in ImageCms.applyTransform(sample,to_print).getpixel((0,0)))

class PDFPen(BasePen):
    def __init__(self,p):super().__init__(None);self.p=p
    def _moveTo(self,p):self.p.moveTo(*p)
    def _lineTo(self,p):self.p.lineTo(*p)
    def _curveToOne(self,a,b,c):self.p.curveTo(*a,*b,*c)
    def _closePath(self):self.p.close()
    def _endPath(self):pass

def transforms(c,s):
    for name,args in re.findall(r'(\w+)\(([^)]*)\)',s):
        v=[float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',args)]
        if name=='translate':c.translate(v[0],v[1] if len(v)>1 else 0)
        elif name=='scale':c.scale(v[0],v[1] if len(v)>1 else v[0])
        elif name=='matrix':c.transform(*v)
        elif name=='rotate':
            if len(v)==3:c.translate(v[1],v[2])
            c.rotate(v[0])
            if len(v)==3:c.translate(-v[1],-v[2])
        else:raise ValueError('Unhandled transform '+name)

def vector(c,node,style=None):
    tag=node.tag.split('}')[-1]
    if tag in ['defs','title','image','mask','clipPath']:return
    if node.get('data-brand'):return
    if tag=='rect' and float(node.get('width',0))==1050 and float(node.get('height',0))==600:return
    style=dict(style or {'fill':'#000000','stroke':'none','stroke-width':'1','color':'#000000'})
    for key in ['fill','stroke','stroke-width','color','fill-rule','stroke-linecap','stroke-linejoin']:
        if key in node.attrib:style[key]=node.get(key)
    c.saveState();transforms(c,node.get('transform',''))
    if tag in ['svg','g']:
        for child in node:vector(c,child,style)
    else:
        fill=style['fill'];stroke=style['stroke']
        if fill=='currentColor':fill=style['color']
        if stroke=='currentColor':stroke=style['color']
        fill=color(fill);stroke=color(stroke)
        # Single-ink black keeps the small QR modules free from registration fringes.
        if node.get('data-qr')=='merged':fill=(0,0,0,1)
        if fill:c.setFillColorCMYK(*fill)
        if stroke:c.setStrokeColorCMYK(*stroke)
        c.setLineWidth(float(style['stroke-width']))
        c.setLineCap({'butt':0,'round':1,'square':2}.get(style.get('stroke-linecap'),0))
        c.setLineJoin({'miter':0,'round':1,'bevel':2}.get(style.get('stroke-linejoin'),0))
        opts={'fill':int(fill is not None),'stroke':int(stroke is not None)}
        num=lambda k,default=0:float(node.get(k,default))
        if tag=='path':
            p=c.beginPath();parse_path(node.get('d',''),PDFPen(p));c.drawPath(p,fillMode=0 if style.get('fill-rule')=='evenodd' else 1,**opts)
        elif tag=='rect':
            if num('rx'):c.roundRect(num('x'),num('y'),num('width'),num('height'),num('rx'),**opts)
            else:c.rect(num('x'),num('y'),num('width'),num('height'),**opts)
        elif tag=='circle':c.circle(num('cx'),num('cy'),num('r'),**opts)
        elif tag=='ellipse':c.ellipse(num('cx')-num('rx'),num('cy')-num('ry'),num('cx')+num('rx'),num('cy')+num('ry'),**opts)
        else:raise ValueError('Unhandled SVG element '+tag)
    c.restoreState()

only=sys.argv[1] if len(sys.argv)>1 else None
manifest=json.loads((OUT/'production-manifest.json').read_text()) if only else []
if only:manifest=[m for m in manifest if m['option']!=only]
for source in sorted(ROOT.glob('*.svg')):
    if not re.match(r'^(17|18|19|20|21|22)-.*-(front|back)\.svg$',source.name):continue
    if only and source.name[:2]!=only:continue
    n=source.name[:2];side='front' if source.stem.endswith('-front') else 'back'
    name=source.stem[3:].replace('refined-—-','').removesuffix('-'+side)
    name=name.removeprefix('the-')
    stem=f'{n}-{name}-{side}'
    tree=ET.fromstring(source.read_text());plate=copy.deepcopy(tree)
    # Expand the underlay to the supplier's bleed edge; do not print white rounded corners.
    bleed_units=BLEED/SCALE
    plate.set('viewBox',f'{-bleed_units} {-bleed_units} {PAGE[0]/SCALE} {PAGE[1]/SCALE}')
    plate.set('width',f'{PAGE[0]/72}in');plate.set('height',f'{PAGE[1]/72}in')
    for node in plate.iter():
        if 'trim-' in node.get('clip-path',''):node.attrib.pop('clip-path')
        if node.get('data-brand')=='crossed-emblem':node.set('opacity','.35')
    for parent in list(plate.iter()):
        for node in list(parent):
            if node.get('aria-label') is not None or node.get('data-qr') is not None:
                parent.remove(node)
            elif node.tag==NS+'rect' and node.get('width')=='234' and node.get('height')=='234':parent.remove(node)
    for node in plate.iter(NS+'rect'):
        if node.get('width')=='1050' and node.get('height')=='600':
            node.set('x',str(-bleed_units));node.set('y',str(-bleed_units));node.set('width',str(PAGE[0]/SCALE));node.set('height',str(PAGE[1]/SCALE));node.set('rx','0')
    plate_path=TEMP/(stem+'-plate.svg');plate_path.write_text(ET.tostring(plate,encoding='unicode'))
    png=TEMP/(stem+'-plate.png')
    js="const sharp=require('sharp');sharp(process.argv[1],{density:600}).resize("+str(round(PAGE[0]/72*600))+","+str(round(PAGE[1]/72*600))+").png().toFile(process.argv[2]).catch(e=>{console.error(e);process.exit(1)});"
    subprocess.run(['node','-e',js,str(plate_path),str(png)],cwd=REPO,check=True)
    rgb=Image.open(png).convert('RGB');mask=None
    if n=='22' and side=='front':
        # Continue the edge of the photograph through the supplier's bleed.
        pad=round(BLEED/72*600);a=np.array(rgb)
        a[:pad]=a[pad];a[-pad:]=a[-pad-1];a[:,:pad]=a[:,pad:pad+1];a[:,-pad:]=a[:,-pad-1:-pad]
        rgb=Image.fromarray(a)
        # Restrict palette ink substitutions to the opaque circular brand stamp.
        mask=Image.new('L',rgb.size);d=ImageDraw.Draw(mask)
        scale=600/72*SCALE
        d.ellipse([(814*scale+pad,64*scale+pad),((814+172)*scale+pad,(64+172)*scale+pad)],fill=255)
    base=ImageCms.applyTransform(rgb,to_print);separated=adjust(rgb,base,mask)
    buf=io.BytesIO();separated.save(buf,format='TIFF',compression='tiff_lzw');buf.seek(0)
    raw=TEMP/(stem+'.pdf');c=canvas.Canvas(str(raw),pagesize=PAGE,pageCompression=1,pdfVersion=(1,4))
    c.setTitle(f'Daisy Hatchet - {name.replace("-"," ").title()} - {side.title()}')
    c.setAuthor('Daisy Hatchet');c.setSubject('Single-card CMYK artwork with bleed; UPS Store Print template dimensions')
    c.drawImage(ImageReader(buf),0,0,*PAGE)
    c.saveState();c.translate(BLEED,PAGE[1]-BLEED);c.scale(SCALE,-SCALE);vector(c,tree);c.restoreState()
    c.showPage();c.save()
    r=PdfReader(raw);w=PdfWriter();w.clone_document_from_reader(r);p=w.pages[0]
    for key,box in [('/TrimBox',[BLEED,BLEED,BLEED+252,BLEED+144]),('/BleedBox',[0,0,*PAGE]),('/CropBox',[0,0,*PAGE])]:p[NameObject(key)]=ArrayObject([FloatObject(x) for x in box])
    profile=DecodedStreamObject();profile.set_data(icc);profile[NameObject('/N')]=NumberObject(4)
    intent=DictionaryObject({NameObject('/Type'):NameObject('/OutputIntent'),NameObject('/S'):NameObject('/GTS_PDFX'),NameObject('/OutputConditionIdentifier'):TextStringObject('Generic CMYK - exploratory process palette'),NameObject('/Info'):TextStringObject('Apple Generic CMYK; not a UPS-supplied profile'),NameObject('/DestOutputProfile'):w._add_object(profile)})
    w.root_object[NameObject('/OutputIntents')]=ArrayObject([w._add_object(intent)])
    output=OUT/(stem+'.pdf');w.write(output)
    manifest.append({'file':output.name,'option':n,'name':name,'side':side,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'page_points':PAGE,'trim_points':[BLEED,BLEED,BLEED+252,BLEED+144],'safety_points':SAFETY,'background_ppi':600,'vector_text_icons_qr':True,'cmyk_profile':'Apple Generic CMYK','pink_percent':[0,100,0,0],'lime_percent':[30,0,100,0],'watermark_opacity':.35,'qr_percent':[0,0,0,100]})
    print(output.name,flush=True)
(OUT/'production-manifest.json').write_text(json.dumps(manifest,indent=2))
