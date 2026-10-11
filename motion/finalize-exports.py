"""Keep deterministic Remotion pictures, set exact-length audio, and join with 12 black frames."""
from pathlib import Path
import subprocess,wave,numpy as np
out=Path('out/final')
def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+args,check=True)
def finish_opening():
 old=out/'cinema-opening-final.mp4';tmp=out/'opening-finalized.mp4'
 run(['-i',str(old),'-i',str(out/'opening-blackout.mp4'),'-i','public/opening.wav','-filter_complex','[0:v]trim=start_frame=0:end_frame=116,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-t','5','-movflags','+faststart',str(tmp)])
 old.rename(out/'opening-before-blackout-fix.mp4');tmp.rename(old)
def finish_outro():
 old=out/'cinema-outro-final.mp4';tmp=out/'outro-finalized.mp4'
 run(['-i',str(old),'-i',str(out/'outro-fold-revised.mp4'),'-i','public/final-outro.wav','-filter_complex','[0:v]trim=start_frame=0:end_frame=36,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=106:end_frame=240,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',str(tmp)])
 old.rename(out/'outro-before-rail-fix.mp4');tmp.rename(old)
def combined():
 chunks=[]
 for n in ['opening','final-outro']:
  with wave.open('public/'+n+'.wav') as w:chunks.append(np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2))
 pcm=np.concatenate([chunks[0],np.zeros((24000,2),dtype='<i2'),chunks[1]])
 with wave.open(str(out/'combined-score.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(pcm.astype('<i2').tobytes())
 run(['-i',str(out/'cinema-opening-final.mp4'),'-i',str(out/'cinema-outro-final.mp4'),'-i',str(out/'combined-score.wav'),'-filter_complex','color=c=black:s=1920x1080:r=24:d=0.5[gap];[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][gap][b]concat=n=3:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-t','15.5','-movflags','+faststart',str(out/'cinema-combined-final.mp4')])
if __name__=='__main__':finish_opening();finish_outro();combined()
