import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'InsightEd — Real-Time Engagement Analysis for Virtual Classrooms',
  description:
    'AI-powered facial expression analysis that detects class fatigue in real-time without compromising student privacy. All processing happens locally on the student\'s device.',
  keywords: 'virtual classroom, engagement analysis, AI education, class fatigue, edtech, privacy-first',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
