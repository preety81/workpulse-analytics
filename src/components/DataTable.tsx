import React, { useState, useMemo } from 'react';
import { 
  FiEye, 
  FiDownload, 
  FiChevronLeft, 
  FiChevronRight,
  FiUserCheck,
  FiFileText,
  FiLayers,
  FiCalendar,
  FiCheckCircle,
  FiActivity,
  FiUser,
  FiUsers,
  FiInfo
} from 'react-icons/fi';
import { EmployeeAggregate, DailyReportEntry, PerformanceTier } from '../types';
import { formatDisplayDate } from '../utils/googleSheetsConnector';
import { classifyReportTier, generateTierCohorts } from '../utils/trendAggregator';

interface DataTableProps {
  employees: EmployeeAggregate[];
  reports: DailyReportEntry[];
  onSelectEmployee: (employee: EmployeeAggregate) => void;
  onLoadDemoTeam?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  employees,
  reports,
  onSelectEmployee,
  onLoadDemoTeam
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'reports'>('employees');
  const [tierViewMode, setTierViewMode] = useState<'profile' | 'breakdown'>('profile');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | 'Tier 1' | 'Tier 2' | 'Tier 3'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Generate Tier 1, Tier 2, and Tier 3 cohorts from employee reports
  const tierCohorts = useMemo(() => {
    return generateTierCohorts(employees, reports);
  }, [employees, reports]);

  // Counts of reports or employees per tier
  const tierCounts = useMemo(() => {
    if (employees.length > 1) {
      let t1 = employees.filter(e => e.tier.includes('Tier 1')).length;
      let t2 = employees.filter(e => e.tier.includes('Tier 2')).length;
      let t3 = employees.filter(e => e.tier.includes('Tier 3')).length;
      return { t1, t2, t3, total: employees.length, isMultiEmployee: true };
    }
    // Single employee: count report days per tier
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    reports.forEach(r => {
      const { tier } = classifyReportTier(r);
      if (tier.includes('Tier 1')) t1++;
      else if (tier.includes('Tier 3')) t3++;
      else t2++;
    });
    return { t1, t2, t3, total: reports.length, isMultiEmployee: false };
  }, [employees, reports]);

  // Determine which list to display in Employee Performance tab
  const displayEmployeeRows = useMemo(() => {
    let list: EmployeeAggregate[] = [];
    if (employees.length > 1) {
      list = employees;
    } else {
      if (tierViewMode === 'profile') {
        list = employees;
      } else {
        list = tierCohorts;
      }
    }

    if (selectedTierFilter === 'ALL') return list;
    return list.filter(e => e.tier.includes(selectedTierFilter));
  }, [tierViewMode, employees, tierCohorts, selectedTierFilter]);

  // Daily reports with classification
  const classifiedReports = useMemo(() => {
    return reports.map(r => ({
      ...r,
      classification: classifyReportTier(r)
    }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (selectedTierFilter === 'ALL') return classifiedReports;
    return classifiedReports.filter(r => r.classification.tier.includes(selectedTierFilter));
  }, [classifiedReports, selectedTierFilter]);

  // Export to CSV
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'employees') {
      csvContent += "Name,Role,Email,Tier,Score,Avg Quality,Hours Efficiency,Records\n";
      displayEmployeeRows.forEach(e => {
        csvContent += `"${e.name}","${e.role}","${e.email}","${e.tier}",${e.overall_score},${e.avg_quality},${e.hours_efficiency}%,${e.records_count}\n`;
      });
    } else {
      csvContent += "Date,Employee,Role,ML Tier,Tasks Completed,Planned Hrs,Actual Hrs,Quality,Blockers,Score\n";
      filteredReports.forEach(r => {
        csvContent += `"${r.date}","${r.employee_name}","${r.role}","${r.classification.tier}","${r.tasks_completed.replace(/"/g, '""')}",${r.planned_hrs},${r.actual_hrs},${r.quality_rating},"${r.blockers}",${r.performance_score}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workpulse_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredReports.length / pageSize);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
          <button
            onClick={() => { setActiveTab('employees'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'employees'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiUserCheck className="text-sm" />
            <span>
              {employees.length > 1
                ? `Team Members (${employees.length} Employees)`
                : `Employee Performance (${tierViewMode === 'profile' ? '1 Profile' : '3 Sprints Tiers'})`}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('reports'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiFileText className="text-sm" />
            <span>Daily Detailed Reports ({filteredReports.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-fit"
          >
            <FiDownload className="text-xs" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Tier Filter & Mode Selector */}
      <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Tier Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter by Tier:</span>
          <button
            onClick={() => { setSelectedTierFilter('ALL'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedTierFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All {tierCounts.isMultiEmployee ? `Employees (${tierCounts.total})` : `Sprints (${tierCounts.total})`}
          </button>
          
          <button
            onClick={() => { setSelectedTierFilter('Tier 1'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center space-x-1.5 transition-all ${
              selectedTierFilter === 'Tier 1'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Tier 1 - High Achiever ({tierCounts.t1})</span>
          </button>

          <button
            onClick={() => { setSelectedTierFilter('Tier 2'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center space-x-1.5 transition-all ${
              selectedTierFilter === 'Tier 2'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>Tier 2 - Consistent ({tierCounts.t2})</span>
          </button>

          <button
            onClick={() => { setSelectedTierFilter('Tier 3'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center space-x-1.5 transition-all ${
              selectedTierFilter === 'Tier 3'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Tier 3 - Coaching Needed ({tierCounts.t3})</span>
          </button>
        </div>

        {/* View Switcher for Tab 1 */}
        {activeTab === 'employees' && (
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {employees.length <= 1 ? (
              <>
                <button
                  onClick={() => setTierViewMode('profile')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tierViewMode === 'profile'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Display overall employee aggregate row"
                >
                  👤 Employee Profile (1)
                </button>
                <button
                  onClick={() => setTierViewMode('breakdown')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tierViewMode === 'breakdown'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Display sprint days categorized by Tier 1, 2, 3"
                >
                  🎯 Sprints by Tier (3 Tiers)
                </button>
              </>
            ) : (
              <div className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                <FiUsers className="text-xs" />
                <span>All {employees.length} Team Members Listed</span>
              </div>
            )}
            <button
              onClick={() => { setActiveTab('reports'); setPage(1); }}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              title="View daily reports classified by Tier"
            >
              <span>📅 Daily Logs ({reports.length})</span>
            </button>
          </div>
        )}

      </div>

      {/* Informational banner when single employee is loaded */}
      {activeTab === 'employees' && employees.length === 1 && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FiUser className="text-sm" />
            </span>
            <div className="text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                Sheet mein 1 employee ({employees[0].name}) ka data hai ({reports.length} daily logs).
              </span>{' '}
              Sabhi sprint tiers dekhne ke liye <strong>'🎯 Sprints by Tier'</strong> button chunein, ya 5 employees ka team test karne ke liye demo load karein.
            </div>
          </div>
          {onLoadDemoTeam && (
            <button
              onClick={onLoadDemoTeam}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all shrink-0 self-start sm:self-auto flex items-center space-x-1.5"
            >
              <span>⚡ 20-Employee Workforce Demo Load Karein</span>
            </button>
          )}
        </div>
      )}

      {/* Multi-Employee Active Banner */}
      {activeTab === 'employees' && employees.length > 1 && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              <strong>{employees.length} Team Members</strong> successfully active across ML Tiers ({reports.length} total sprint reports).
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
            All Employees Visible Below
          </span>
        </div>
      )}

      {/* Tab 1: Employees Summary Table */}
      {activeTab === 'employees' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee / Cohort</th>
                <th className="py-3 px-4">Role & Specialization</th>
                <th className="py-3 px-4">ML Tier Classification</th>
                <th className="py-3 px-4">Performance Score</th>
                <th className="py-3 px-4">Avg Quality</th>
                <th className="py-3 px-4">Hours Efficiency</th>
                <th className="py-3 px-4">Reports</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {displayEmployeeRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No records found matching the selected tier filter. Click "All Tiers" to view all records.
                  </td>
                </tr>
              ) : (
                displayEmployeeRows.map((emp) => {
                  const isOverall = emp.name.includes('Overall Cumulative');
                  const isTier1 = emp.tier.includes('Tier 1');
                  const isTier2 = emp.tier.includes('Tier 2');
                  const isTier3 = emp.tier.includes('Tier 3');

                  return (
                    <tr 
                      key={emp.name} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isOverall ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                      onClick={() => onSelectEmployee(emp)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div 
                            className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-xs"
                            style={{ 
                              backgroundColor: isOverall ? '#4f46e5' : emp.tier_color 
                            }}
                          >
                            {isOverall ? '★' : isTier1 ? '1' : isTier2 ? '2' : '3'}
                          </div>
                          <div className="min-w-0 max-w-[260px]">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate" title={emp.name}>
                              {emp.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate" title={emp.email}>
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {emp.role}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm inline-flex items-center space-x-1"
                          style={{ backgroundColor: emp.tier_color }}
                        >
                          <span>{emp.tier}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                            {emp.overall_score}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${emp.overall_score}%`, 
                                backgroundColor: emp.tier_color 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        ★ {emp.avg_quality}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{emp.hours_efficiency}%</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {emp.records_count} days
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(emp);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                          title="View Details"
                        >
                          <FiEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Daily Reports Detailed Log */}
      {activeTab === 'reports' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">ML Tier Classification</th>
                  <th className="py-3 px-4">Tasks Completed</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Quality</th>
                  <th className="py-3 px-4">Blockers</th>
                  <th className="py-3 px-4">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No daily reports matching the selected tier filter. Click "All Tiers" above to view all reports.
                    </td>
                  </tr>
                ) : (
                  currentReports.map((r, i) => {
                    return (
                      <tr key={r.id || i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatDisplayDate(r.date)}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap max-w-[180px] truncate" title={r.employee_name}>
                          {r.employee_name}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs inline-flex items-center space-x-1"
                            style={{ backgroundColor: r.classification.color }}
                          >
                            <span>{r.classification.tier}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 max-w-sm truncate" title={r.tasks_completed}>
                          {r.tasks_completed}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {r.actual_hrs}h <span className="text-slate-400 text-[10px]">({r.planned_hrs}h plan)</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap font-medium text-emerald-600 dark:text-emerald-400">
                          ★ {r.quality_rating}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {r.blockers && r.blockers.toLowerCase() !== 'none' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              {r.blocker_severity}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-display font-bold text-slate-900 dark:text-white">
                          {r.performance_score}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {filteredReports.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredReports.length)} of {filteredReports.length} reports
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiChevronLeft className="text-sm" />
              </button>
              <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
