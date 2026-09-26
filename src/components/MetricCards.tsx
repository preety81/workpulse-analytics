import React from 'react';
import { 
  FiTrendingUp, 
  FiClock, 
  FiStar, 
  FiAlertTriangle,
  FiAward
} from 'react-icons/fi';
import { DatasetSummary, EmployeeAggregate } from '../types';

interface MetricCardsProps {
  summary: DatasetSummary;
  topPerformer?: EmployeeAggregate;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, topPerformer }) => {
  const hasData = summary.total_reports > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      {/* 1. Overall Team Score */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Team Score</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FiTrendingUp className="text-base" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {hasData ? summary.avg_team_score : '—'}
          </span>
          {hasData && <span className="text-xs text-slate-400">/ 100</span>}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span>{hasData ? 'Live evaluated score' : 'Awaiting data'}</span>
        </div>
      </div>

      {/* 2. Total Hours Logged */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hours Logged</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FiClock className="text-base" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {hasData ? `${summary.total_hours_logged}h` : '—'}
          </span>
          {hasData && <span className="text-xs text-slate-400">actual</span>}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
          {hasData ? (
            <>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{summary.completion_rate_pct}%</span>
              <span className="ml-1">completion rate</span>
            </>
          ) : (
            <span>0 hrs recorded</span>
          )}
        </div>
      </div>

      {/* 3. Quality Rating */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Quality</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FiStar className="text-base" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {hasData ? summary.avg_quality_rating : '—'}
          </span>
          {hasData && <span className="text-xs text-slate-400">/ 5.0</span>}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span>{hasData ? 'Peer / manager benchmark' : 'No ratings yet'}</span>
        </div>
      </div>

      {/* 4. Active Blockers */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reported Blockers</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            summary.active_blockers_count > 0 
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <FiAlertTriangle className="text-base" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {hasData ? summary.active_blockers_count : 0}
          </span>
          <span className="text-xs text-slate-400">active</span>
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">
            {hasData ? `Across ${summary.total_reports} daily reports` : 'None logged'}
          </span>
        </div>
      </div>

      {/* 5. Top Performer Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/50 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            Top Performer
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <FiAward className="text-base" />
          </div>
        </div>
        <div className="mt-3 truncate">
          <span className="font-display text-lg font-bold text-slate-900 dark:text-white truncate block">
            {topPerformer ? topPerformer.name : 'Awaiting Sheet'}
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {topPerformer ? topPerformer.role : 'Connect Data Source'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
          {topPerformer ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Score: <strong>{topPerformer.overall_score}</strong></span>
            </>
          ) : (
            <span className="text-slate-400 text-[11px]">No ranking available</span>
          )}
        </div>
      </div>

    </div>
  );
};
