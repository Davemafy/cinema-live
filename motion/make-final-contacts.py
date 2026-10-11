from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess
out=Path('out/final');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
def frame(path,n):
 p=out/'contact-frame.png';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-vf',f'select=eq(n\\,{n})','-frames:v','1',str(p)],check=True);return Image.open(p).convert('RGB').resize((384,216))
def comparison(name,before,after,bframes,aframes):
 sheet=Image.new('RGB',(384*len(bframes),560),'#090b0c');d=ImageDraw.Draw(sheet)
 for row,(path,frames,label) in enumerate([(before,bframes,'BEFORE · V2'),(after,aframes,'AFTER · THE FINAL FRAME')]):
  y=row*280;d.text((12,y+8),label,font=font,fill='#efaa68')
  for k,n in enumerate(frames):sheet.paste(frame(path,n),(384*k,y+40));d.text((384*k+10,y+258),f'{n/24:.2f}s · frame {n}',font=font,fill='#aaa49a')
 sheet.save(out/name,quality=94)
comparison('before-after-opening.jpg','/workspace/scratch/42fb3c8c13eb/delivery/opening-v2.mp4',out/'cinema-opening-final.mp4',[8,24,48,72,88,105],[8,24,48,72,88,105])
comparison('before-after-outro.jpg','/workspace/scratch/42fb3c8c13eb/delivery/ending-placeholder-v2.mp4',out/'cinema-outro-final.mp4',[0,24,36,48,64,84],[0,60,82,101,166,195])
