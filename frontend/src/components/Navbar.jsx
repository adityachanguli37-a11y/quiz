import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Shield, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ isCandidate = false, candidateName = '', candidateId = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          {isCandidate ? (
            <div className="flex items-center space-x-2 select-none">
              <Shield className="h-8 w-8 text-sky-500 animate-pulse" />
              <span className="font-sans text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                CYBER<span className="text-sky-500">SHIELD</span>
              </span>
            </div>
          ) : (
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-sky-500 animate-pulse" />
              <span className="font-sans text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                CYBER<span className="text-sky-500">SHIELD</span>
              </span>
            </Link>
          )}

          {/* Right items */}
          <div className="flex items-center space-x-4">
            
            {/* Candidate Identity Tag */}
            {isCandidate && candidateId && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-slate-400">Examinee Name</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-emerald-400">
                  {candidateName} ({candidateId})
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Admin Logout Button */}
            {!isCandidate && admin && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium transition-all"
                title="Log Out Admin"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
