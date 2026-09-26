import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'WorkPulse AI — Workforce Performance & ML Intelligence Dashboard',
  description: 'Enterprise Daily Work Report Analytics & Machine Learning Performance Suite built with Next.js & Chart.js',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
