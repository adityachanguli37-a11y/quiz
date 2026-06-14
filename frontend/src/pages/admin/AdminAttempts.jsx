import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  FileText, Search, Download, ChevronLeft, ChevronRight, Eye, AlertTriangle, 
  CheckCircle2, XCircle, Trash2, Calendar
} from 'lucide-react';

const AdminAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // Filter variables
  const [search, setSearch] = useState('');
  const [quizId, setQuizId] = useState('');
  const [status, setStatus] = useState('');
  const [passOrFail, setPassOrFail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/quiz-attempts', {
        params: {
          search,
          quizId,
          status,
          passOrFail,
          startDate,
          endDate,
          page,
          limit: 10
        }
      });
      setAttempts(response.data.attempts);
      setTotalPages(response.data.pagination.pages);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      setError('Failed to fetch quiz attempts roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [page, quizId, status, passOrFail]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAttempts();
  };

  const handleClearFilters = () => {
    setSearch('');
    setQuizId('');
    setStatus('');
    setPassOrFail('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Trigger immediate reload
    setTimeout(() => fetchAttempts(), 50);
  };

  // Dispatch links for downloads
  const handleExport = (type) => {
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings/export`;
    const queryParams = new URLSearchParams();
    if (quizId) queryParams.append('quizId', quizId);

    window.open(`${baseUrl}/${type}?${queryParams.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="h-7 w-7 text-sky-505" />
            <span>Examinee Submissions</span>
          </h1>
          <p className="text-sm text-slate-450 mt-1">Review candidate grades, verify cheat warning audit logs, and export rosters.</p>
        </div>
        
        {/* Export buttons */}
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => handleExport('csv')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter panels */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-sm space-y-4">
        
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
          <button type="submit" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm border border-slate-250 dark:border-slate-800 transition">
            Search
          </button>
        </form>

        {/* Dropdown filters rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          
          {/* Quiz select */}
          <div>
            <select
              value={quizId}
              onChange={(e) => { setQuizId(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Assessments</option>
              {quizzes.map(q => (
                <option key={q._id} value={q._id}>{q.title}</option>
              ))}
            </select>
          </div>

          {/* Status select */}
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="auto_submitted">Auto Submitted</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>

          {/* Grade select */}
          <div>
            <select
              value={passOrFail}
              onChange={(e) => { setPassOrFail(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Grades</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>

          {/* Date range inputs */}
          <div className="flex space-x-1.5 md:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-550 text-xs focus:outline-none"
              title="Filter Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-550 text-xs focus:outline-none"
              title="Filter End Date"
            />
            
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-semibold rounded-lg text-xs border border-red-500/10 transition"
              title="Reset Filters"
            >
              Reset
            </button>
          </div>

        </div>

      </div>

      {/* Attempts Table */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">ID & Name</th>
                <th className="py-4 px-6">Assessment</th>
                <th className="py-4 px-6 text-center">Score</th>
                <th className="py-4 px-6 text-center">Grade</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Cheats</th>
                <th className="py-4 px-6 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {loading ? (
                [1, 2, 3, 4].map(n => (
                  <tr key={n}>
                    <td colSpan="7" className="py-4 px-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
                    </td>
                  </tr>
                ))
              ) : attempts.length > 0 ? (
                attempts.map((a) => {
                  const isDisq = a.status === 'disqualified';
                  const isPass = a.passOrFail === 'Pass' && !isDisq;
                  return (
                    <tr key={a._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/10">
                      
                      {/* Name & ID */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-white">{a.candidateName}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wide">{a.candidateId}</div>
                      </td>

                      {/* Quiz Title */}
                      <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                        {a.quiz ? a.quiz.title : 'N/A'}
                      </td>

                      {/* Score / Percent */}
                      <td className="py-4 px-6 text-center font-bold">
                        {isDisq ? '0' : a.score} ({isDisq ? '0%' : `${a.percentage}%`})
                      </td>

                      {/* Grade Pass/Fail */}
                      <td className="py-4 px-6 text-center">
                        {a.status === 'registered' || a.status === 'in_progress' ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : isPass ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Pass</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400">Fail</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full
                          ${a.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400' :
                            isDisq ? 'bg-red-500/15 text-red-500 font-bold border border-red-500/20' :
                            a.status === 'registered' ? 'bg-slate-500/10 text-slate-400' :
                            'bg-slate-550/10 text-slate-700 dark:text-slate-350'}`}>
                          {a.status?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Cheats Count */}
                      <td className="py-4 px-6 text-center font-semibold">
                        {a.violationCount > 0 ? (
                          <span className="text-red-500 flex items-center justify-center space-x-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{a.violationCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Review details */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/admin/attempts/review/${a._id}`)}
                          className="p-1.5 rounded bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-605 dark:text-slate-400 hover:text-sky-500 transition"
                          title="Open Attempt Audit"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-450 font-mono">
                    No examinee attempts matching the criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Attempts: {totalRecords}</span>
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

    </div>
  );
};

export default AdminAttempts;
