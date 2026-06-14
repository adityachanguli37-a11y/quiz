import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { ShieldCheck, ShieldAlert, ArrowLeft, Search, CheckCircle, Calendar, BookOpen, Award, Key } from 'lucide-react';

const VerifyCertificate = () => {
  const { certId } = useParams();
  const [searchId, setSearchId] = useState(certId || '');
  const [certInfo, setCertInfo] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If certId URL param exists, run automatic verification
  useEffect(() => {
    if (certId) {
      verifyId(certId);
    }
  }, [certId]);

  const verifyId = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setCertInfo(null);
    setSearched(true);
    try {
      const response = await api.get(`/certificates/verify/${id.toUpperCase().trim()}`);
      setCertInfo(response.data.certificate);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate ID was not found or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify-certificate/${searchId.toUpperCase().trim()}`);
    }
  };

  const formattedDate = certInfo?.completionDate ? new Date(certInfo.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar isCandidate={true} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-2xl p-8 transition-colors duration-200">
          
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 transition-colors"
              title="Return Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Certificate Verification</h1>
          </div>

          {/* Search bar — only show when no certId was provided via URL */}
          {!certId && (
            <form onSubmit={handleSearchSubmit} className="mb-8">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Enter Certificate ID
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="e.g. CERT-2026-0001"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm font-mono tracking-wide"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* When auto-verifying from URL, show a subtle cert ID label */}
          {certId && !certInfo && !loading && !error && (
            <div className="mb-6 px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center space-x-2 text-xs font-mono text-slate-500">
              <Search className="h-3.5 w-3.5" />
              <span>Verifying: <span className="text-slate-700 dark:text-slate-300 font-semibold">{certId.toUpperCase()}</span></span>
            </div>
          )}


          {/* Verification Result Display */}
          {loading && (
            <div className="py-12 text-center text-slate-400 font-mono text-sm animate-pulse">
              QUERING CRYPTOGRAPHIC LEDGER...
            </div>
          )}

          {error && searched && !loading && (
            <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-lg text-center space-y-3">
              <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="font-bold text-red-500 text-sm uppercase">Verification Failed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {certInfo && !loading && (
            <div className="space-y-6">
              
              {/* Success Badge */}
              <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                <ShieldCheck className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">VERIFIED SECURE CREDENTIAL</h3>
                  <p className="text-[11px] text-emerald-400/80">This certificate is authentic and recorded in our database.</p>
                </div>
              </div>

              {/* Data list */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase">Examinee Name</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{certInfo.candidateName}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase">Candidate ID</span>
                    <span className="text-sm font-semibold text-slate-850 dark:text-slate-300">{certInfo.candidateId}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase">Assessment Quiz</span>
                    <span className="text-sm font-semibold text-slate-850 dark:text-slate-300">{certInfo.quizName}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Award className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase">Performance Score</span>
                    <span className="text-sm font-semibold text-slate-850 dark:text-slate-350">
                      {certInfo.score} Correct Answers ({certInfo.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] text-slate-400 uppercase">Completion Timestamp</span>
                    <span className="text-sm font-semibold text-slate-850 dark:text-slate-350">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Key className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] text-slate-400 uppercase">Sha256 Audit Signature</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 break-all leading-normal select-text">
                      {certInfo.hash}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
};

export default VerifyCertificate;
