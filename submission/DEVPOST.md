# CINEMA — Devpost description

**Tagline:** Turn a performance into a cinematic scene.

## Inspiration

A great performance can take hours to capture. But what happens when the acting and movement are right, and the visual atmosphere isn't?

Changing the lighting or creative direction often means reshooting, hiring equipment, or spending hours in post-production.

We wondered: What if filmmakers could explore different cinematic possibilities without losing the performance they already captured?

That became CINEMA.

## What it does

CINEMA is an AI-powered creative workspace for transforming existing footage into cinematic treatments.

Creators can record or upload a short performance, select a visual direction, and explore the result alongside the original before exporting their film.

Unlike traditional prompt-to-video generation, CINEMA focuses on keeping the original people, movements, and timing recognizable while changing how the scene looks.

Our experimental rendering pipeline successfully processed the built-in sample through the deployed application using a temporary Kaggle GPU backend. We also verified a separate video through AI processing, playback, and export locally. The public rendering service is temporary rather than always-on.

## How we built it

We built the studio with Next.js, React, TypeScript, and FastAPI, using Python and FFmpeg for video processing.

We initially experimented with LTX Video and Wan VACE. Both generated real video transformations, but preserving faces, choreography, and fine details proved difficult.

That led us to a different architecture:

- IC-Light generates a cinematic lighting reference from the uploaded footage.
- A lightweight segmentation model identifies people automatically.
- OpenCV optical flow tracks movement between frames.
- Subject-aware compositing applies different lighting treatments to performers and their surroundings.
- FFmpeg encodes the result while preserving the original performance.

Rather than regenerating every frame, we use image AI to guide how the original footage is treated.

## Challenges we ran into

Our biggest challenge was discovering that successful AI inference didn't necessarily mean a better film.

Early video-generation results introduced blur, lost details, or barely changed the scene. More aggressive transformations risked altering the performance itself.

Building around original frames improved preservation, but introduced new challenges: moving subject boundaries, temporal consistency, realistic illumination, and GPU limitations.

Our subject-aware prototype still exhibits some visible masking artifacts, which we're actively working to reduce.

## Accomplishments that we're proud of

We built more than a static AI demo.

- Produced a real 120-frame, 854×480 cinematic treatment while preserving the original movement.
- Implemented genuine source-conditioned IC-Light inference and automatic person segmentation.
- Demonstrated separate foreground and background lighting control.
- Completed a live Directed light transformation using the deployed application and its temporary Kaggle GPU backend.
- Verified a second video upload through actual AI processing, playback, and MP4 export in our local application.
- Built a creative workspace with recording, upload, comparison, and export functionality.

We also documented our experiments and limitations rather than presenting unsuccessful renders as finished results.

## What we learned

Generating a new image is easier than preserving what matters in an existing one.

We learned that cinematic AI needs to understand the relationship between creative direction and the original performance.

The strongest approach wasn't simply using a larger generative model. It was combining image AI, motion analysis, and source-preserving processing to give creators more control.

## What's next for CINEMA

We're working toward more convincing spatial lighting, cleaner moving-subject boundaries, additional cinematic directions, and reliable, always-on GPU infrastructure.

Longer term, we want CINEMA to become a creative tool where filmmakers can explore multiple visual interpretations of the same take without reshooting it.

One performance. Reimagined.

## Links

- Website: https://madeincinema.vercel.app
- Code: https://github.com/Davemafy/cinema-live
- Offline appearance-transfer (B): [video](../docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4)
- Experimental Directed light (C): [video](../docs/evidence/subject-aware-v1/subject-aware.mp4)
- Technical record: [subject-aware architecture and evidence](../docs/subject-aware-cinematography.md)
- Credits: [model and media attribution](ATTRIBUTIONS.md)

*Public YouTube demo: add its URL on Devpost after upload.*
