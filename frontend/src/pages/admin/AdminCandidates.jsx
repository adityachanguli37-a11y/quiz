import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Search, 
  Trash2, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const AdminCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bulk Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/candidates', {
        params: { search, page, limit: 10 }
      });
      setCandidates(response.data.candidates);
      setTotalPages(response.data.pagination.pages);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      setError('Failed to fetch examinees list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to soft-delete examinee "${name}"?`)) return;
    try {
      await api.delete(`/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete examinee.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    setUploading(true);
    setUploadSummary(null);
    try {
      const response = await api.post('/candidates/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(response.data);
      setUploadFile(null);
      setPage(1);
      fetchCandidates();
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk candidate import failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-7 w-7 text-sky-500" />
            <span>Examinee Registry</span>
          </h1>
          <p className="text-sm text-slate-450 mt-1">Review registered candidates and import roster sheets.</p>
        </div>
        
        {/* Bulk Upload trigger */}
        <button
          onClick={() => { setShowUploadModal(true); setUploadSummary(null); setError(''); }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition"
        >
          <Upload className="h-4 w-4" />
          <span>Import Roster</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-4 rounded-xl shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Name, or Email Address..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-250 dark:border-slate-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Candidate ID</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Registered Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {loading ? (
                [1, 2, 3, 4].map(n => (
                  <tr key={n}>
                    <td colSpan="5" className="py-4 px-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
                    </td>
                  </tr>
                ))
              ) : candidates.length > 0 ? (
                candidates.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                    <td className="py-4 px-6 font-mono font-bold text-sky-550 dark:text-sky-400">{c.candidateId}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-white">{c.name}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{c.email}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(c.registrationDate).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 transition"
                        title="Delete examinee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-450 font-mono">
                    No examinees matched the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Records: {totalRecords}</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-xs font-semibold font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
                PAGE {page} OF {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-2 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roster Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark w-full max-w-md rounded-xl shadow-2xl p-8">
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <span>Import Candidate Roster</span>
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500 text-xs">
                {error}
              </div>
            )}

            {!uploadSummary ? (
              <form onSubmit={handleImportSubmit} className="space-y-6">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload an Excel Spreadsheet (.xlsx) file. Columns must match exactly: <br />
                  <strong className="text-slate-800 dark:text-slate-250">Name | Email</strong>
                </p>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-lg text-center bg-slate-50 dark:bg-slate-950/30">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file-picker"
                  />
                  <label 
                    htmlFor="excel-file-picker"
                    className="cursor-pointer text-sm font-semibold text-sky-500 hover:text-sky-400 block"
                  >
                    {uploadFile ? uploadFile.name : 'Choose spreadsheet file (.xlsx)'}
                  </label>
                  {uploadFile && <span className="text-[10px] text-slate-400 mt-1 block">{(uploadFile.size / 1024).toFixed(1)} KB</span>}
                </div>

                <div className="flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-405 font-medium rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-xs shadow-md transition disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Run Import'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                
                {/* Upload summary logs */}
                <div className="flex items-center space-x-2.5 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase">Import Complete</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Read Rows</span>
                    <span className="text-lg font-bold">{uploadSummary.totalRows}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Imported</span>
                    <span className="text-lg font-bold text-emerald-500">{uploadSummary.successCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded">
                    <span className="text-slate-450 block uppercase text-[10px]">Failed</span>
                    <span className={`text-lg font-bold ${uploadSummary.failedCount > 0 ? 'text-red-500' : ''}`}>
                      {uploadSummary.failedCount}
                    </span>
                  </div>
                </div>

                {uploadSummary.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-150 dark:border-slate-850 p-3 bg-slate-50 dark:bg-slate-950 rounded text-left">
                    <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Validation log issues</span>
                    </h5>
                    <ul className="text-[10px] space-y-1 text-red-500 list-disc pl-4 font-mono leading-relaxed">
                      {uploadSummary.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {uploadSummary.errors.length > 10 && <li>...and {uploadSummary.errors.length - 10} more warnings.</li>}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded text-xs transition"
                >
                  Close Summary
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCandidates;
