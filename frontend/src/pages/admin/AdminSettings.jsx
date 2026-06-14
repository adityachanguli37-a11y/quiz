import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Settings, 
  Database, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const AdminSettings = () => {
  const [retentionDays, setRetentionDays] = useState(30);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setRetentionDays(response.data.retentionDays || 30);
        setBackupFrequency(response.data.backupFrequency || 'daily');
      } catch (err) {
        setError('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.put('/settings', {
        retentionDays: Number(retentionDays),
        backupFrequency
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update settings variables.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const backupUrl = 'http://localhost:5000/api/settings/backup';
    window.open(backupUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Settings className="h-7 w-7 text-sky-505" />
          <span>System Configurations</span>
        </h1>
        <p className="text-sm text-slate-450 mt-1">Adjust administrative global controls and download backups.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>Configurations updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg text-sm flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Form controls */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-8 rounded-xl shadow-md space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Trash2 className="h-4.5 w-4.5 text-sky-500" />
            <span>Data Retention Settings</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Purge Abandoned Attempts (Days)
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                min="1"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block leading-normal">
                Delete incomplete sessions ('registered' or 'in_progress') older than this threshold.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Database Backup Schedule
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none text-sm"
              >
                <option value="daily">Daily Backups</option>
                <option value="weekly">Weekly Backups</option>
                <option value="monthly">Monthly Backups</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-lg shadow-md transition disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Database backups card */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-8 rounded-xl shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Database className="h-4.5 w-4.5 text-sky-500" />
              <span>Database Backups Utility</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export all questions bank data, examinee profiles, and assessment submission attempts into a single JSON file. You can restore this file if you migrate data to another deployment.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-850">
            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 font-semibold rounded-lg flex items-center justify-center space-x-2 shadow-sm text-sm border border-slate-250 dark:border-slate-800 transition"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminSettings;
