'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic client-side import for Chart.js and client state
const DashboardApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-600/50">
        <span className="text-xl font-bold">WP</span>
      </div>
      <p className="text-xs text-slate-400 font-medium tracking-wide">
        WorkPulse AI Dashboard Initializing...
      </p>
    </div>
  ),
});

export default function HomePage() {
  return <DashboardApp />;
}
