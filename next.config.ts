import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { useTypeScriptCli: false },
  serverExternalPackages: ['ffmpeg-static', 'ffprobe-static'],
  outputFileTracingIncludes: {
    '/api/normalize': ['./node_modules/ffmpeg-static/ffmpeg', './node_modules/ffprobe-static/bin/linux/x64/ffprobe'],
    '/api/jobs': ['./node_modules/ffmpeg-static/ffmpeg', './node_modules/ffprobe-static/bin/linux/x64/ffprobe'],
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self)' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
export default config;
