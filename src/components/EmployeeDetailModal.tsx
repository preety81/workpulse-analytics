import React from 'react';
import { 
  FiX, 
  FiUser, 
  FiMail, 
  FiBriefcase, 
  FiAward, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiCalendar
} from 'react-icons/fi';
import { EmployeeAggregate, DailyReportEntry } from '../types';
import { formatDisplayDate } from '../utils/googleSheetsConnector';

interface EmployeeDetailModalProps {
  employee: EmployeeAggregate | null;
  reports: DailyReportEntry[];
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  reports,
  onClose
}) => {
  if (!employee) return null;

  const empReports = reports.filter(r => {
    const baseName = employee.name.split(' (')[0].trim();
    const nameMatch = r.employee_name === employee.name || r.employee_name === baseName;
    if (!nameMatch) return false;

    if (employee.name.includes('Tier 1')) {
      const q = r.quality_rating || 4.0;
      const eff = r.actual_hrs > 0 ? (r.planned_hrs / r.actual_hrs) * 100 : 100;
      const hasBlocker = Boolean(r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '');
      return r.performance_score >= 90 || (q >= 4.5 && eff >= 95 && !hasBlocker);
    }
    if (employee.name.includes('Tier 2')) {
      const q = r.quality_rating || 4.0;
      const eff = r.actual_hrs > 0 ? (r.planned_hrs / r.actual_hrs) * 100 : 100;
      const hasBlocker = Boolean(r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '');
      const isT1 = r.performance_score >= 90 || (q >= 4.5 && eff >= 95 && !hasBlocker);
      const isT3 = r.performance_score < 75 || q < 3.8 || r.blocker_severity === 'High';
      return !isT1 && !isT3;
    }
    if (employee.name.includes('Tier 3')) {
      const q = r.quality_rating || 4.0;
      return r.performance_score < 75 || q < 3.8 || r.blocker_severity === 'High';
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-all max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg font-display shrink-0 shadow-xs">
              {employee.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl" title={employee.name}>
                  {employee.name}
                </h3>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm shrink-0 whitespace-nowrap"
                  style={{ backgroundColor: employee.tier_color }}
                >
                  {employee.tier}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center space-x-1 shrink-0">
                  <FiBriefcase className="text-xs shrink-0" />
                  <span className="font-medium">{employee.role}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 truncate max-w-xs sm:max-w-md" title={employee.email}>
                  <FiMail className="text-xs shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Composite Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 dark:text-white">{employee.overall_score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Avg Quality</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 dark:text-white">{employee.avg_quality}</span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Hours Efficiency</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 dark:text-white">{employee.hours_efficiency}%</span>
              <span className="text-xs text-slate-400 font-medium">planned vs actual</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Logged Days</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-display text-slate-900 dark:text-white">{empReports.length}</span>
              <span className="text-xs text-slate-400 font-medium">daily reports</span>
            </div>
          </div>
        </div>

        {/* Scrollable Daily Reports Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Tasks Completed</th>
                <th className="py-2.5 px-3">Hours</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3">Blockers</th>
                <th className="py-2.5 px-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {empReports.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {formatDisplayDate(r.date)}
                  </td>
                  <td className="py-2 px-3 max-w-xs truncate" title={r.tasks_completed}>
                    {r.tasks_completed}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {r.actual_hrs}h <span className="text-slate-400 text-[10px]">({r.planned_hrs}h plan)</span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-medium text-emerald-600 dark:text-emerald-400">
                    ★ {r.quality_rating}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {r.blockers && r.blockers.toLowerCase() !== 'none' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        {r.blocker_severity}: {r.blockers}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                    {r.performance_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
