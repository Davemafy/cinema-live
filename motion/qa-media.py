from pathlib import Path
import subprocess,json,numpy as np
out=Path('out/final');report=[]
for n,frames,dur in [('cinema-opening-final.mp4',120,5),('cinema-outro-final.mp4',240,10),('cinema-combined-final.mp4',372,15.5)]:
 p=out/n;r=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));v=r['streams'][0];a=r['streams'][1]
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-f','null','-'],check=True)
 def frame(k):return np.frombuffer(subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-vf',f'select=eq(n\\,{k})','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']),dtype=np.uint8)
 first,last=frame(0),frame(frames-1)
 audio=np.frombuffer(subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-vn','-f','f32le','-acodec','pcm_f32le','-']),dtype='<f4').reshape(-1,2)
 assert int(v['nb_frames'])==frames and v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='24/1'
 assert a['channels']==2 and a['sample_rate']=='48000'
 assert abs(float(r['format']['duration'])-dur)<.001
 timestamps=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',str(p)]))['frames']
 pts=np.array([float(x['best_effort_timestamp_time']) for x in timestamps]);stepError=float(abs(np.diff(pts)-1/24).max())
 assert len(pts)==frames and abs(pts[0])<.000001 and stepError<.000002
 assert int(last.max())==0
 if n!='cinema-outro-final.mp4':assert int(first.max())==0
 if n=='cinema-combined-final.mp4':
  gap=np.frombuffer(subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-vf','select=between(n\\,120\\,131)','-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-']),dtype=np.uint8)
  assert gap.size==12*1920*1080*3 and int(gap.max())==0
 report.append(dict(name=n,width=v['width'],height=v['height'],fps=v['r_frame_rate'],frames=frames,duration=float(r['format']['duration']),audioCodec=a['codec_name'],channels=a['channels'],sampleRate=a['sample_rate'],firstFrameMax=int(first.max()),lastFrameMax=int(last.max()),peakDBFS=float(20*np.log10(max(abs(audio).max(),1e-9))),audioRMS=float(np.sqrt((audio**2).mean())),maximumFrameStepErrorSeconds=stepError,fullDecode='pass'))
(out/'media-qa.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
