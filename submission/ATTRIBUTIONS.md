# Media, model and code attribution

Performance: ARTSEDGE, The Kennedy Center, Charleston-dance.webm.
https://commons.wikimedia.org/wiki/File:Charleston-dance.webm
CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
CINEMA excerpted seconds 8–13, transcoded to H.264 and removed audio. Other short
excerpts are taken from that clip for real upload tests. Media adaptations are
shared under CC BY 3.0. Source authors do not endorse CINEMA.

Primary showcase B: the owner's actual appearance-transfer MP4, source frames
modulated using a real OpenAI image-generation reference and optical flow. Exact
provenance/prompt: docs/evidence/preservation-v1/ai-provenance.json. The tool did
not expose a specific model identifier; no one is invented here.

Experimental C: actual IC-Light (lllyasviel/ic-light) foreground conditioning,
SD1.5 realistic-vision-v51 and torchvision LRASPP-MobileNetV3 COCO/VOC person
segmentation. Pinned checkpoints, input/output hashes and actual execution are
recorded under docs/evidence/subject-aware-v1. IC-Light code is Apache-2.0;
torchvision code is BSD-3-Clause. The SD base card specifies CreativeML Open
RAIL-M. Code licensing alone does not establish unrestricted checkpoint licensing;
consult model terms before commercial use.

LTX: Lightricks. Wan VACE: its upstream authors; previous experiments are retained
and attributed in the repository. CINEMA did not train these models. No new Wan
render or GPU execution of C is claimed during this sprint.

Final demo: actual source/result media and screen-recorded CINEMA application.
B is explicitly an offline showcase. The app sequence reopens a previously
completed genuine local IC-Light job; it does not simulate live generation. C is
experimental and is not presented as finished cinematic lighting. No stock result,
generated promotional substitute, unlicensed music or fabricated processing state
is included. Repository code retains its existing license.
