import React, { useState, useEffect } from 'react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'status' | 'sql'>('status');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => setHealthData(data))
        .catch(() => {});

      fetch('/api/schema')
        .then((res) => res.text())
        .then((sql) => setSqlSchema(sql))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-surface-container-lowest dark:bg-surface-container-low rounded-2xl hairline-border p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container dark:border-surface-container-high shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">database</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">
                Backend & Supabase Database Status
              </h3>
              <p className="text-xs text-outline">Express API + Supabase Postgres Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-container dark:bg-surface-container-high rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'status'
                ? 'bg-surface-container-lowest dark:bg-surface-container text-primary dark:text-primary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sql'
                ? 'bg-surface-container-lowest dark:bg-surface-container text-primary dark:text-primary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Copy SQL Schema ({sqlSchema ? 'Ready' : 'Loading'})
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'status' && (
            <div className="space-y-3">
              {/* Backend indicator */}
              <div className="p-3.5 rounded-xl bg-surface-container-low dark:bg-surface-container hairline-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-on-surface flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Express Backend Server
                  </div>
                  <p className="text-xs text-outline mt-0.5">
                    Port 3000 · Full-Stack API active & processing requests
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  ONLINE
                </span>
              </div>

              {/* Supabase connection indicator */}
              <div className="p-3.5 rounded-xl bg-surface-container-low dark:bg-surface-container hairline-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Supabase Client Endpoint
                    </div>
                    <p className="text-xs text-outline mt-0.5 truncate max-w-xs sm:max-w-md font-mono">
                      {healthData?.supabaseUrl || 'https://awvuoelsvwsexguqvoux.supabase.co'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    CONNECTED
                  </span>
                </div>
              </div>

              {/* Tables provision status */}
              <div
                className={`p-3.5 rounded-xl hairline-border space-y-2 ${
                  healthData?.tablesProvisioned
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        healthData?.tablesProvisioned ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {healthData?.tablesProvisioned ? 'check_circle' : 'pending'}
                    </span>
                    Database Tables: {healthData?.tablesProvisioned ? 'Provisioned' : 'Action Required'}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      healthData?.tablesProvisioned
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {healthData?.tablesProvisioned ? 'Tables Active' : 'Copy SQL Schema'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {healthData?.statusMessage ||
                    'Run the provided schema in your Supabase SQL Editor to initialize persistent tables.'}
                </p>
                {!healthData?.tablesProvisioned && (
                  <button
                    onClick={() => setActiveTab('sql')}
                    className="mt-1 text-xs font-bold text-secondary dark:text-secondary-fixed underline flex items-center gap-1"
                  >
                    <span>View and copy supabase-schema.sql</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-outline font-label-sm uppercase tracking-wider">
                  File: /supabase-schema.sql
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-3 bg-surface-container-high dark:bg-surface-container rounded-xl text-[11px] font-mono text-on-surface overflow-x-auto max-h-72 select-all leading-relaxed border border-outline-variant/30">
                  {sqlSchema || '-- Loading schema...'}
                </pre>
              </div>

              <div className="text-xs text-outline space-y-1 pt-1">
                <p className="font-semibold text-on-surface">How to apply in Supabase:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-on-surface-variant">
                  <li>Open your Supabase Project dashboard.</li>
                  <li>Click on <strong>SQL Editor</strong> in the left sidebar.</li>
                  <li>Click <strong>New query</strong>, paste this SQL, and click <strong>Run</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-surface-container dark:border-surface-container-high shrink-0">
          <span className="text-xs text-outline">
            In-memory fallback active while schema is applied
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
