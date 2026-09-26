import React from 'react';
import { 
  FiSun, 
  FiMoon, 
  FiRefreshCw, 
  FiLink, 
  FiActivity, 
  FiTrash2,
  FiUsers
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { SheetConnectionConfig } from '../types';

interface HeaderProps {
  connectionConfig: SheetConnectionConfig;
  onOpenConnectModal: () => void;
  onSyncNow: () => void;
  onClearData: () => void;
  onLoad20Employees?: () => void;
  isSyncing: boolean;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionConfig,
  onOpenConnectModal,
  onSyncNow,
  onClearData,
  onLoad20Employees,
  isSyncing,
  hasData
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <FiActivity className="text-white text-xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                  WorkPulse <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ML Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Employee Daily Reports & Performance Analytics
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            
            {/* Sheet Connection Status Pill */}
            <div 
              onClick={onOpenConnectModal}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all duration-150 hover:opacity-90 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              title="Click to change connected Google Sheet or upload Excel file"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionConfig.status === 'connected' ? 'bg-emerald-400' :
                  connectionConfig.status === 'syncing' ? 'bg-amber-400' :
                  connectionConfig.status === 'error' ? 'bg-rose-400' : 'bg-slate-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionConfig.status === 'connected' ? 'bg-emerald-500' :
                  connectionConfig.status === 'syncing' ? 'bg-amber-500' :
                  connectionConfig.status === 'error' ? 'bg-rose-500' : 'bg-slate-500'
                }`} />
              </span>
              <span className="hidden md:inline font-mono">
                {connectionConfig.type === 'google_sheets' && connectionConfig.url ? 'Google Sheet Active' : 
                 connectionConfig.type === 'excel_file' && connectionConfig.url ? 'Excel File Active' : 'No Sheet Connected'}
              </span>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {connectionConfig.lastSynced ? `Synced ${connectionConfig.lastSynced}` : 'Click to Link'}
              </span>
            </div>

            {/* Sync Now Button (Only when connected) */}
            {connectionConfig.url && (
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50"
                title="Fetch latest updates from connected sheet"
              >
                <FiRefreshCw className={`text-sm ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}

            {/* 20 Employees Company Dataset Button */}
            {onLoad20Employees && (
              <button
                onClick={onLoad20Employees}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                title="Load full 20 Employees company dataset (380 logs)"
              >
                <FiUsers className="text-sm text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline font-bold">20 Employees (19 Days)</span>
                <span className="md:hidden font-bold">20 Emps</span>
              </button>
            )}

            {/* Connect / Change Sheet Button */}
            <button
              onClick={onOpenConnectModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <FiLink className="text-sm" />
              <span className="hidden sm:inline">Connect Sheet</span>
            </button>

            {/* Disconnect / Clear Data Button (If data or url present) */}
            {(hasData || connectionConfig.url) && (
              <button
                onClick={onClearData}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors"
                title="Disconnect & Clear All Data"
                aria-label="Disconnect & Clear Data"
              >
                <FiTrash2 className="text-sm" />
              </button>
            )}

            {/* Theme Toggle (Dark / Light Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <FiSun className="text-amber-400 text-base" />
              ) : (
                <FiMoon className="text-indigo-600 text-base" />
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
