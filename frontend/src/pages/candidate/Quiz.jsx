import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Maximize2
} from 'lucide-react';

const Quiz = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Core quiz state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingTime, setRemainingTime] = useState(600);
  const [violations, setViolations] = useState(0);
  const [violationLimit, setViolationLimit] = useState(3);
  const [fullscreenReq, setFullscreenReq] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI Indicators
  const [saving, setSaving] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showFsModal, setShowFsModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Ref to suppress false violations when submit confirmation modal is open
  const isSubmitModalOpenRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Refs for timers and visibility listeners
  const timerRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const currentQIndexRef = useRef(0);
  const answersRef = useRef({});
  const remainingTimeRef = useRef(600);

  // Sync refs to avoid stale closures in event listeners
  useEffect(() => {
    currentQIndexRef.current = currentIndex;
    answersRef.current = answers;
    remainingTimeRef.current = remainingTime;
  }, [currentIndex, answers, remainingTime]);

  // 1. Fetch/Resume Quiz Attempt State
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const response = await api.get(`/quiz-attempts/${attemptId}/resume`);
        const attempt = response.data;
        
        if (['submitted', 'auto_submitted', 'disqualified'].includes(attempt.status)) {
          navigate(`/result/${attemptId}`);
          return;
        }

        setQuestions(attempt.questions || []);
        setCurrentIndex(attempt.currentQuestionIndex || 0);
        
        // Convert map response to object if needed
        const loadedAnswers = {};
        if (attempt.answers) {
          Object.keys(attempt.answers).forEach(k => {
            loadedAnswers[k] = attempt.answers[k];
          });
        }
        setAnswers(loadedAnswers);
        setRemainingTime(attempt.remainingTime);
        setViolations(attempt.violationCount || 0);
        
        // Get settings from registration metadata or look up
        setViolationLimit(attempt.violationLimit || 3);
        setFullscreenReq(attempt.fullscreenRequirement !== false);

        setLoading(false);

        // Force check fullscreen status on mount if required
        if (attempt.fullscreenRequirement !== false && !document.fullscreenElement) {
          setShowFsModal(true);
        }
      } catch (err) {
        setError('Failed to fetch active quiz attempt data.');
        setLoading(false);
      }
    };
    initQuiz();
  }, [attemptId, navigate]);

  // 2. Start Countdown Timer & Auto-save Loop
  useEffect(() => {
    if (loading || error) return;

    // Countdown Timer (1s)
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Periodic Server Auto-save (Every 10 seconds)
    autosaveTimerRef.current = setInterval(async () => {
      try {
        await api.post(`/quiz-attempts/${attemptId}/autosave`, {
          answers: answersRef.current,
          currentQuestionIndex: currentQIndexRef.current,
          remainingTime: remainingTimeRef.current
        });
      } catch (err) {
        console.error('Interval auto-save sync failed:', err);
      }
    }, 10000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(autosaveTimerRef.current);
    };
  }, [loading, error, attemptId]);

  // 3. Register Anti-Cheating Event Handlers
  useEffect(() => {
    if (loading || error) return;

    // A. Context Menu Block (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('right_click');
    };

    // B. Copy, Cut, Paste Block
    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerViolation(e.type === 'copy' ? 'copy_attempt' : e.type === 'paste' ? 'paste_attempt' : 'shortcut_usage');
    };

    // C. Keyboard Restrictions (F12, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, Ctrl+S)
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.key === 'F12' || (isCtrl && ['c', 'v', 'x', 'u', 's'].includes(key))) {
        e.preventDefault();
        triggerViolation(e.key === 'F12' ? 'devtools_detected' : 'shortcut_usage');
      }
    };

    // D. Tab Switch Detection (Page Visibility change and Blur)
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitModalOpenRef.current && !isSubmittingRef.current) {
        triggerViolation('tab_switch');
      }
    };
    
    const handleWindowBlur = () => {
      // Suppress false violation when the submit confirmation modal is open or submitting
      if (!isSubmitModalOpenRef.current && !isSubmittingRef.current) {
        triggerViolation('tab_switch');
      }
    };

    // E. Fullscreen Change Detector
    const handleFullscreenChange = () => {
      // Suppress false fullscreen exit violation when submit modal triggers it
      if (!document.fullscreenElement && fullscreenReq && !isSubmitModalOpenRef.current && !isSubmittingRef.current) {
        triggerViolation('fullscreen_exit');
        setShowFsModal(true);
      }
    };

    // F. Block browser back/forward navigation (treat as violation)
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      if (isSubmittingRef.current) return;
      window.history.pushState(null, null, window.location.href);
      triggerViolation('back_navigation');
    };

    // G. Warn on page reload/unload attempt
    const handleBeforeUnload = (e) => {
      if (isSubmittingRef.current) return;
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quiz-attempts/${attemptId}/violation`;
      const blob = new Blob([JSON.stringify({
        violationType: 'page_unload_attempt',
        currentQuestionNumber: currentQIndexRef.current + 1,
        remainingTime: remainingTimeRef.current
      })], { type: 'application/json' });
      navigator.sendBeacon(url, blob);

      e.preventDefault();
      e.returnValue = 'Warning: Exiting or reloading the assessment will log a cheating violation.';
      return e.returnValue;
    };

    // Bind event listeners to document & window
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, error, attemptId, fullscreenReq]);

  // 4. Trigger violation logger
  const triggerViolation = async (violationType) => {
    try {
      const response = await api.post(`/quiz-attempts/${attemptId}/violation`, {
        violationType,
        currentQuestionNumber: currentQIndexRef.current + 1,
        remainingTime: remainingTimeRef.current
      });

      const data = response.data;
      setViolations(data.violationCount);

      if (data.status === 'disqualified') {
        clearInterval(timerRef.current);
        clearInterval(autosaveTimerRef.current);
        setWarningMessage('ASSESSMENT DISQUALIFIED: Exceeded security violations limit.');
        setTimeout(() => {
          navigate(`/result/${attemptId}`);
        }, 2000);
        return;
      }

      // Show temporary screen banner alert
      let alertMsg = 'Warning: Security violation detected.';
      if (violationType === 'tab_switch') alertMsg = 'Warning: Tab switching or app switching detected.';
      else if (violationType === 'fullscreen_exit') alertMsg = 'Warning: Exited Fullscreen Mode.';
      else if (violationType === 'right_click') alertMsg = 'Warning: Right-clicking is disabled.';
      else if (violationType === 'copy_attempt' || violationType === 'paste_attempt') alertMsg = 'Warning: Copying and pasting are disabled.';
      else if (violationType === 'devtools_detected') alertMsg = 'Warning: Developer Tools detection triggered.';
      else if (violationType === 'back_navigation') alertMsg = 'Warning: Back/Forward navigation is disabled.';
      else if (violationType === 'page_unload_attempt') alertMsg = 'Warning: Browser reload/navigation attempt detected.';

      setWarningMessage(`${alertMsg} (${data.violationCount}/${violationLimit} violations)`);
      setTimeout(() => setWarningMessage(''), 6500);

    } catch (err) {
      console.error('Failed to log cheating violation:', err);
    }
  };

  // Re-enter Fullscreen Mode
  const enterFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      setShowFsModal(false);
    } catch (err) {
      console.error('Fullscreen retry failed:', err);
    }
  };

  // 5. Handle answer changes and auto-save on selection
  const handleSelectOption = async (questionIdStr, selectedOption) => {
    const updatedAnswers = { ...answers, [questionIdStr]: selectedOption };
    setAnswers(updatedAnswers);
    setSaving(true);
    try {
      // Sync immediately on selection
      await api.post(`/quiz-attempts/${attemptId}/autosave`, {
        answers: updatedAnswers,
        currentQuestionIndex: currentIndex,
        remainingTime
      });
    } catch (err) {
      console.error('Immediate answer save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // 6. Manual & Auto Submissions
  const handleSubmitQuiz = () => {
    // Use custom modal to avoid triggering window blur / fullscreen violations
    isSubmitModalOpenRef.current = true;
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    isSubmitModalOpenRef.current = false;
    setShowSubmitModal(false);
    processSubmit(false);
  };

  const cancelSubmit = () => {
    isSubmitModalOpenRef.current = false;
    setShowSubmitModal(false);
  };

  const handleAutoSubmit = () => {
    processSubmit(true);
  };

  const processSubmit = async (isAutoSubmit = false) => {
    isSubmittingRef.current = true;
    clearInterval(timerRef.current);
    clearInterval(autosaveTimerRef.current);
    setLoading(true);
    try {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      await api.post(`/quiz-attempts/${attemptId}/submit`, { isAutoSubmit });
      navigate(`/result/${attemptId}`);
    } catch (err) {
      setError('Failed to submit assessment answers. Please verify connectivity.');
      setLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono text-emerald-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400 mb-4 mx-auto"></div>
          <div>LOADING SECURE EXAM DATABASE...</div>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-cyber-bg-dark px-4">
        <div className="max-w-md w-full bg-white dark:bg-cyber-panel-dark border border-red-500/25 p-6 rounded-lg text-center shadow-xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quiz Load Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error || 'No questions snapshot available.'}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm">
            Return to Entrance
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentQuestionIdStr = currentQuestion.questionId.toString();
  const selectedAnswer = answers[currentQuestionIdStr] || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 select-none">
      
      {/* Upper Violation Warn Message Bar */}
      {warningMessage && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center font-bold py-2.5 px-4 text-sm z-50 animate-pulse flex items-center justify-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{warningMessage}</span>
        </div>
      )}

      <Navbar isCandidate={true} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Left column: Active Question Form */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl p-8 shadow-xl">
          
          <div>
            {/* Header: Difficulty & Category tags */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450">
                Category: <span className="text-sky-500">{currentQuestion.category}</span>
              </span>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full 
                ${currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' :
                  currentQuestion.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'}`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-white leading-relaxed mb-8">
              Q{currentIndex + 1}. {currentQuestion.question}
            </h2>

            {/* Options list */}
            <div className="space-y-4">
              {currentQuestion.options.map((opt, idx) => {
                const optLetter = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedAnswer === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(currentQuestionIdStr, opt)}
                    className={`flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none
                      ${isSelected 
                        ? 'bg-sky-500/10 border-sky-500 text-slate-900 dark:text-white font-semibold shadow-md shadow-sky-500/5' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border
                      ${isSelected 
                        ? 'bg-sky-500 border-sky-500 text-white' 
                        : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'}`}>
                      {optLetter}
                    </div>
                    <span className="flex-1 text-sm sm:text-base leading-relaxed">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer controls: Back / Next */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition
                ${currentIndex === 0 
                  ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {saving && <span className="text-xs text-slate-400 animate-pulse font-mono">Syncing answers...</span>}

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-650 text-white font-semibold text-sm shadow-md transition"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/10 transition"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Finish Examination</span>
              </button>
            )}
          </div>

        </div>

        {/* Right column: Sidebar summary panel */}
        <div className="w-full md:w-80 space-y-6">
          
          {/* Time & Violations counters card */}
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-400">Exam Timer</span>
              <div className={`flex items-center space-x-1.5 font-mono text-xl font-bold 
                ${remainingTime < 60 ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-emerald-400'}`}>
                <Clock className="h-5 w-5" />
                <span>{formatTime(remainingTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">Cheating Logs</span>
              <div className={`flex items-center space-x-1.5 text-sm font-bold
                ${violations > 0 ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertTriangle className="h-4 w-4" />
                <span>{violations} / {violationLimit} warnings</span>
              </div>
            </div>
          </div>

          {/* Questions Navigation map Grid */}
          <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl p-6 shadow-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-1">
              <HelpCircle className="h-4 w-4" />
              <span>Questions Map</span>
            </h4>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[q.questionId.toString()];
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-full rounded-lg font-bold text-sm transition-all flex items-center justify-center border
                      ${isCurrent 
                        ? 'bg-sky-500 text-white border-sky-500 scale-[1.05]' 
                        : isAnswered 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded bg-sky-500"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submit Assessment?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                You have answered <span className="font-semibold text-slate-700 dark:text-slate-200">{Object.keys(answers).length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{questions.length}</span> questions.
                Once submitted, your answers cannot be changed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelSubmit}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Continue Exam
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forced Fullscreen Modal Alert */}
      {showFsModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-500/30 p-8 rounded-xl shadow-2xl max-w-md w-full text-center space-y-6">
            <Maximize2 className="h-14 w-14 text-red-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">FULLSCREEN MODE REQUIRED</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This examination must be completed under fullscreen. If you exit fullscreen, security warning logs are dispatched, and you face disqualified auto-submission.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition"
            >
              Enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Quiz;
