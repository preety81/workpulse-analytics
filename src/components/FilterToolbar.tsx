import React from 'react';
import { 
  FiSearch, 
  FiCalendar, 
  FiRotateCcw,
  FiSliders,
  FiUser,
  FiBriefcase,
  FiAward
} from 'react-icons/fi';
import { TimeViewMode } from '../types';

interface FilterToolbarProps {
  timeView: TimeViewMode;
  onTimeViewChange: (view: TimeViewMode) => void;
  selectedEmployee: string;
  onEmployeeChange: (name: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  employeeList: string[];
  roleList: string[];
  onResetFilters: () => void;
  onOpenSimulator: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  timeView,
  onTimeViewChange,
  selectedEmployee,
  onEmployeeChange,
  selectedRole,
  onRoleChange,
  selectedTier,
  onTierChange,
  searchQuery,
  onSearchChange,
  employeeList,
  roleList,
  onResetFilters,
  onOpenSimulator
}) => {
  const hasActiveFilters = 
    selectedEmployee !== 'ALL' || 
    selectedRole !== 'ALL' || 
    selectedTier !== 'ALL' || 
    searchQuery !== '';

  return (
    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
      
      {/* 1 Single Horizontal Row */}
      <div className="flex items-center gap-2.5 w-full flex-nowrap shrink-0">
        
        {/* 1. Trend View Dropdown (Daily / Weekly / Monthly) */}
        <div className="relative shrink-0">
          <FiCalendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 text-xs z-10" />
          <select
            value={timeView}
            onChange={(e) => onTimeViewChange(e.target.value as TimeViewMode)}
            className="appearance-none pl-8 pr-7 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="daily">📅 Daily Trends</option>
            <option value="weekly">📆 Weekly Velocity</option>
            <option value="monthly">🗓️ Monthly Overview</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 text-[10px]">▼</div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* 2. Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-[260px] shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search report or task..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 3. Employee Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={selectedEmployee}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Employees</option>
            {employeeList.map((emp) => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▼</div>
        </div>

        {/* 4. Role Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            {roleList.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▼</div>
        </div>

        {/* 5. ML Tier Dropdown Filter */}
        <div className="relative shrink-0">
          <select
            value={selectedTier}
            onChange={(e) => onTierChange(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All ML Tiers</option>
            <option value="Tier 1 - High Achiever">🟢 Tier 1 - High Achievers</option>
            <option value="Tier 2 - Consistent Performer">🔵 Tier 2 - Consistent</option>
            <option value="Tier 3 - Coaching Required">🟠 Tier 3 - Coaching Needed</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">▼</div>
        </div>

        {/* 6. Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="p-2 text-xs rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors"
            title="Reset Filters"
          >
            <FiRotateCcw className="text-xs" />
          </button>
        )}

        {/* 7. ML Simulator Button (Always in the same 1 line on the right) */}
        <div className="ml-auto shrink-0 pl-2">
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all shrink-0 whitespace-nowrap"
          >
            <FiSliders className="text-xs" />
            <span>ML Simulator</span>
          </button>
        </div>

      </div>

    </div>
  );
};
