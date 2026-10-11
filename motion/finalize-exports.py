"""Keep complete Remotion pictures, mux exact score lengths, add 12 black frames."""
from pathlib import Path
import subprocess,wave,numpy as np
out=Path('out/final')
def run(args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+args,check=True)
def mux(name,score,seconds):
    movie=out/name;temporary=out/('mux-'+name)
    run(['-i',str(movie),'-i','public/'+score+'.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(seconds),'-movflags','+faststart',str(temporary)])
    movie.rename(out/('remotion-'+name));temporary.rename(movie)
def revise_gate():
    movie=out/'cinema-opening-final.mp4';temporary=out/'gate-assembled.mp4'
    if not (out/'opening-gate-revised.mp4').exists():return
    run(['-i',str(movie),'-i',str(out/'opening-gate-revised.mp4'),'-filter_complex',
         '[0:v]trim=start_frame=0:end_frame=70,setpts=PTS-STARTPTS[a];'
         '[1:v]setpts=PTS-STARTPTS[b];'
         '[0:v]trim=start_frame=96:end_frame=120,setpts=PTS-STARTPTS[c];'
         '[a][b][c]concat=n=3:v=1:a=0[v]',
         '-map','[v]','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24',str(temporary)])
    movie.rename(out/'opening-before-edge-light.mp4');temporary.rename(movie)
def revise_outro():
    if not (out/'outro-tail-revised.mp4').exists():return
    run(['-i',str(out/'outro-preserved-body.mp4'),'-i',str(out/'outro-tail-revised.mp4'),
         '-filter_complex','[0:v]trim=start_frame=0:end_frame=106,setpts=PTS-STARTPTS[a];'
         '[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]',
         '-map','[v]','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-r','24',
         str(out/'cinema-outro-final.mp4')])
def combined():
    chunks=[]
    for score in ['directed-opening','final-outro']:
        with wave.open('public/'+score+'.wav') as source:
            assert source.getframerate()==48000 and source.getnchannels()==2
            chunks.append(np.frombuffer(source.readframes(source.getnframes()),dtype='<i2').reshape(-1,2))
    pcm=np.concatenate([chunks[0],np.zeros((24000,2),dtype='<i2'),chunks[1]])
    with wave.open(str(out/'combined-score.wav'),'wb') as target:
        target.setnchannels(2);target.setsampwidth(2);target.setframerate(48000);target.writeframes(pcm.astype('<i2').tobytes())
    run(['-f','lavfi','-i','color=c=black:s=1920x1080:r=24:d=0.5','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-frames:v','12','-an',str(out/'black-separation.mp4')])
    for name in ['opening','outro']:
        run(['-i',str(out/('cinema-'+name+'-final.mp4')),'-map','0:v:0','-c:v','copy','-an',str(out/(name+'-picture.mp4'))])
    listing=out/'join-final.txt'
    listing.write_text(''.join("file '"+str((out/name).resolve())+"'\nduration "+str(duration)+"\n" for name,duration in [('opening-picture.mp4',5),('black-separation.mp4',.5),('outro-picture.mp4',10)]))
    run(['-f','concat','-safe','0','-i',str(listing),'-i',str(out/'combined-score.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','15.5','-movflags','+faststart',str(out/'cinema-combined-final.mp4')])

if __name__=='__main__':
    revise_gate()
    revise_outro()
    mux('cinema-opening-final.mp4','directed-opening',5)
    mux('cinema-outro-final.mp4','final-outro',10)
    combined()
