import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PerformanceDataset, 
  TimeViewMode, 
  SheetConnectionConfig, 
  EmployeeAggregate, 
  DailyReportEntry 
} from './types';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FilterToolbar } from './components/FilterToolbar';
import { DailyTrendChart } from './components/charts/DailyTrendChart';
import { WeeklyVelocityChart } from './components/charts/WeeklyVelocityChart';
import { MonthlyBreakdownChart } from './components/charts/MonthlyBreakdownChart';
import { MLClusteringChart } from './components/charts/MLClusteringChart';
import { MLRegressionForecastChart } from './components/charts/MLRegressionForecastChart';
import { CircularDistributionChart } from './components/charts/CircularDistributionChart';
import { DataTable } from './components/DataTable';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { MLSimulator } from './components/MLSimulator';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { 
  getDailyTrends, 
  getWeeklyTrends, 
  getMonthlyTrends,
  getTierDistribution,
  getRoleDistribution,
  getBlockerDistribution,
  classifyReportTier
} from './utils/trendAggregator';
import { fetchGoogleSheetData, buildDatasetFromReports } from './utils/googleSheetsConnector';
import { parseUploadedFile } from './utils/excelParser';
import { getSampleTeamDataset } from './data/sampleTeamDataset';
import { FiTrendingUp, FiLayers, FiCpu, FiLink, FiDatabase, FiAlertCircle, FiUploadCloud, FiUsers } from 'react-icons/fi';

const emptyDataset: PerformanceDataset = {
  summary: {
    total_interns: 0,
    total_reports: 0,
    date_range: { start: '', end: '' },
    avg_team_score: 0,
    avg_quality_rating: 0,
    total_hours_logged: 0,
    completion_rate_pct: 0,
    active_blockers_count: 0
  },
  employees: [],
  daily_reports: [],
  ml_clustering: {
    algorithm: 'K-Means (k=3)',
    k: 0,
    clusters: []
  },
  ml_regression: {
    r2_score: 0,
    intercept: 0,
    coefficients: {
      quality_rating: 0,
      progress_pct: 0,
      hours_deviation: 0,
      blocker_severity: 0,
      self_rating_discrepancy: 0
    },
    feature_importance_pct: {}
  }
};

// Automatically repairs dates if they were previously parsed with day/month swapped
function sanitizeDatasetDates(ds: PerformanceDataset): PerformanceDataset {
  if (!ds || !ds.daily_reports || ds.daily_reports.length === 0) return ds;
  
  // Find dominant year-month across reports (e.g., 2026-09)
  const monthCounts: Record<string, number> = {};
  ds.daily_reports.forEach(r => {
    const ym = r.date.substring(0, 7);
    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
  });

  let dominantYM = '';
  let maxC = 0;
  for (const [ym, count] of Object.entries(monthCounts)) {
    if (count > maxC) {
      maxC = count;
      dominantYM = ym;
    }
  }

  // If >= 40% are in dominant month (e.g. September 2026), repair any inverted outlier dates (e.g. 2026-02-09 -> 2026-09-02)
  if (dominantYM && maxC >= ds.daily_reports.length * 0.4) {
    const [domYear, domMonth] = dominantYM.split('-');
    let hasChanged = false;

    const repairedReports = ds.daily_reports.map((r) => {
      const parts = r.date.split('-');
      // Check if parts[2] (day) is actually the dominant month and parts[1] is the day
      if (parts.length === 3 && parts[0] === domYear && parts[1] !== domMonth && parts[2] === domMonth) {
        hasChanged = true;
        return {
          ...r,
          date: `${domYear}-${domMonth}-${parts[1].padStart(2, '0')}`
        };
      }
      return r;
    });

    if (hasChanged) {
      repairedReports.sort((a, b) => a.date.localeCompare(b.date));
      repairedReports.forEach((r, i) => {
        r.day_no = i + 1;
      });
      const repairedDs = buildDatasetFromReports(repairedReports);
      try {
        localStorage.setItem('workpulse-user-dataset', JSON.stringify(repairedDs));
      } catch {
        // ignore
      }
      return repairedDs;
    }
  }

  return ds;
}

export const App: React.FC = () => {
  // Purge any stale dummy data or old instruction rows on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('workpulse-user-dataset');
      if (saved) {
        if (
          saved.includes('Aman Sharma') ||
          saved.includes('Priya Verma') ||
          saved.includes('Member 1') ||
          saved.includes('Employee 1') ||
          saved.includes('Add ONE new row') ||
          saved.includes('previous day')
        ) {
          localStorage.removeItem('workpulse-user-dataset');
          setDataset(emptyDataset);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Main Dataset State (defaults to 20-employee company workforce, 380 reports)
  const [dataset, setDataset] = useState<PerformanceDataset>(() => {
    try {
      const saved = localStorage.getItem('workpulse-user-dataset');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore from localStorage if it has 2 or more employees
        if (parsed && parsed.employees && parsed.employees.length >= 2 && parsed.daily_reports && parsed.daily_reports.length > 0) {
          if (
            !saved.includes('Aman Sharma') && 
            !saved.includes('Priya Verma') &&
            !saved.includes('Add ONE new row') &&
            !saved.includes('previous day')
          ) {
            return sanitizeDatasetDates(parsed);
          }
        }
      }
    } catch {
      // ignore
    }
    // Default to the full 20-employee company dataset (380 logs)
    const initial20 = getSampleTeamDataset();
    try {
      localStorage.setItem('workpulse-user-dataset', JSON.stringify(initial20));
    } catch {}
    return initial20;
  });
  
  // Connection Configuration
  const [connectionConfig, setConnectionConfig] = useState<SheetConnectionConfig>(() => {
    try {
      const saved = localStorage.getItem('workpulse-user-connection');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url && !parsed.url.includes('Aarav_Sharma')) return parsed;
      }
    } catch {
      // ignore
    }
    return {
      type: 'google_sheets',
      url: 'WorkPulse 20-Employee Company Workforce (380 Reports)',
      lastSynced: 'Active Live',
      status: 'connected',
      autoSyncInterval: 0
    };
  });

  // Filter & View States
  const [timeView, setTimeView] = useState<TimeViewMode>('daily');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & UI States
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<EmployeeAggregate | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isWindowDragging, setIsWindowDragging] = useState<boolean>(false);
  const [dragToastMsg, setDragToastMsg] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Global Drag & Drop Listeners for Excel / CSV files anywhere on the page
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsWindowDragging(false);
        dragCounter.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      dragCounter.current = 0;

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        alert('Kripya sirf Excel (.xlsx, .xls) ya CSV (.csv) file drop karein.');
        return;
      }

      try {
        setIsSyncing(true);
        const parsed = await parseUploadedFile(file);
        const newCfg: SheetConnectionConfig = {
          type: 'excel_file',
          url: file.name,
          sheetName: file.name,
          lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'connected',
          autoSyncInterval: 0
        };
        setDataset(parsed);
        setConnectionConfig(newCfg);
        localStorage.setItem('workpulse-user-dataset', JSON.stringify(parsed));
        localStorage.setItem('workpulse-user-connection', JSON.stringify(newCfg));
        setIsConnectModalOpen(false);
        setDragToastMsg(`Successfully loaded ${file.name} with ${parsed.daily_reports.length} reports!`);
        setTimeout(() => setDragToastMsg(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Excel file read karne mein error aayi.');
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Sync Logic
  const handleSyncNow = async () => {
    const targetUrl = connectionConfig.url || 'https://docs.google.com/spreadsheets/d/1_9XTENTpCSBbLG1-ubL8E3IIjRTRx2m3hvNTOIcp6j8/edit?usp=sharing';
    setIsSyncing(true);
    try {
      const updated = await fetchGoogleSheetData(targetUrl);
      setDataset(updated);
      const newCfg: SheetConnectionConfig = {
        type: 'google_sheets',
        url: targetUrl,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'connected',
        autoSyncInterval: connectionConfig.autoSyncInterval || 0
      };
      setConnectionConfig(newCfg);
      localStorage.setItem('workpulse-user-dataset', JSON.stringify(updated));
      localStorage.setItem('workpulse-user-connection', JSON.stringify(newCfg));
    } catch (err: any) {
      setConnectionConfig(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-fetch data on start ONLY if user explicitly configured an external Google Sheet URL
  useEffect(() => {
    if (
      dataset.daily_reports.length === 0 && 
      !isSyncing && 
      connectionConfig.url && 
      connectionConfig.url.startsWith('https://docs.google.com')
    ) {
      handleSyncNow();
    }
  }, []);

  // Disconnect & Clear All Data
  const handleClearData = () => {
    localStorage.removeItem('workpulse-user-dataset');
    localStorage.removeItem('workpulse-user-connection');
    setDataset(emptyDataset);
    setConnectionConfig({
      type: 'google_sheets',
      url: '',
      lastSynced: null,
      status: 'idle',
      autoSyncInterval: 0
    });
    setSelectedEmployee('ALL');
    setSelectedRole('ALL');
    setSelectedTier('ALL');
    setSearchQuery('');
  };

  // Load Complete 20-Employee Company Workforce (380 Reports)
  const handleLoad20Employees = () => {
    const dataset20 = getSampleTeamDataset();
    setDataset(dataset20);
    const newCfg: SheetConnectionConfig = {
      type: 'google_sheets',
      url: 'WorkPulse 20-Employee Company Workforce (380 Reports)',
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'connected',
      autoSyncInterval: 0
    };
    setConnectionConfig(newCfg);
    localStorage.setItem('workpulse-user-dataset', JSON.stringify(dataset20));
    localStorage.setItem('workpulse-user-connection', JSON.stringify(newCfg));
    setSelectedEmployee('ALL');
    setSelectedRole('ALL');
    setSelectedTier('ALL');
    setSearchQuery('');
  };

  // Periodic Auto-Sync Timer
  useEffect(() => {
    if (connectionConfig.type === 'google_sheets' && connectionConfig.autoSyncInterval > 0 && connectionConfig.url) {
      const interval = setInterval(() => {
        handleSyncNow();
      }, connectionConfig.autoSyncInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [connectionConfig]);

  // Unique Lists for Dropdown Filters
  const employeeList = useMemo(() => {
    return Array.from(new Set(dataset.employees.map(e => e.name))).sort();
  }, [dataset]);

  const roleList = useMemo(() => {
    return Array.from(new Set(dataset.employees.map(e => e.role))).sort();
  }, [dataset]);

  // Filtered Daily Reports
  const filteredReports = useMemo(() => {
    return dataset.daily_reports.filter(r => {
      if (selectedEmployee !== 'ALL' && r.employee_name !== selectedEmployee) return false;
      if (selectedRole !== 'ALL' && r.role !== selectedRole) return false;
      if (selectedTier !== 'ALL') {
        if (dataset.employees.length <= 1) {
          const { tier } = classifyReportTier(r);
          if (tier !== selectedTier) return false;
        } else {
          const emp = dataset.employees.find(e => e.name === r.employee_name);
          if (emp && emp.tier !== selectedTier) return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = r.employee_name.toLowerCase().includes(q);
        const matchTask = r.tasks_completed.toLowerCase().includes(q);
        const matchGoal = r.goal.toLowerCase().includes(q);
        const matchBlocker = r.blockers.toLowerCase().includes(q);
        if (!matchName && !matchTask && !matchGoal && !matchBlocker) return false;
      }
      return true;
    });
  }, [dataset, selectedEmployee, selectedRole, selectedTier, searchQuery]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return dataset.employees.filter(e => {
      if (selectedEmployee !== 'ALL' && e.name !== selectedEmployee) return false;
      if (selectedRole !== 'ALL' && e.role !== selectedRole) return false;
      if (selectedTier !== 'ALL') {
        if (dataset.employees.length <= 1) {
          const hasReportsInTier = dataset.daily_reports.some(r => classifyReportTier(r).tier === selectedTier);
          if (!hasReportsInTier) return false;
        } else {
          if (e.tier !== selectedTier) return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.role.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [dataset, selectedEmployee, selectedRole, selectedTier, searchQuery]);

  // Aggregated Trends
  const dailyTrends = useMemo(() => getDailyTrends(filteredReports), [filteredReports]);
  const weeklyTrends = useMemo(() => getWeeklyTrends(filteredReports), [filteredReports]);
  const monthlyTrends = useMemo(() => getMonthlyTrends(filteredReports), [filteredReports]);

  // Circular Distributions (Round Charts)
  const tierDistribution = useMemo(() => getTierDistribution(filteredEmployees, filteredReports), [filteredEmployees, filteredReports]);
  const roleDistribution = useMemo(() => getRoleDistribution(filteredEmployees), [filteredEmployees]);
  const blockerDistribution = useMemo(() => getBlockerDistribution(filteredReports), [filteredReports]);

  // Top Performer
  const topPerformer = useMemo(() => {
    if (dataset.employees.length === 0) return undefined;
    return [...dataset.employees].sort((a, b) => b.overall_score - a.overall_score)[0];
  }, [dataset]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedEmployee('ALL');
    setSelectedRole('ALL');
    setSelectedTier('ALL');
    setSearchQuery('');
  };

  const hasData = dataset.daily_reports.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <Header
        connectionConfig={connectionConfig}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onSyncNow={handleSyncNow}
        onClearData={handleClearData}
        onLoad20Employees={handleLoad20Employees}
        isSyncing={isSyncing}
        hasData={hasData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Clean Empty State Prompt when no data */}
        {!hasData && (
          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/80 dark:border-indigo-900/50 shadow-md text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FiDatabase className="text-2xl" />
            </div>
            <div className="max-w-xl">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                Koi Dummy Data Nahi Hai — Sheet Connect Karein
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Software bilkul saaf (empty) hai. Apni company ki <strong>Google Sheet</strong> ka link paste karein ya <strong>Excel file (.xlsx)</strong> upload karein. Jab tak aapki sheet mein kam se kam 1 row data nahi hoga, graphs blank rahenge.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                <FiLink className="text-sm" />
                <span>Google Sheet Link Karein ya Excel Upload Karein</span>
              </button>
              <button
                onClick={handleLoad20Employees}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
              >
                <FiUsers className="text-sm" />
                <span>⚡ 20-Employee Workforce Load Karein (380 Logs)</span>
              </button>
            </div>
          </div>
        )}

        {/* KPI Metric Cards */}
        <MetricCards
          summary={dataset.summary}
          topPerformer={topPerformer}
        />

        {/* 1-Line Filter & Mode Toolbar */}
        <FilterToolbar
          timeView={timeView}
          onTimeViewChange={setTimeView}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          employeeList={employeeList}
          roleList={roleList}
          onResetFilters={handleResetFilters}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />

        {/* Section 1: Main Trend Chart + Colorful Circular Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Trend Curve (8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
                  <FiTrendingUp className="text-base" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    {timeView === 'daily' && 'Daily Output & Quality Benchmark'}
                    {timeView === 'weekly' && 'Weekly Velocity & Sprint Growth'}
                    {timeView === 'monthly' && 'Monthly Performance & Score Stability'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {hasData ? `${filteredReports.length} daily reports analyzed` : 'Awaiting data rows in connected sheet'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {hasData ? `${filteredReports.length} records` : '0 records'}
              </span>
            </div>

            <div className="mt-4">
              {hasData ? (
                <>
                  {timeView === 'daily' && <DailyTrendChart data={dailyTrends} />}
                  {timeView === 'weekly' && <WeeklyVelocityChart data={weeklyTrends} />}
                  {timeView === 'monthly' && <MonthlyBreakdownChart data={monthlyTrends} />}
                </>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <FiAlertCircle className="text-2xl text-slate-400" />
                  <span>Abhi koi data nahi hai. Apni sheet mein data rows enter karke connect karein.</span>
                </div>
              )}
            </div>
          </div>

          {/* Round Circular Donut Chart (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <CircularDistributionChart
              tierData={tierDistribution}
              roleData={roleDistribution}
              blockerData={blockerDistribution}
            />
          </div>

        </div>

        {/* Section 2: Machine Learning Intelligence Suite (Clustering + Regression side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ML Clustering Scatter Plot (6 cols) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <FiLayers className="text-base" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Unsupervised K-Means Tier Clusters
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Quality Rating vs Hours Efficiency segmentation
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                k = {dataset.ml_clustering.k} clusters
              </span>
            </div>

            <div className="mt-4">
              {hasData ? (
                <MLClusteringChart
                  employees={filteredEmployees}
                  clusteringData={dataset.ml_clustering}
                  reports={filteredReports}
                  onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <FiAlertCircle className="text-2xl text-slate-400" />
                  <span>K-Means clustering sheet connect hone par calculate hoga.</span>
                </div>
              )}
            </div>
          </div>

          {/* ML Regression & 7-Day Forecast (6 cols) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-sm">
                  <FiCpu className="text-base" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Predictive Regression & 7-Day Forecast
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Multivariate scoring & projected trajectory
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                {hasData ? `R² = ${dataset.ml_regression.r2_score}` : 'R² = 0.00'}
              </span>
            </div>

            <div className="mt-4">
              {hasData ? (
                <MLRegressionForecastChart
                  dailyData={dailyTrends}
                  regressionData={dataset.ml_regression}
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <FiAlertCircle className="text-2xl text-slate-400" />
                  <span>Regression forecast sheet connect hone par generate hoga.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Detailed Data Table */}
        <DataTable
          employees={filteredEmployees}
          reports={filteredReports}
          onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
          onLoadDemoTeam={handleLoad20Employees}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 dark:text-slate-500">
          WorkPulse AI Workforce Analytics • Connected via Online Google Sheet & Excel Data Pipeline
        </div>
      </footer>

      {/* Modals */}
      <GoogleSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        connectionConfig={connectionConfig}
        onUpdateDataset={(newDataset, newConfig) => {
          setDataset(newDataset);
          setConnectionConfig(newConfig);
          localStorage.setItem('workpulse-user-dataset', JSON.stringify(newDataset));
          localStorage.setItem('workpulse-user-connection', JSON.stringify(newConfig));
        }}
      />

      <MLSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <EmployeeDetailModal
        employee={selectedEmployeeDetail}
        reports={dataset.daily_reports}
        onClose={() => setSelectedEmployeeDetail(null)}
      />

      {/* Full-Screen Drag and Drop Hover Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-[100] bg-indigo-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-fade-in pointer-events-none">
          <div className="w-24 h-24 rounded-3xl bg-white/10 border-2 border-dashed border-white/60 flex items-center justify-center mb-6 animate-bounce shadow-2xl">
            <FiUploadCloud className="text-5xl text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
            Excel ya CSV File Yahan Chhodein (Drop here)
          </h2>
          <p className="text-indigo-200 text-sm max-w-md text-center">
            File drop karte hi aapka data automatically parse ho jayega aur dashboard update ho jayega (.xlsx, .xls, .csv).
          </p>
        </div>
      )}

      {/* Toast Notification on Successful File Drop */}
      {dragToastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center space-x-3 text-xs font-semibold animate-fade-in">
          <FiUploadCloud className="text-lg shrink-0" />
          <span>{dragToastMsg}</span>
        </div>
      )}

    </div>
  );
};
export default App;
