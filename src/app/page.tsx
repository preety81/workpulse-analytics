'use client';

import React, { useState, useEffect } from 'react';
import '../utils/chartSetup';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-600/50">
          <span className="text-xl font-bold">WP</span>
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          WorkPulse AI Dashboard Initializing...
        </p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
