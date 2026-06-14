import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  HelpCircle, 
  Users, 
  FileText, 
  Settings,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { notifications } = useAuth();
  const unreadCount = notifications.filter(n => !n.read).length;

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
    { to: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    { to: '/admin/candidates', label: 'Examinees', icon: Users },
    { to: '/admin/attempts', label: 'Quiz Attempts', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] transition-colors duration-200">
      <div className="p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-4">
          Control Center
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-sky-500/10 text-sky-500 border-l-2 border-sky-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                {/* Alert Badge for Dashboard (Unread logs count) */}
                {link.label === 'Dashboard' && unreadCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
