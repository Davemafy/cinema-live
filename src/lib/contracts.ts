export const MAX_UPLOAD_BYTES = 4_000_000;
export const CLIP_SECONDS = 5;
export const MODEL = 'fal-ai/ltx-2.3-22b/distilled/video-to-video';
export const TREATMENTS = [{
  id: 'noir', name: 'Silver screen', category: 'MONOCHROME / DRAMA',
  description: 'Black-and-white cinematography, sculpted side lighting and restrained film grain.',
  prompt: 'Restyle the entire supplied performance as a realistic black-and-white cinematic drama. Preserve the subject, action, gesture timing, camera framing and composition of the input video. Sculpted side lighting, deep but detailed shadows, natural skin texture, subtle 35mm film grain, professional cinematography. Continuous shot. Do not add people, actions, cuts, text or camera moves.',
}, {
  id: 'subject-aware', name: 'Directed light', category: 'SUBJECT / ATMOSPHERE',
  description: 'A new AI reference for your take, moving person masks and independent foreground/background illumination. Experimental; source detail retained.',
  prompt: 'Subject-aware warm side lighting, cool edge light and subdued scene ambience. Preserve source subjects and movement.',
}] as const;
export type TreatmentId = typeof TREATMENTS[number]['id'];
export type JobState = 'queued' | 'rendering' | 'succeeded' | 'failed';
export type Job = {
  token: string; id: string; state: JobState; createdAt: number;
  treatment: TreatmentId; model: string; sourceUrl: string;
  config: Record<string, unknown>; durationSeconds?: number;
  videoUrl?: string; exportToken?: string; error?: string; seed?: number; inferenceSeconds?: number;
};
export type Health = { inferenceAvailable: boolean; model: string; reason?: string; renderCodeRequired: boolean;
  treatments?: Record<string, { available: boolean; reason?: string }> };
