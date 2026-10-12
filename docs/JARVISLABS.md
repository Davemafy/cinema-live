# Run CINEMA's GPU backend on JarvisLabs

The **PyTorch** template supplies a CUDA environment. JarvisLabs publishes services listening on **port 6006** through its instance's **API** HTTPS address. See the [official JarvisLabs guide](https://docs.jarvislabs.ai/tutorials/getting-started/serving-llms).

This setup runs CINEMA's existing source-aware **IC-Light FastAPI worker**, not a model marketplace endpoint. It preserves the existing signed-video API. A GPU server being online does not prove that it has completed a real render.

## 1. Launch the GPU instance

Choose **PyTorch, 1 GPU, On-Demand, 100 GB**. A100 40 GB is suitable for a short judging window; L4 24 GB is cheaper for longer testing. Do not select interruptible Spot for judge availability.

The instance's **API** menu provides its public **HTTPS origin** for port 6006. Copy just that URL (no path, username, password or token).

## 2. Prepare the worker from the JarvisLabs terminal

Open the instance's **JupyterLab > Terminal** or SSH session:

```bash
cd /home
git clone https://github.com/Davemafy/cinema-live.git cinema-live
cd /home/cinema-live
bash scripts/jarvislabs-bootstrap.sh
```

The bootstrap checks the actual CUDA-enabled PyTorch installation, installs the pinned Python packages, creates model/job/cache directories in persistent `/home`, and generates a private token in `/home/cinema-worker.token`. If the repository already exists, use `git -C /home/cinema-live pull --ff-only` instead of cloning.

The PyTorch template must include a compatible CUDA torchvision pair and FFmpeg/FFprobe. If either check fails, correct the reported dependency before proceeding. **Do not indiscriminately reinstall PyTorch.**

## 3. Start the service

In a terminal (replace the URL with your exact JarvisLabs **API** HTTPS origin):

```bash
cd /home/cinema-live
CINEMA_BACKEND_URL=https://YOUR-JARVISLABS-API-ORIGIN bash scripts/jarvislabs-serve.sh
```

The worker listens on `0.0.0.0:6006`, but requires bearer authentication on job creation and status checks. MP4 links use four-hour HMAC signatures.

For a detached session, after confirming that foreground mode starts successfully, use:

```bash
cd /home/cinema-live
nohup env CINEMA_BACKEND_URL=https://YOUR-JARVISLABS-API-ORIGIN bash scripts/jarvislabs-serve.sh > /home/cinema-worker.log 2>&1 < /dev/null &
tail -f /home/cinema-worker.log
```

Do not run foreground and background workers simultaneously. Jobs live in memory; worker restarts lose job status even when their video files remain on disk. A pause/reboot ends availability. No automatic restart is configured here.

## 4. Verify public health and connect Vercel

From a browser, open `https://YOUR-JARVISLABS-API-ORIGIN/health`. Expect JSON containing:
```json
{"ok":true,"model":"cinema/ic-light-person-aware-v1","mode":"subject-aware","ltxFallback":false}
```

In Vercel's **cinema-live > Settings > Environment Variables > Production**, set:

- `CINEMA_BACKEND_URL`: exact public HTTPS origin (without `/health`).
- `CINEMA_BACKEND_TOKEN`: contents of **/home/cinema-worker.token**, copied privately from your JarvisLabs terminal.
- Keep the existing `JOB_SIGNING_SECRET` unchanged.

**Never post the token in chat, screenshots, logs or GitHub.** Redeploy Vercel production for the environment changes to take effect.

The application rejects insecure HTTP origins, embedded URL credentials and foreign MP4 origins. It needs the same HTTPS origin for health, job submission, polling and signed video delivery.

## 5. Confirm a real end-to-end job

1. Open [the live studio](https://madeincinema.vercel.app). Select **Use sample performance** and **Directed light**.
2. Submit **one** job. The first run downloads pretrained model weights into `/home/cinema-cache`. Watch `/home/cinema-jobs/<job-id>/execution.log`.
3. Wait for **succeeded**, play the processed film, and test **Download film**.
4. Confirm that Vercel's `/api/health` shows Directed light available.
5. Leave the instance running for judging; set an explicit budget/time reminder. Pause afterwards to preserve grant credits.

An HTTP 200 from `/health` only proves the FastAPI process is reachable. Successful inference and output must be verified separately.

**Cost:** at the displayed A100 price $0.89/hr plus 100 GB storage $0.014/hr, approximately $0.904/hr while running. Verify actual storage charges when paused.

**Limitations:** subject-boundary artifacts remain; a faster GPU does not fix them. JarvisLabs instances are not a distributed durable worker queue. This configuration prioritizes immediate judge availability, not autoscaling or high availability.
