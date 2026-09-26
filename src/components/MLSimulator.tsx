import React, { useState } from 'react';
import { 
  FiX, 
  FiSliders, 
  FiZap, 
  FiAward, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiTrendingUp
} from 'react-icons/fi';
import { BlockerSeverity } from '../types';
import { simulateScoreAndTier } from '../utils/mlEngine';

interface MLSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MLSimulator: React.FC<MLSimulatorProps> = ({ isOpen, onClose }) => {
  const [plannedHrs, setPlannedHrs] = useState<number>(8.0);
  const [actualHrs, setActualHrs] = useState<number>(8.0);
  const [qualityRating, setQualityRating] = useState<number>(4.5);
  const [progressPct, setProgressPct] = useState<number>(95);
  const [blockerSeverity, setBlockerSeverity] = useState<BlockerSeverity>('None');
  const [selfRating, setSelfRating] = useState<number>(4.5);

  if (!isOpen) return null;

  const result = simulateScoreAndTier(
    plannedHrs,
    actualHrs,
    qualityRating,
    progressPct,
    blockerSeverity,
    selfRating
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiSliders className="text-lg" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                ML Performance & Tier Simulator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive What-If scenario testing using our trained ML model
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          
          {/* Sliders Form (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* 1. Quality Rating */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Deliverable Quality Rating</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{qualityRating.toFixed(1)} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={qualityRating}
                onChange={(e) => setQualityRating(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* 2. Progress % */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Goal / Sprint Completion Rate</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPct}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={progressPct}
                onChange={(e) => setProgressPct(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* 3. Actual vs Planned Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Planned Hours: {plannedHrs}h
                </label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={plannedHrs}
                  onChange={(e) => setPlannedHrs(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Hours: {actualHrs}h
                </label>
                <input
                  type="range"
                  min="4"
                  max="14"
                  step="0.5"
                  value={actualHrs}
                  onChange={(e) => setActualHrs(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Blocker Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Encountered Blockers
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['None', 'Low', 'Medium', 'High'] as BlockerSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setBlockerSeverity(sev)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      blockerSeverity === sev
                        ? sev === 'None'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : sev === 'Low'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : sev === 'Medium'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Self Rating */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Self-Assessment Rating</span>
                <span className="text-slate-500 font-bold">{selfRating.toFixed(1)} / 5.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={selfRating}
                onChange={(e) => setSelfRating(parseFloat(e.target.value))}
                className="w-full accent-slate-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Real-time ML Prediction Card (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Predicted Output
              </span>
              
              {/* Score Display */}
              <div className="flex items-baseline space-x-2 my-2">
                <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">
                  {result.predictedScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>

              {/* Tier Badge */}
              <div className="mt-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Assigned Cluster Tier:</span>
                <div 
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm text-white"
                  style={{ backgroundColor: result.color }}
                >
                  <FiAward className="text-sm" />
                  <span>{result.tier}</span>
                </div>
              </div>

              {/* AI Insights */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Model Recommendations:
                </span>
                {result.insights.map((ins, i) => (
                  <div key={i} className="flex items-start space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <FiCheckCircle className="text-indigo-500 mt-0.5 shrink-0" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              Done Testing
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
