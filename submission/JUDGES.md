# CINEMA — guide for judges

**Website:** https://madeincinema.vercel.app  
**Code:** https://github.com/Davemafy/cinema-live

CINEMA is a camera/upload → treatment → comparison → MP4 export workflow. It uses the original performance as its foundation.

## Try the product

1. Choose **Use sample performance** or upload your own short video (maximum 4 MB).
2. Select **Directed light**. If the temporary GPU worker is online, transform the clip and wait for the actual render to finish.
3. Compare original/output footage and download the resulting MP4.
4. If the worker is unavailable, explore capture/preprocessing and the separately labeled offline evidence on the page.

Temporary Kaggle sessions can disconnect. A working homepage is not a guarantee that GPU inference is currently available.

## What is demonstrated

- **B — appearance transfer:** a real offline image-AI-directed treatment, visually stronger than C. This is a recorded experiment, *not* a newly rendered live visitor result.
- **C — Directed light:** source-conditioned IC-Light reference generation, automatic people segmentation, motion-aware foreground/background compositing. The owner completed a built-in-sample render through the deployed application using the Kaggle worker. Local processing of a different uploaded video, playback and MP4 export were also verified. Subject edges and illumination remain experimental.
- **A/B/C:** [comparison video](../docs/evidence/subject-aware-v1/comparison-abc.mp4). [Technical measurements and limitations](../docs/subject-aware-cinematography.md).

CINEMA integrates pretrained models; we did not train IC-Light, LTX, Wan VACE, or the segmentation model. The main contribution is keeping a captured performance usable while applying a new AI-guided visual treatment.

[Media/model credits](ATTRIBUTIONS.md) · [Devpost description](DEVPOST.md)
