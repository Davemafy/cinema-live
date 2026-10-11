"""Deadline contingency: preferred opening plus optical-matte ending; keep native pictures."""
from pathlib import Path
import argparse,subprocess,shutil,wave,numpy as np

def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+args,check=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('preferred_opening');a=p.parse_args();out=Path('out/demo');out.mkdir(parents=True,exist_ok=True)
 shutil.copy2(a.preferred_opening,out/'cinema-demo-opening.mp4')
 raw=out/'cinema-demo-outro.mp4';tmp=out/'mux-outro.mp4'
 run(['-i',str(raw),'-i','public/final-outro.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',str(tmp)])
 raw.rename(out/'remotion-demo-outro.mp4');tmp.rename(raw)
 run(['-i',str(out/'cinema-demo-opening.mp4'),'-vn','-ar','48000','-ac','2',str(out/'preferred-score.wav')])
 chunks=[]
 for score in [out/'preferred-score.wav',Path('public/final-outro.wav')]:
  with wave.open(str(score)) as w:chunks.append(np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2))
 chunks[0]=chunks[0][:240000];assert len(chunks[0])==240000 and len(chunks[1])==480000
 with wave.open(str(out/'demo-score.wav'),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(np.concatenate([chunks[0],np.zeros((24000,2),dtype='<i2'),chunks[1]]).astype('<i2').tobytes())
 for name in ['opening','outro']:run(['-i',str(out/('cinema-demo-'+name+'.mp4')),'-map','0:v','-c:v','copy','-an','-video_track_timescale','90000',str(out/(name+'-picture.mp4'))])
 run(['-f','lavfi','-i','color=c=black:s=1920x1080:r=24:d=0.5','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-frames:v','12','-an','-video_track_timescale','90000',str(out/'gap.mp4')])
 listing=out/'join.txt';listing.write_text(''.join("file '"+str((out/name).resolve())+"'\nduration "+str(d)+"\n" for name,d in [('opening-picture.mp4',5),('gap.mp4',.5),('outro-picture.mp4',10)]))
 run(['-f','concat','-safe','0','-i',str(listing),'-i',str(out/'demo-score.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t','15.5','-movflags','+faststart',str(out/'cinema-demo-combined.mp4')])

 run(['-ss','4.5','-i',str(out/'cinema-demo-outro.mp4'),'-t','3','-vf','fade=t=out:st=2.6:d=0.35','-af','afade=t=out:st=2.6:d=0.35','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24','-video_track_timescale','90000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out/'cinema-demo-credit-3s.mp4')])
