import React, { useState, useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { EmployeeAggregate, MLClusteringData, DailyReportEntry } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { formatDisplayDate } from '../../utils/googleSheetsConnector';

interface MLClusteringChartProps {
  employees: EmployeeAggregate[];
  clusteringData: MLClusteringData;
  reports?: DailyReportEntry[];
  onSelectEmployee?: (employee: EmployeeAggregate) => void;
}

export const MLClusteringChart: React.FC<MLClusteringChartProps> = ({
  employees,
  clusteringData,
  reports = [],
  onSelectEmployee
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Toggle between Daily Sessions (reports) and Employee Summary (employees)
  const [viewMode, setViewMode] = useState<'sessions' | 'employees'>(() => employees.length > 1 ? 'employees' : 'sessions');

  React.useEffect(() => {
    if (employees.length > 1) {
      setViewMode('employees');
    }
  }, [employees.length]);

  // Daily Sessions Tier Classification
  const sessionPoints = useMemo(() => {
    return reports.map((r, idx) => {
      const quality = r.quality_rating || 4.0;
      const efficiency = r.actual_hrs > 0 ? Math.min(105, Math.round((r.planned_hrs / r.actual_hrs) * 100)) : 100;
      const score = r.performance_score;

      let tier: 'Tier 1 - High Achiever' | 'Tier 2 - Consistent Performer' | 'Tier 3 - Coaching Required' = 'Tier 2 - Consistent Performer';
      let cluster = 1;
      let color = '#3b82f6'; // Blue

      if (score >= 90 || (quality >= 4.5 && efficiency >= 95)) {
        tier = 'Tier 1 - High Achiever';
        cluster = 0;
        color = '#10b981'; // Emerald
      } else if (score < 75 || quality < 3.8 || r.blocker_severity === 'High') {
        tier = 'Tier 3 - Coaching Required';
        cluster = 2;
        color = '#f59e0b'; // Amber
      }

      // Micro-jitter to prevent points with identical quality/efficiency from completely hiding each other
      const jitterX = Number((((idx % 3) - 1) * 0.03).toFixed(3));
      const jitterY = Number(((((idx * 3) % 5) - 2) * 0.5).toFixed(2));

      return {
        x: Number((quality + jitterX).toFixed(2)),
        y: Number((efficiency + jitterY).toFixed(1)),
        exactQuality: quality,
        exactEfficiency: efficiency,
        tier,
        cluster,
        color,
        rawReport: r,
        dayNo: r.day_no || (idx + 1)
      };
    });
  }, [reports]);

  // Grouped data based on active view mode
  const t1Data = useMemo(() => {
    if (viewMode === 'sessions') {
      return sessionPoints.filter(p => p.cluster === 0);
    }
    return employees.filter(e => e.cluster === 0 || e.tier.includes('Tier 1')).map((e, idx) => {
      const jitterX = employees.length > 1 ? Number((((idx % 3) - 1) * 0.02).toFixed(3)) : 0;
      const jitterY = employees.length > 1 ? Number(((((idx * 3) % 5) - 2) * 0.35).toFixed(2)) : 0;
      return {
        x: Number((e.avg_quality + jitterX).toFixed(2)),
        y: Number((e.hours_efficiency + jitterY).toFixed(1)),
        exactQuality: e.avg_quality,
        exactEfficiency: e.hours_efficiency,
        rawEmp: e
      };
    });
  }, [viewMode, sessionPoints, employees]);

  const t2Data = useMemo(() => {
    if (viewMode === 'sessions') {
      return sessionPoints.filter(p => p.cluster === 1);
    }
    const real = employees.filter(e => e.cluster === 1 || e.tier.includes('Tier 2')).map((e, idx) => {
      const jitterX = employees.length > 1 ? Number((((idx % 3) - 1) * 0.02).toFixed(3)) : 0;
      const jitterY = employees.length > 1 ? Number(((((idx * 3) % 5) - 2) * 0.35).toFixed(2)) : 0;
      return {
        x: Number((e.avg_quality + jitterX).toFixed(2)),
        y: Number((e.hours_efficiency + jitterY).toFixed(1)),
        exactQuality: e.avg_quality,
        exactEfficiency: e.hours_efficiency,
        rawEmp: e
      };
    });
    if (real.length === 0 && employees.length <= 1) {
      return [{
        x: 4.1,
        y: 98,
        exactQuality: 4.1,
        exactEfficiency: 98,
        label: 'Consistent Benchmark (4.1★, 98% eff)',
        tier: 'Tier 2 - Consistent Performer',
        isBenchmark: true
      }];
    }
    return real;
  }, [viewMode, sessionPoints, employees]);

  const t3Data = useMemo(() => {
    if (viewMode === 'sessions') {
      return sessionPoints.filter(p => p.cluster === 2);
    }
    const real = employees.filter(e => e.cluster === 2 || e.tier.includes('Tier 3')).map((e, idx) => {
      const jitterX = employees.length > 1 ? Number((((idx % 3) - 1) * 0.02).toFixed(3)) : 0;
      const jitterY = employees.length > 1 ? Number(((((idx * 3) % 5) - 2) * 0.35).toFixed(2)) : 0;
      return {
        x: Number((e.avg_quality + jitterX).toFixed(2)),
        y: Number((e.hours_efficiency + jitterY).toFixed(1)),
        exactQuality: e.avg_quality,
        exactEfficiency: e.hours_efficiency,
        rawEmp: e
      };
    });
    if (real.length === 0 && employees.length <= 1) {
      return [{
        x: 3.4,
        y: 82,
        exactQuality: 3.4,
        exactEfficiency: 82,
        label: 'Coaching Target Baseline (3.4★, 82% eff)',
        tier: 'Tier 3 - Coaching Required',
        isBenchmark: true
      }];
    }
    return real;
  }, [viewMode, sessionPoints, employees]);

  const chartData = {
    datasets: [
      {
        label: `Tier 1: High Achievers (${t1Data.filter((d: any) => !d.isBenchmark).length})`,
        data: t1Data,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1.5,
        pointRadius: 6.5,
        pointHoverRadius: 9
      },
      {
        label: `Tier 2: Consistent (${t2Data.filter((d: any) => !d.isBenchmark).length})`,
        data: t2Data,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        pointRadius: 6.5,
        pointHoverRadius: 9
      },
      {
        label: `Tier 3: Coaching Needed (${t3Data.filter((d: any) => !d.isBenchmark).length})`,
        data: t3Data,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1.5,
        pointRadius: 6.5,
        pointHoverRadius: 9
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
      axis: 'xy' as const
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0 && onSelectEmployee) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const pt = chartData.datasets[datasetIndex].data[index] as any;
        if (pt?.rawEmp) {
          onSelectEmployee(pt.rawEmp);
        } else if (pt?.rawReport && employees.length > 0) {
          const emp = employees.find(e => e.name === pt.rawReport.employee_name) || employees[0];
          onSelectEmployee(emp);
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#475569',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          usePointStyle: true,
          boxWidth: 8,
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1.5,
        padding: 12,
        boxPadding: 4,
        callbacks: {
          title: (items: any[]) => {
            const raw = items[0]?.raw;
            if (raw?.isBenchmark) {
              return `🎯 ${raw.label}`;
            }
            if (raw?.rawReport) {
              const r = raw.rawReport;
              return `📅 Day ${r.day_no} (${formatDisplayDate(r.date)}) • ${r.employee_name}`;
            }
            if (raw?.rawEmp) {
              return `👤 ${raw.rawEmp.name} • ${raw.rawEmp.role}`;
            }
            return 'Performance Cluster Point';
          },
          label: (item: any) => {
            const raw = item.raw;
            if (raw?.isBenchmark) {
              return [
                `★ Quality Benchmark: ${raw.exactQuality || raw.x} / 5.0`,
                `⏱️ Planning Efficiency: ${raw.exactEfficiency || raw.y}%`,
                `Target benchmark baseline for this cluster`
              ];
            }
            if (raw?.rawReport) {
              const r = raw.rawReport;
              return [
                `🏅 Classification: ${raw.tier}`,
                `★ Deliverable Quality: ${r.quality_rating} / 5.0`,
                `⏱️ Hours Logged: ${r.actual_hrs}h (${r.planned_hrs}h plan)`,
                `⚡ Efficiency: ${raw.exactEfficiency || raw.y}%`,
                `📈 Daily Score: ${r.performance_score} / 100`,
                `⚠️ Blockers: ${r.blockers && r.blockers.toLowerCase() !== 'none' ? r.blockers : 'None'}`
              ];
            }
            if (raw?.rawEmp) {
              const emp = raw.rawEmp;
              return [
                `🏅 Classification: ${emp.tier}`,
                `★ Avg Quality: ${emp.avg_quality} / 5.0`,
                `⏱️ Hours Efficiency: ${emp.hours_efficiency}%`,
                `📈 Composite Score: ${emp.overall_score} / 100`,
                `👉 Click to view scorecard`
              ];
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        min: 2.8,
        max: 5.2,
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        },
        title: {
          display: true,
          text: 'Deliverable Quality Benchmark (1 - 5)',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11, weight: '600' }
        }
      },
      y: {
        min: 55,
        max: 110,
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (val: any) => `${val}%`
        },
        title: {
          display: true,
          text: 'Hours Planning Efficiency (%)',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11, weight: '600' }
        }
      }
    }
  };

  const allTiers = [
    {
      tier: 'Tier 1 - High Achiever',
      shortTitle: 'Tier 1',
      subtitle: 'High Achiever',
      color: '#10b981',
      count: viewMode === 'sessions' 
        ? sessionPoints.filter(p => p.cluster === 0).length 
        : employees.filter(e => e.cluster === 0 || e.tier.includes('Tier 1')).length,
      desc: 'Top output velocity, high quality rating (4.5–5.0), disciplined adherence and 0 blockers.'
    },
    {
      tier: 'Tier 2 - Consistent Performer',
      shortTitle: 'Tier 2',
      subtitle: 'Consistent Performer',
      color: '#3b82f6',
      count: viewMode === 'sessions' 
        ? sessionPoints.filter(p => p.cluster === 1).length 
        : employees.filter(e => e.cluster === 1 || e.tier.includes('Tier 2')).length,
      desc: 'Dependable daily output, steady progress, solid adherence to goals and consistent ratings (3.8–4.4).'
    },
    {
      tier: 'Tier 3 - Coaching Required',
      shortTitle: 'Tier 3',
      subtitle: 'Coaching Required',
      color: '#f59e0b',
      count: viewMode === 'sessions' 
        ? sessionPoints.filter(p => p.cluster === 2).length 
        : employees.filter(e => e.cluster === 2 || e.tier.includes('Tier 3')).length,
      desc: 'Frequent blockers, lower efficiency gap (<3.8 rating), requires proactive 1-on-1 mentorship.'
    }
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Header with Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong>{viewMode === 'sessions' ? `${reports.length} Daily Work Sessions` : `${employees.length} Employee(s)`}</strong>
        </span>

        {/* View Switcher Pill */}
        {reports.length > 0 && (
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'sessions'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Classify each daily report log across Tier 1, Tier 2, and Tier 3"
            >
              📅 Daily Sessions ({reports.length})
            </button>
            <button
              onClick={() => setViewMode('employees')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'employees'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Classify overall employee aggregates"
            >
              👥 Employee View ({employees.length})
            </button>
          </div>
        )}
      </div>

      {/* Visual Guide explaining what the dots mean */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
          <span>💡 Yeh Dots Chart Kaise Kaam Karta Hai (How It Works):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950 flex flex-col space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>🟢 Green Dots (Tier 1: High Achievers)</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Top quality (<strong>4.5 - 5.0</strong>) aur high efficiency (<strong>95% - 100%</strong>), zero blockers.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-950 flex flex-col space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>🔵 Blue Dots (Tier 2: Consistent)</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Steady deliverable days jahan Quality <strong>~4.0</strong> aur plan ke hisab se work time par hua.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 flex flex-col space-y-1">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>🟠 Orange Dots (Tier 3: Coaching Needed)</span>
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Wo din jahan <strong>blockers</strong> aaye ya Quality <strong>3.5 se neeche</strong> rahi jisme support chahiye.
            </p>
          </div>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="h-64 w-full">
        <Chart type="scatter" data={chartData} options={options} />
      </div>

      {/* Cluster Tier Explanation Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {allTiers.map((c, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              {/* Header with Title & Badge */}
              <div className="flex items-center justify-between gap-1.5 pb-1">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {c.shortTitle}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0 whitespace-nowrap shadow-xs">
                  {c.count} {viewMode === 'sessions' ? 'Days' : 'Active'}
                </span>
              </div>

              {/* Subtitle Label */}
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                {c.subtitle}
              </div>

              {/* Description */}
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {c.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
