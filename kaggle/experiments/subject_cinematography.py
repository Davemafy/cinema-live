"""Person-aware cinematography: learned masks + IC-Light + source compositing.

Lighting uses silhouette-derived 2.5D cues, not measured geometry/physical relighting.
Every job generates its own IC-Light reference from the actual uploaded frame.
"""
from __future__ import annotations
import argparse
import gc
import hashlib
import json
import os
from pathlib import Path
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw
import torch
from treatment_transfer import read_video, write_movie, digest, linear, srgb, derive_gain, shade, tracking_step, run

SD_MODEL="stablediffusionapi/realistic-vision-v51"
SD_REVISION="19e3643d7d963c156d01537188ec08f0b79a514a"
IC_MODEL="lllyasviel/ic-light"
IC_REVISION="9cad1878695f546a7fb9eaca14e2a89131ba5ffe"
SEED=20261012


class PersonSegmenter:
    """Small automatic semantic model; person class, no manual prompts or sample masks."""
    def __init__(self):
        from torchvision.models.segmentation import lraspp_mobilenet_v3_large, LRASPP_MobileNet_V3_Large_Weights
        weights=LRASPP_MobileNet_V3_Large_Weights.COCO_WITH_VOC_LABELS_V1
        self.model=lraspp_mobilenet_v3_large(weights=None,weights_backbone=None,num_classes=21).eval()
        state=torch.hub.load_state_dict_from_url(weights.url,check_hash=True,weights_only=True)
        self.model.load_state_dict(state)
        self.transform=weights.transforms(resize_size=384)
        self.model_url=weights.url
    @torch.inference_mode()
    def predict(self,rgb):
        tensor=self.transform(Image.fromarray(rgb))[None]
        alpha=self.model(tensor)["out"].softmax(1)[0,15].cpu().numpy()
        alpha=cv2.resize(alpha,(rgb.shape[1],rgb.shape[0]),interpolation=cv2.INTER_LINEAR)
        # Edge-aware filtering refines a learned probability map; no alpha is
        # supplied from a prerecorded sample or a manually drawn mask.
        guide=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY).astype(np.float32)/255
        box=lambda x:cv2.boxFilter(x,-1,(9,9),normalize=True)
        mean_i,mean_p=box(guide),box(alpha)
        a=(box(guide*alpha)-mean_i*mean_p)/(box(guide*guide)-mean_i**2+1e-3)
        refined=box(a)*guide+box(mean_p-a*mean_i)
        # Refine uncertain borders against actual source RGB. This avoids a broad
        # bright halo when a coarse neural mask meets a darkened background.
        trimap=np.full(refined.shape,cv2.GC_PR_BGD,np.uint8)
        trimap[refined>.40]=cv2.GC_PR_FGD
        trimap[refined>.85]=cv2.GC_FGD
        trimap[refined<.08]=cv2.GC_BGD
        if (trimap==cv2.GC_FGD).any() and (trimap==cv2.GC_BGD).any():
            cv2.grabCut(rgb,trimap,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),1,cv2.GC_INIT_WITH_MASK)
            matte=np.isin(trimap,[cv2.GC_FGD,cv2.GC_PR_FGD]).astype(np.float32)
            return cv2.GaussianBlur(matte,(0,0),1.1)
        return np.clip((refined-.30)/.55,0,1).astype(np.float32)


def scene_geometry(alpha):
    """View-dependent silhouette surface proxy. No claim of metric depth/normals."""
    inside=(alpha>.5).astype(np.uint8)
    distance=cv2.distanceTransform(inside,cv2.DIST_L2,5)
    distance=cv2.GaussianBlur(distance,(0,0),2.5)
    nx=-cv2.Sobel(distance,cv2.CV_32F,1,0,ksize=3)/8
    ny=-cv2.Sobel(distance,cv2.CV_32F,0,1,ksize=3)/8
    normals=np.stack([nx*.8,ny*.35,np.ones_like(nx)*.8],axis=-1)
    normals/=np.maximum(np.linalg.norm(normals,axis=-1,keepdims=True),1e-5)
    light=np.array([-.85,-.25,.6],np.float32);light/=np.linalg.norm(light)
    incidence=np.maximum(normals@light,0)
    # A restrained cool edge follows each actor's silhouette as it moves.
    boundary=cv2.dilate(inside,np.ones((5,5),np.uint8))-cv2.erode(inside,np.ones((5,5),np.uint8))
    right_edge=np.clip(normals[...,0],0,1)*boundary*alpha
    return incidence,right_edge


def contact_shadow(alpha):
    """Approximate floor contact darkening from inferred moving subject components."""
    h,w=alpha.shape;shadow=np.zeros_like(alpha)
    n,labels,stats,centroids=cv2.connectedComponentsWithStats((alpha>.5).astype(np.uint8))
    for i in range(1,n):
        x,y,bw,bh,area=stats[i]
        if area<150 or bh<.10*h:continue
        foot_y=y+bh-1
        # Soft contact pool, not an asserted accurate cast shadow solution.
        cv2.ellipse(shadow,(round(centroids[i,0])+round(bw*.12),foot_y),
                    (max(3,round(bw*.65)),max(2,round(bh*.045))),0,0,360,.22,-1)
    return cv2.GaussianBlur(shadow,(0,0),max(2,w/160))*(1-alpha)


def composite_frame(source,alpha,reference_field,background_exposure=.14):
    if source.shape[:2]!=alpha.shape:raise ValueError("Subject mask does not match source geometry")
    incidence,rim=scene_geometry(alpha)
    # Spatial response comes from current moving subject shape, not an image-wide LUT.
    directional=.55+.95*incidence
    warm=np.array([1.08,1.00,.88],np.float32)
    # IC-Light illumination field stays attached to source correspondence.
    # Preserve clothing chroma; use the learned reference as a bounded intensity
    # cue. Very dark regenerated faces never force original faces into silhouette.
    intensity=np.clip(reference_field.mean(axis=-1),-.45,.65)
    fg=linear(source)*np.exp(intensity[...,None]*.35)*directional[...,None]*warm
    fg+=linear(source)*rim[...,None]*np.array([.00,.035,.08],np.float32)
    bg=linear(source)*background_exposure*(1-contact_shadow(alpha)[...,None])
    combined=fg*alpha[...,None]+bg*(1-alpha[...,None])
    clipping=float((combined>1).mean())
    # Soft highlight compression, no source-face replacement or geometry warp.
    combined=np.where(combined>.98,.98+.02*(1-np.exp(-np.maximum(combined-.98,0)/.02)),combined)
    return srgb(combined),clipping


@torch.inference_mode()
def relight_reference(frame,alpha,cache,steps=20):
    from diffusers import UNet2DConditionModel,AutoencoderKL,StableDiffusionImg2ImgPipeline,DPMSolverMultistepScheduler
    from transformers import CLIPTextModel,CLIPTokenizer
    from huggingface_hub import hf_hub_download
    from safetensors import safe_open
    from diffusers.models.attention_processor import AttnProcessor2_0
    device="cuda" if torch.cuda.is_available() else "cpu"
    dtype=torch.float16 if device=="cuda" else torch.bfloat16
    kwargs=dict(revision=SD_REVISION,cache_dir=str(cache),use_safetensors=True,low_cpu_mem_usage=True)
    began=time.monotonic()
    print("LOADING IC-LIGHT + SD15, actual source conditioning",device,dtype,flush=True)
    unet=UNet2DConditionModel.from_pretrained(SD_MODEL,subfolder="unet",torch_dtype=dtype,**kwargs)
    old=unet.conv_in
    new=torch.nn.Conv2d(8,old.out_channels,old.kernel_size,old.stride,old.padding).to(dtype=dtype)
    new.weight.zero_();new.weight[:,:4].copy_(old.weight);new.bias.copy_(old.bias)
    unet.conv_in=new
    checkpoint=hf_hub_download(IC_MODEL,"iclight_sd15_fc.safetensors",revision=IC_REVISION,cache_dir=str(cache))
    # Merge official additive offsets in place, one tensor at a time to bound RAM.
    state=unet.state_dict()
    with safe_open(checkpoint,framework="pt",device="cpu") as offsets:
        if set(state)!=set(offsets.keys()):raise RuntimeError("IC-Light/base UNet keys differ; do not continue")
        for key,value in state.items():value.add_(offsets.get_tensor(key).to(value.dtype))
    del state;gc.collect()
    unet.register_to_config(in_channels=8)
    original_forward=unet.forward
    def conditioned_forward(sample,timestep,encoder_hidden_states,**forward_kwargs):
        conditions=forward_kwargs["cross_attention_kwargs"]["concat_conds"].to(sample)
        conditions=conditions.repeat(sample.shape[0]//conditions.shape[0],1,1,1)
        forward_kwargs["cross_attention_kwargs"]={}
        return original_forward(torch.cat([sample,conditions],dim=1),timestep,encoder_hidden_states,**forward_kwargs)
    unet.forward=conditioned_forward
    unet.set_attn_processor(AttnProcessor2_0())
    vae=AutoencoderKL.from_pretrained(SD_MODEL,subfolder="vae",torch_dtype=torch.float32,**kwargs).to(device)
    encoder=CLIPTextModel.from_pretrained(SD_MODEL,subfolder="text_encoder",torch_dtype=dtype,**kwargs).to(device)
    tokenizer=CLIPTokenizer.from_pretrained(SD_MODEL,subfolder="tokenizer",revision=SD_REVISION,cache_dir=str(cache))
    unet=unet.to(device)
    scheduler=DPMSolverMultistepScheduler(num_train_timesteps=1000,beta_start=.00085,beta_end=.012,
        beta_schedule="scaled_linear",algorithm_type="sde-dpmsolver++",use_karras_sigmas=True,steps_offset=1)
    pipe=StableDiffusionImg2ImgPipeline(vae=vae,text_encoder=encoder,tokenizer=tokenizer,unet=unet,
        scheduler=scheduler,safety_checker=None,feature_extractor=None,requires_safety_checker=False)
    # Reference-only resolution; output film retains full source dimensions.
    ratio=frame.shape[1]/frame.shape[0]
    width=512 if ratio>=1 else max(64,round(512*ratio/8)*8)
    height=512 if ratio<1 else max(64,round(512/ratio/8)*8)
    resized=cv2.resize(frame,(width,height));matte=cv2.resize(alpha,(width,height))[...,None]
    foreground=127+(resized.astype(np.float32)-127)*matte
    as_tensor=lambda im:torch.from_numpy(im.astype(np.float32)/127.-1).permute(2,0,1)[None].to(device)
    concat=vae.encode(as_tensor(foreground)).latent_dist.mode()*vae.config.scaling_factor
    background=np.tile(np.linspace(255,0,width,dtype=np.float32),(height,1))
    background=np.stack([background]*3,axis=-1)
    initial=vae.encode(as_tensor(background)).latent_dist.mode()*vae.config.scaling_factor
    prompt="cinematic photograph, the same foreground people and clothing, dramatic warm light from the left, detailed faces, deep shadows, cool rim light, natural textures, indoor scene"
    negative="extra people, changed clothing, malformed hands, deformed face, blur, painting, text, watermark"
    encode=lambda text:encoder(tokenizer(text,padding="max_length",max_length=77,truncation=True,return_tensors="pt").input_ids.to(device))[0]
    positive,negative_embeds=encode(prompt),encode(negative)
    inference_start=time.monotonic()
    executed_steps=0
    def step_end(_pipe,step,timestep,data):
        nonlocal executed_steps
        executed_steps=step+1
        if not torch.isfinite(data["latents"]).all():raise RuntimeError("IC-Light produced non-finite latents")
        print(f"IC-LIGHT STEP {step+1} | elapsed {time.monotonic()-inference_start:.1f}s",flush=True)
        return data
    latent=pipe(image=initial.to(dtype),strength=.9,num_inference_steps=round(steps/.9),
        prompt_embeds=positive,negative_prompt_embeds=negative_embeds,guidance_scale=2.,
        generator=torch.Generator(device=device).manual_seed(SEED),output_type="latent",
        cross_attention_kwargs={"concat_conds":concat.to(dtype)},callback_on_step_end=step_end).images
    decoded=vae.decode(latent.to(torch.float32)/vae.config.scaling_factor).sample
    del unet.forward
    rgb=(decoded[0].permute(1,2,0).float().cpu().numpy()*.5+.5).clip(0,1)
    reference=cv2.resize(np.rint(rgb*255).astype(np.uint8),(frame.shape[1],frame.shape[0]))
    details={"model":IC_MODEL,"revision":IC_REVISION,"baseModel":SD_MODEL,"baseRevision":SD_REVISION,
             "seed":SEED,"requestedSteps":steps,"executedDenoiseSteps":executed_steps,"guidance":2.,"strength":.9,"referenceSize":[width,height],
             "sourceConditioning":"actual foreground frame + predicted person matte","prompt":prompt,
             "inferenceSeconds":round(time.monotonic()-inference_start,3),"loadAndInferenceSeconds":round(time.monotonic()-began,3),
             "device":device,"dtype":str(dtype),"imageAiExecuted":True}
    del pipe,unet,vae,encoder,decoded,latent;gc.collect()
    if torch.cuda.is_available():torch.cuda.empty_cache()
    return reference,details


def comparison_movie(source,baseline,result,fps,info,source_path,out):
    if len(source)!=len(baseline) or baseline.shape!=source.shape:raise RuntimeError("A/B/C source/baseline dimensions or frame count differ")
    from fractions import Fraction
    w=640;h=round(source.shape[1]*w/source.shape[2]);h+=h%2
    frames=[]
    selected=[]
    for index,(a,b,c) in enumerate(zip(source,baseline,result)):
        panel=Image.new("RGB",(w*3,h+40),"#151515");draw=ImageDraw.Draw(panel)
        for col,(frame,label) in enumerate([(a,"A / ORIGINAL"),(b,"B / APPEARANCE TRANSFER"),(c,"C / SUBJECT-AWARE CANDIDATE")]):
            panel.paste(Image.fromarray(frame).resize((w,h)),(col*w,40));draw.text((col*w+12,12),label,fill="white")
        frames.append(np.asarray(panel))
        if index in (0,len(source)//2,len(source)-1):panel.save(out/f"comparison-{index:03d}.jpg",quality=95);selected.append(panel)
    write_movie(out/"comparison-abc.mp4",source_path,fps,frames,info)
    sheet=Image.new("RGB",(w*3,(h+40)*3))
    for i,panel in enumerate(selected):sheet.paste(panel,(0,i*(h+40)))
    sheet.save(out/"comparison-start-middle-end.jpg",quality=95)


def process(source_path,out,baseline_path=None,cache=None,reference_only=False):
    started=time.monotonic();torch.set_num_threads(min(4,os.cpu_count() or 1))
    os.environ.setdefault("TORCH_HOME",str(Path(cache or "/tmp/cinema-subject-models").parent/"cinema-torch"))
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    if (out/"subject-aware.mp4").exists():raise RuntimeError("Output exists; preserve it and choose another folder")
    source,fps,info=read_video(source_path)
    segmenter=PersonSegmenter();alpha0=segmenter.predict(source[0])
    if (alpha0>.5).mean()<.005:raise RuntimeError("No visible person detected; subject-aware mode requires a person")
    Image.fromarray(np.rint(alpha0*255).astype(np.uint8)).save(out/"person-mask-first.png")
    ref_path=out/"ic-light-reference.png";meta_path=out/"reference.json"
    if ref_path.exists() and meta_path.exists():
        details=json.loads(meta_path.read_text())
        if details.get("sourceSha256")!=digest(source_path) or details.get("referenceSha256")!=digest(ref_path):
            raise RuntimeError("Reference/source mismatch; cannot reuse another input's reference")
        reference=np.asarray(Image.open(ref_path).convert("RGB"))
    else:
        reference,details=relight_reference(source[0],alpha0,Path(cache or "/tmp/cinema-subject-models"))
        gc.collect()
        Image.fromarray(reference).save(ref_path)
        details.update({"sourceSha256":digest(source_path),"referenceSha256":digest(ref_path)})
        meta_path.write_text(json.dumps(details,indent=2))
    ref_alpha=segmenter.predict(reference)
    iou=float(((ref_alpha>.5)&(alpha0>.5)).sum()/max(1,((ref_alpha>.5)|(alpha0>.5)).sum()))
    if iou<.40:raise RuntimeError(f"AI reference subject correspondence too weak ({iou:.3f}); stop before propagation")
    print("REFERENCE SUBJECT IOU",iou,flush=True)
    if reference_only:return details
    field=derive_gain(source[0],reference);result=[];masks=[];clips=[];confidence=[]
    previous_alpha=alpha0
    for i,frame in enumerate(source):
        alpha=alpha0 if i==0 else segmenter.predict(frame)
        if i:
            warped,conf=tracking_step(source[i-1],frame,np.repeat(previous_alpha[...,None],3,axis=-1),np.repeat(alpha[...,None],3,axis=-1))
            alpha=.75*alpha+.25*warped[...,0]
            field,conf=tracking_step(source[i-1],frame,field,derive_gain(source[0],reference))
            confidence.append(conf)
        alpha=np.clip(alpha,0,1);previous_alpha=alpha
        rgb,hot=composite_frame(frame,alpha,field);result.append(rgb);clips.append(hot)
        masks.append(np.repeat(np.rint(alpha*255).astype(np.uint8)[...,None],3,axis=-1))
        if i%24==0:print(f"ACTUAL SUBJECT COMPOSITING {i+1}/{len(source)}",flush=True)
    audio=write_movie(out/"subject-aware.mp4",source_path,fps,result,info)
    write_movie(out/"moving-subject-masks.mp4",source_path,fps,masks,info)
    exported,export_fps,_=read_video(out/"subject-aware.mp4")
    if exported.shape!=source.shape or export_fps!=fps:raise RuntimeError("Output changed source geometry/count/timing")
    run(["ffmpeg","-v","error","-i",out/"subject-aware.mp4","-f","null","-"])
    if baseline_path:
        baseline,baseline_fps,_=read_video(baseline_path)
        if baseline_fps!=fps:raise RuntimeError("Baseline timebase differs; cannot assert direct A/B/C comparison")
        comparison_movie(source,baseline,result,fps,info,source_path,out)
    import resource
    report={"mode":"subject-aware source-frame compositing","imageAi":details,"segmentationModel":"torchvision/LRASPP-MobileNetV3-Large COCO-VOC person",
            "segmentationWeightsUrl":segmenter.model_url,"referenceSubjectIoU":iou,
            "geometry":"silhouette-derived 2.5D surface proxy; not physical relighting or metric depth",
            "foregroundBackgroundIndependent":True,"generatedFacesUsed":False,"fps":str(fps),"frames":len(source),
            "width":source.shape[2],"height":source.shape[1],"audio":audio,"totalSeconds":round(time.monotonic()-started,3),
            "peakProcessRamGiB":round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024/1024**3,3),
            "meanClippedChannelFraction":float(np.mean(clips)),"sourceSha256":digest(source_path),
            "outputSha256":digest(out/"subject-aware.mp4"),"baselineSha256":digest(baseline_path) if baseline_path else None,
            "visualImprovement":"unverified; inspect entire A/B/C clip","limitations":"people only; coarse segmentation edges; view-dependent geometry proxy; approximate contact darkening"}
    (out/"run.json").write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
    return report


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("--source",required=True);p.add_argument("--out",required=True)
    p.add_argument("--baseline");p.add_argument("--cache");p.add_argument("--reference-only",action="store_true")
    a=p.parse_args();process(a.source,a.out,a.baseline,a.cache,a.reference_only)
