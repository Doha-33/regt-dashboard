
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import UserNetwork from './pages/UserNetwork'; // New Component
import Withdrawals from './pages/Withdrawals';
import WithdrawalDetail from './pages/WithdrawalDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Ads from './pages/Ads';
import AdDetail from './pages/AdDetail';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

const MainRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/*" element={
        isAuthenticated ? (
           <Layout>
             <Routes>
               <Route path="/" element={<Dashboard />} />
               
               <Route path="/users" element={<Users />} />
               <Route path="/users/new" element={<UserDetail />} />
               <Route path="/users/:id" element={<UserDetail />} />
               <Route path="/users/:id/team" element={<UserNetwork />} />
               
               <Route path="/withdrawals" element={<Withdrawals />} />
               <Route path="/withdrawals/:id" element={<WithdrawalDetail />} />
               
               <Route path="/companies" element={<Companies />} />
               <Route path="/companies/new" element={<CompanyDetail />} />
               <Route path="/companies/:id" element={<CompanyDetail />} />

               <Route path="/ads" element={<Ads />} />
               <Route path="/ads/new" element={<AdDetail />} />
               <Route path="/ads/:id" element={<AdDetail />} />

               <Route path="/notifications" element={<Notifications />} />
               <Route path="/settings" element={<Settings />} />
               <Route path="/profile" element={<Profile />} />
               <Route path="/analytics" element={<div className="p-8 text-center text-gray-500">Analytics Module Loading...</div>} />
               <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
           </Layout>
        ) : (
           <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <HashRouter>
              <MainRoutes />
            </HashRouter>
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;
