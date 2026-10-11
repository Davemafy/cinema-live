#!/usr/bin/env bash
set -euo pipefail
for experiment in A B C; do
 ffmpeg -y -i "out/reconstruction/experiment-$experiment.mp4" -map 0:v:0 -c:v copy -an -t 2 -movflags +faststart "out/reconstruction/experiment-$experiment-final.mp4" -loglevel error
 mv "out/reconstruction/experiment-$experiment-final.mp4" "out/reconstruction/experiment-$experiment.mp4"
done
for name in opening ending; do
 duration=5
 target=opening-v2
 if [ "$name" = ending ]; then duration=4; target=ending-placeholder-v2; fi
 ffmpeg -y -i "out/reconstruction/$target.mp4" -i "public/$name.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t "$duration" -movflags +faststart "out/reconstruction/$target-final.mp4" -loglevel error
 mv "out/reconstruction/$target-final.mp4" "out/reconstruction/$target.mp4"
done
ffmpeg -y -i out/reconstruction/opening-v2.mp4 -i out/reconstruction/ending-placeholder-v2.mp4 -filter_complex '[0:v]trim=end_frame=120,setpts=PTS-STARTPTS,tpad=stop_mode=add:stop=12:color=black[v0];[0:a]atrim=duration=5,asetpts=PTS-STARTPTS,apad=pad_dur=0.5,atrim=duration=5.5[a0];[1:v]trim=end_frame=96,setpts=PTS-STARTPTS[v1];[1:a]atrim=duration=4,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]' -map '[v]' -map '[a]' -frames:v 228 -t 9.5 -r 24 -c:v libx264 -crf 17 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/reconstruction/combined-preview-v2.mp4 -loglevel error
