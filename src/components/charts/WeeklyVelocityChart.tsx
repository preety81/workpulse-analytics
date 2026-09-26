import React from 'react';
import '../../utils/chartSetup';
import { Chart } from 'react-chartjs-2';
import { WeeklyTrendPoint } from '../../utils/trendAggregator';
import { useTheme } from '../../context/ThemeContext';

interface WeeklyVelocityChartProps {
  data: WeeklyTrendPoint[];
}

export const WeeklyVelocityChart: React.FC<WeeklyVelocityChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-sm text-slate-400">
        No weekly aggregate data available.
      </div>
    );
  }

  const chartData = {
    labels: data.map(w => w.weekLabel),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Deliverables Completed',
        data: data.map(w => w.totalTasks),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          if (!ctx) return '#3b82f6';
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.95)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)');
          return gradient;
        },
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 10,
        yAxisID: 'y',
        order: 1,
        barPercentage: 0.55
      },
      {
        type: 'line' as const,
        label: 'Week-over-Week Growth (%)',
        data: data.map(w => w.velocityGrowthPct),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
        order: 0
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#475569',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1.5,
        padding: 12,
        boxPadding: 5,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.6)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
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
          text: 'Total Deliverables',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11, weight: '600' }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#f59e0b',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          callback: (val: any) => `${val}%`
        },
        title: {
          display: true,
          text: 'Velocity Growth (%)',
          color: '#f59e0b',
          font: { size: 11, weight: '600' }
        }
      }
    }
  };

  return (
    <div className="h-80 w-full">
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};
