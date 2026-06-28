import './globals.css';

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
