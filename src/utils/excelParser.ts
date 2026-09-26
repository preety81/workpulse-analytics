import * as XLSX from 'xlsx';
import { PerformanceDataset, DailyReportEntry } from '../types';
import { parseCsvRawTextToReports, buildDatasetFromReports } from './googleSheetsConnector';

/**
 * Parses an uploaded Excel or CSV file (.xlsx, .xls, .csv) into a PerformanceDataset
 */
export async function parseUploadedFile(file: File): Promise<PerformanceDataset> {
  const fileName = file.name.toLowerCase();

  // 1. Direct CSV file handling
  if (fileName.endsWith('.csv')) {
    try {
      const csvText = await file.text();
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Aapki CSV file khali hai. Kripya data wali file upload karein.');
      }
      const reports = parseCsvRawTextToReports(csvText);
      if (reports.length === 0) {
        throw new Error('Aapki CSV file mein koi valid task/hours rows nahi mili.');
      }
      return buildDatasetFromReports(reports);
    } catch (err: any) {
      throw new Error(`CSV file parse karne mein error: ${err.message}`);
    }
  }

  // 2. Excel file handling (.xlsx, .xls)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook mein koi sheets nahi mili.');
    }

    // 2. Iterate through all sheets to support multi-employee workbooks
    const allReports: DailyReportEntry[] = [];
    const seenSignatures = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const csvString = XLSX.utils.sheet_to_csv(worksheet, { 
        blankrows: false 
      });

      if (csvString && csvString.trim().length > 10) {
        try {
          const parsed = parseCsvRawTextToReports(csvString, sheetName);
          if (parsed.length > 0) {
            for (const r of parsed) {
              const sig = `${r.employee_name}_${r.date}_${r.day_no}_${r.tasks_completed.slice(0, 25)}`;
              if (!seenSignatures.has(sig)) {
                seenSignatures.add(sig);
                allReports.push(r);
              }
            }
          }
        } catch {
          // Continue scanning next sheet
        }
      }
    }

    // Fallback: If no sheet yielded reports via column mapping, try the first sheet directly
    if (allReports.length === 0 && workbook.SheetNames.length > 0) {
      const firstWs = workbook.Sheets[workbook.SheetNames[0]];
      const rawCsv = XLSX.utils.sheet_to_csv(firstWs, { dateNF: 'yyyy-mm-dd' });
      if (rawCsv && rawCsv.trim().length > 0) {
        const parsed = parseCsvRawTextToReports(rawCsv, workbook.SheetNames[0]);
        allReports.push(...parsed);
      }
    }

    if (allReports.length === 0) {
      throw new Error('Aapki Excel file mein koi valid task/hours rows nahi mili. Kripya check karein ki sheet mein date, tasks, ya hours ki entries hain.');
    }

    return buildDatasetFromReports(allReports);
  } catch (err: any) {
    throw new Error(`Excel file parse karne mein error: ${err.message}`);
  }
}
