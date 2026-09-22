"""ICC-managed RGB → CMYK → sRGB previews. Source artwork is never modified."""
from pathlib import Path
import hashlib,json,os
from PIL import Image,ImageCms
import numpy as np

root=Path(__file__).resolve().parent
profile=Path(os.environ.get('DAISY_CMYK_PROFILE','/System/Library/ColorSync/Profiles/Generic CMYK Profile.icc'))
srgb=ImageCms.createProfile('sRGB')
cmyk=ImageCms.getOpenProfile(str(profile))
flags=ImageCms.Flags.BLACKPOINTCOMPENSATION
to_print=ImageCms.buildTransform(srgb,cmyk,'RGB','CMYK',renderingIntent=1,flags=flags)
to_screen=ImageCms.buildTransform(cmyk,srgb,'CMYK','RGB',renderingIntent=1,flags=flags)
icc=ImageCms.ImageCmsProfile(srgb).tobytes()
# Deliberate process-ink choices, not a saturation filter on the proof image.
# Both logo and layout pinks share clean magenta; lime trades hue slightly for chroma.
palette=np.array([[41,21,31],[255,250,244],[245,47,151],[176,254,61],[234,0,139],[150,245,1]],dtype=np.float32)
swatches=Image.fromarray(palette.astype('uint8').reshape(1,-1,3))
automatic=np.asarray(ImageCms.applyTransform(swatches,to_print),dtype=np.float32).reshape(-1,4)
chosen=automatic.copy()
chosen[[2,4]]=[0,255,0,0]  # 0 / 100 / 0 / 0
chosen[[3,5]]=[round(.30*255),0,255,0]  # 30 / 0 / 100 / 0
delta=chosen-automatic

def adjusted_separations(rgb,separated,mask=None):
    pixels=np.asarray(rgb)
    flat=pixels.reshape(-1,3)
    active=np.ones(len(flat),dtype=bool) if mask is None else np.asarray(mask).reshape(-1)>0
    colors,inverse=np.unique(flat[active],axis=0,return_inverse=True)
    colors=colors.astype(np.float32)
    error=np.full(len(colors),np.inf);correction=np.zeros((len(colors),4),dtype=np.float32)
    # Preserve antialiasing and the tinted watermark by interpolating ink changes
    # along the existing palette blends. Unrecognized colors retain their conversion.
    for i in range(len(palette)):
        for j in range(i+1,len(palette)):
            axis=palette[j]-palette[i]
            t=np.clip((colors-palette[i])@axis/(axis@axis),0,1)
            distance=np.sum((colors-(palette[i]+t[:,None]*axis))**2,axis=1)
            use=distance<error
            correction[use]=delta[i]+t[use,None]*(delta[j]-delta[i])
            error[use]=distance[use]
    correction*=np.clip(1-np.sqrt(error)/12,0,1)[:,None]
    corrected=np.asarray(separated,dtype=np.float32).reshape(-1,4).copy()
    change=correction[inverse]
    if mask is not None: change*=np.asarray(mask).reshape(-1)[active,None]/255
    corrected[active]+=change
    corrected=corrected.reshape(*pixels.shape[:2],4)
    return Image.fromarray(np.rint(np.clip(corrected,0,255)).astype('uint8'),'CMYK')
for source in (root/'proof/assets').glob('*-rgb.png'):
    original=Image.open(source).convert('RGBA')
    separated=ImageCms.applyTransform(original.convert('RGB'),to_print)
    proof=ImageCms.applyTransform(separated,to_screen)
    proof.putalpha(original.getchannel('A'))
    proof.save(str(source).replace('-rgb.png','-cmyk.png'),icc_profile=icc)
    adjustment_source=Path(str(source).replace('-rgb.png','-adjustment-source.png'))
    adjusted_original=Image.open(adjustment_source).convert('RGBA') if adjustment_source.exists() else original
    adjusted_rgb=adjusted_original.convert('RGB')
    adjusted_base=ImageCms.applyTransform(adjusted_rgb,to_print)
    mask_path=Path(str(source).replace('-rgb.png','-brand-mask.png'))
    mask=Image.open(mask_path).getchannel('A') if mask_path.exists() else None
    adjusted=ImageCms.applyTransform(adjusted_separations(adjusted_rgb,adjusted_base,mask),to_screen)
    adjusted.putalpha(original.getchannel('A'))
    adjusted.save(str(source).replace('-rgb.png','-adjusted.png'),icc_profile=icc)
    original.save(source,icc_profile=icc)
metadata={'profile':ImageCms.getProfileDescription(cmyk).strip(),'profile_sha256':hashlib.sha256(profile.read_bytes()).hexdigest(),'method':'sRGB → CMYK → sRGB; relative colorimetric; black-point compensation; no paper-white simulation','scope':'Refined flirty set, both sides. Screen comparison only; not production artwork.'}
metadata['adjusted_variant']={'method':'Change brand-color CMYK separations before converting back to sRGB; interpolate changes through existing antialiased edges and watermark blends. Plum and cream retain the automatic conversion.','pink_CMYK_percent':[0,100,0,0],'lime_CMYK_percent':[30,0,100,0],'note':'Exploratory process-color palette. Applies to both supplied logo and layout colors. Not UPS-approved or a fluorescent-ink simulation.'}
metadata['adjusted_variant']['watermark_source_opacity']=0.35
(root/'proof/metadata.json').write_text(json.dumps(metadata,indent=2))
