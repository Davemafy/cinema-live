import type { Metadata } from 'next';
import './tokens.css';
import './globals.css';
export const metadata: Metadata = { title: 'CINEMA — Performance Studio', description: 'Record or upload a short performance. Explore a video-conditioned cinematic treatment, compare and export.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
