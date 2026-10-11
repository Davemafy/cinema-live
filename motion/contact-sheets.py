from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,io
out=Path('out/reconstruction')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
def frame(file,t):
 b=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(file),'-frames:v','1','-f','image2pipe','-vcodec','png','-'])
 return Image.open(io.BytesIO(b)).convert('RGB').resize((640,360),Image.Resampling.LANCZOS)
def sheet(file,name,times):
 canvas=Image.new('RGB',(1920,840),'#070a0c');d=ImageDraw.Draw(canvas);d.text((28,16),name,font=font,fill='#f0efea')
 for i,t in enumerate(times):
  x=i%3*640;y=60+i//3*390;canvas.paste(frame(file,t),(x,y));d.text((x+14,y+365),f'{t:.2f}s / frame {round(t*24)}',font=small,fill='#b2b4b5')
 canvas.save(out/(name.split(' ')[0]+'.jpg'),quality=94)
for k,label in [('A','Physical ribbon'),('B','Macro to wide camera'),('C','Lens crossing identity')]:sheet(out/f'experiment-{k}.mp4',f'experiment-{k}-contact {label}',[0,.333,.667,1,1.333,1.667])
if (out/'opening-v2.mp4').exists():sheet(out/'opening-v2.mp4','opening-contact Darkness to identity',[.333,1,2,3,3.833,4.5])

if (out/"ending-placeholder-v2.mp4").exists():sheet(out/"ending-placeholder-v2.mp4","ending-contact Image shutter to identity",[0,.667,1.333,2,2.667,3.5])

if (out/'before.mp4').exists() and (out/'opening-v2.mp4').exists():
 canvas=Image.new('RGB',(1920,880),'#090b0d');d=ImageDraw.Draw(canvas)
 for row,(name,label) in enumerate([('before.mp4','BEFORE · seven strips, shallow framing, detached reveal'),('opening-v2.mp4','AFTER · solid hero film, macro to wide, lens crossing reveal')]):
  d.text((20,row*440+12),label,font=font,fill='#f0efea')
  for col,t in enumerate([1,2.5,4.5]):
   canvas.paste(frame(out/name,t),(col*640,row*440+52));d.text((col*640+14,row*440+413),str(t)+'s',font=small,fill='#aaa')
 canvas.save(out/'before-after.jpg',quality=94)
