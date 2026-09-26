import { DailyReportEntry, PerformanceDataset, BlockerSeverity } from '../types';
import { buildDatasetFromReports } from '../utils/googleSheetsConnector';

// Detailed daily work report logs for content and technical documentation
const sampleRoleDailyLogs = [
  {
    day_no: 1,
    date: '2026-09-01',
    goal: 'Close out pending items from yesterday',
    task_desc: 'Draft documentation for new process\nProofread and edit content draft\nCompile weekly report / summary notes',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Knowledge base article updated',
    evidence: 'https://docs.acme.com/notes/214',
    planned_hrs: 5.5,
    actual_hrs: 5.0,
    quality_rating: 4,
    progress_pct: 73,
    blockers: 'Minor technical roadblock',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Draft documentation for new process\nCompile weekly report / summary notes',
    tomorrow_goal: 'Complete current sprint deliverable',
    self_rating: 3,
    performance_score: 82
  },
  {
    day_no: 2,
    date: '2026-09-02',
    goal: 'Wrap up task and start next one',
    task_desc: 'Compile weekly report / summary notes\nPrepare internal how-to guide\nDraft documentation for new process',
    category: 'Documentation',
    tasks_completed: '2',
    outcome: 'Knowledge base article updated',
    evidence: 'https://docs.acme.com/notes/215',
    planned_hrs: 6.0,
    actual_hrs: 5.0,
    quality_rating: 4,
    progress_pct: 94,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Prepare internal how-to guide\nDraft documentation for new process\nProofread and edit content draft',
    tomorrow_goal: 'Wrap up task and start next one',
    self_rating: 3,
    performance_score: 91
  },
  {
    day_no: 3,
    date: '2026-09-03',
    goal: 'Get feedback on work in progress',
    task_desc: 'Update existing knowledge base article\nProofread and edit content draft\nCompile weekly report / summary',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Weekly report compiled and shared',
    evidence: 'https://docs.acme.com/notes/216',
    planned_hrs: 6.0,
    actual_hrs: 6.5,
    quality_rating: 3,
    progress_pct: 70,
    blockers: 'Tooling/environment issue',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Compile weekly report / summary notes\nDraft documentation for new process\nUpdate existing knowledge base',
    tomorrow_goal: 'Make progress on assigned task',
    self_rating: 5,
    performance_score: 75
  },
  {
    day_no: 4,
    date: '2026-09-04',
    goal: 'Complete current sprint deliverable',
    task_desc: 'Prepare internal how-to guide\nProofread and edit content draft\nUpdate existing knowledge base article',
    category: 'Documentation',
    tasks_completed: '2',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/217',
    planned_hrs: 7.5,
    actual_hrs: 7.5,
    quality_rating: 5,
    progress_pct: 71,
    blockers: 'Tooling/environment issue',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Proofread and edit content draft\nCompile weekly report / summary notes\nPrepare internal how-to guide',
    tomorrow_goal: 'Get feedback on work in progress',
    self_rating: 5,
    performance_score: 87
  },
  {
    day_no: 5,
    date: '2026-09-07',
    goal: 'Make progress on assigned task',
    task_desc: 'Prepare internal how-to guide\nUpdate existing knowledge base article\nDraft documentation for new process',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'How-to guide published internally',
    evidence: 'https://docs.acme.com/notes/218',
    planned_hrs: 5.0,
    actual_hrs: 4.5,
    quality_rating: 3,
    progress_pct: 67,
    blockers: 'Tooling/environment issue',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Compile weekly report / summary notes\nUpdate existing knowledge base',
    tomorrow_goal: 'Complete current sprint deliverable',
    self_rating: 4,
    performance_score: 74
  },
  {
    day_no: 6,
    date: '2026-09-08',
    goal: 'Wrap up task and start next one',
    task_desc: 'Proofread and edit content draft\nDraft documentation for new process\nCompile weekly report / summary notes',
    category: 'Documentation',
    tasks_completed: '2',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/219',
    planned_hrs: 5.5,
    actual_hrs: 5.5,
    quality_rating: 4,
    progress_pct: 93,
    blockers: 'Dependency on another team',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Prepare internal how-to guide\nCompile weekly report / summary notes\nUpdate existing knowledge base',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 3,
    performance_score: 88
  },
  {
    day_no: 7,
    date: '2026-09-09',
    goal: 'Get feedback on work in progress',
    task_desc: 'Prepare internal how-to guide\nDraft documentation for new process\nUpdate existing knowledge base article',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Weekly report compiled and shared',
    evidence: 'https://docs.acme.com/notes/220',
    planned_hrs: 6.0,
    actual_hrs: 5.5,
    quality_rating: 4,
    progress_pct: 83,
    blockers: 'Unclear requirements initially',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Prepare internal how-to guide\nUpdate existing knowledge base article\nProofread and edit content draft',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 4,
    performance_score: 86
  },
  {
    day_no: 8,
    date: '2026-09-10',
    goal: 'Wrap up task and start next one',
    task_desc: 'Draft documentation for new process\nProofread and edit content draft\nPrepare internal how-to guide',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/221',
    planned_hrs: 7.0,
    actual_hrs: 8.0,
    quality_rating: 3,
    progress_pct: 69,
    blockers: 'Dependency on another team',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Update existing knowledge base article\nDraft documentation for new process\nPrepare internal how-to guide',
    tomorrow_goal: 'Get feedback on work in progress',
    self_rating: 3,
    performance_score: 72
  },
  {
    day_no: 9,
    date: '2026-09-11',
    goal: 'Complete current sprint deliverable',
    task_desc: 'Update existing knowledge base article\nDraft documentation for new process\nPrepare internal how-to guide',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/222',
    planned_hrs: 6.0,
    actual_hrs: 6.5,
    quality_rating: 5,
    progress_pct: 74,
    blockers: 'Minor technical roadblock',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Draft documentation for new process\nProofread and edit content draft',
    tomorrow_goal: 'Wrap up task and start next one',
    self_rating: 4,
    performance_score: 88
  },
  {
    day_no: 10,
    date: '2026-09-14',
    goal: 'Get feedback on work in progress',
    task_desc: 'Proofread and edit content draft\nCompile weekly report / summary notes',
    category: 'Documentation',
    tasks_completed: '2',
    outcome: 'Knowledge base article updated',
    evidence: 'https://docs.acme.com/notes/223',
    planned_hrs: 8.0,
    actual_hrs: 7.0,
    quality_rating: 3,
    progress_pct: 96,
    blockers: 'Dependency on another team',
    blocker_severity: 'Medium' as BlockerSeverity,
    tomorrow_tasks: 'Proofread and edit content draft\nCompile weekly report / summary notes\nPrepare internal how-to guide',
    tomorrow_goal: 'Complete current sprint deliverable',
    self_rating: 5,
    performance_score: 80
  },
  {
    day_no: 11,
    date: '2026-09-15',
    goal: 'Make progress on assigned task',
    task_desc: 'Proofread and edit content draft\nPrepare internal how-to guide\nDraft documentation for new process\nCompile weekly report / summary',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Knowledge base article updated',
    evidence: 'https://docs.acme.com/notes/224',
    planned_hrs: 7.5,
    actual_hrs: 7.5,
    quality_rating: 5,
    progress_pct: 93,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Proofread and edit content draft\nCompile weekly report / summary notes\nPrepare internal how-to guide',
    tomorrow_goal: 'Wrap up task and start next one',
    self_rating: 5,
    performance_score: 95
  },
  {
    day_no: 12,
    date: '2026-09-16',
    goal: 'Wrap up task and start next one',
    task_desc: 'Proofread and edit content draft\nCompile weekly report / summary notes\nDraft documentation for new process',
    category: 'Documentation',
    tasks_completed: '2',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/225',
    planned_hrs: 6.5,
    actual_hrs: 6.0,
    quality_rating: 3,
    progress_pct: 73,
    blockers: 'Waiting on teammate\'s review',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Proofread and edit content draft\nCompile weekly report / summary notes\nUpdate existing knowledge base',
    tomorrow_goal: 'Complete current sprint deliverable',
    self_rating: 5,
    performance_score: 79
  },
  {
    day_no: 13,
    date: '2026-09-17',
    goal: 'Wrap up task and start next one',
    task_desc: 'Compile weekly report / summary notes\nUpdate existing knowledge base',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'How-to guide published internally',
    evidence: 'https://docs.acme.com/notes/226',
    planned_hrs: 6.5,
    actual_hrs: 7.5,
    quality_rating: 5,
    progress_pct: 69,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Draft documentation for new process\nPrepare internal how-to guide\nUpdate existing knowledge base article',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 3,
    performance_score: 84
  },
  {
    day_no: 14,
    date: '2026-09-18',
    goal: 'Complete current sprint deliverable',
    task_desc: 'Compile weekly report / summary notes\nUpdate existing knowledge base article',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'Weekly report compiled and shared',
    evidence: 'https://docs.acme.com/notes/227',
    planned_hrs: 7.5,
    actual_hrs: 6.5,
    quality_rating: 3,
    progress_pct: 98,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Update existing knowledge base article\nCompile weekly report / summary notes',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 5,
    performance_score: 91
  },
  {
    day_no: 15,
    date: '2026-09-21',
    goal: 'Wrap up task and start next one',
    task_desc: 'Proofread and edit content draft\nDraft documentation for new process\nUpdate existing knowledge base article',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Weekly report compiled and shared',
    evidence: 'https://docs.acme.com/notes/228',
    planned_hrs: 6.0,
    actual_hrs: 6.5,
    quality_rating: 5,
    progress_pct: 99,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Update existing knowledge base article\nCompile weekly report / summary notes',
    tomorrow_goal: 'Wrap up task and start next one',
    self_rating: 4,
    performance_score: 96
  },
  {
    day_no: 16,
    date: '2026-09-22',
    goal: 'Wrap up task and start next one',
    task_desc: 'Compile weekly report / summary notes\nDraft documentation for new process\nPrepare internal how-to guide',
    category: 'Documentation',
    tasks_completed: '4',
    outcome: 'Documentation drafted and shared for review',
    evidence: 'https://docs.acme.com/notes/229',
    planned_hrs: 8.0,
    actual_hrs: 9.0,
    quality_rating: 4,
    progress_pct: 78,
    blockers: 'Dependency on another team',
    blocker_severity: 'Medium' as BlockerSeverity,
    tomorrow_tasks: 'Draft documentation for new process\nPrepare internal how-to guide\nProofread and edit content draft',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 5,
    performance_score: 79
  },
  {
    day_no: 17,
    date: '2026-09-23',
    goal: 'Complete current sprint deliverable',
    task_desc: 'Proofread and edit content draft\nPrepare internal how-to guide\nDraft documentation for new process\nUpdate existing knowledge base',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/230',
    planned_hrs: 6.5,
    actual_hrs: 7.0,
    quality_rating: 3,
    progress_pct: 93,
    blockers: 'Dependency on another team',
    blocker_severity: 'Low' as BlockerSeverity,
    tomorrow_tasks: 'Update existing knowledge base article\nProofread and edit content draft\nPrepare internal how-to guide',
    tomorrow_goal: 'Close out pending items from yesterday',
    self_rating: 5,
    performance_score: 83
  },
  {
    day_no: 18,
    date: '2026-09-24',
    goal: 'Make progress on assigned task',
    task_desc: 'Proofread and edit content draft\nCompile weekly report / summary notes\nUpdate existing knowledge base',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/231',
    planned_hrs: 6.5,
    actual_hrs: 6.0,
    quality_rating: 3,
    progress_pct: 94,
    blockers: 'None',
    blocker_severity: 'None' as BlockerSeverity,
    tomorrow_tasks: 'Update existing knowledge base article\nDraft documentation for new process',
    tomorrow_goal: 'Make progress on assigned task',
    self_rating: 4,
    performance_score: 88
  },
  {
    day_no: 19,
    date: '2026-09-25',
    goal: 'Make progress on assigned task',
    task_desc: 'Prepare internal how-to guide\nCompile weekly report / summary notes\nDraft documentation for new process',
    category: 'Documentation',
    tasks_completed: '3',
    outcome: 'Content proofread and finalized',
    evidence: 'https://docs.acme.com/notes/232',
    planned_hrs: 8.0,
    actual_hrs: 9.0,
    quality_rating: 3,
    progress_pct: 75,
    blockers: 'Minor technical roadblock',
    blocker_severity: 'Medium' as BlockerSeverity,
    tomorrow_tasks: 'Prepare internal how-to guide\nProofread and edit content draft\nUpdate existing knowledge base article',
    tomorrow_goal: 'Make progress on assigned task',
    self_rating: 4,
    performance_score: 75
  }
];

// Standard 19 workdays schedule for September 2026
const DATES_SEP_2026 = [
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
  '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-14',
  '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-21',
  '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'
];

interface EmployeeProfileMeta {
  name: string;
  role: string;
  email: string;
  targetTier: 1 | 2 | 3;
  baseQuality: number;
  baseProgress: number;
  basePlannedHrs: number;
  baseActualHrs: number;
  blockerFrequency: number;
  domain: string;
  category: string;
}

// 20 Employees Configuration across 3 Tiers
const TEAM_20_MEMBERS: EmployeeProfileMeta[] = [
  // --- TIER 1: HIGH ACHIEVERS (6 Employees) ---
  {
    name: 'Aarav Sharma',
    role: 'Software Development Intern',
    email: 'aarav.sharma@company.com',
    targetTier: 1,
    baseQuality: 4.6,
    baseProgress: 94,
    basePlannedHrs: 7.5,
    baseActualHrs: 7.3,
    blockerFrequency: 0.1,
    domain: 'Full Stack & APIs',
    category: 'Development'
  },
  {
    name: 'Sneha Patel',
    role: 'Frontend UI/UX Engineer',
    email: 'sneha.patel@company.com',
    targetTier: 1,
    baseQuality: 4.8,
    baseProgress: 96,
    basePlannedHrs: 7.5,
    baseActualHrs: 7.2,
    blockerFrequency: 0.05,
    domain: 'React, Tailwind & Component Architecture',
    category: 'Frontend'
  },
  {
    name: 'Arjun Mehta',
    role: 'Machine Learning Intern',
    email: 'arjun.mehta@company.com',
    targetTier: 1,
    baseQuality: 4.7,
    baseProgress: 93,
    basePlannedHrs: 8.0,
    baseActualHrs: 7.8,
    blockerFrequency: 0.1,
    domain: 'Python, PyTorch & Clustering Algorithms',
    category: 'ML/AI'
  },
  {
    name: 'Ananya Iyer',
    role: 'Cloud & DevOps Specialist',
    email: 'ananya.iyer@company.com',
    targetTier: 1,
    baseQuality: 4.7,
    baseProgress: 95,
    basePlannedHrs: 8.0,
    baseActualHrs: 7.5,
    blockerFrequency: 0.05,
    domain: 'Terraform, Docker & AWS ECS Pipelines',
    category: 'DevOps'
  },
  {
    name: 'Kabir Joshi',
    role: 'Full Stack Developer',
    email: 'kabir.joshi@company.com',
    targetTier: 1,
    baseQuality: 4.5,
    baseProgress: 92,
    basePlannedHrs: 7.5,
    baseActualHrs: 7.4,
    blockerFrequency: 0.1,
    domain: 'Next.js, Node.js & GraphQL Endpoints',
    category: 'Development'
  },
  {
    name: 'Riya Sen',
    role: 'Product Management Intern',
    email: 'riya.sen@company.com',
    targetTier: 1,
    baseQuality: 4.6,
    baseProgress: 94,
    basePlannedHrs: 7.0,
    baseActualHrs: 7.0,
    blockerFrequency: 0.05,
    domain: 'Sprint Roadmaps, User Stories & Analytics',
    category: 'Management'
  },

  // --- TIER 2: CONSISTENT PERFORMERS (8 Employees) ---
  {
    name: 'Sneha Reddy',
    role: 'Content Writing Intern',
    email: 'sneha.reddy@company.com',
    targetTier: 2,
    baseQuality: 3.9,
    baseProgress: 84,
    basePlannedHrs: 6.6,
    baseActualHrs: 6.7,
    blockerFrequency: 0.35,
    domain: 'Knowledge Base, Technical Documentation',
    category: 'Documentation'
  },
  {
    name: 'Rohan Verma',
    role: 'Backend & Database Engineer',
    email: 'rohan.verma@company.com',
    targetTier: 2,
    baseQuality: 4.2,
    baseProgress: 86,
    basePlannedHrs: 8.0,
    baseActualHrs: 8.2,
    blockerFrequency: 0.25,
    domain: 'PostgreSQL, Express & Redis Caching',
    category: 'Backend'
  },
  {
    name: 'Priya Singh',
    role: 'QA & Test Automation Specialist',
    email: 'priya.singh@company.com',
    targetTier: 2,
    baseQuality: 4.1,
    baseProgress: 85,
    basePlannedHrs: 7.5,
    baseActualHrs: 7.8,
    blockerFrequency: 0.25,
    domain: 'Playwright, Jest & Integration Suites',
    category: 'QA'
  },
  {
    name: 'Karan Kapoor',
    role: 'Mobile App Developer',
    email: 'karan.kapoor@company.com',
    targetTier: 2,
    baseQuality: 4.0,
    baseProgress: 83,
    basePlannedHrs: 8.0,
    baseActualHrs: 8.4,
    blockerFrequency: 0.3,
    domain: 'React Native, Android Studio & iOS Swift',
    category: 'Mobile'
  },
  {
    name: 'Pooja Nair',
    role: 'Data Analyst Intern',
    email: 'pooja.nair@company.com',
    targetTier: 2,
    baseQuality: 4.2,
    baseProgress: 86,
    basePlannedHrs: 7.5,
    baseActualHrs: 7.6,
    blockerFrequency: 0.2,
    domain: 'SQL queries, Tableau & Excel Analytics',
    category: 'Analytics'
  },
  {
    name: 'Aditya Rao',
    role: 'Cybersecurity Analyst',
    email: 'aditya.rao@company.com',
    targetTier: 2,
    baseQuality: 4.0,
    baseProgress: 82,
    basePlannedHrs: 8.0,
    baseActualHrs: 8.3,
    blockerFrequency: 0.3,
    domain: 'Security Audits, OWASP Scans & IAM Rules',
    category: 'Security'
  },
  {
    name: 'Tanvi Deshmukh',
    role: 'UI/UX Designer',
    email: 'tanvi.deshmukh@company.com',
    targetTier: 2,
    baseQuality: 4.3,
    baseProgress: 87,
    basePlannedHrs: 7.0,
    baseActualHrs: 7.2,
    blockerFrequency: 0.2,
    domain: 'Figma Wireframes, User Journeys & Prototypes',
    category: 'Design'
  },
  {
    name: 'Nikhil Gupta',
    role: 'Systems & Infrastructure Admin',
    email: 'nikhil.gupta@company.com',
    targetTier: 2,
    baseQuality: 4.1,
    baseProgress: 84,
    basePlannedHrs: 8.0,
    baseActualHrs: 8.5,
    blockerFrequency: 0.3,
    domain: 'Linux Bash, Nginx Config & Health Monitors',
    category: 'Systems'
  },

  // --- TIER 3: COACHING REQUIRED (6 Employees) ---
  {
    name: 'Vikram Malhotra',
    role: 'Cloud Infrastructure Intern',
    email: 'vikram.malhotra@company.com',
    targetTier: 3,
    baseQuality: 3.2,
    baseProgress: 68,
    basePlannedHrs: 8.0,
    baseActualHrs: 9.3,
    blockerFrequency: 0.65,
    domain: 'Docker Containerization & Cluster Config',
    category: 'DevOps'
  },
  {
    name: 'Meera Bhatt',
    role: 'Junior QA Automation Trainee',
    email: 'meera.bhatt@company.com',
    targetTier: 3,
    baseQuality: 3.3,
    baseProgress: 71,
    basePlannedHrs: 7.5,
    baseActualHrs: 8.8,
    blockerFrequency: 0.6,
    domain: 'Regression Test Scripting & Debugging',
    category: 'QA'
  },
  {
    name: 'Siddharth Jain',
    role: 'Technical Support Engineer',
    email: 'siddharth.jain@company.com',
    targetTier: 3,
    baseQuality: 3.4,
    baseProgress: 72,
    basePlannedHrs: 8.0,
    baseActualHrs: 9.0,
    blockerFrequency: 0.55,
    domain: 'User Escalations, Bug Repro & Log Tracing',
    category: 'Support'
  },
  {
    name: 'Divya Kulkarni',
    role: 'Technical Writer Intern',
    email: 'divya.kulkarni@company.com',
    targetTier: 3,
    baseQuality: 3.5,
    baseProgress: 73,
    basePlannedHrs: 7.0,
    baseActualHrs: 8.2,
    blockerFrequency: 0.5,
    domain: 'API Docs, Release Changelogs & Proofreading',
    category: 'Documentation'
  },
  {
    name: 'Harsh Vardhan',
    role: 'Database Intern',
    email: 'harsh.vardhan@company.com',
    targetTier: 3,
    baseQuality: 3.1,
    baseProgress: 66,
    basePlannedHrs: 8.0,
    baseActualHrs: 9.5,
    blockerFrequency: 0.7,
    domain: 'Database Migrations, Index Tuning & Queries',
    category: 'Database'
  },
  {
    name: 'Ishaan Trivedi',
    role: 'Research & Development Intern',
    email: 'ishaan.trivedi@company.com',
    targetTier: 3,
    baseQuality: 3.2,
    baseProgress: 67,
    basePlannedHrs: 7.5,
    baseActualHrs: 9.0,
    blockerFrequency: 0.6,
    domain: 'Algorithm Benchmarking & Spec Prototyping',
    category: 'R&D'
  }
];

/**
 * Generates full 19 daily reports for all 20 employees (380 records)
 */
export function generateSampleTeamReports(): DailyReportEntry[] {
  const allReports: DailyReportEntry[] = [];
  let reportIdSeq = 1;

  TEAM_20_MEMBERS.forEach((emp, empIdx) => {
    // Use detailed daily work report logs
    if (emp.name === 'Sneha Reddy') {
      sampleRoleDailyLogs.forEach((log) => {
        allReports.push({
          id: `rep-${reportIdSeq++}`,
          employee_name: emp.name,
          role: emp.role,
          email: emp.email,
          date: log.date,
          day_no: log.day_no,
          goal: log.goal,
          task_desc: log.task_desc,
          category: log.category,
          tasks_completed: log.tasks_completed,
          outcome: log.outcome,
          evidence: log.evidence,
          planned_hrs: log.planned_hrs,
          actual_hrs: log.actual_hrs,
          quality_rating: log.quality_rating,
          progress_pct: log.progress_pct,
          blockers: log.blockers,
          blocker_severity: log.blocker_severity,
          tomorrow_tasks: log.tomorrow_tasks,
          tomorrow_goal: log.tomorrow_goal,
          self_rating: log.self_rating,
          performance_score: log.performance_score
        });
      });
      return;
    }

    // For all other employees, generate realistic day-by-day logs based on their domain and tier profile
    DATES_SEP_2026.forEach((dateStr, dayIdx) => {
      const dayNo = dayIdx + 1;
      const pseudoSeed = (empIdx * 37 + dayIdx * 19) % 100;
      const hasBlocker = pseudoSeed < (emp.blockerFrequency * 100);

      // Quality calculation (1 to 5)
      const qOffset = ((pseudoSeed % 7) - 3) * 0.12;
      const quality = Math.min(5, Math.max(1, Number((emp.baseQuality + qOffset).toFixed(1))));

      // Progress percentage
      const pOffset = ((pseudoSeed % 9) - 4) * 2;
      const progress = Math.min(100, Math.max(45, Math.round(emp.baseProgress + pOffset)));

      // Hours calculation
      const hOffset = ((pseudoSeed % 5) - 2) * 0.3;
      const plannedHrs = emp.basePlannedHrs;
      const actualHrs = Math.max(4, Number((emp.baseActualHrs + hOffset).toFixed(1)));

      const efficiency = actualHrs > 0 ? (plannedHrs / actualHrs) * 100 : 100;

      // Blocker details
      let blockerSeverity: BlockerSeverity = 'None';
      let blockerDesc = 'None';
      if (hasBlocker) {
        if (emp.targetTier === 3) {
          blockerSeverity = (pseudoSeed % 2 === 0) ? 'High' : 'Medium';
          blockerDesc = 'Complex technical blocker / environment configuration issue requiring senior assistance';
        } else if (emp.targetTier === 2) {
          blockerSeverity = (pseudoSeed % 3 === 0) ? 'Medium' : 'Low';
          blockerDesc = 'Cross-team dependency / pending PR approval';
        } else {
          blockerSeverity = 'Low';
          blockerDesc = 'Minor dependency / tooling update';
        }
      }

      // Self rating (1-5)
      const selfRating = Math.min(5, Math.max(2, Math.round(quality + ((pseudoSeed % 3) - 1) * 0.3)));

      // Performance Score (40 - 100 scale)
      const blockerPenalty = blockerSeverity === 'High' ? 14 : blockerSeverity === 'Medium' ? 8 : blockerSeverity === 'Low' ? 3 : 0;
      const perfScore = Math.min(100, Math.max(45, Math.round(
        (quality / 5) * 45 +
        (progress / 100) * 35 +
        (Math.min(100, efficiency) / 100) * 20 -
        blockerPenalty
      )));

      allReports.push({
        id: `rep-${reportIdSeq++}`,
        employee_name: emp.name,
        role: emp.role,
        email: emp.email,
        date: dateStr,
        day_no: dayNo,
        goal: `Sprint Day ${dayNo}: Deliver milestone tasks for ${emp.domain}`,
        task_desc: `1. Implement and test ${emp.domain} features\n2. Perform code self-review and automated test runs\n3. Coordinate sprint deliverables with team members`,
        category: emp.category,
        tasks_completed: `${(dayIdx % 3) + 2}`,
        outcome: `Milestone deliverables successfully verified with unit tests passing; PR submitted for review.`,
        evidence: `https://github.com/company/repo/commit/${Math.random().toString(36).substring(2, 9)}`,
        planned_hrs: plannedHrs,
        actual_hrs: actualHrs,
        quality_rating: quality,
        progress_pct: progress,
        blockers: blockerDesc,
        blocker_severity: blockerSeverity,
        tomorrow_tasks: `1. Continue integration validation\n2. Refactor code based on mentor feedback\n3. Prepare deployment build for staging`,
        tomorrow_goal: `Deliver Day ${dayNo + 1} sprint tasks on schedule`,
        self_rating: selfRating,
        performance_score: perfScore
      });
    });
  });

  return allReports;
}

/**
 * Builds the complete 20-employee dataset with clustering and regression precalculated
 */
export function getSampleTeamDataset(): PerformanceDataset {
  const reports = generateSampleTeamReports();
  return buildDatasetFromReports(reports);
}
