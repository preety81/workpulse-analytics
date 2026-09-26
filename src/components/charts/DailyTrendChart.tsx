import React, { useRef, useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { DailyTrendPoint } from '../../utils/trendAggregator';
import { useTheme } from '../../context/ThemeContext';

interface DailyTrendChartProps {
  data: DailyTrendPoint[];
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartRef = useRef<any>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-sm text-slate-400">
        No daily report data available for the selected filters.
      </div>
    );
  }

  const labels = data.map(d => {
    const parts = d.date.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      return `${dayNum} ${monthNames[mIdx] || parts[1]}`;
    }
    return d.date;
  });

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Deliverables Completed',
        data: data.map(d => d.totalTasks),
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          if (!ctx) return 'rgba(99, 102, 241, 0.8)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(129, 140, 248, 0.95)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.4)');
          return gradient;
        },
        borderColor: isDark ? '#818cf8' : '#6366f1',
        borderWidth: 1.5,
        borderRadius: 8,
        yAxisID: 'y',
        order: 2,
        barPercentage: 0.65
      },
      {
        type: 'line' as const,
        label: 'Actual Hours Logged',
        data: data.map(d => d.totalHours),
        borderColor: '#06b6d4',
        borderWidth: 2.5,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          if (!ctx) return 'rgba(6, 182, 212, 0.1)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        yAxisID: 'y',
        order: 1
      },
      {
        type: 'line' as const,
        label: 'Deliverable Quality (1-5)',
        data: data.map(d => d.avgQuality),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [5, 4],
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
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
          boxWidth: 8,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1.5,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            if (label.includes('Quality')) return ` ★ ${label}: ${val.toFixed(2)} / 5.0`;
            if (label.includes('Hours')) return ` ⏱️ ${label}: ${val} hrs`;
            return ` 📦 ${label}: ${val} items`;
          }
        }
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
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
          maxRotation: 45
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
          text: 'Deliverables & Hours Worked',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11, weight: '600' }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 1.0,
        max: 5.0,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#10b981',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
        },
        title: {
          display: true,
          text: 'Quality Rating (1-5)',
          color: '#10b981',
          font: { size: 11, weight: '600' }
        }
      }
    }
  };

  return (
    <div className="h-80 w-full">
      <Chart ref={chartRef} type="bar" data={chartData} options={options} />
    </div>
  );
};
