"""One isolated, pinned Kaggle reproduction. One new IC-Light reference; no LTX/Wan.

No production configuration, public tunnel, credentials or payment required.
Cached model assets are retained. A real GPU/MP4 is required for GPU success.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import urllib.request
from datetime import datetime, timezone

# Source commit and integrity manifest are filled after the source tree is pushed.
COMMIT = "f8a231e6091a81e1f68b346b0c86238353983717"
FILES = {
    "kaggle/experiments/subject_cinematography.py": "ae40018c25baa9156cee855ce9b5895b0fe0a6be469c6ca7c31823c9cb07b83e",
    "kaggle/experiments/treatment_transfer.py": "633a17ab8e49306819cd1572181e7e067d62074599785239da9cda39f4ca75c4",
    "public/demo-performance.mp4": "db12280afa65e42db525120158495eb50e98df55d9d78089f388f1330346ab43",
    "docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4": "396a74cb32d2a2c1aad5fb9d3f43eca0f5c3e6b33f9bbcf8580ef3ebe80afc51"
}


def assets(root):
    root.mkdir(parents=True,exist_ok=True)
    for relative,expected in FILES.items():
        target=root/Path(relative).name
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==expected:continue
        with urllib.request.urlopen(f"https://raw.githubusercontent.com/Davemafy/cinema-live/{COMMIT}/{relative}",timeout=60) as response:
            data=response.read(5_000_001)
        if len(data)>5_000_000 or hashlib.sha256(data).hexdigest()!=expected:raise RuntimeError("Pinned integrity failure: "+relative)
        if relative.endswith('.py'):compile(data,str(target),'exec')
        target.write_bytes(data)
    return root


def hardware(temp,working):
    for exe in ('ffmpeg','ffprobe','nvidia-smi'):
        if not shutil.which(exe):raise RuntimeError("Required executable missing: "+exe)
    rows=subprocess.check_output(['nvidia-smi','--query-gpu=index,memory.free,name','--format=csv,noheader,nounits'],text=True)
    choices=[]
    for line in rows.splitlines():
        index,free,name=line.split(',',2);choices.append((int(free),index.strip(),name.strip()))
    free,index,name=max(choices)
    if free<5120:raise RuntimeError(f"Need 5 GiB free on ONE GPU; best has {free} MiB. Stop without rendering.")
    mem={k:int(v.split()[0]) for k,v in (line.split(':',1) for line in Path('/proc/meminfo').read_text().splitlines())}
    if mem['MemAvailable']<6*1024**2:raise RuntimeError("Need 6 GiB available host RAM before model loading")
    if shutil.disk_usage(working).free<200*1024**2:raise RuntimeError("Need 200 MiB free output disk")
    caches=[Path('/tmp/cinema-subject-models'),Path('/kaggle/working/cinema-subject-models'),Path.home()/'.cache/huggingface/hub']
    def complete(p):
        ic=p/'models--lllyasviel--ic-light/snapshots/9cad1878695f546a7fb9eaca14e2a89131ba5ffe/iclight_sd15_fc.safetensors'
        base=p/'models--stablediffusionapi--realistic-vision-v51/snapshots/19e3643d7d963c156d01537188ec08f0b79a514a'
        return ic.is_file() and all((base/name).is_file() for name in ('unet/diffusion_pytorch_model.safetensors','vae/diffusion_pytorch_model.safetensors','text_encoder/model.safetensors','tokenizer/vocab.json'))
    cache=next((p for p in caches if complete(p)),caches[0])
    cache.mkdir(parents=True,exist_ok=True)
    needed=2 if complete(cache) else 8
    if shutil.disk_usage(cache).free<needed*1024**3:raise RuntimeError(f"Need {needed} GiB free cache disk (weights ~3.8 GB); stop before downloading")
    print(json.dumps({'gpu':name,'selectedGpu':index,'freeVramMiB':free,'availableRamGiB':round(mem['MemAvailable']/1024**2,2),'cache':str(cache),'cacheFreeGiB':round(shutil.disk_usage(cache).free/1024**3,2),'gpuFitVerified':False}),flush=True)
    env=os.environ.copy();env['CUDA_VISIBLE_DEVICES']=index
    env['TORCH_HOME']=str(temp/'cinema-torch')
    return cache,env


def python_environment(temp,env):
    # Inherit Kaggle's already-installed CUDA torch; do not upgrade it or mutate
    # the working cinema-vace-venv / LTX environment. Avoid Python 3.13 ensurepip.
    root=temp/'cinema-subject-venv';python=root/'bin/python'
    if not python.is_file():subprocess.run([sys.executable,'-m','venv','--without-pip','--system-site-packages',str(root)],check=True)
    version=subprocess.check_output([str(python),'-c','import torch; assert torch.cuda.is_available(); print(torch.__version__.split("+")[0])'],env=env,text=True).strip()
    matching={'2.5.1':'0.20.1','2.6.0':'0.21.0','2.7.0':'0.22.0','2.7.1':'0.22.1','2.8.0':'0.23.0','2.9.0':'0.24.0','2.9.1':'0.24.1','2.10.0':'0.25.0','2.11.0':'0.26.0'}
    compatible=subprocess.run([str(python),'-c','import torch,torchvision; from torchvision.models.segmentation import lraspp_mobilenet_v3_large; assert torch.cuda.is_available()'],env=env,capture_output=True).returncode==0
    if not compatible:
        if version not in matching:raise RuntimeError('Unsupported installed torch/torchvision combination: '+version+'; no CUDA-wheel replacement attempted')
        subprocess.run([sys.executable,'-m','pip','--python',str(python),'install','--no-deps','--no-cache-dir','torchvision=='+matching[version]],env=env,check=True,timeout=600)
    pins=['diffusers==0.36.0','transformers==4.49.0','huggingface-hub==0.34.4','accelerate==1.10.1','safetensors==0.6.2','tokenizers==0.21.4','opencv-python-headless==4.11.0.86','ftfy==6.3.1']
    subprocess.run([sys.executable,'-m','pip','--python',str(python),'install','--no-deps','--no-cache-dir',*pins],env=env,check=True,timeout=600)
    subprocess.run([str(python),'-c','import torch,torchvision,cv2,numpy,PIL,ftfy; from diffusers import StableDiffusionImg2ImgPipeline; from transformers import CLIPTextModel; assert torch.cuda.is_available(); print("DEPENDENCY/API PREFLIGHT PASSED; GPU has not yet rendered")'],env=env,check=True,timeout=120)
    return python


def main():
    temp=Path('/tmp');working=Path('/kaggle/working');working.mkdir(parents=True,exist_ok=True)
    cache,env=hardware(temp,working)
    files=assets(temp/('cinema-subject-assets-'+COMMIT[:8]))
    python=python_environment(temp,env)
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    out=working/('cinema-subject-'+stamp)
    out.mkdir();log=out/'execution.log'
    # Always a fresh directory/reference. Only model weights are reused.
    cmd=[str(python),'-u',str(files/'subject_cinematography.py'),'--source',str(files/'demo-performance.mp4'),'--baseline',str(files/'baseline-appearance-transfer.mp4'),'--cache',str(cache),'--out',str(out)]
    print('Starting ONE actual source-conditioned IC-Light GPU render; not Wan VACE. GPU fit remains unverified until completion.',flush=True)
    with log.open('w') as stream:
        task=subprocess.Popen(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        deadline=threading.Timer(1800,task.terminate);deadline.start()
        try:
            for line in task.stdout:print(line,end='',flush=True);stream.write(line);stream.flush()
            code=task.wait(timeout=60)
        except BaseException:
            task.terminate();task.wait(timeout=30);raise
        finally:deadline.cancel()
    if code:raise RuntimeError(f'Render failed ({code}); evidence/error log retained at {out}. No GPU-success claim.')
    report=json.loads((out/'run.json').read_text())
    if report['imageAi'].get('device')!='cuda' or not report['imageAi'].get('imageAiExecuted'):raise RuntimeError('No genuine GPU reference execution recorded')
    movie=out/'subject-aware.mp4'
    if hashlib.sha256(movie.read_bytes()).hexdigest()!=report['outputSha256']:raise RuntimeError('Output hash differs')
    subprocess.run(['ffmpeg','-v','error','-i',str(out/'comparison-abc.mp4'),'-f','null','-'],check=True,timeout=120)
    report['gpuRenderVerified']=True;report['gpuName']=subprocess.check_output(['nvidia-smi','--query-gpu=name','--format=csv,noheader'],env=env,text=True).strip()
    (out/'run.json').write_text(json.dumps(report,indent=2))
    print('REAL GPU REFERENCE AND MP4 COMPLETED. Visual improvement remains unverified: inspect A/B/C and all frames.',out,flush=True)
    from IPython.display import display,Video,Image,FileLink
    display(Video(str(out/'comparison-abc.mp4'),embed=True))
    display(Image(filename=str(out/'comparison-start-middle-end.jpg')))
    for p in sorted(out.iterdir()):
        if p.is_file():display(FileLink(str(p)))


if __name__=='__main__':main()
