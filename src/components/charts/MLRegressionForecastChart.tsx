import React, { useState } from 'react';
import '../../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { DailyTrendPoint } from '../../utils/trendAggregator';
import { MLRegressionData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface MLRegressionForecastChartProps {
  dailyData: DailyTrendPoint[];
  regressionData: MLRegressionData;
}

export const MLRegressionForecastChart: React.FC<MLRegressionForecastChartProps> = ({
  dailyData,
  regressionData
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Default to showing up to the last actual date, with option to toggle AI forecast
  const [showForecast, setShowForecast] = useState<boolean>(false);

  if (!dailyData || dailyData.length === 0 || !regressionData || regressionData.r2_score === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-xs text-slate-400">
        No report data available for regression modeling. Connect your sheet to generate forecasts.
      </div>
    );
  }

  // Calculate trend line
  const n = dailyData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  dailyData.forEach((d, i) => {
    sumX += i;
    sumY += d.avgScore;
    sumXY += i * d.avgScore;
    sumX2 += i * i;
  });

  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0.1;
  const intercept = (sumY - slope * sumX) / n;

  // Format date cleanly as "1 Sep", "25 Sep"
  const formatChartDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      return `${dayNum} ${monthNames[mIdx] || parts[1]}`;
    }
    return dateStr;
  };

  const lastDate = dailyData[dailyData.length - 1]?.date || '';
  const lastDateLabel = lastDate ? formatChartDate(lastDate) : '';

  // Historical labels
  const labels: string[] = dailyData.map(d => formatChartDate(d.date));

  const forecastDays = showForecast ? 7 : 0;
  if (showForecast) {
    for (let f = 1; f <= forecastDays; f++) {
      labels.push(`+Day ${f} (AI)`);
    }
  }

  // Actual scores (historical only)
  const actualSeries: (number | null)[] = dailyData.map(d => d.avgScore);
  if (showForecast) {
    for (let f = 1; f <= forecastDays; f++) {
      actualSeries.push(null);
    }
  }

  // Regression line (historical only or historical + forecast)
  const regressionSeries: number[] = [];
  const totalPoints = n + forecastDays;
  for (let i = 0; i < totalPoints; i++) {
    const val = Number((intercept + slope * i).toFixed(1));
    regressionSeries.push(Math.max(50, Math.min(100, val)));
  }

  // Compute dynamic Y-axis min/max
  const allScores = dailyData.map(d => d.avgScore).concat(regressionSeries);
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);
  const yMin = Math.max(0, Math.floor((minScore - 4) / 5) * 5);
  const yMax = Math.min(100, Math.ceil((maxScore + 4) / 5) * 5);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Historical Actual Score',
        data: actualSeries,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.25,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        borderWidth: 2.5
      },
      {
        label: showForecast ? 'ML Regression Trend & 7-Day Forecast' : 'ML Regression Trend Fit',
        data: regressionSeries,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
        borderWidth: 2
      }
    ]
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        }
      },
      y: {
        min: yMin,
        max: yMax,
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        },
        title: {
          display: true,
          text: 'Performance Score (0-100)',
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Range & Forecast Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Active Date Range: <strong className="text-slate-900 dark:text-slate-200">{formatChartDate(dailyData[0].date)} &rarr; {lastDateLabel}</strong> ({n} Daily Sprints)
        </div>

        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setShowForecast(false)}
            className={`px-3 py-1 rounded-lg transition-all ${
              !showForecast
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Display graph strictly up to the last recorded date in your report"
          >
            📍 Fit to Last Date ({lastDateLabel})
          </button>
          <button
            onClick={() => setShowForecast(true)}
            className={`px-3 py-1 rounded-lg transition-all ${
              showForecast
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Extend graph with 7-day AI predictive performance forecast"
          >
            🔮 +7 Days AI Forecast
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <Line data={chartData} options={options} />
      </div>

      {/* Model Stats & Feature Importance Weights */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Regression Model Fit:
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              R² = {regressionData.r2_score} ({Math.round(regressionData.r2_score * 100)}% Model Fit)
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Trend Gradient: <strong>{slope >= 0 ? `+${slope.toFixed(2)} pts/day` : `${slope.toFixed(2)} pts/day`}</strong>
          </span>
        </div>

        {/* Feature Importance Percentages */}
        <div className="mt-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
            Driving Factors Impacting Performance Score:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(regressionData.feature_importance_pct).map(([feature, pct]) => (
              <div key={feature} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block">{feature}</span>
                <span className="font-display font-bold text-slate-900 dark:text-white mt-0.5 block">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
