import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Candidate Screens
import Landing from './pages/candidate/Landing';
import Instructions from './pages/candidate/Instructions';
import Quiz from './pages/candidate/Quiz';
import Result from './pages/candidate/Result';
import VerifyCertificate from './pages/candidate/VerifyCertificate';

// Admin Screens
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminAttempts from './pages/admin/AdminAttempts';
import AttemptReview from './pages/admin/AttemptReview';
import AdminSettings from './pages/admin/AdminSettings';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar isCandidate={false} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Candidate Portal Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/quiz-instructions/:attemptId" element={<Instructions />} />
      <Route path="/quiz/:attemptId" element={<Quiz />} />
      <Route path="/result/:attemptId" element={<Result />} />
      
      {/* Public Certificate verification */}
      <Route path="/verify-certificate" element={<VerifyCertificate />} />
      <Route path="/verify-certificate/:certId" element={<VerifyCertificate />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/quizzes" 
        element={
          <ProtectedRoute>
            <AdminLayout><AdminQuizzes /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/questions" 
        element={
          <ProtectedRoute>
            <AdminLayout><AdminQuestions /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/candidates" 
        element={
          <ProtectedRoute>
            <AdminLayout><AdminCandidates /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/attempts" 
        element={
          <ProtectedRoute>
            <AdminLayout><AdminAttempts /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/attempts/review/:attemptId" 
        element={
          <ProtectedRoute>
            <AdminLayout><AttemptReview /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Fallback redirects */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
