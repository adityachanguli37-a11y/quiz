import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { 
  Award, 
  XCircle, 
  AlertOctagon, 
  CheckCircle2, 
  Home, 
  FileCheck2
} from 'lucide-react';

const Result = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get(`/quiz-attempts/${attemptId}/resume`);
        setResult(response.data);
      } catch (err) {
        setError('Failed to load assessment results data.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono text-sky-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400 mb-4 mx-auto"></div>
          <div>COMPILING SCORE REPORT...</div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-cyber-bg-dark px-4">
        <div className="max-w-md w-full bg-white dark:bg-cyber-panel-dark border border-red-500/25 p-6 rounded-lg text-center shadow-xl">
          <AlertOctagon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error || 'Session results not accessible.'}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm">
            Return to Entrance
          </button>
        </div>
      </div>
    );
  }

  const isDisqualified = result.status === 'disqualified';
  const isPassed = result.passOrFail === 'Pass' && !isDisqualified;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar isCandidate={true} candidateName={result.candidateName} candidateId={result.candidateId} />

      <main className="flex-1 flex justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-2xl overflow-hidden transition-colors duration-200">
          
          {/* Top Banner (Status themed) */}
          <div className={`p-8 text-center text-white flex flex-col items-center
            ${isDisqualified 
              ? 'bg-red-600' 
              : isPassed 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
              : 'bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-800 dark:to-slate-900'}`}>
            
            <div className="p-3 bg-white/10 rounded-full mb-3">
              {isDisqualified ? (
                <AlertOctagon className="h-12 w-12 text-white" />
              ) : isPassed ? (
                <Award className="h-12 w-12 text-white" />
              ) : (
                <XCircle className="h-12 w-12 text-white" />
              )}
            </div>

            <h1 className="text-xl font-bold font-sans tracking-wide">
              {isDisqualified 
                ? 'ASSESSMENT DISQUALIFIED' 
                : isPassed 
                ? 'EXAMINATION PASSED' 
                : 'EXAMINATION FAILED'}
            </h1>
            <p className="text-xs text-white/80 mt-1">
              {result.quiz?.title || 'Cybersecurity Evaluation'}
            </p>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Candidate Info */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{result.candidateName}</h3>
              <p className="text-xs text-slate-400">Candidate ID: {result.candidateId}</p>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                <span className="block text-[11px] text-slate-400 uppercase font-semibold">Correct Answers</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isDisqualified ? '0' : `${result.score}/${result.questions?.length || 10}`}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                <span className="block text-[11px] text-slate-400 uppercase font-semibold">Score Percentage</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isDisqualified ? '0%' : `${result.percentage}%`}
                </span>
              </div>
            </div>

            {/* Integrity / Violations Check */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Attempt Status:</span>
                <span className="font-semibold capitalize text-slate-700 dark:text-slate-350">{result.status?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cheating Violations:</span>
                <span className={`font-semibold ${result.violationCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-350'}`}>
                  {result.violationCount} logged warnings
                </span>
              </div>
              {result.timeTaken && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Taken:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                  </span>
                </div>
              )}
            </div>

            {isDisqualified && (
              <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg text-center text-xs text-red-500 font-medium leading-relaxed">
                This attempt has been flagged and archived as DISQUALIFIED. If you feel this was an error, please contact your training coordinator or program administrator.
              </div>
            )}

            {/* Home navigation */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition"
              >
                <Home className="h-4 w-4" />
                <span>Return to Home</span>
              </button>
              
              {isPassed && result.certificateId && (
                <button
                  onClick={() => navigate(`/verify-certificate/${result.certificateId}`)}
                  className="w-full py-2 px-4 text-xs font-semibold text-sky-500 hover:text-sky-450 flex items-center justify-center space-x-1 hover:underline transition"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Verify Credential Authenticity</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Result;
