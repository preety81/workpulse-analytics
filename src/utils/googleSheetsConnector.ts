import Papa from 'papaparse';
import { DailyReportEntry, PerformanceDataset, BlockerSeverity } from '../types';
import { computeEmployeeAggregates } from './trendAggregator';
import { runKMeansClustering, runRegressionAnalysis } from './mlEngine';

export interface ParsedSheetUrl {
  sheetId: string | null;
  pubId: string | null;
  gid: string | null;
  candidateUrls: string[];
}

/**
 * Robust parser for all variations of Google Sheet URLs
 */
export function parseGoogleSheetUrl(rawInput: string): ParsedSheetUrl {
  const url = rawInput.trim();
  const candidateUrls: string[] = [];

  // Extract gid if present in query or hash (e.g., gid=12345 or #gid=12345)
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  // Case 1: Published to web format: /spreadsheets/d/e/{PUB_ID}/...
  const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    const pubId = pubMatch[1];
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${gid ? `&gid=${gid}` : ''}`);
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
    return { sheetId: null, pubId, gid, candidateUrls };
  }

  // Case 2: Standard editable or viewable sheet: /spreadsheets/d/{SHEET_ID}/...
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  let sheetId: string | null = null;
  if (sheetMatch && sheetMatch[1] && sheetMatch[1] !== 'e') {
    sheetId = sheetMatch[1];
  } else if (/^[a-zA-Z0-9-_]{25,}$/.test(url)) {
    sheetId = url;
  }

  if (sheetId) {
    if (gid) {
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
    }
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
  } else if (url.startsWith('http')) {
    candidateUrls.push(url);
  }

  return { sheetId, pubId: null, gid, candidateUrls };
}

/**
 * Normalizes string keys for column fuzzy matching
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a cell value looks like a date (DD/MM/YYYY, YYYY-MM-DD, Excel serial, text date)
 */
export function isDateLikeValue(val: string): boolean {
  if (!val) return false;
  const s = String(val).trim();
  if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}/.test(s)) return true;
  if (/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/.test(s)) return true;
  if (/^\d{5}$/.test(s)) {
    const num = parseInt(s, 10);
    if (num >= 30000 && num <= 65000) return true;
  }
  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s) && /\d{1,4}/.test(s)) return true;
  return false;
}

/**
 * Normalizes any date format (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, M/D/YYYY, 25 Sep 2026, 45560)
 * into a standard ISO YYYY-MM-DD string with zero timezone shifts.
 */
export function normalizeDateString(rawVal: any, preferMonthFirst?: boolean): string {
  if (rawVal === null || rawVal === undefined) return '';
  const val = String(rawVal).trim();
  if (!val) return '';

  // 1. Excel 5-digit serial date e.g. 45560
  if (/^\d{5}(\.\d+)?$/.test(val)) {
    const serial = parseFloat(val);
    if (serial >= 30000 && serial <= 65000) {
      const dt = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!isNaN(dt.getTime())) {
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dt.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = val.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = val.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let yr = dmyMatch[3];
    if (yr.length === 2) {
      yr = (parseInt(yr, 10) > 50 ? '19' : '20') + yr;
    }

    let day = p1;
    let month = p2;

    if (p1 > 12) {
      // First is day (e.g. 25/09/2026)
      day = p1;
      month = p2;
    } else if (p2 > 12) {
      // Second is day (e.g. 09/25/2026)
      month = p1;
      day = p2;
    } else if (preferMonthFirst !== undefined) {
      if (preferMonthFirst) {
        month = p1;
        day = p2;
      } else {
        day = p1;
        month = p2;
      }
    } else {
      // Default to DD/MM/YYYY
      day = p1;
      month = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${yr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 4. Textual dates like "25 Sep 2026"
  const dt = new Date(val);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    if (y >= 2000 && y <= 2100) {
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return val;
}

/**
 * Formats YYYY-MM-DD or any date string into clean human-friendly format (e.g., "25 Sep 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const clean = String(dateStr).trim();
  const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const y = m[1];
    const moIdx = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (moIdx >= 0 && moIdx < 12) {
      return `${d} ${months[moIdx]} ${y}`;
    }
  }
  return clean;
}

/**
 * Detects whether a row is an instruction, guideline, template rule, or non-data meta row
 */
export function isInstructionOrMetaRow(row: string[], nameColIdx: number): boolean {
  if (!Array.isArray(row)) return true;
  const nonEmptyCells = row.map(c => String(c || '').trim()).filter(c => c !== '');
  if (nonEmptyCells.length === 0) return true;

  const rawName = nameColIdx !== undefined && row[nameColIdx] ? String(row[nameColIdx]).trim() : '';
  const rowText = nonEmptyCells.join(' ').toLowerCase();

  const instructionKeywords = [
    'add one new row',
    'add new row',
    'never edit',
    'never delete',
    'previous day',
    'working day',
    'working days',
    'do not edit',
    'do not delete',
    'do not modify',
    'instruction',
    'guideline',
    'guidelines',
    'please note',
    'sample row',
    'example row',
    'template row',
    'fill all',
    'how to fill',
    'rules for',
    'rules:',
    'notes:',
    'note:',
    'important:',
    'attention:',
    'reminder:',
    'legend:'
  ];

  if (instructionKeywords.some(keyword => rowText.includes(keyword))) {
    return true;
  }

  // Starts with bullet point or markdown marker in first non-empty cell
  if (/^[•\*\-\>\#\~]/.test(nonEmptyCells[0])) {
    return true;
  }

  // Name cell checks
  if (rawName) {
    const norm = normalizeKey(rawName);
    if ([
      'name', 'employeename', 'internname', 'empname', 'membername', 'person', 'staff', 'fullname',
      'date', 'tasks', 'hours', 'total', 'grandtotal', 'summary', 'average', 'count'
    ].includes(norm)) {
      return true;
    }

    if (/^[•\*\-\>\#\~]/.test(rawName)) {
      return true;
    }

    // A real person's name is not an entire sentence (> 40 chars or sentence words)
    if (rawName.length > 40) {
      return true;
    }

    if (rawName.includes('.') && rawName.split(/\s+/).length > 3) {
      return true;
    }
  }

  // Sparsity check: if a row has only 1 non-empty cell in the entire sheet, it cannot be a daily report
  if (nonEmptyCells.length <= 1) {
    return true;
  }

  return false;
}

/**
 * Super-smart CSV parser:
 * 1. Parses raw 2D array so title rows or blank top rows never break parsing
 * 2. Locates the real header row automatically, skipping instruction banners
 * 3. Uses broad fuzzy matching + content inference to detect real Date, Name, Tasks, and Hours columns
 * 4. Filters out instructions and template guidelines
 */
export function parseCsvRawTextToReports(csvText: string, fallbackSheetName?: string): DailyReportEntry[] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: 'greedy'
  });

  if (!parsed.data || parsed.data.length === 0) {
    return [];
  }

  // Keep rows that have at least one non-empty cell
  const allRows = parsed.data.filter(row => 
    Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
  );

  if (allRows.length === 0) {
    return [];
  }

  // 1. Scan for Header Banner Metadata (e.g. Employee Name, Role, Email at top of template)
  let bannerName = '';
  let bannerRole = '';
  let bannerEmail = '';

  for (let r = 0; r < Math.min(6, allRows.length); r++) {
    const row = allRows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim();
      const norm = normalizeKey(cell);

      // Check key-value in adjacent cell or inline
      if (norm === 'employeename' || norm === 'name' || norm === 'internname' || norm === 'membername' || norm === 'candidate') {
        if (row[c + 1] && String(row[c + 1]).trim()) {
          bannerName = String(row[c + 1]).trim();
        }
      }
      if (norm === 'role' || norm === 'designation' || norm === 'dept' || norm === 'department') {
        if (row[c + 1] && String(row[c + 1]).trim()) {
          bannerRole = String(row[c + 1]).trim();
        }
      }
      if (norm === 'email' || norm === 'mail') {
        if (row[c + 1] && String(row[c + 1]).trim()) {
          bannerEmail = String(row[c + 1]).trim();
        }
      }

      // Check inline email address
      const emMatch = cell.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emMatch && !bannerEmail) {
        bannerEmail = emMatch[0];
      }
    }
  }

  // If email was found but bannerName wasn't, infer employee name from email local-part
  if (!bannerName && bannerEmail) {
    const localPart = bannerEmail.split('@')[0];
    const words = localPart.split(/[._-]/).filter(Boolean);
    bannerName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // If fallbackSheetName is provided and doesn't look like generic "Sheet1", use it if bannerName is still empty
  if (!bannerName && fallbackSheetName) {
    const cleanSheet = fallbackSheetName.trim();
    if (!/^(sheet|table|data|page|untitled|report|work)\s*\d*$/i.test(cleanSheet)) {
      bannerName = cleanSheet;
    }
  }

  // 2. Locate the Table Header Row
  let headerRowIndex = 0;
  let bestScore = -1;

  for (let r = 0; r < Math.min(8, allRows.length); r++) {
    const row = allRows[r];
    const rowText = row.map(c => String(c || '').trim()).filter(Boolean).join(' ').toLowerCase();

    // Skip instruction rows so they are never picked as header
    if (
      rowText.includes('add one new row') || 
      rowText.includes('never edit') || 
      rowText.includes('previous day') ||
      rowText.startsWith('•') ||
      rowText.startsWith('*')
    ) {
      continue;
    }

    let score = 0;
    row.forEach(cell => {
      const norm = normalizeKey(String(cell || ''));
      if (norm === 'date' || norm.includes('date') || norm === 'tarikh' || norm === 'dinank' || norm === 'timestamp') score += 5;
      if (norm.includes('task') || norm.includes('work') || norm.includes('kaam') || norm.includes('activity')) score += 3;
      if (norm.includes('hour') || norm.includes('hrs') || norm.includes('ghante') || norm.includes('duration')) score += 3;
      if (norm.includes('quality') || norm.includes('rating') || norm.includes('score')) score += 2;
      if (norm.includes('blocker') || norm.includes('challenge') || norm.includes('issue')) score += 2;
      if (norm.includes('goal') || norm.includes('outcome') || norm.includes('progress')) score += 2;
    });

    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = r;
    }
  }

  const headerRow = allRows[headerRowIndex];
  const candidateDataRows = allRows.slice(headerRowIndex + 1);

  if (candidateDataRows.length === 0) {
    return [];
  }

  // 3. Map Header Columns
  const colIndexMap: Record<string, number> = {};

  headerRow.forEach((cell, colIdx) => {
    const norm = normalizeKey(String(cell || ''));
    if (!norm) return;

    if (colIndexMap['date'] === undefined && (norm === 'date' || norm === 'workdate' || norm === 'reportingdate' || norm === 'reportdate' || norm === 'tarikh' || norm === 'dinank' || norm === 'timestamp')) {
      colIndexMap['date'] = colIdx;
    }
    if (colIndexMap['day_no'] === undefined && (norm === 'dayno' || norm === 'daynum' || norm === 'day')) {
      colIndexMap['day_no'] = colIdx;
    }
    if (colIndexMap['name'] === undefined && (
      norm === 'name' || 
      norm === 'employeename' || 
      norm === 'employee' ||
      norm === 'internname' || 
      norm === 'intern' ||
      norm === 'empname' || 
      norm === 'emp' ||
      norm === 'membername' || 
      norm === 'member' ||
      norm === 'teammember' ||
      norm === 'fullname' ||
      norm === 'candidate' ||
      norm === 'candidatename' ||
      norm === 'user' ||
      norm === 'username' ||
      norm === 'staff' ||
      norm === 'staffname' ||
      norm === 'resource' ||
      norm === 'resourcename' ||
      norm === 'developer' ||
      norm === 'person' ||
      norm === 'trainee' ||
      norm === 'student' ||
      norm === 'naam' ||
      norm.includes('employeename') ||
      norm.includes('internname') ||
      norm.includes('nameofemployee') ||
      norm.includes('nameofintern') ||
      (norm.startsWith('employee') && !norm.includes('rating') && !norm.includes('id') && !norm.includes('score')) ||
      (norm.startsWith('intern') && !norm.includes('id') && !norm.includes('score'))
    )) {
      colIndexMap['name'] = colIdx;
    }
    if (colIndexMap['goal'] === undefined && (norm.includes('goal') || norm.includes('objective') || norm.includes('target'))) {
      colIndexMap['goal'] = colIdx;
    }
    if (colIndexMap['task_desc'] === undefined && (norm.includes('taskdesc') || norm.includes('taskdescription') || norm.includes('activity') || norm.includes('details'))) {
      colIndexMap['task_desc'] = colIdx;
    }
    if (colIndexMap['tasks'] === undefined && (norm.includes('task') || norm.includes('taskscompleted') || norm.includes('work') || norm.includes('kaam') || norm.includes('deliverable'))) {
      colIndexMap['tasks'] = colIdx;
    }
    if (colIndexMap['category'] === undefined && (norm.includes('category') || norm.includes('domain'))) {
      colIndexMap['category'] = colIdx;
    }
    if (colIndexMap['hours'] === undefined && (norm === 'actualhours' || norm === 'actualhrs' || norm === 'hours' || norm === 'hrs' || norm === 'hour' || norm === 'ghante')) {
      colIndexMap['hours'] = colIdx;
    }
    if (colIndexMap['planned_hrs'] === undefined && (norm === 'plannedhours' || norm === 'plannedhrs' || norm === 'expectedhours' || norm.includes('estimate') || norm.includes('plan'))) {
      colIndexMap['planned_hrs'] = colIdx;
    }
    if (colIndexMap['quality'] === undefined && (norm.includes('quality') || norm.includes('rating') || norm.includes('score') || norm.includes('star'))) {
      colIndexMap['quality'] = colIdx;
    }
    if (colIndexMap['progress'] === undefined && (norm.includes('progress') || norm.includes('completion') || norm.includes('pct') || norm.includes('percent'))) {
      colIndexMap['progress'] = colIdx;
    }
    if (colIndexMap['blocker'] === undefined && (norm.includes('blocker') || norm.includes('challenge') || norm.includes('issue') || norm.includes('problem') || norm.includes('stuck') || norm.includes('hurdle'))) {
      colIndexMap['blocker'] = colIdx;
    }
    if (colIndexMap['blocker_sev'] === undefined && (norm.includes('severity') || norm.includes('level') || norm.includes('priority'))) {
      colIndexMap['blocker_sev'] = colIdx;
    }
    if (colIndexMap['outcome'] === undefined && (norm.includes('outcome') || norm.includes('result'))) {
      colIndexMap['outcome'] = colIdx;
    }
    if (colIndexMap['evidence'] === undefined && (norm.includes('evidence') || norm.includes('link') || norm.includes('proof') || norm.includes('url'))) {
      colIndexMap['evidence'] = colIdx;
    }
    if (colIndexMap['tomorrow_tasks'] === undefined && (norm.includes('tomorrow') && (norm.includes('task') || norm.includes('work')))) {
      colIndexMap['tomorrow_tasks'] = colIdx;
    }
    if (colIndexMap['tomorrow_goal'] === undefined && (norm.includes('tomorrow') && (norm.includes('goal') || norm.includes('target')))) {
      colIndexMap['tomorrow_goal'] = colIdx;
    }
    if (colIndexMap['self_rating'] === undefined && (norm.includes('selfrating') || norm.includes('selfscore'))) {
      colIndexMap['self_rating'] = colIdx;
    }
    if (colIndexMap['role'] === undefined && (norm === 'role' || norm === 'designation' || norm === 'department' || norm === 'dept')) {
      colIndexMap['role'] = colIdx;
    }
    if (colIndexMap['email'] === undefined && (norm === 'email' || norm === 'mail')) {
      colIndexMap['email'] = colIdx;
    }
  });

  // Date column fallback: content inspection if not explicitly found
  if (colIndexMap['date'] === undefined) {
    let bestCol = 0;
    let maxDateMatches = 0;
    for (let c = 0; c < headerRow.length; c++) {
      const matches = candidateDataRows.filter(r => isDateLikeValue(String(r[c] || ''))).length;
      if (matches > maxDateMatches) {
        maxDateMatches = matches;
        bestCol = c;
      }
    }
    colIndexMap['date'] = bestCol;
  }

  // Name column fallback: content inspection if not explicitly found in header
  if (colIndexMap['name'] === undefined) {
    let bestNameCol = -1;
    let maxNameMatches = 0;
    for (let c = 0; c < headerRow.length; c++) {
      if (
        c === colIndexMap['date'] ||
        c === colIndexMap['day_no'] ||
        c === colIndexMap['hours'] ||
        c === colIndexMap['planned_hrs'] ||
        c === colIndexMap['quality'] ||
        c === colIndexMap['progress'] ||
        c === colIndexMap['self_rating']
      ) {
        continue;
      }
      const matches = candidateDataRows.filter(r => {
        const val = String(r[c] || '').trim();
        if (!val || val.length < 3 || val.length > 35) return false;
        if (isDateLikeValue(val) || /^[\d\.\-\/]+$/.test(val)) return false;
        if (/https?:\/\//i.test(val)) return false;
        if (/\b(task|fixed|testing|meeting|bug|feature|development|support|none|low|medium|high|learning|jira|done|completed|code)\b/i.test(val)) return false;
        return /^[a-zA-Z\s\.\'-]+$/.test(val) && val.split(/\s+/).length <= 4;
      }).length;

      if (matches > maxNameMatches && matches >= Math.min(2, candidateDataRows.length * 0.2)) {
        maxNameMatches = matches;
        bestNameCol = c;
      }
    }
    if (bestNameCol !== -1) {
      colIndexMap['name'] = bestNameCol;
    }
  }

  // Filter out instruction, guideline, rule, or empty rows
  const validDataRows = candidateDataRows.filter(row => {
    if (isInstructionOrMetaRow(row, colIndexMap['name'] !== undefined ? colIndexMap['name'] : -1)) {
      return false;
    }
    // Must have at least a date OR (some tasks/hours)
    const rawDate = colIndexMap['date'] !== undefined ? String(row[colIndexMap['date']] || '').trim() : '';
    const hasDate = isDateLikeValue(rawDate);
    const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length;
    return hasDate && nonEmpty >= 2;
  });

  if (validDataRows.length === 0) {
    return [];
  }

  // Column-level date format detection:
  // Check if second number > 12 (MM/DD/YYYY) or first number > 12 (DD/MM/YYYY)
  let detectedMonthFirst: boolean | undefined = undefined;
  const sampleDateCells = validDataRows.map(r => colIndexMap['date'] !== undefined ? String(r[colIndexMap['date']] || '').trim() : '');

  let foundP2Gt12 = 0;
  let foundP1Gt12 = 0;
  const numPairs: [number, number][] = [];

  for (const cell of sampleDateCells) {
    const m = cell.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
    if (m) {
      const n1 = parseInt(m[1], 10);
      const n2 = parseInt(m[2], 10);
      if (n1 > 12 && n2 <= 12) foundP1Gt12++;
      if (n2 > 12 && n1 <= 12) foundP2Gt12++;
      numPairs.push([n1, n2]);
    }
  }

  if (foundP2Gt12 > 0 && foundP1Gt12 === 0) {
    // Definitive: second number exceeds 12 (e.g. 09/25/2026), so MM/DD/YYYY
    detectedMonthFirst = true;
  } else if (foundP1Gt12 > 0 && foundP2Gt12 === 0) {
    // Definitive: first number exceeds 12 (e.g. 25/09/2026), so DD/MM/YYYY
    detectedMonthFirst = false;
  } else if (numPairs.length >= 2) {
    const n1s = numPairs.map(p => p[0]);
    const n2s = numPairs.map(p => p[1]);
    const n1Constant = n1s.every(v => v === n1s[0]);
    const n2Constant = n2s.every(v => v === n2s[0]);

    if (n1Constant && !n2Constant) {
      // First number is constant (e.g. 9 for Sept), second number varies (1, 3, 7...) -> MM/DD/YYYY
      detectedMonthFirst = true;
    } else if (n2Constant && !n1Constant) {
      // Second number is constant, first number varies -> DD/MM/YYYY
      detectedMonthFirst = false;
    }
  }

  let previousValidDate = new Date().toISOString().split('T')[0];

  const reports = validDataRows.map((row, idx) => {
    // 1. Employee Name
    let rawName = colIndexMap['name'] !== undefined ? String(row[colIndexMap['name']] || '').trim() : '';
    if (!rawName || isDateLikeValue(rawName) || /^\d+$/.test(rawName)) {
      rawName = bannerName || 'Aarav Sharma';
    }

    // 2. Role & Email
    let rawRole = colIndexMap['role'] !== undefined ? String(row[colIndexMap['role']] || '').trim() : '';
    if (!rawRole) rawRole = bannerRole || 'Software Development Intern';

    let rawEmail = colIndexMap['email'] !== undefined ? String(row[colIndexMap['email']] || '').trim() : '';
    if (!rawEmail) {
      if (rawName && rawName !== bannerName) {
        rawEmail = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.com`;
      } else {
        rawEmail = bannerEmail || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.com`;
      }
    }

    // 3. Date
    let rawDateCell = colIndexMap['date'] !== undefined ? String(row[colIndexMap['date']] || '').trim() : '';
    let parsedDate = normalizeDateString(rawDateCell, detectedMonthFirst);
    if (!parsedDate || !/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
      parsedDate = previousValidDate;
    } else {
      previousValidDate = parsedDate;
    }

    // 4. Tasks & Descriptions
    const rawTaskDesc = colIndexMap['task_desc'] !== undefined ? String(row[colIndexMap['task_desc']] || '').trim() : '';
    const rawTasksCompleted = colIndexMap['tasks'] !== undefined ? String(row[colIndexMap['tasks']] || '').trim() : '';
    const finalTaskDesc = rawTaskDesc || rawTasksCompleted || 'Daily deliverables completed';
    const finalTasks = rawTasksCompleted || rawTaskDesc || 'Sprint tasks executed';

    // 5. Hours & Metrics
    const actualHrs = colIndexMap['hours'] !== undefined ? (parseFloat(row[colIndexMap['hours']]) || 8.0) : 8.0;
    const plannedHrs = colIndexMap['planned_hrs'] !== undefined ? (parseFloat(row[colIndexMap['planned_hrs']]) || actualHrs) : actualHrs;
    const qualityRating = colIndexMap['quality'] !== undefined ? (parseFloat(row[colIndexMap['quality']]) || 4.2) : 4.2;
    const progressPct = colIndexMap['progress'] !== undefined ? (parseFloat(row[colIndexMap['progress']]) || 90.0) : 90.0;
    const selfRating = colIndexMap['self_rating'] !== undefined ? (parseFloat(row[colIndexMap['self_rating']]) || qualityRating) : qualityRating;

    // 6. Blockers
    const rawBlockers = colIndexMap['blocker'] !== undefined ? String(row[colIndexMap['blocker']] || 'None').trim() : 'None';
    let blockerSeverity: BlockerSeverity = 'None';
    const explicitSev = colIndexMap['blocker_sev'] !== undefined ? String(row[colIndexMap['blocker_sev']] || '').trim().toLowerCase() : '';
    
    if (explicitSev.includes('high') || explicitSev.includes('critical')) {
      blockerSeverity = 'High';
    } else if (explicitSev.includes('med')) {
      blockerSeverity = 'Medium';
    } else if (explicitSev.includes('low')) {
      blockerSeverity = 'Low';
    } else {
      const bLower = rawBlockers.toLowerCase();
      if (bLower.includes('critical') || bLower.includes('high') || bLower.includes('stuck') || bLower.includes('blocking')) {
        blockerSeverity = 'High';
      } else if (bLower.includes('medium') || bLower.includes('delay') || bLower.includes('waiting')) {
        blockerSeverity = 'Medium';
      } else if (bLower !== 'none' && bLower.trim() !== '') {
        blockerSeverity = 'Low';
      }
    }

    // 7. Additional columns
    const goal = colIndexMap['goal'] !== undefined ? String(row[colIndexMap['goal']] || '').trim() : 'Assigned milestone delivery';
    const outcome = colIndexMap['outcome'] !== undefined ? String(row[colIndexMap['outcome']] || '').trim() : 'Completed and recorded';
    const evidence = colIndexMap['evidence'] !== undefined ? String(row[colIndexMap['evidence']] || '').trim() : 'Sprint verified';
    const category = colIndexMap['category'] !== undefined ? String(row[colIndexMap['category']] || '').trim() : rawRole;
    const tomorrowTasks = colIndexMap['tomorrow_tasks'] !== undefined ? String(row[colIndexMap['tomorrow_tasks']] || '').trim() : 'Continue planned roadmap';
    const tomorrowGoal = colIndexMap['tomorrow_goal'] !== undefined ? String(row[colIndexMap['tomorrow_goal']] || '').trim() : 'Maintain milestone velocity';
    const dayNo = colIndexMap['day_no'] !== undefined ? (parseInt(row[colIndexMap['day_no']], 10) || (idx + 1)) : (idx + 1);

    // Performance Score Calculation
    const efficiency = actualHrs > 0 ? Math.min(100, (plannedHrs / actualHrs) * 100) : 100;
    const blockerPenalty = blockerSeverity === 'High' ? 15 : blockerSeverity === 'Medium' ? 8 : blockerSeverity === 'Low' ? 3 : 0;
    const baseScore = (qualityRating / 5.0) * 45 + (progressPct / 100) * 35 + (efficiency / 100) * 20 - blockerPenalty;
    const performanceScore = Math.max(10, Math.min(100, Math.round(baseScore * 10) / 10));

    return {
      id: `rep-${idx + 1}`,
      employee_name: rawName,
      role: rawRole,
      email: rawEmail,
      date: parsedDate,
      day_no: dayNo,
      goal: goal,
      task_desc: finalTaskDesc,
      category: category,
      tasks_completed: finalTasks,
      outcome: outcome,
      evidence: evidence,
      planned_hrs: plannedHrs,
      actual_hrs: actualHrs,
      quality_rating: qualityRating,
      progress_pct: progressPct,
      blockers: rawBlockers,
      blocker_severity: blockerSeverity,
      tomorrow_tasks: tomorrowTasks,
      tomorrow_goal: tomorrowGoal,
      self_rating: selfRating,
      performance_score: performanceScore
    };
  });

  // Auto-correct any inverted dates if the dataset is concentrated in a dominant month
  const monthCounts: Record<string, number> = {};
  reports.forEach(r => {
    const ym = r.date.substring(0, 7);
    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
  });

  let dominantYM = '';
  let maxCount = 0;
  for (const [ym, count] of Object.entries(monthCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantYM = ym;
    }
  }

  if (dominantYM && maxCount >= reports.length * 0.4) {
    const [domYear, domMonth] = dominantYM.split('-');
    reports.forEach(r => {
      const parts = r.date.split('-');
      // If day is the dominant month and month is different (e.g. 2026-02-09 where domMonth is 09)
      if (parts.length === 3 && parts[0] === domYear && parts[1] !== domMonth && parts[2] === domMonth) {
        r.date = `${domYear}-${domMonth}-${parts[1].padStart(2, '0')}`;
      }
    });
  }

  // Sort chronologically by date
  reports.sort((a, b) => a.date.localeCompare(b.date));
  reports.forEach((r, i) => {
    r.day_no = i + 1;
  });
  return reports;
}

/**
 * Compiles a full PerformanceDataset from parsed daily report entries
 */
export function buildDatasetFromReports(reports: DailyReportEntry[]): PerformanceDataset {
  if (reports.length === 0) {
    return {
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
  }

  const rawEmployees = computeEmployeeAggregates(reports);
  const { employeesWithClusters, clusteringData } = runKMeansClustering(rawEmployees);
  const regressionData = runRegressionAnalysis(reports);

  const totalHours = reports.reduce((s, r) => s + r.actual_hrs, 0);
  const avgQuality = reports.length > 0 ? reports.reduce((s, r) => s + r.quality_rating, 0) / reports.length : 4.0;
  const avgScore = reports.length > 0 ? reports.reduce((s, r) => s + r.performance_score, 0) / reports.length : 90.0;
  const avgProgress = reports.length > 0 ? reports.reduce((s, r) => s + r.progress_pct, 0) / reports.length : 90.0;
  const activeBlockers = reports.filter(r => r.blocker_severity !== 'None').length;

  const dates = reports.map(r => r.date).sort();

  return {
    summary: {
      total_interns: employeesWithClusters.length,
      total_reports: reports.length,
      date_range: {
        start: dates[0] || new Date().toISOString().split('T')[0],
        end: dates[dates.length - 1] || new Date().toISOString().split('T')[0]
      },
      avg_team_score: Number(avgScore.toFixed(1)),
      avg_quality_rating: Number(avgQuality.toFixed(2)),
      total_hours_logged: Number(totalHours.toFixed(1)),
      completion_rate_pct: Number(avgProgress.toFixed(1)),
      active_blockers_count: activeBlockers
    },
    employees: employeesWithClusters,
    daily_reports: reports,
    ml_clustering: clusteringData,
    ml_regression: regressionData
  };
}

/**
 * Fetch helper with proxy fallback and multiple URL candidates
 */
async function fetchWithCandidateUrls(candidateUrls: string[]): Promise<string> {
  let lastError = 'No valid URL candidate';

  for (const url of candidateUrls) {
    try {
      const proxyUrl = `/api/proxy-sheet?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch {
      // Continue
    }

    try {
      const res = await fetch(url, { headers: { 'Accept': 'text/csv,*/*' } });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      } else {
        lastError = `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err: any) {
      lastError = err.message || 'CORS or Network error';
    }

    try {
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(allOriginsUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch {
      // Continue
    }
  }

  throw new Error(
    `Failed to fetch Google Sheet (${lastError}).\n` +
    `Kripya check karein: Google Sheets mein 'Share' button click karein aur General access ko 'Anyone with the link' (Viewer) par set karein.`
  );
}

/**
 * Primary function to fetch and process Google Sheet data
 */
export async function fetchGoogleSheetData(sheetUrl: string): Promise<PerformanceDataset> {
  const parsed = parseGoogleSheetUrl(sheetUrl);

  if (parsed.candidateUrls.length === 0) {
    throw new Error('Please enter a valid Google Sheet URL (e.g., https://docs.google.com/spreadsheets/d/your-id/edit)');
  }

  const csvText = await fetchWithCandidateUrls(parsed.candidateUrls);
  const reports = parseCsvRawTextToReports(csvText);

  if (reports.length === 0) {
    throw new Error(
      'Aapki Google Sheet mein koi data rows nahi mili (sheet khali hai).\n' +
      'Kripya sheet mein kam se kam 1 row data bharein (jaise: Name, Date, Tasks, Hours).'
    );
  }

  return buildDatasetFromReports(reports);
}
