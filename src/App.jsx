import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import WorkerDashboard from './pages/WorkerDashboard.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import FindJobsPage from './pages/FindJobsPage.jsx';
import JobDetailsPage from './pages/JobDetailsPage.jsx';
import MyApplicationsPage from './pages/MyApplicationsPage.jsx';
import ManageApplicationsPage from './pages/ManageApplicationsPage.jsx';
import PostJobPage from './pages/PostJobPage.jsx';
import DigitalIdentityPage from './pages/DigitalIdentityPage.jsx';
import WorkHistoryPage from './pages/WorkHistoryPage.jsx';
import FindWorkersPage from './pages/FindWorkersPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import AppHeader from './components/layout/AppHeader.jsx';
import Footer from './components/layout/Footer.jsx';

import './styles/global.css';
import './styles/app.css';

// Layout wrapper for app pages
function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <div className="app-shell-bg" aria-hidden="true" />
      <AppHeader />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

// Smart dashboard router that routes according to user role
function DashboardRedirect() {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return currentUser.role === 'employer' ? <EmployerDashboard /> : <WorkerDashboard />;
}

// Protected route wrapper
function RequireAuth({ children, role }) {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  if (role && currentUser.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - Exactly intact with existing layout */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Unified and Role-Specific Dashboards */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardRedirect />
              </AppLayout>
            }
          />
          <Route
            path="/worker/dashboard"
            element={
              <AppLayout>
                <RequireAuth role="worker">
                  <WorkerDashboard />
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path="/employer/dashboard"
            element={
              <AppLayout>
                <RequireAuth role="employer">
                  <EmployerDashboard />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Jobs Discovery & Details */}
          <Route
            path="/jobs"
            element={
              <AppLayout>
                <FindJobsPage />
              </AppLayout>
            }
          />
          <Route
            path="/jobs/new"
            element={
              <AppLayout>
                <RequireAuth role="employer">
                  <PostJobPage />
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path="/jobs/edit/:id"
            element={
              <AppLayout>
                <RequireAuth role="employer">
                  <PostJobPage />
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <AppLayout>
                <JobDetailsPage />
              </AppLayout>
            }
          />

          {/* Applications */}
          <Route
            path="/applications"
            element={
              <AppLayout>
                <RequireAuth role="worker">
                  <MyApplicationsPage />
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path="/employer/applications"
            element={
              <AppLayout>
                <RequireAuth role="employer">
                  <ManageApplicationsPage />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Digital Work Identity */}
          <Route
            path="/identity"
            element={
              <AppLayout>
                <DigitalIdentityPage />
              </AppLayout>
            }
          />
          <Route
            path="/identity/:id"
            element={
              <AppLayout>
                <DigitalIdentityPage />
              </AppLayout>
            }
          />

          {/* Work History */}
          <Route
            path="/history"
            element={
              <AppLayout>
                <RequireAuth role="worker">
                  <WorkHistoryPage />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Workers Directory */}
          <Route
            path="/workers"
            element={
              <AppLayout>
                <FindWorkersPage />
              </AppLayout>
            }
          />
          <Route
            path="/workers/:id"
            element={
              <AppLayout>
                <DigitalIdentityPage />
              </AppLayout>
            }
          />

          {/* Messaging */}
          <Route
            path="/messages"
            element={
              <AppLayout>
                <RequireAuth>
                  <MessagesPage />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <AppLayout>
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <AppLayout>
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              </AppLayout>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
