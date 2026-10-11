"""Separate per-input person-aware worker. No LTX imports or fallback calls."""
import hmac
import json
import os
from pathlib import Path
import queue
import re
import secrets
import sys
import threading
import time
import traceback
from hashlib import sha256

from fastapi import FastAPI,UploadFile,File,Form,Header,HTTPException
from fastapi.responses import FileResponse

sys.path.insert(0,str(Path(__file__).resolve().parent/"experiments"))
from subject_cinematography import process

ROOT=Path(os.environ.get("CINEMA_SUBJECT_WORKDIR","/tmp/cinema-subject-jobs"));ROOT.mkdir(parents=True,exist_ok=True)
TOKEN=os.environ.get("CINEMA_SUBJECT_TOKEN","")
if len(TOKEN)<32:raise RuntimeError("Configure CINEMA_SUBJECT_TOKEN privately before starting the worker")
ORIGIN=os.environ.get("CINEMA_SUBJECT_ORIGIN","").rstrip("/")
CACHE=os.environ.get("CINEMA_SUBJECT_CACHE","/tmp/cinema-subject-models")
jobs={};lock=threading.Lock();work=queue.Queue(maxsize=2)
app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)


def auth(value):
    if not value or not hmac.compare_digest(value,"Bearer "+TOKEN):raise HTTPException(401,"Unauthorized")


def video_url(jid):
    expires=int(time.time())+14400
    signature=hmac.new(TOKEN.encode(),f"{jid}:{expires}".encode(),sha256).hexdigest()
    return f"{ORIGIN}/v1/jobs/{jid}/video?e={expires}&s={signature}"


@app.get("/health")
def health():return {"ok":True,"model":"cinema/ic-light-person-aware-v1","mode":"subject-aware","queued":work.qsize(),"ltxFallback":False}


@app.post("/v1/jobs",status_code=202)
async def submit(video:UploadFile=File(...),treatment:str=Form(...),authorization:str|None=Header(default=None)):
    auth(authorization)
    if treatment!="subject-aware":raise HTTPException(400,"This worker accepts only subject-aware jobs")
    data=await video.read(4_000_001)
    if not data or len(data)>4_000_000:raise HTTPException(413,"Use video smaller than 4 MB")
    if data[4:8]!=b"ftyp":raise HTTPException(415,"Expected normalized MP4")
    jid=secrets.token_hex(12);folder=ROOT/jid;folder.mkdir();source=folder/"source.mp4";source.write_bytes(data)
    with lock:jobs[jid]={"id":jid,"state":"queued","folder":folder,"source":source,"createdAt":time.time()}
    try:work.put_nowait(jid)
    except queue.Full:
        # Only this just-created request's files are removed.
        source.unlink();folder.rmdir()
        with lock:del jobs[jid]
        raise HTTPException(429,"Subject-aware queue full")
    return {"id":jid,"state":"queued"}


@app.get("/v1/jobs/{jid}")
def status(jid:str,authorization:str|None=Header(default=None)):
    auth(authorization)
    with lock:
        if jid not in jobs:raise HTTPException(404,"Job lost or session restarted")
        job=dict(jobs[jid])
    result={k:job[k] for k in ("id","state")}
    if job["state"]=="failed":result["error"]=job["error"]
    if job["state"]=="succeeded":result.update(videoUrl=video_url(jid),inferenceSeconds=job["seconds"],config=job["config"])
    return result


@app.get("/v1/jobs/{jid}/video")
def video(jid:str,e:int,s:str):
    if not re.fullmatch(r"[0-9a-f]{24}",jid) or e<time.time() or e>time.time()+14460:raise HTTPException(403,"Expired link")
    expected=hmac.new(TOKEN.encode(),f"{jid}:{e}".encode(),sha256).hexdigest()
    if not hmac.compare_digest(expected,s):raise HTTPException(403,"Invalid signature")
    with lock:job=jobs.get(jid)
    if not job or job["state"]!="succeeded":raise HTTPException(404,"Not ready")
    return FileResponse(job["folder"]/"render/subject-aware.mp4",media_type="video/mp4",filename="cinema-"+jid+".mp4",
        content_disposition_type="inline",headers={"Cache-Control":"private, no-store"})


def generate():
    while True:
        jid=work.get()
        try:
            with lock:jobs[jid]["state"]="rendering";job=jobs[jid]
            result=process(job["source"],job["folder"]/"render",cache=CACHE)
            with lock:
                jobs[jid].update(state="succeeded",seconds=result["totalSeconds"],config={
                    "mode":"subject-aware","imageAi":result["imageAi"],"segmentationModel":result["segmentationModel"],
                    "geometry":result["geometry"],"ltxFallbackUsed":False,"sourceSha256":result["sourceSha256"],
                    "frames":result["frames"],"width":result["width"],"height":result["height"],"fps":result["fps"]})
        except Exception as exc:
            print("SUBJECT JOB FAILED",jid,traceback.format_exc(),flush=True)
            with lock:jobs[jid].update(state="failed",error=f"{type(exc).__name__}: {str(exc)[:350]}")
        finally:work.task_done()


if __name__=="__main__":
    import uvicorn
    threading.Thread(target=generate,daemon=True).start()
    uvicorn.run(app,host="127.0.0.1",port=int(os.environ.get("CINEMA_SUBJECT_PORT","8892")),log_level="warning")
