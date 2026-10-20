import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  Calendar,
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

const STATUS_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'pending', label: 'Pending' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'accepted', label: 'Accepted / Hired' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

export default function MyApplicationsPage() {
  const { applications, jobs, currentUser, withdrawApplication, sendMessage } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  // Filter applications belonging to current worker
  const myApplications = useMemo(() => {
    return applications.filter((app) => app.workerId === currentUser?.id);
  }, [applications, currentUser]);

  // Tab counts
  const counts = useMemo(() => {
    const res = { all: myApplications.length };
    STATUS_TABS.slice(1).forEach((t) => {
      res[t.key] = myApplications.filter((a) => a.status === t.key).length;
    });
    return res;
  }, [myApplications]);

  const filteredApps = useMemo(() => {
    if (activeTab === 'all') return myApplications;
    return myApplications.filter((a) => a.status === activeTab);
  }, [myApplications, activeTab]);

  const handleWithdraw = (appId, jobTitle) => {
    if (window.confirm(`Are you sure you want to withdraw your application for "${jobTitle}"?`)) {
      withdrawApplication(appId);
      setToastMsg('Application withdrawn successfully.');
    }
  };

  const handleMessageEmployer = (app) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    const employerId =
      jobs.find((j) => j.id === app.jobId)?.employerId || app.employerId;
    if (!employerId) {
      setToastMsg('This employer is not available to message.');
      return;
    }
    sendMessage({
      recipientId: employerId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      text: `Hello, I'm following up on my application for "${app.jobTitle}".`,
    });
    navigate('/messages');
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Page Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">My Applications</h1>
          <p className="page-header__subtitle">
            Track the status of your submitted job proposals and communicate with employers.
          </p>
        </div>

        <Link to="/jobs">
          <Button variant="dark" size="sm">
            <Search size={14} /> Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--line)',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
        role="tablist"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn--sm ${activeTab === tab.key ? 'btn--dark' : 'btn--light'}`}
            style={{ borderRadius: '999px', fontSize: '13px' }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span
              style={{
                marginLeft: '4px',
                padding: '1px 6px',
                borderRadius: '999px',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApps.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredApps.map((app) => (
            <div key={app.id} className="card card--hoverable">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`badge badge--${app.status}`}>
                      {app.status === 'accepted' && <CheckCircle2 size={12} />}
                      {app.status === 'shortlisted' && <CheckCircle2 size={12} />}
                      {app.status === 'rejected' && <XCircle size={12} />}
                      {app.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Applied {app.appliedDateText || 'recently'}
                    </span>
                  </div>

                  <Link
                    to={`/jobs/${app.jobId}`}
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--navy)',
                      textDecoration: 'none',
                    }}
                  >
                    {app.jobTitle}
                  </Link>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>
                    <strong>{app.companyName}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                    Expected Rate
                  </span>
                  <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>
                    {app.expectedRate || app.payRate}
                  </strong>
                </div>
              </div>

              {/* Cover Note Snippet */}
              {app.coverNote && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: 'var(--ink)',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '2px' }}>
                    Your Pitch Note:
                  </strong>
                  "{app.coverNote}"
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  borderTop: '1px solid var(--line)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleMessageEmployer(app)}
                  >
                    <MessageSquare size={13} /> Message Employer
                  </Button>

                  <Link to={`/jobs/${app.jobId}`}>
                    <Button variant="light" size="sm">
                      View Job Details <ChevronRight size={13} />
                    </Button>
                  </Link>
                </div>

                {app.status !== 'withdrawn' && app.status !== 'rejected' && (
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleWithdraw(app.id, app.jobTitle)}
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <FileText size={24} />
          </div>
          <h3 className="empty-state__title">No applications in this status</h3>
          <p className="empty-state__desc">
            {activeTab === 'all'
              ? 'You have not submitted any job proposals yet. Explore available jobs and start applying.'
              : `You have 0 applications marked as ${activeTab}.`}
          </p>
          <Link to="/jobs">
            <Button variant="dark" size="md">
              Discover Open Jobs <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
