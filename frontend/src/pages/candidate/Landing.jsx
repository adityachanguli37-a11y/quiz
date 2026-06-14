import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { ShieldAlert, Award, FileCheck2, ArrowRight, User, Mail, Hash } from 'lucide-react';

const Landing = () => {
  const [formData, setFormData] = useState({ name: '', email: '', quizCode: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.quizCode.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/quiz-attempts/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        quizCode: formData.quizCode.toUpperCase().trim()
      });
      
      const attempt = response.data;
      
      // If candidate is resuming an in-progress quiz, route them straight to the Quiz console
      if (['in_progress', 'registered'].includes(attempt.status)) {
        if (attempt.status === 'in_progress') {
          navigate(`/quiz/${attempt.attemptId}`);
        } else {
          navigate(`/quiz-instructions/${attempt.attemptId}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please check your credentials or quiz code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark transition-colors duration-200 flex flex-col">
      <Navbar isCandidate={true} />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark rounded-xl shadow-2xl p-8 transition-colors duration-200">
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-sky-500/10 p-3 rounded-full mb-3">
              <ShieldAlert className="h-10 w-10 text-sky-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold font-sans text-slate-900 dark:text-white text-center">
              Candidate Examination Entry
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
              Enter your credentials and quiz access code to begin.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Limit of one active attempt per email address.</span>
            </div>

            {/* Quiz Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Quiz Access Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="quizCode"
                  value={formData.quizCode}
                  onChange={handleChange}
                  placeholder="e.g. CYBER2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-sm font-mono tracking-wider"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Enter Secure Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Public utility links */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <Link 
              to="/verify-certificate" 
              className="flex items-center space-x-1 hover:text-sky-500 transition-colors"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Verify Certificate</span>
            </Link>
            <Link 
              to="/admin/login" 
              className="flex items-center space-x-1 hover:text-sky-500 transition-colors"
            >
              <Award className="h-4 w-4" />
              <span>Admin Console</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Landing;
