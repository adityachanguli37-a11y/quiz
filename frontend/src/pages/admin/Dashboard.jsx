import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Play, 
  CheckSquare, 
  Slash, 
  Award, 
  AlertTriangle, 
  Activity,
  Bell,
  Check,
  CheckCheck,
  ShieldAlert,
  ThumbsDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  PieChart, Pie, Legend
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { notifications, setNotifications } = useAuth();
  const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];

  const fetchStats = async () => {
    try {
      const response = await api.get('/auth/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded skeleton-loading"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl skeleton-loading"></div>
        </div>
      </div>
    );
  }

  const unreadNotifs = notifications.filter(n => !n.read);

  // Cards layout
  const cards = [
    { label: 'Total Candidates', value: stats?.totalCandidates || 0, icon: Users, color: 'text-sky-500 bg-sky-500/10' },
    { label: 'Active Sessions', value: stats?.activeParticipants || 0, icon: Play, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Completed Attempts', value: stats?.submittedAttempts || 0, icon: CheckSquare, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Disqualified Attempts', value: stats?.disqualifiedAttempts || 0, icon: ThumbsDown, color: 'text-red-500 bg-red-500/10' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Activity className="h-8 w-8 text-sky-500" />
            <span>Operational Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and security auditing metrics.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1 block">{card.value}</span>
              </div>
              <div className={`p-4 rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Second Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Score</span>
          <span className="text-3xl font-bold text-sky-500 mt-2 block">{stats?.averageScore || 0} / 10</span>
        </div>
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Passing Rate</span>
          <span className="text-3xl font-bold text-emerald-500 mt-2 block">{stats?.passRate || 0}%</span>
        </div>
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg Violations Per Attempt</span>
          <span className="text-3xl font-bold text-red-500 mt-2 block">{stats?.avgViolationsPerUser || 0} warnings</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center space-x-1.5">
            <Activity className="h-4 w-4 text-sky-500" />
            <span>Examinee Trend Analysis</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyParticipation || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#F8FAFC' }} />
                <Area type="monotone" dataKey="attempts" stroke="#0EA5E9" strokeWidth={2} fillOpacity={1} fill="url(#colorAttempts)" name="Total Attempts" />
                <Area type="monotone" dataKey="passes" stroke="#10B981" strokeWidth={1.5} fillOpacity={0} name="Passed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations Pie Chart */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md flex flex-col justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-1.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Cheating Warnings logged</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            {stats?.violationStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.violationStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.violationStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-450 font-mono">No warning events logged yet.</div>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-100 dark:border-slate-850 pt-4">
            {stats?.violationStats?.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span>{item.name}</span>
                </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Third row: Most missed questions & notification sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Missed Questions list */}
        <div className="lg:col-span-2 bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center space-x-1.5">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span>Top 10 Most Missed Questions</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Question Text</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 text-right">Incorrect Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                {stats?.hardestQuestions?.length > 0 ? (
                  stats.hardestQuestions.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/20">
                      <td className="py-3.5 pr-4 text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">{q.questionText}</td>
                      <td className="py-3.5 pr-4 text-sky-500 font-medium">{q.category}</td>
                      <td className="py-3.5 text-right font-bold text-red-500">{q.wrongAnswerPercentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-400 font-mono">No exam statistics compiled yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time notification sidebar */}
        <div className="bg-white dark:bg-cyber-panel-dark border border-slate-200 dark:border-cyber-border-dark p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Bell className="h-4 w-4 text-amber-500" />
                <span>Live Event Alerts</span>
              </h3>
              {unreadNotifs.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-sky-500 hover:text-sky-400 flex items-center space-x-1 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <div 
                    key={notif._id || idx} 
                    className={`p-3.5 rounded-lg border text-xs relative transition-all
                      ${notif.read 
                        ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 text-slate-550 dark:text-slate-400' 
                        : 'bg-sky-500/5 border-sky-550/30 text-slate-800 dark:text-white shadow-sm shadow-sky-500/5'}`}
                  >
                    <div className="font-bold flex justify-between pr-4">
                      <span>{notif.title}</span>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif._id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-emerald-500"
                          title="Mark Read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-slate-500 dark:text-slate-300 leading-normal">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-mono text-sm">
                  Waiting on telemetry stream...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
