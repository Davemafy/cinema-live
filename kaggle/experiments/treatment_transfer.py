"""Transfer an inspected AI keyframe's low-frequency appearance to SOURCE frames.

Not a physical relighter or video diffusion model. No frame/identity synthesis.
Requires a real AI reference plus provenance; no fake or default generated image.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from fractions import Fraction
from pathlib import Path
import subprocess
import time

import cv2
import numpy as np


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def run(command):
    result = subprocess.run([str(x) for x in command], capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace")[-4000:])
    return result.stdout


def probe(path):
    return json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path]))


def read_video(path):
    info = probe(path)
    streams = [s for s in info["streams"] if s["codec_type"] == "video"]
    if len(streams) != 1:
        raise RuntimeError("Expected exactly one video stream")
    stream = streams[0]
    width, height = stream["width"], stream["height"]
    fps = Fraction(stream["avg_frame_rate"])
    rate = Fraction(stream["r_frame_rate"])
    if not fps or abs(float(fps - rate)) > 0.01:
        raise RuntimeError("Variable-rate input: normalize timing first; this prototype accepts constant-rate video")
    if any(d.get("rotation", 0) for d in stream.get("side_data_list", [])):
        raise RuntimeError("Normalize rotation metadata first; do not silently crop or rotate this reference")
    if width % 2 or height % 2 or width*height > 1920*1080:
        raise RuntimeError("Prototype requires even dimensions at or below 1080p; no automatic downscaling")
    duration = float(info["format"]["duration"])
    if duration > 10 or duration <= 0:
        raise RuntimeError("Prototype input must be a real video of ten seconds or less")
    raw = run(["ffmpeg", "-v", "error", "-nostdin", "-threads", "2", "-i", path,
               "-map", "0:v:0", "-an", "-fps_mode", "passthrough", "-pix_fmt", "rgb24", "-f", "rawvideo", "pipe:1"])
    size = width*height*3
    if len(raw) % size or not raw:
        raise RuntimeError("Invalid raw frame count")
    frames = np.frombuffer(raw, np.uint8).reshape(-1,height,width,3)
    if len(frames) > 300:
        raise RuntimeError("Prototype frame limit is 300")
    return frames, fps, info


def linear(rgb):
    x = rgb.astype(np.float32)/255
    return np.where(x <= 0.04045, x/12.92, ((x+0.055)/1.055)**2.4)


def srgb(rgb):
    x = np.clip(rgb,0,1)
    out = np.where(x <= 0.0031308, 12.92*x, 1.055*np.power(x,1/2.4)-0.055)
    return np.rint(out*255).astype(np.uint8)


def derive_gain(original, reference):
    if original.shape != reference.shape:
        raise RuntimeError("Reference must match source geometry")
    sigma = max(6, original.shape[1]/48)
    a = cv2.GaussianBlur(linear(original),(0,0),sigma)
    b = cv2.GaussianBlur(linear(reference),(0,0),sigma)
    return np.clip(np.log((b+0.02)/(a+0.02)),-1.6,0.9).astype(np.float32)


def shade(original, log_gain):
    # Original high-frequency pixels are retained, modulated by a smooth field.
    x = linear(original)*np.exp(log_gain)
    hot = float((x > 1).mean())
    # Only compress highlights above 0.98. Identity treatment remains bit-exact
    # for all ordinary values, and original saturated pixels stay saturated.
    shoulder = np.where((x > .98)&(log_gain>0), .98+.02*(1-np.exp(-np.maximum(x-.98,0)/.02)), x)
    return srgb(shoulder), hot


def tracking_step(previous, current, previous_gain, anchor_gain):
    h,w = current.shape[:2]
    flow_w = min(w,512)
    flow_h = max(16,round(h*flow_w/w))
    size = (flow_w,flow_h)
    a = cv2.resize(cv2.cvtColor(previous,cv2.COLOR_RGB2GRAY),size)
    b = cv2.resize(cv2.cvtColor(current,cv2.COLOR_RGB2GRAY),size)
    back = cv2.calcOpticalFlowFarneback(b,a,None,.5,3,21,3,5,1.2,0)
    forward = cv2.calcOpticalFlowFarneback(a,b,None,.5,3,21,3,5,1.2,0)
    yy,xx = np.mgrid[0:flow_h,0:flow_w].astype(np.float32)
    mx,my = xx+back[...,0],yy+back[...,1]
    roundtrip = back+cv2.remap(forward,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    residual = b.astype(np.float32)-cv2.remap(a,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT).astype(np.float32)
    valid = ((mx>=0)&(mx<flow_w-1)&(my>=0)&(my<flow_h-1)).astype(np.float32)
    confidence = valid*np.exp(-np.sum(roundtrip**2,axis=2)/4)*np.exp(-residual**2/1600)
    # Warp only the low-frequency treatment; NEVER warp original output pixels.
    full_back = cv2.resize(back,(w,h))
    full_back[...,0] *= w/flow_w
    full_back[...,1] *= h/flow_h
    fy,fx = np.mgrid[0:h,0:w].astype(np.float32)
    warped = cv2.remap(previous_gain,fx+full_back[...,0],fy+full_back[...,1],cv2.INTER_LINEAR,
                       borderMode=cv2.BORDER_REFLECT)
    weight = cv2.resize(confidence,(w,h))[...,None]*.98
    mixed = warped*weight+anchor_gain*(1-weight)
    mixed = cv2.GaussianBlur(mixed,(0,0),max(2,w/250))
    return mixed, float(confidence.mean())


def write_movie(path,source,fps,frames,info):
    h,w = frames[0].shape[:2]
    audio = next((s for s in info["streams"] if s["codec_type"]=="audio"),None)
    codec = "copy" if audio and audio.get("codec_name")=="aac" else "aac"
    command = ["ffmpeg","-v","error","-nostdin","-f","rawvideo","-pix_fmt","rgb24",
               "-s",f"{w}x{h}","-r",str(fps),"-i","pipe:0","-i",str(source),
               "-map","0:v:0","-map","1:a:0?","-c:v","libx264","-threads","2",
               "-crf","18","-preset","medium","-pix_fmt","yuv420p","-c:a",codec]
    if codec != "copy": command.extend(["-b:a","192k"])
    command.extend(["-shortest","-movflags","+faststart","-n",str(path)])
    process = subprocess.Popen(command,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for frame in frames: process.stdin.write(frame.tobytes())
        process.stdin.close()
        error = process.stderr.read().decode(errors="replace")
        code = process.wait(timeout=120)
    except Exception:
        process.kill(); process.wait(); raise
    finally:
        if not process.stdin.closed:process.stdin.close()
        process.stderr.close()
    if code: raise RuntimeError("Export failed: "+error[-4000:])
    return "AAC stream copy" if codec=="copy" else ("AAC transcode" if audio else "source has no audio")


def panels(source,result,out):
    from PIL import Image,ImageDraw
    h,w = source[0].shape[:2]
    thumb_w = min(w,640); thumb_h = round(h*thumb_w/w)
    selected = [0,len(source)//2,len(source)-1]
    strips = []
    for i in selected:
        panel = Image.new("RGB",(thumb_w*2,thumb_h+36),"#151515")
        draw = ImageDraw.Draw(panel)
        draw.text((8,9),f"SOURCE | frame {i}",fill="white")
        draw.text((thumb_w+8,9),"AI-derived treatment on source pixels",fill="white")
        for col,im in enumerate((source[i],result[i])):
            panel.paste(Image.fromarray(im).resize((thumb_w,thumb_h)),(col*thumb_w,36))
        panel.save(out/f"comparison-{i:03d}.png");strips.append(panel)
    sheet = Image.new("RGB",(strips[0].width,strips[0].height*3))
    for i,strip in enumerate(strips):sheet.paste(strip,(0,i*strip.height))
    sheet.save(out/"comparison-contact-sheet.jpg",quality=95)
    # Every frame can be reviewed; this is source-derived media, not a fixture.
    columns=10; rows=(len(result)+columns-1)//columns
    tw=170;th=round(h*tw/w)
    all_frames=Image.new("RGB",(tw*columns,(th+20)*rows),"#111111")
    draw=ImageDraw.Draw(all_frames)
    for i,frame in enumerate(result):
        x,y=(i%columns)*tw,(i//columns)*(th+20)
        all_frames.paste(Image.fromarray(frame).resize((tw,th)),(x,y+20))
        draw.text((x+3,y+3),str(i),fill="white")
    all_frames.save(out/"every-frame.jpg",quality=95)


def transfer(source_path,reference_path,provenance_path,out,anchor=0):
    start=time.monotonic()
    if out.exists():raise RuntimeError("Keep prior evidence; choose a new output folder")
    provenance=json.loads(Path(provenance_path).read_text())
    for field in ["imageAiProvider","imageAiModel","imageAiPrompt","sourceSha256","referenceSha256"]:
        if not provenance.get(field):raise RuntimeError("Missing real AI provenance: "+field)
    if provenance["sourceSha256"]!=digest(source_path) or provenance["referenceSha256"]!=digest(reference_path):
        raise RuntimeError("AI reference/source provenance hash mismatch")
    if provenance.get("anchorFrame",0)!=anchor or not provenance.get("visuallyReviewed"):
        raise RuntimeError("Review the exact AI anchor before propagation and record that review")
    source,fps,info=read_video(source_path)
    if not 0<=anchor<len(source):raise RuntimeError("Anchor index outside source")
    loaded=cv2.imread(str(reference_path))
    if loaded is None:raise RuntimeError("AI reference image could not be decoded")
    ref=cv2.cvtColor(loaded,cv2.COLOR_BGR2RGB)
    h,w=source[anchor].shape[:2]
    if abs(ref.shape[1]/ref.shape[0]-w/h)>.02:
        raise RuntimeError("AI keyframe aspect changed; reject instead of cropping/stretching")
    ref=cv2.resize(ref,(w,h),interpolation=cv2.INTER_AREA)
    gain=derive_gain(source[anchor],ref)
    output=[None]*len(source); clipping=[];confidence=[]
    output[anchor],hot=shade(source[anchor],gain);clipping.append(hot)
    for direction in (1,-1):
        previous=anchor; field=gain.copy()
        for i in range(anchor+direction,len(source) if direction==1 else -1,direction):
            field,conf=tracking_step(source[previous],source[i],field,gain)
            output[i],hot=shade(source[i],field)
            clipping.append(hot);confidence.append(conf);previous=i
            if i%24==0:print(f"SOURCE FRAME {i+1}/{len(source)} | flow confidence {conf:.3f}",flush=True)
    out.mkdir(parents=True)
    audio=write_movie(out/"treated-source.mp4",source_path,fps,output,info)
    result,_fps,result_info=read_video(out/"treated-source.mp4")
    if result.shape!=source.shape or _fps!=fps:raise RuntimeError("Export changed source frame count/dimensions/timing")
    run(["ffmpeg","-v","error","-i",out/"treated-source.mp4","-f","null","-"])
    panels(source,result,out)
    report={"mode":"AI-derived low-frequency illumination/color transfer; not physical relighting",
            "videoDiffusionUsed":False,"originalFramesUsed":True,"sourceGeometryAndDetailRetained":True,"noFrameSynthesis":True,
            "sourceFrames":len(source),"outputFrames":len(result),"width":w,"height":h,"fps":str(fps),
            "audio":audio,"seconds":round(time.monotonic()-start,3),"anchorFrame":anchor,
            "meanFlowConfidence":float(np.mean(confidence)),"meanPreShoulderClippedChannelFraction":float(np.mean(clipping)),
            "sourceSha256":digest(source_path),"outputSha256":digest(out/"treated-source.mp4"),
            "referenceSha256":digest(reference_path),"imageAi":provenance,"opencv":cv2.__version__,
            "visualReviewOfVideo":"pending","knownLimits":"2D appearance transfer; occlusions/drift; no new geometry or atmosphere synthesis"}
    (out/"run.json").write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2),flush=True)
    return report


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source",required=True);parser.add_argument("--reference",required=True)
    parser.add_argument("--provenance",required=True);parser.add_argument("--out",required=True)
    parser.add_argument("--anchor",type=int,default=0)
    args=parser.parse_args()
    transfer(args.source,args.reference,args.provenance,Path(args.out),args.anchor)
