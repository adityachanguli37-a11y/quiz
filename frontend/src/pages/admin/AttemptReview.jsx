import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  FileText, ArrowLeft, User, ShieldCheck, AlertTriangle, Monitor, Clock, Check, X, Eye
} from 'lucide-react';

const AttemptReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await api.get(`/quiz-attempts/${attemptId}/review`);
        setAttempt(response.data);
      } catch (err) {
        setError('Failed to fetch attempt details for review.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttemptDetails();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="bg-white dark:bg-cyber-panel-dark border border-red-500/25 p-8 text-center rounded-xl">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Load Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error || 'Attempt records not found.'}</p>
        <button onClick={() => navigate('/admin/attempts')} className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded font-medium text-sm">
          Return to Attempts List
        </button>
      </div>
    );
  }

  const isDisqualified = attempt.status === 'disqualified';
  const isPassed = attempt.passOrFail === 'Pass' && !isDisqualified;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <button
          onClick={() => navigate('/admin/attempts')}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-550 dark:text-slate-400 hover:text-sky-500 transition-colors"
          title="Back to attempts"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-909 dark:text-white">Attempt Audit Review</h1>
          <p className="text-sm text-slate-450 mt-1">Verifying examinee metrics: {attempt.candidateName} ({attempt.candidateId})</p>
        </div>
      </div>

      {/* Roster & Metadata details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Examinee Identity Card */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <User className="h-4 w-4 text-sky-500" />
            <span>Examinee Identity</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Full Name:</span>
              <span className="font-semibold">{attempt.candidateName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Email Address:</span>
              <span className="font-semibold">{attempt.candidateEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Generated Candidate ID:</span>
              <span className="font-semibold text-sky-550 dark:text-sky-400 font-mono">{attempt.candidateId}</span>
            </div>
            {attempt.certificateId && isPassed && (
              <div>
                <span className="text-slate-450 block text-xs">Certificate ID:</span>
                <span className="font-semibold text-emerald-500 font-mono">{attempt.certificateId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry metadata card */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Monitor className="h-4 w-4 text-sky-505" />
            <span>Device Telemetry Metadata</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-xs">IP Address:</span>
                <span className="font-semibold font-mono text-xs">{attempt.ipAddress || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Device Type:</span>
                <span className="font-semibold capitalize">{attempt.deviceType || 'Desktop'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-xs">Operating System:</span>
                <span className="font-semibold">{attempt.os || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Status State:</span>
                <span className="font-semibold capitalize">{attempt.status?.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-xs">Client User Agent:</span>
              <span className="font-semibold text-[10px] break-all leading-normal text-slate-500 dark:text-slate-400">
                {attempt.userAgent || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Exam stats card */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-sky-500" />
            <span>Assessment Results</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded border dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Score</span>
                <span className="block font-bold text-lg">{isDisqualified ? '0' : attempt.score} / {attempt.questions?.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Percentage</span>
                <span className="block font-bold text-lg">{isDisqualified ? '0%' : `${attempt.percentage}%`}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Grade:</span>
              <span className={`font-semibold ${isPassed ? 'text-emerald-400' : 'text-red-500'}`}>
                {isDisqualified ? 'Disqualified' : attempt.passOrFail}
              </span>
            </div>

            {attempt.submittedAt && (
              <div>
                <span className="text-slate-400 text-xs">Submitted timestamp:</span>
                <span className="block text-xs font-semibold">{new Date(attempt.submittedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cheat Warnings violation logs */}
      <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-1.5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span>Security Violations Audit Ledger ({attempt.violationCount || 0} warnings)</span>
        </h3>
        
        {attempt.violationDetails?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-400 font-sans font-semibold uppercase">
                  <th className="pb-3 pr-4">Violation Type</th>
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 pr-4 text-center">Active Question</th>
                  <th className="pb-3 text-right">Time Left (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
                {attempt.violationDetails.map((v, i) => (
                  <tr key={i} className="text-slate-800 dark:text-slate-300">
                    <td className="py-2.5 pr-4 font-bold text-red-500">{v.violationType?.replace('_', ' ').toUpperCase()}</td>
                    <td className="py-2.5 pr-4 text-slate-450">{new Date(v.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-center">Q{v.currentQuestionNumber}</td>
                    <td className="py-2.5 text-right">{v.remainingTime}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 font-mono">
            No security exceptions logged during this assessment session.
          </div>
        )}
      </div>

      {/* Snapshot Questions responses review */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Questions snapshot & responses</span>
        </h3>
        
        <div className="space-y-4">
          {attempt.questions?.map((q, idx) => {
            const chosenAnswer = attempt.answers?.[q.questionId.toString()] || '';
            const isCorrect = chosenAnswer === q.correctAnswer;
            
            return (
              <div 
                key={idx} 
                className={`bg-white dark:bg-cyber-panel-dark border rounded-xl p-6 shadow-sm relative overflow-hidden
                  ${isDisqualified 
                    ? 'border-slate-200 dark:border-slate-800' 
                    : !chosenAnswer 
                    ? 'border-amber-500/20' 
                    : isCorrect 
                    ? 'border-emerald-500/20' 
                    : 'border-red-500/20'}`}
              >
                
                {/* Score Indicator Badge */}
                <div className="absolute right-4 top-4 text-xs font-bold font-mono">
                  {isDisqualified ? (
                    <span className="text-red-550 bg-red-500/10 px-2 py-0.5 rounded">0/1 (DISQ)</span>
                  ) : !chosenAnswer ? (
                    <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">0/1 (EMPTY)</span>
                  ) : isCorrect ? (
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">1/1</span>
                  ) : (
                    <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded">0/1</span>
                  )}
                </div>

                {/* Info Header */}
                <div className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wide space-x-2">
                  <span>Q{idx + 1}</span>
                  <span className="text-slate-350">|</span>
                  <span className="text-sky-505">{q.category}</span>
                  <span className="text-slate-350">|</span>
                  <span className="capitalize">{q.difficulty}</span>
                </div>

                {/* Question Text */}
                <h4 className="font-bold text-slate-909 dark:text-white leading-relaxed mb-4">{q.question}</h4>

                {/* Render Options list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = chosenAnswer === opt;
                    const isCorrectOpt = q.correctAnswer === opt;

                    // Option color mapping
                    let classNames = 'border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-400 bg-slate-50/20 dark:bg-slate-950/10';
                    if (!isDisqualified) {
                      if (isCorrectOpt) {
                        classNames = 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        classNames = 'border-red-500/30 text-red-650 dark:text-red-400 bg-red-500/5 font-semibold';
                      }
                    }

                    return (
                      <div key={oIdx} className={`p-3 rounded-lg border flex items-start space-x-2 select-text ${classNames}`}>
                        <span className="font-bold font-mono">{letter}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AttemptReview;
