import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Award,
  Filter,
  Search,
  ChevronDown,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

const STATUS_OPTIONS = ['all', 'pending', 'under-review', 'shortlisted', 'accepted', 'rejected'];

export default function ManageApplicationsPage() {
  const {
    applications,
    jobs,
    currentUser,
    updateApplicationStatus,
    sendMessage,
  } = useApp();

  const [selectedJobId, setSelectedJobId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  // Employer's jobs
  const employerJobs = jobs.filter((j) => j.employerId === currentUser?.id);
  const employerJobIds = employerJobs.map((j) => j.id);

  // Applications submitted to employer's jobs
  const employerApps = useMemo(() => {
    return applications.filter((a) => employerJobIds.includes(a.jobId));
  }, [applications, employerJobIds]);

  // Filtered by job and status
  const filteredApps = useMemo(() => {
    return employerApps.filter((a) => {
      const matchJob = selectedJobId === 'all' || a.jobId === selectedJobId;
      const matchStatus = selectedStatus === 'all' || a.status === selectedStatus;
      return matchJob && matchStatus;
    });
  }, [employerApps, selectedJobId, selectedStatus]);

  const handleStatusUpdate = (appId, newStatus, candidateName) => {
    updateApplicationStatus(appId, newStatus);
    setToastMsg(`Updated ${candidateName}'s application to "${newStatus}".`);
  };

  const handleMessage = (app) => {
    sendMessage({
      recipientId: app.workerId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      text: `Hello ${app.workerName}, following up on your application for "${app.jobTitle}".`,
    });
    navigate('/messages');
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Manage Candidate Applications</h1>
          <p className="page-header__subtitle">
            Review applicant proposals, inspect portable work credentials, and make hiring decisions.
          </p>
        </div>

        <Link to="/jobs/new">
          <Button variant="dark" size="sm">
            + Post Another Job
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
              Filter by Job:
            </span>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '220px' }}
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="all">All Postings ({employerApps.length} applicants)</option>
              {employerJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under-review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted / Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Showing <strong>{filteredApps.length}</strong> candidate submissions
        </span>
      </div>

      {/* Applications List */}
      {filteredApps.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="card"
              style={{
                border:
                  app.status === 'shortlisted'
                    ? '1px solid #fde68a'
                    : app.status === 'accepted'
                    ? '1px solid #a7f3d0'
                    : '1px solid var(--line)',
                boxShadow:
                  app.status === 'shortlisted' || app.status === 'accepted'
                    ? '0 4px 16px rgba(10, 17, 32, 0.06)'
                    : '0 1px 3px rgba(10, 17, 32, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {/* Candidate Info */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'var(--sky-strong)',
                      color: 'var(--blue-dark)',
                      fontWeight: 700,
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {app.workerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                        {app.workerName}
                      </h3>
                      <span className="id-verified-pill" style={{ fontSize: '10px' }}>
                        <ShieldCheck size={11} /> Verified Pro
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {app.workerRole} · ★ {app.workerRating || '4.9'} ({app.workerReviews || 128}{' '}
                      reviews)
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      Applied {app.appliedDateText || 'recently'} for:{' '}
                      <strong style={{ color: 'var(--navy)' }}>{app.jobTitle}</strong>
                    </p>
                  </div>
                </div>

                {/* Status & Rate */}
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge--${app.status}`} style={{ marginBottom: '6px' }}>
                    {app.status.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Expected:{' '}
                    <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                      {app.expectedRate || app.payRate}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cover Note */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  color: 'var(--ink)',
                  marginBottom: '18px',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                  CANDIDATE PITCH:
                </strong>
                "{app.coverNote}"
              </div>

              {/* Action Toolbar */}
              <div
                style={{
                  borderTop: '1px solid var(--line)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/identity/${app.workerId}`}>
                    <Button variant="light" size="sm">
                      <Award size={14} /> View Work Identity
                    </Button>
                  </Link>

                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleMessage(app)}
                  >
                    <MessageSquare size={14} /> Chat with Pro
                  </Button>
                </div>

                {/* Status Updater Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
                    Change Status:
                  </span>

                  {app.status !== 'under-review' && (
                    <button
                      type="button"
                      className="btn btn--sm btn--light"
                      onClick={() => handleStatusUpdate(app.id, 'under-review', app.workerName)}
                    >
                      Under Review
                    </button>
                  )}

                  {app.status !== 'shortlisted' && (
                    <button
                      type="button"
                      className="btn btn--sm btn--light"
                      style={{ color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                      onClick={() => handleStatusUpdate(app.id, 'shortlisted', app.workerName)}
                    >
                      <Sparkles size={12} /> Shortlist
                    </button>
                  )}

                  {app.status !== 'accepted' && (
                    <button
                      type="button"
                      className="btn btn--sm btn--dark"
                      style={{ background: 'var(--green)' }}
                      onClick={() => handleStatusUpdate(app.id, 'accepted', app.workerName)}
                    >
                      <CheckCircle2 size={13} /> Accept & Hire
                    </button>
                  )}

                  {app.status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn btn--sm btn--light"
                      style={{ color: '#ef4444' }}
                      onClick={() => handleStatusUpdate(app.id, 'rejected', app.workerName)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <FileText size={24} />
          </div>
          <h3 className="empty-state__title">No applications matching criteria</h3>
          <p className="empty-state__desc">
            No candidate submissions were found for the selected job or status filter.
          </p>
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              setSelectedJobId('all');
              setSelectedStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
