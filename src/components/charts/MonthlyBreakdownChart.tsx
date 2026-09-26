import React from 'react';
import { Line } from 'react-chartjs-2';
import { MonthlyTrendPoint } from '../../utils/trendAggregator';
import { useTheme } from '../../context/ThemeContext';

interface MonthlyBreakdownChartProps {
  data: MonthlyTrendPoint[];
}

export const MonthlyBreakdownChart: React.FC<MonthlyBreakdownChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-sm text-slate-400">
        No monthly aggregate data available.
      </div>
    );
  }

  const chartData = {
    labels: data.map(m => m.monthLabel),
    datasets: [
      {
        label: 'Average Performance Score (0-100)',
        data: data.map(m => m.avgScore),
        borderColor: '#6366f1',
        borderWidth: 3,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          if (!ctx) return 'rgba(99, 102, 241, 0.15)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      },
      {
        label: 'Milestone Progress Rate (%)',
        data: data.map(m => m.avgProgress),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [5, 4],
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
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
        boxPadding: 4,
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
        min: 60,
        max: 100,
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
          text: 'Score / Milestone Progress (%)',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11, weight: '600' }
        }
      }
    }
  };

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};
