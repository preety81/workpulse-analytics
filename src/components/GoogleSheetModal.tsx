import React, { useState, useRef } from 'react';
import { 
  FiX, 
  FiLink, 
  FiUploadCloud, 
  FiCheck, 
  FiAlertCircle, 
  FiHelpCircle,
  FiDatabase,
  FiFileText
} from 'react-icons/fi';
import { SheetConnectionConfig, PerformanceDataset } from '../types';
import { fetchGoogleSheetData } from '../utils/googleSheetsConnector';
import { parseUploadedFile } from '../utils/excelParser';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionConfig: SheetConnectionConfig;
  onUpdateDataset: (dataset: PerformanceDataset, config: SheetConnectionConfig) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  connectionConfig,
  onUpdateDataset
}) => {
  const [activeTab, setActiveTab] = useState<'google_sheet' | 'file_upload'>('google_sheet');
  const [sheetUrl, setSheetUrl] = useState(connectionConfig.url || '');
  const [autoSync, setAutoSync] = useState(connectionConfig.autoSyncInterval);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleConnectGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setErrorMsg('Please enter a valid Google Sheet URL or Sheet ID.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const dataset = await fetchGoogleSheetData(sheetUrl.trim());
      const newConfig: SheetConnectionConfig = {
        type: 'google_sheets',
        url: sheetUrl.trim(),
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'connected',
        autoSyncInterval: autoSync
      };
      onUpdateDataset(dataset, newConfig);
      setSuccessMsg(`Successfully loaded ${dataset.daily_reports.length} daily reports across ${dataset.employees.length} employees!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setErrorMsg('Kripya sirf .xlsx, .xls, ya .csv Excel/CSV file upload karein.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const dataset = await parseUploadedFile(file);
      const newConfig: SheetConnectionConfig = {
        type: 'excel_file',
        url: file.name,
        sheetName: file.name,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'connected',
        autoSyncInterval: 0
      };
      onUpdateDataset(dataset, newConfig);
      setSuccessMsg(`Successfully parsed ${file.name} with ${dataset.daily_reports.length} daily reports!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Excel file read karne mein error aayi. Kripya file format check karein.');
    } finally {
      setLoading(false);
    }
  };

  // Modal drag & drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only turn off if leaving modal
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setActiveTab('file_upload');
      processFile(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-2xl p-6 ${
        isDragging 
          ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.01]' 
          : 'border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FiDatabase className="text-lg" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Connect Data Source
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link your company Google Sheet or upload an Excel report
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('google_sheet')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'google_sheet'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiLink className="text-sm" />
            <span>Google Sheet Link</span>
          </button>
          <button
            onClick={() => setActiveTab('file_upload')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'file_upload'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiUploadCloud className="text-sm" />
            <span>Upload Excel File</span>
          </button>
        </div>

        {/* Tab 1: Google Sheet URL */}
        {activeTab === 'google_sheet' && (
          <form onSubmit={handleConnectGoogleSheet} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Sheet Share URL
              </label>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={loading}
              />
            </div>

            {/* Auto-Sync Interval */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Auto-Sync Interval
              </label>
              <select
                value={autoSync}
                onChange={(e) => setAutoSync(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={loading}
              >
                <option value={0}>Manual Only (No Auto Sync)</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
              </select>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold">
                <FiHelpCircle className="text-sm text-indigo-600 dark:text-indigo-400" />
                <span>How to connect your sheet:</span>
              </div>
              <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/80">
                1. Open your Google Sheet in browser.<br />
                2. Click <strong>Share</strong> (top right) &rarr; set <strong>General Access</strong> to <em>"Anyone with the link can view"</em>.<br />
                3. Paste the URL here and click Connect.
              </p>
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <FiAlertCircle className="text-sm mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                <FiCheck className="text-sm shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Connecting & Analyzing...' : 'Connect & Sync'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Upload Excel File */}
        {activeTab === 'file_upload' && (
          <div className="mt-4 space-y-4">
            
            {/* Interactive Drag & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 scale-[1.02] shadow-xl shadow-indigo-500/10'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-indigo-500 dark:hover:border-indigo-400'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                isDragging ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-500'
              }`}>
                <FiUploadCloud className="text-3xl" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center">
                {isDragging ? 'Excel file abhi yahan chhod dein (Drop now)...' : 'Click to browse ya Excel file drag & drop karein'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Supports .xlsx, .xls, aur .csv Excel spreadsheets
              </span>

              {loading && (
                <div className="mt-3 flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Parsing Excel data...</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
                disabled={loading}
              />
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                <FiAlertCircle className="text-sm mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                <FiCheck className="text-sm shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
