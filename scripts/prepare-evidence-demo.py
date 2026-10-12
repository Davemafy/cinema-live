"""Actual offline evidence montage, 56 seconds. No simulated application states."""
from pathlib import Path
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/"docs/evidence/preservation-v1"
SOURCE=ROOT/"public/demo-performance.mp4"
FILM=EVIDENCE/"treated-source.mp4"
REFERENCE=EVIDENCE/"ai-reference.png"
FONT=Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")


def main():
    if not FONT.is_file():raise RuntimeError("Install DejaVu Sans before encoding the evidence demo")
    target=EVIDENCE/"cinema-evidence-demo.mp4"
    if target.exists():raise RuntimeError("Keep the prior demo; do not overwrite evidence")
    segments=[
        (12,"Record one performance. Explore a cinematic treatment.",
         "Original take", "AI-derived treatment on original frames",
         "A filmmaker can explore a scene's visual direction without restaging the performance.",False),
        (12,"Image AI establishes the visual direction.",
         "Original source frame", "Actual generated appearance reference",
         "Warm amber key, cool edge light, subdued ambience. Generated faces and poses are excluded.",True),
        (12,"Preserve the performance. Transfer the direction.",
         "Original take", "Same source frames, directed appearance",
         "Linear-light gain field + confidence-checked optical flow. Original geometry and detail remain.",False),
        (12,"Compare the source and result, and download the film.",
         "Original take", "Validated MP4: 854 x 480, 120 frames",
         "Original dimensions and 23.976 fps. This source is silent; AAC source audio is copied when present.",False),
        (8,"CINEMA — verified offline quality experiment",
         "Original take", "Source-preserving cinematic finish",
         "Live image-AI integration pending. Wan reimagining is experimental. Source: ARTSEDGE, CC BY 3.0.",False),
    ]
    with tempfile.TemporaryDirectory(prefix="cinema-demo-") as folder:
        tmp=Path(folder);clips=[]
        for index,(seconds,title,left,right,caption,still) in enumerate(segments):
            texts={"title":title,"left":left,"right":right,"caption":caption,
                   "brand":"CINEMA","scope":"Verified offline experiment | actual source-derived film"}
            for name,text in texts.items():(tmp/(name+".txt")).write_text(text)
            args=["ffmpeg","-v","error","-nostdin"]
            if still:
                # Extract the actual source frame; keep generated image disclosed.
                original=tmp/"source-frame.png"
                subprocess.run(["ffmpeg","-v","error","-i",str(SOURCE),"-frames:v","1","-y",str(original)],check=True)
                args.extend(["-loop","1","-i",str(original),"-loop","1","-i",str(REFERENCE)])
            else:
                args.extend(["-stream_loop","-1","-i",str(SOURCE),"-stream_loop","-1","-i",str(FILM)])
            filters=("[0:v]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:black,fps=24[a];"
                     "[1:v]scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:black,fps=24[b];"
                     "[a][b]hstack,pad=1280:720:0:180:color=0x141414")
            for name,x,y,size,color in [("brand",32,26,26,"0xdba678"),("title",32,78,27,"white"),
                                       ("left",32,145,20,"white"),("right",672,145,20,"white"),
                                       ("caption",32,590,17,"white"),("scope",32,665,16,"0xbababa")]:
                filters+=f",drawtext=fontfile={FONT}:textfile={tmp/(name+'.txt')}:x={x}:y={y}:fontsize={size}:fontcolor={color}"
            clip=tmp/f"part-{index}.mp4";clips.append(clip)
            args.extend(["-filter_complex",filters+"[v]","-map","[v]","-t",str(seconds),"-an",
                         "-c:v","libx264","-threads","2","-crf","20","-preset","fast","-pix_fmt","yuv420p",str(clip)])
            subprocess.run(args,check=True,timeout=180)
        listing=tmp/"concat.txt"
        listing.write_text("".join(f"file '{clip}'\n" for clip in clips))
        subprocess.run(["ffmpeg","-v","error","-f","concat","-safe","0","-i",str(listing),
                        "-c","copy","-movflags","+faststart",str(target)],check=True,timeout=120)
    subprocess.run(["ffmpeg","-v","error","-i",str(target),"-f","null","-"],check=True,timeout=120)
    print("Actual evidence demo saved:",target)


if __name__=="__main__":main()
