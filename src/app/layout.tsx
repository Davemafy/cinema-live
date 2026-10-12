import type { Metadata } from 'next';
import './tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'CINEMA',
  applicationName: 'CINEMA',
  description: 'Turn a performance into a cinematic scene.',
  openGraph: {
    title: 'CINEMA',
    description: 'Turn a performance into a cinematic scene.',
    url: 'https://madeincinema.vercel.app',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
