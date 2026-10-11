# Subject-aware evidence: attribution and scope

Source: ARTSEDGE, The Kennedy Center, Charleston-dance.webm, CC BY 3.0.
https://commons.wikimedia.org/wiki/File:Charleston-dance.webm
https://creativecommons.org/licenses/by/3.0/
CINEMA's existing excerpt is seconds 8–13, H.264-transcoded, with audio removed.
The alternate fresh-input test uses a different 2-second portion of that excerpt.
The source author does not endorse CINEMA. These media adaptations are shared
under CC BY 3.0; code retains the repository code license.

B: actual appearance-transfer MP4 supplied by the owner, generated using the
previous session image-AI appearance reference. Historical provenance and prompt
remain in ../preservation-v1/ai-provenance.json. It is not a Wan/LTX output.

C: actual source-conditioned local IC-Light reference, learned automatic moving
person masks, optical-flow transport and source-frame compositing. Original
frames supply faces, clothing and motion. The new IC-Light reference's generated
faces and background are not inserted into the film. Actual pinned models and
measured execution are recorded in reference.json and run.json.

Models: lllyasviel/IC-Light foreground-conditioned checkpoint + SD1.5
stablediffusionapi/realistic-vision-v51; torchvision LRASPP-MobileNetV3-Large
COCO/VOC person segmentation. IC-Light code is Apache-2.0; the base model card
specifies CreativeML Open RAIL-M. The code license does not establish unrestricted
checkpoint licensing: consult weight terms before commercial deployment.
Torchvision code is BSD-3-Clause. No SAM weights were used. CINEMA did not train
or invent these model capabilities; the contribution is orchestration,
structure-conditioned compositing, temporal transport, comparison and export.

This is an experimental offline A/B/C comparison with real inference, not a
prerecorded substitute for a visitor's fresh job. Matte halos/border changes
remain; overall superiority over B is not established. It is not physically
accurate relighting. The separately recorded fresh-upload test genuinely ran a
new reference and was verified through the local app, not public production.
