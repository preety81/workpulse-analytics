import { DailyReportEntry, EmployeeAggregate, PerformanceTier } from '../types';

export interface DailyTrendPoint {
  date: string;
  dayNo: number;
  totalTasks: number;
  totalHours: number;
  avgQuality: number;
  avgScore: number;
  avgProgress: number;
  blockerCount: number;
  employeeCount: number;
}

export interface WeeklyTrendPoint {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  totalHours: number;
  avgEfficiency: number;
  avgQuality: number;
  velocityGrowthPct: number;
}

export interface MonthlyTrendPoint {
  monthLabel: string;
  totalHours: number;
  totalTasks: number;
  avgProgress: number;
  avgScore: number;
  highPerformersCount: number;
  coachingCount: number;
}

export interface CircularDistributionPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

/**
 * Aggregates daily reports into day-by-day trend metrics
 */
export function getDailyTrends(reports: DailyReportEntry[]): DailyTrendPoint[] {
  const grouped: Record<string, DailyReportEntry[]> = {};
  
  reports.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });

  const dates = Object.keys(grouped).sort();

  return dates.map(date => {
    const list = grouped[date];
    const totalHours = list.reduce((sum, r) => sum + (r.actual_hrs || 0), 0);
    const avgQuality = list.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / (list.length || 1);
    const avgScore = list.reduce((sum, r) => sum + (r.performance_score || 0), 0) / (list.length || 1);
    const avgProgress = list.reduce((sum, r) => sum + (r.progress_pct || 0), 0) / (list.length || 1);
    const blockerCount = list.filter(r => r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '').length;
    
    // Calculate realistic task/deliverable count by counting deliverables in task_desc
    let totalTasks = 0;
    list.forEach(r => {
      if (r.task_desc) {
        const numberedItems = r.task_desc.match(/^\s*\d+[\.\)]/gm);
        if (numberedItems && numberedItems.length > 0) {
          totalTasks += numberedItems.length;
        } else {
          const lines = r.task_desc.split('\n').filter(s => s.trim().length > 0);
          totalTasks += Math.max(1, Math.min(6, lines.length));
        }
      } else {
        totalTasks += 3;
      }
    });

    return {
      date,
      dayNo: list[0]?.day_no || 1,
      totalTasks: Math.max(list.length, totalTasks),
      totalHours: Number(totalHours.toFixed(1)),
      avgQuality: Number(avgQuality.toFixed(2)),
      avgScore: Number(avgScore.toFixed(1)),
      avgProgress: Number(avgProgress.toFixed(1)),
      blockerCount,
      employeeCount: list.length
    };
  });
}

/**
 * Aggregates daily reports into weekly velocity trends
 */
export function getWeeklyTrends(reports: DailyReportEntry[]): WeeklyTrendPoint[] {
  const daily = getDailyTrends(reports);
  if (daily.length === 0) return [];

  const chunkSize = 5;
  const weeks: WeeklyTrendPoint[] = [];

  for (let i = 0; i < daily.length; i += chunkSize) {
    const slice = daily.slice(i, i + chunkSize);
    const weekIdx = Math.floor(i / chunkSize) + 1;
    const totalTasks = slice.reduce((sum, d) => sum + d.totalTasks, 0);
    const totalHours = slice.reduce((sum, d) => sum + d.totalHours, 0);
    const avgQuality = slice.reduce((sum, d) => sum + d.avgQuality, 0) / slice.length;
    const avgEfficiency = totalHours > 0 ? (totalTasks / totalHours) * 10 : 0;

    let velocityGrowthPct = 0;
    if (weeks.length > 0) {
      const prevTasks = weeks[weeks.length - 1].totalTasks;
      if (prevTasks > 0) {
        velocityGrowthPct = Number((((totalTasks - prevTasks) / prevTasks) * 100).toFixed(1));
      }
    }

    weeks.push({
      weekLabel: `Sprint Week ${weekIdx}`,
      startDate: slice[0].date,
      endDate: slice[slice.length - 1].date,
      totalTasks,
      totalHours: Number(totalHours.toFixed(1)),
      avgEfficiency: Number(avgEfficiency.toFixed(1)),
      avgQuality: Number(avgQuality.toFixed(2)),
      velocityGrowthPct
    });
  }

  return weeks;
}

/**
 * Aggregates daily reports into monthly trend metrics
 */
export function getMonthlyTrends(reports: DailyReportEntry[]): MonthlyTrendPoint[] {
  const grouped: Record<string, DailyReportEntry[]> = {};

  reports.forEach(r => {
    const monthKey = r.date ? r.date.substring(0, 7) : 'Current Period';
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(r);
  });

  const monthKeys = Object.keys(grouped).sort();

  return monthKeys.map(key => {
    const list = grouped[key];
    const totalHours = list.reduce((sum, r) => sum + (r.actual_hrs || 0), 0);
    const avgProgress = list.reduce((sum, r) => sum + (r.progress_pct || 0), 0) / (list.length || 1);
    const avgScore = list.reduce((sum, r) => sum + (r.performance_score || 0), 0) / (list.length || 1);

    let monthLabel = key;
    try {
      const [year, month] = key.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      monthLabel = key;
    }

    return {
      monthLabel,
      totalHours: Number(totalHours.toFixed(1)),
      totalTasks: list.length * 3,
      avgProgress: Number(avgProgress.toFixed(1)),
      avgScore: Number(avgScore.toFixed(1)),
      highPerformersCount: list.filter(r => r.quality_rating >= 4.5).length,
      coachingCount: list.filter(r => r.quality_rating < 3.8).length
    };
  });
}

export function classifyReportTier(r: DailyReportEntry): {
  tier: PerformanceTier;
  color: string;
  badge: string;
} {
  const s = r.performance_score;
  const q = r.quality_rating || 4.0;
  const eff = r.actual_hrs > 0 ? (r.planned_hrs / r.actual_hrs) * 100 : 100;
  const hasBlocker = Boolean(r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '');

  if (s >= 90 || (q >= 4.5 && eff >= 95 && !hasBlocker)) {
    return {
      tier: 'Tier 1 - High Achiever',
      color: '#10b981', // Emerald
      badge: 'Elite Performer'
    };
  } else if (s < 75 || q < 3.8 || r.blocker_severity === 'High') {
    return {
      tier: 'Tier 3 - Coaching Required',
      color: '#f59e0b', // Amber
      badge: 'Action Needed'
    };
  }

  return {
    tier: 'Tier 2 - Consistent Performer',
    color: '#3b82f6', // Blue
    badge: 'Core Driver'
  };
}

/**
 * Computes Tier Distribution for colorful Doughnut / Circular charts
 */
export function getTierDistribution(
  employees: EmployeeAggregate[],
  reports: DailyReportEntry[] = []
): CircularDistributionPoint[] {
  // If only 1 employee (or few employees) with multiple daily reports, compute Tier ratio across daily reports so all tiers are represented!
  if (employees.length <= 1 && reports.length > 0) {
    const total = reports.length;
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;

    reports.forEach(r => {
      const { tier } = classifyReportTier(r);
      if (tier.includes('Tier 1')) {
        t1++;
      } else if (tier.includes('Tier 3')) {
        t3++;
      } else {
        t2++;
      }
    });

    return [
      {
        label: 'Tier 1 - High Achiever',
        value: t1,
        percentage: Math.round((t1 / total) * 100),
        color: '#10b981' // Emerald
      },
      {
        label: 'Tier 2 - Consistent',
        value: t2,
        percentage: Math.round((t2 / total) * 100),
        color: '#3b82f6' // Blue
      },
      {
        label: 'Tier 3 - Coaching Needed',
        value: t3,
        percentage: Math.round((t3 / total) * 100),
        color: '#f59e0b' // Amber
      }
    ];
  }

  const total = employees.length || 1;
  const t1 = employees.filter(e => e.cluster === 0 || e.tier.includes('Tier 1')).length;
  const t2 = employees.filter(e => e.cluster === 1 || e.tier.includes('Tier 2')).length;
  const t3 = employees.filter(e => e.cluster === 2 || e.tier.includes('Tier 3')).length;

  return [
    {
      label: 'Tier 1 - High Achiever',
      value: t1,
      percentage: Math.round((t1 / total) * 100),
      color: '#10b981' // Emerald
    },
    {
      label: 'Tier 2 - Consistent',
      value: t2,
      percentage: Math.round((t2 / total) * 100),
      color: '#3b82f6' // Blue / Indigo
    },
    {
      label: 'Tier 3 - Coaching Needed',
      value: t3,
      percentage: Math.round((t3 / total) * 100),
      color: '#f59e0b' // Amber
    }
  ];
}

/**
 * Computes Role Workload Distribution for colorful Circular / Doughnut charts
 */
export function getRoleDistribution(employees: EmployeeAggregate[]): CircularDistributionPoint[] {
  const counts: Record<string, number> = {};
  employees.forEach(e => {
    const role = e.role || 'General';
    counts[role] = (counts[role] || 0) + 1;
  });

  const total = employees.length || 1;
  const palette = ['#6366f1', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];

  return Object.entries(counts).map(([role, val], idx) => ({
    label: role,
    value: val,
    percentage: Math.round((val / total) * 100),
    color: palette[idx % palette.length]
  }));
}

/**
 * Computes Blocker & Delivery Health breakdown for Circular charts
 */
export function getBlockerDistribution(reports: DailyReportEntry[]): CircularDistributionPoint[] {
  const total = reports.length || 1;
  const none = reports.filter(r => !r.blocker_severity || r.blocker_severity === 'None').length;
  const low = reports.filter(r => r.blocker_severity === 'Low').length;
  const med = reports.filter(r => r.blocker_severity === 'Medium').length;
  const high = reports.filter(r => r.blocker_severity === 'High').length;

  return [
    { label: 'Unblocked (Smooth)', value: none, percentage: Math.round((none / total) * 100), color: '#10b981' },
    { label: 'Minor Discrepancy', value: low, percentage: Math.round((low / total) * 100), color: '#06b6d4' },
    { label: 'Moderate Blocker', value: med, percentage: Math.round((med / total) * 100), color: '#f59e0b' },
    { label: 'Critical Escalation', value: high, percentage: Math.round((high / total) * 100), color: '#f43f5e' }
  ];
}

/**
 * Computes raw employee summaries from daily report rows
 */
export function computeEmployeeAggregates(
  reports: DailyReportEntry[]
): Omit<EmployeeAggregate, 'cluster' | 'tier' | 'tier_badge' | 'tier_color' | 'pca_x' | 'pca_y'>[] {
  const grouped: Record<string, DailyReportEntry[]> = {};

  reports.forEach(r => {
    const name = r.employee_name || 'Anonymous';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(r);
  });

  return Object.keys(grouped).map(name => {
    const list = grouped[name];
    const count = list.length;
    const avgQuality = list.reduce((s, r) => s + (r.quality_rating || 0), 0) / count;
    const avgProgress = list.reduce((s, r) => s + (r.progress_pct || 0), 0) / count;
    const avgPlanned = list.reduce((s, r) => s + (r.planned_hrs || 0), 0) / count;
    const avgActual = list.reduce((s, r) => s + (r.actual_hrs || 0), 0) / count;
    const avgScore = list.reduce((s, r) => s + (r.performance_score || 0), 0) / count;
    const avgSelf = list.reduce((s, r) => s + (r.self_rating || r.quality_rating || 0), 0) / count;
    
    const blockersCount = list.filter(r => r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '').length;
    const blockerIntensity = Number((blockersCount / count).toFixed(2));

    const efficiency = avgActual > 0 ? Math.min(100, (avgPlanned / avgActual) * 100) : 100;
    const alignmentDelta = Number(Math.abs(avgSelf - avgQuality).toFixed(2));

    const first = list[0];

    return {
      name,
      role: first.role || 'Member',
      email: first.email || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      records_count: count,
      avg_quality: Number(avgQuality.toFixed(2)),
      avg_progress: Number(avgProgress.toFixed(1)),
      avg_planned_hrs: Number(avgPlanned.toFixed(1)),
      avg_actual_hrs: Number(avgActual.toFixed(1)),
      hours_efficiency: Number(efficiency.toFixed(1)),
      blocker_intensity: blockerIntensity,
      avg_self_rating: Number(avgSelf.toFixed(2)),
      self_alignment_delta: alignmentDelta,
      overall_score: Number(avgScore.toFixed(1))
    };
  });
}

/**
 * Generates Tier-by-Tier Cohort rows for display in Employee Performance Tables
 */
export function generateTierCohorts(
  employees: EmployeeAggregate[],
  reports: DailyReportEntry[]
): EmployeeAggregate[] {
  if (reports.length === 0) {
    return employees;
  }

  // If there are multiple employees in the dataset, each employee belongs to their own ML tier!
  // Return all employees directly so every team member is visible
  if (employees.length > 1) {
    return employees;
  }

  const baseEmp = employees[0] || {
    name: 'Aarav Sharma',
    role: 'Software Development Intern',
    email: 'aarav.sharma@company.com'
  };

  const t1Reports: DailyReportEntry[] = [];
  const t2Reports: DailyReportEntry[] = [];
  const t3Reports: DailyReportEntry[] = [];

  reports.forEach(r => {
    const classification = classifyReportTier(r);
    if (classification.tier.includes('Tier 1')) t1Reports.push(r);
    else if (classification.tier.includes('Tier 3')) t3Reports.push(r);
    else t2Reports.push(r);
  });

  const cohorts: EmployeeAggregate[] = [];

  // Helper to aggregate a subset of reports into an EmployeeAggregate
  const buildCohortAggregate = (
    tierName: PerformanceTier,
    tierBadge: string,
    tierColor: string,
    roleSuffix: string,
    clusterId: number,
    groupReports: DailyReportEntry[],
    labelTitle: string
  ): EmployeeAggregate => {
    const count = groupReports.length;
    if (count === 0) {
      return {
        name: `${baseEmp.name} (${labelTitle})`,
        role: `${baseEmp.role} • ${roleSuffix}`,
        email: baseEmp.email,
        records_count: 0,
        avg_quality: 4.0,
        avg_progress: 85,
        avg_planned_hrs: 8,
        avg_actual_hrs: 8,
        hours_efficiency: 100,
        blocker_intensity: 0,
        avg_self_rating: 4.0,
        self_alignment_delta: 0,
        overall_score: clusterId === 0 ? 95 : clusterId === 1 ? 84 : 70,
        cluster: clusterId,
        tier: tierName,
        tier_badge: tierBadge,
        tier_color: tierColor
      };
    }

    const avgQuality = groupReports.reduce((s, r) => s + (r.quality_rating || 0), 0) / count;
    const avgProgress = groupReports.reduce((s, r) => s + (r.progress_pct || 0), 0) / count;
    const avgPlanned = groupReports.reduce((s, r) => s + (r.planned_hrs || 0), 0) / count;
    const avgActual = groupReports.reduce((s, r) => s + (r.actual_hrs || 0), 0) / count;
    const avgScore = groupReports.reduce((s, r) => s + (r.performance_score || 0), 0) / count;
    const avgSelf = groupReports.reduce((s, r) => s + (r.self_rating || r.quality_rating || 0), 0) / count;
    const blockersCount = groupReports.filter(r => r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '').length;
    const efficiency = avgActual > 0 ? Math.min(100, (avgPlanned / avgActual) * 100) : 100;

    return {
      name: `${baseEmp.name} (${labelTitle})`,
      role: `${baseEmp.role} • ${roleSuffix}`,
      email: baseEmp.email,
      records_count: count,
      avg_quality: Number(avgQuality.toFixed(2)),
      avg_progress: Number(avgProgress.toFixed(1)),
      avg_planned_hrs: Number(avgPlanned.toFixed(1)),
      avg_actual_hrs: Number(avgActual.toFixed(1)),
      hours_efficiency: Number(efficiency.toFixed(1)),
      blocker_intensity: Number((blockersCount / count).toFixed(2)),
      avg_self_rating: Number(avgSelf.toFixed(2)),
      self_alignment_delta: Number(Math.abs(avgSelf - avgQuality).toFixed(2)),
      overall_score: Number(avgScore.toFixed(1)),
      cluster: clusterId,
      tier: tierName,
      tier_badge: tierBadge,
      tier_color: tierColor
    };
  };

  // 1. Overall Cumulative Intern Profile
  if (employees[0]) {
    cohorts.push({
      ...employees[0],
      name: `${employees[0].name} (Overall Cumulative Profile)`,
      role: `${employees[0].role} • Total ${reports.length} Sprints Tracked`
    });
  }

  // 2. Tier 1 High Achiever Sprints
  cohorts.push(
    buildCohortAggregate(
      'Tier 1 - High Achiever',
      'Elite Performer',
      '#10b981',
      'Peak Velocity & High Quality',
      0,
      t1Reports,
      `Tier 1 - High Achiever Sprints • ${t1Reports.length} Days`
    )
  );

  // 3. Tier 2 Consistent Performer Sprints
  cohorts.push(
    buildCohortAggregate(
      'Tier 2 - Consistent Performer',
      'Core Driver',
      '#3b82f6',
      'Core Milestone Execution',
      1,
      t2Reports,
      `Tier 2 - Consistent Performer Sprints • ${t2Reports.length} Days`
    )
  );

  // 4. Tier 3 Coaching Required Sprints
  cohorts.push(
    buildCohortAggregate(
      'Tier 3 - Coaching Required',
      'Action Needed',
      '#f59e0b',
      'Support & Blocker Resolution',
      2,
      t3Reports,
      `Tier 3 - Coaching Required Sprints • ${t3Reports.length} Days`
    )
  );

  return cohorts;
}

