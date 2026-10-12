"""Final submission film from actual B/C media and captured CINEMA UI; no simulated generation."""
from pathlib import Path
import json,subprocess,tempfile,hashlib
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'submission/assets';ASSETS.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'public/demo-performance.mp4'
B=ROOT/'docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4'
ABC=ROOT/'docs/evidence/subject-aware-v1/comparison-abc.mp4'
REF=ROOT/'docs/evidence/preservation-v1/ai-reference.png'
CAPTURE=ROOT/'artifacts/final-demo'
FONT=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')

def run(args):subprocess.run(['ffmpeg','-v','error','-nostdin',*map(str,args)],check=True,timeout=180)

def main():
    recording=Path((CAPTURE/'capture-path.txt').read_text())
    out=ASSETS/'cinema-final-demo.mp4'
    if out.exists():raise RuntimeError('Preserve the existing final film; choose a new output name')
    segments=[
      (14,'pair','Record one performance. Explore a cinematic treatment.','Original performance','B / AI-directed appearance transfer','Preserve the take. Compare and export the film. Actual offline showcase.'),
      (16,'app','CINEMA / actual upload, preview, comparison and export','','','Local app footage; reopens a completed IC-Light job. Not live generation.'),
      (10,'reference','Image AI proposes the visual direction.','Actual source frame','Genuine AI-generated reference','Generated faces are excluded. The film keeps the original performance.'),
      (12,'pair','Source detail and movement stay in the film.','Original performance','B / primary showcase','Bounded illumination field + optical flow + source-frame compositing.'),
      (10,'abc','Subject-aware processing is real, but still experimental.','','','C: real IC-Light + moving masks. Matte artifacts remain; B is stronger.'),
      (12,'result','A genuine local render completed and exported.','','','Actual app capture of a previously completed job. CPU processing: 344.7 s.'),
      (8,'pair','CINEMA / Banana Hacks 2026','Original performance','Primary offline showcase','Public studio deployed; reliable public source-aware GPU serving pending.'),
    ]
    with tempfile.TemporaryDirectory(prefix='cinema-final-demo-') as folder:
      tmp=Path(folder);parts=[]
      for i,(seconds,kind,title,left,right,caption) in enumerate(segments):
        text={'brand':'CINEMA','title':title,'left':left,'right':right,'caption':caption,
              'scope':'Actual footage / offline examples explicitly disclosed | ARTSEDGE, The Kennedy Center / CC BY 3.0'}
        for name,value in text.items():(tmp/(name+'.txt')).write_text(value)
        args=[]
        if kind in ('pair','reference'):
          if kind=='reference':
            frame=tmp/'source-frame.png';run(['-i',SOURCE,'-frames:v','1','-y',frame]);args=['-loop','1','-i',frame,'-loop','1','-i',REF]
          else:args=['-stream_loop','-1','-i',SOURCE,'-stream_loop','-1','-i',B]
          filt='[0:v]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:black,fps=24[a];[1:v]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:black,fps=24[b];[a][b]hstack,pad=1280:720:0:180:color=0x141414'
        elif kind=='abc':
          args=['-stream_loop','-1','-i',ABC];filt='[0:v]scale=1280:267,pad=1280:720:0:220:color=0x141414,fps=24'
        else:
          # Actual recorded UI. No scripted fake render, fake progress or stock result.
          start=2 if kind=='app' else max(0,float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(recording)]))['format']['duration'])-13)
          args=['-stream_loop','-1','-ss',str(start),'-i',recording]
          filt='[0:v]scale=740:520:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:160:color=0x141414,fps=24'
        labels=[('brand',32,24,24,'0xdba678'),('title',32,68,26,'white'),('caption',32,606,17,'white'),('scope',32,680,12,'0xbababa')]
        if kind in ('pair','reference'):labels += [('left',32,147,18,'white'),('right',672,147,18,'white')]
        for name,x,y,size,color in labels:filt+=f',drawtext=fontfile={FONT}:textfile={tmp/(name+".txt")}:x={x}:y={y}:fontsize={size}:fontcolor={color}'
        part=tmp/f'{i}.mp4';parts.append(part)
        run([*args,'-filter_complex',filt+'[v]','-map','[v]','-t',seconds,'-an','-c:v','libx264','-threads','2','-crf','26','-preset','fast','-pix_fmt','yuv420p',part])
      listing=tmp/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in parts))
      run(['-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',out])
    run(['-i',out,'-f','null','-'])
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(out)]))
    duration=float(meta['format']['duration']);assert duration<180
    report={'durationSeconds':duration,'first20Seconds':'Original/B actual film and core promise with offline disclosure','primaryShowcase':'B; C technical evidence only','actualAppCapture':json.loads((CAPTURE/'capture-provenance.json').read_text()),'demoSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'showcaseSha256':hashlib.sha256(B.read_bytes()).hexdigest(),'decodedAllFrames':True,'publicLiveSourceAwareRenderingVerified':False,'devpostSubmitted':False}
    (ASSETS/'demo-provenance.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'durationSeconds':duration,'bytes':out.stat().st_size,'sha256':report['demoSha256']}))

if __name__=='__main__':main()
