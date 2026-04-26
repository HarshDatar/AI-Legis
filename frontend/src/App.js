import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Upload from './pages/Upload';
import NewCase from './pages/NewCase';
import AIChat from './pages/AIChat';

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="workspace">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/chat/:caseId" element={<AIChat />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/new-case" element={<NewCase />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
