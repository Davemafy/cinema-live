# Media, model and code attribution

## Sample performance

ARTSEDGE / The Kennedy Center — *Charleston-dance.webm*.  
[Wikimedia source](https://commons.wikimedia.org/wiki/File:Charleston-dance.webm) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

CINEMA uses a five-second excerpt (8–13 s), transcoded to H.264 with audio removed, as a labeled **input performance**. Further short excerpts were used for testing. The original creators do not endorse CINEMA.

## Models and methods

- **B (offline showcase):** an image-AI appearance reference created with OpenAI's image-generation tool; its exact model identifier was not exposed. CINEMA applied a bounded appearance field using optical flow and original-frame compositing. [Recorded provenance](../docs/evidence/preservation-v1/ai-provenance.json).
- **C (experimental Directed light):** [IC-Light](https://github.com/lllyasviel/IC-Light), Stable Diffusion 1.5 / realistic-vision-v51 checkpoint and torchvision LRASPP-MobileNetV3 segmentation. Details, model revisions and source/result hashes are in [the evidence record](../docs/subject-aware-cinematography.md).
- **Other evaluated models:** Lightricks LTX and Wan VACE. CINEMA did not train these models.

Model weights and checkpoint licenses may impose requirements beyond the license on the application code. IC-Light source code is Apache-2.0, torchvision code is BSD-3-Clause, and the SD base model uses CreativeML Open RAIL-M. Verify the checkpoint-specific terms before commercial use.

## Demo and footage provenance

B is an **offline** experiment and must not be described as the live Directed light result. C was executed through the deployed studio using a temporary Kaggle GPU with the built-in sample, and separately tested locally with another upload. C's moving subject boundaries and lighting remain imperfect.

Final edited/narrated demos should clearly distinguish these outputs and credit the sample footage. This document does not claim a YouTube upload or Devpost submission.

Application code is MIT-licensed; third-party software and media retain their own licenses.
