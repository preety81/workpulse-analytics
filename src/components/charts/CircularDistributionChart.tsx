import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { CircularDistributionPoint } from '../../utils/trendAggregator';
import { useTheme } from '../../context/ThemeContext';

interface CircularDistributionChartProps {
  tierData: CircularDistributionPoint[];
  roleData: CircularDistributionPoint[];
  blockerData: CircularDistributionPoint[];
}

export const CircularDistributionChart: React.FC<CircularDistributionChartProps> = ({
  tierData,
  roleData,
  blockerData
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeMode, setActiveMode] = useState<'tier' | 'role' | 'health'>('tier');

  const currentData = 
    activeMode === 'tier' ? tierData :
    activeMode === 'role' ? roleData : blockerData;

  const totalCount = currentData.reduce((sum, d) => sum + d.value, 0);

  const chartData = {
    labels: currentData.map(d => d.label),
    datasets: [
      {
        data: currentData.map(d => d.value),
        backgroundColor: currentData.map(d => d.color),
        borderColor: isDark ? '#0f172a' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 6,
        spacing: 3,
        borderRadius: 6
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: (item: any) => {
            const pt = currentData[item.dataIndex];
            return ` ${pt.label}: ${pt.value} (${pt.percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      
      {/* Top Tab Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
            {activeMode === 'tier' && 'ML Performance Tier Ratio'}
            {activeMode === 'role' && 'Department & Role Allocation'}
            {activeMode === 'health' && 'Delivery Health & Impediments'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {activeMode === 'tier' && 'Proportion of High Achievers vs Coaching Needed'}
            {activeMode === 'role' && 'Cross-functional engineering & design breakdown'}
            {activeMode === 'health' && 'Unblocked deliveries vs reported bottlenecks'}
          </p>
        </div>

        {/* Mini Pill Switch */}
        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold shrink-0">
          <button
            onClick={() => setActiveMode('tier')}
            className={`px-2 py-1 rounded-md transition-all ${
              activeMode === 'tier'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tiers
          </button>
          <button
            onClick={() => setActiveMode('role')}
            className={`px-2 py-1 rounded-md transition-all ${
              activeMode === 'role'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveMode('health')}
            className={`px-2 py-1 rounded-md transition-all ${
              activeMode === 'health'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Health
          </button>
        </div>
      </div>

      {/* Center Donut with Metric in Center */}
      <div className="relative h-56 my-3 flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
        
        {/* Inner Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {activeMode === 'health' ? 'Reports' : 'Total'}
          </span>
          <span className="font-display text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </span>
          <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
            {activeMode === 'tier' ? 'Employees' : activeMode === 'role' ? 'Members' : 'Logs'}
          </span>
        </div>
      </div>

      {/* Bottom Colorful Breakdown List */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {currentData.map((pt, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                style={{ backgroundColor: pt.color }} 
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {pt.label}
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-slate-400 font-mono text-[11px]">
                {pt.value}
              </span>
              <span 
                className="font-bold font-display px-1.5 py-0.5 rounded text-[10px]"
                style={{ 
                  color: pt.color, 
                  backgroundColor: `${pt.color}18` 
                }}
              >
                {pt.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
