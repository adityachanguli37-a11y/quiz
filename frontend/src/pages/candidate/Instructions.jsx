import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { Play, ShieldAlert, Clock, AlertTriangle, CheckSquare } from 'lucide-react';

const Instructions = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        // We retrieve registration details using the attempt ID
        const response = await api.get(`/quiz-attempts/${attemptId}/resume`);
        setAttempt(response.data);
      } catch (err) {
        setError('Failed to load assessment registration data. Invalid attempt URL.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  const handleStart = async () => {
    if (!agreed) return;
    try {
      // 1. Mark quiz as started / in-progress on the server
      await api.post(`/quiz-attempts/${attemptId}/start`);

      // 2. Request Fullscreen Mode
      const elem = document.documentElement;
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
          await elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
          await elem.msRequestFullscreen();
        }
      } catch (fsErr) {
        console.warn('Fullscreen request denied by user/browser permissions:', fsErr);
      }

      // 3. Navigate to active quiz screen
      navigate(`/quiz/${attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize the quiz session.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono text-sky-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400 mb-4 mx-auto"></div>
          <div>ESTABLISHING SECURE CONNECTION...</div>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-cyber-bg-dark px-4">
        <div className="max-w-md w-full bg-white dark:bg-cyber-panel-dark border border-red-500/25 p-6 rounded-lg text-center shadow-xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Registration Verification Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error || 'Attempt session was not found.'}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm">
            Return to Entrance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar isCandidate={true} candidateName={attempt.candidateName} candidateId={attempt.candidateId} />

      <main className="flex-1 flex justify-center items-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-2xl p-8 transition-colors duration-200">
          
          <h1 className="text-2xl font-bold border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center space-x-2 text-slate-900 dark:text-white">
            <ShieldAlert className="h-6 w-6 text-sky-500" />
            <span>Assessment Integrity & Rules</span>
          </h1>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
              <span className="block text-xs text-slate-400 uppercase font-semibold">Total Questions</span>
              <span className="text-xl font-bold text-sky-500">{attempt.questions?.length || 10}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
              <span className="block text-xs text-slate-400 uppercase font-semibold">Duration Limit</span>
              <span className="text-xl font-bold text-sky-500 flex items-center justify-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{attempt.remainingTime ? Math.round(attempt.remainingTime / 60) : 10}m</span>
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
              <span className="block text-xs text-slate-400 uppercase font-semibold">Passing Standard</span>
              <span className="text-xl font-bold text-sky-500">{attempt.passingPercentage || 70}%</span>
            </div>
          </div>

          {/* Anti Cheating detailed list */}
          <div className="bg-amber-500/5 border-l-4 border-amber-500 p-5 rounded-r-lg space-y-4 mb-6">
            <div className="flex items-center space-x-2 font-bold text-amber-500 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>ANTI-CHEAT MONITORING ACTIVE</span>
            </div>
            <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300 pl-4 list-disc">
              <li><strong>Fullscreen Mode:</strong> The assessment runs in forced fullscreen. Minimizing or exiting fullscreen registers a cheating violation.</li>
              <li><strong>Tab Switching:</strong> Switching browser tabs or launching other desktop apps logs a violation.</li>
              <li><strong>Shortcut Controls:</strong> Copy/Paste (<code className="bg-slate-200 dark:bg-slate-850 px-1 rounded">Ctrl+C</code> / <code className="bg-slate-200 dark:bg-slate-850 px-1 rounded">Ctrl+V</code>), Inspect keys (<code className="bg-slate-200 dark:bg-slate-850 px-1 rounded">F12</code>), and Right-Click are disabled.</li>
              <li><strong>Violation Threshold:</strong> Exceeding <strong>{attempt.violationLimit || 3} violations</strong> triggers immediate auto-submission with a status of <strong>Disqualified (0% Score)</strong>.</li>
            </ul>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start space-x-3 mb-8 cursor-pointer select-none">
            <input
              type="checkbox"
              id="terms-check"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1.5 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="terms-check" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              I acknowledge that I have read the security rules. I agree to launch the browser in fullscreen mode and understand that any navigation away from the exam window will be logged as a violation.
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 text-center transition"
            >
              Cancel Entry
            </button>
            <button
              onClick={handleStart}
              disabled={!agreed}
              className={`w-full flex-1 py-3.5 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-lg transition
                ${agreed 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-[0.98]' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
            >
              <Play className="h-4 w-4" />
              <span>Start Assessment</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Instructions;
