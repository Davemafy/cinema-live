"""Compare user-preferred footage against actual final exports at matched edit points."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess,argparse
out=Path('out/final');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
def frame(path,n):
    target=out/'contact-frame.png'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-vf',f'select=eq(n\\,{n})','-frames:v','1',str(target)],check=True)
    return Image.open(target).convert('RGB').resize((320,180))
def comparison(name,before,after,bframes,aframes,before_label,offset=0):
    sheet=Image.new('RGB',(320*len(bframes),480),'#090b0c');draw=ImageDraw.Draw(sheet)
    for row,(path,frames,label) in enumerate([(before,bframes,before_label),(after,aframes,'AFTER · INTO THE FRAME · RECOMMENDED')]):
        y=row*240;draw.text((12,y+7),label,font=font,fill='#efaa68')
        for k,n in enumerate(frames):
            sheet.paste(frame(path,n),(320*k,y+34));draw.text((320*k+10,y+218),f'{(n-(offset if row==0 else 0))/24:.2f}s',font=font,fill='#aaa49a')
    sheet.save(out/name,quality=95)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('preferred_opening');parser.add_argument('previous_combined');args=parser.parse_args()
    points=[8,18,32,46,58,69,85,105]
    comparison('before-after-opening.jpg',args.preferred_opening,out/'cinema-opening-final.mp4',points,points,'BEFORE · USER-PREFERRED OPENING')
    points=[0,40,60,82,103,120,166,195]
    comparison('before-after-outro.jpg',args.previous_combined,out/'cinema-outro-final.mp4',[132+n for n in points],points,'BEFORE · ATTACHED COMBINED / OUTRO',132)
    for movie,name,frames in [('cinema-opening-final.mp4','opening-final-contact.jpg',[0,8,16,24,32,40,48,56,64,72,80,88,96,104,112]),('cinema-outro-final.mp4','outro-final-contact.jpg',[0,24,36,48,60,72,82,90,98,105,110,120,138,150,166,182,195,210,225,239])]:
        sheet=Image.new('RGB',(384*5,244*((len(frames)+4)//5)),'#070809');draw=ImageDraw.Draw(sheet)
        for k,n in enumerate(frames):
            x=k%5*384;y=k//5*244;sheet.paste(frame(out/movie,n).resize((384,216)),(x,y));draw.text((x+8,y+220),f'{n/24:.2f}s · {n}',font=font,fill='#bbb4aa')
        sheet.save(out/name,quality=95)
