export type BlockerSeverity = 'None' | 'Low' | 'Medium' | 'High';

export type PerformanceTier = 
  | 'Tier 1 - High Achiever' 
  | 'Tier 2 - Consistent Performer' 
  | 'Tier 3 - Coaching Required';

export interface DailyReportEntry {
  id: string;
  employee_name: string;
  role: string;
  email: string;
  date: string;
  day_no: number;
  goal: string;
  task_desc: string;
  category: string;
  tasks_completed: string;
  outcome: string;
  evidence: string;
  planned_hrs: number;
  actual_hrs: number;
  quality_rating: number;
  progress_pct: number;
  blockers: string;
  blocker_severity: BlockerSeverity;
  tomorrow_tasks: string;
  tomorrow_goal: string;
  self_rating: number;
  performance_score: number;
}

export interface EmployeeAggregate {
  name: string;
  role: string;
  email: string;
  records_count: number;
  avg_quality: number;
  avg_progress: number;
  avg_planned_hrs: number;
  avg_actual_hrs: number;
  hours_efficiency: number;
  blocker_intensity: number;
  avg_self_rating: number;
  self_alignment_delta: number;
  overall_score: number;
  cluster: number;
  tier: PerformanceTier;
  tier_badge: string;
  tier_color: string;
  pca_x?: number;
  pca_y?: number;
}

export interface MLClusterInfo {
  tier: PerformanceTier;
  description: string;
  color: string;
  count?: number;
}

export interface MLClusteringData {
  algorithm: string;
  k: number;
  clusters: MLClusterInfo[];
}

export interface MLRegressionData {
  r2_score: number;
  intercept: number;
  coefficients: {
    quality_rating: number;
    progress_pct: number;
    hours_deviation: number;
    blocker_severity: number;
    self_rating_discrepancy: number;
  };
  feature_importance_pct: Record<string, number>;
}

export interface DatasetSummary {
  total_interns: number;
  total_reports: number;
  date_range: {
    start: string;
    end: string;
  };
  avg_team_score: number;
  avg_quality_rating: number;
  total_hours_logged: number;
  completion_rate_pct: number;
  active_blockers_count: number;
}

export interface PerformanceDataset {
  summary: DatasetSummary;
  employees: EmployeeAggregate[];
  daily_reports: DailyReportEntry[];
  ml_clustering: MLClusteringData;
  ml_regression: MLRegressionData;
}

export type TimeViewMode = 'daily' | 'weekly' | 'monthly';

export interface SheetConnectionConfig {
  type: 'google_sheets' | 'excel_file' | 'demo_data';
  url: string;
  sheetName?: string;
  lastSynced: string | null;
  status: 'connected' | 'syncing' | 'error' | 'idle';
  autoSyncInterval: number; // in seconds (0 = disabled)
  errorMessage?: string;
}
