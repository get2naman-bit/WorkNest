import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Award,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function EmployerDashboard() {
  const {
    currentUser,
    jobs,
    applications,
    updateApplicationStatus,
    sendMessage,
    users,
  } = useApp();

  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  // Employer's jobs
  const myJobs = jobs.filter((j) => j.employerId === currentUser?.id);
  const activeJobs = myJobs.filter((j) => j.status === 'active');
  const closedJobs = myJobs.filter((j) => j.status === 'closed');

  // Applications submitted to employer's jobs
  const myJobIds = myJobs.map((j) => j.id);
  const receivedApplications = applications.filter((a) => myJobIds.includes(a.jobId));
  const pendingApplications = receivedApplications.filter((a) => a.status === 'pending');
  const shortlistedCandidates = receivedApplications.filter((a) => a.status === 'shortlisted');
  const hiredCount = receivedApplications.filter((a) => a.status === 'accepted').length;

  const handleStatusChange = (appId, status, workerName) => {
    updateApplicationStatus(appId, status);
    setToastMsg(`Application from ${workerName} marked as ${status}.`);
  };

  const handleMessageWorker = (app) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    sendMessage({
      recipientId: app.workerId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      text: `Hello ${app.workerName}, thank you for your application to "${app.jobTitle}". Let's discuss details.`,
    });
    navigate('/messages');
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Top Banner */}
      <div
        className="card hero-banner-card"
        style={{
          padding: '32px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'rgba(26, 111, 224, 0.3)',
                color: '#93c5fd',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Employer Workspace
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{currentUser?.companyName}</span>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {currentUser?.name || 'Sarah Jenkins'}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '15px', maxWidth: '580px' }}>
            Manage your open trade listings, review applicant credentials, and hire verified
            craftspeople with established work histories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/jobs/new">
            <Button variant="blue" size="md">
              <PlusCircle size={16} /> Post a New Job
            </Button>
          </Link>
          <Link to="/workers">
            <Button variant="light" size="md">
              <Search size={16} /> Find Verified Pros
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Statistics Grid */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--sky)', color: 'var(--blue)' }}>
            <Briefcase size={22} />
          </div>
          <div className="stat-card__content">
            <small>Active Job Listings</small>
            <strong>{activeJobs.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <FileText size={22} />
          </div>
          <div className="stat-card__content">
            <small>Total Applications</small>
            <strong>{receivedApplications.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Sparkles size={22} />
          </div>
          <div className="stat-card__content">
            <small>Shortlisted Candidates</small>
            <strong style={{ color: '#b45309' }}>{shortlistedCandidates.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#ecfdf5', color: 'var(--green)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card__content">
            <small>Workers Hired</small>
            <strong style={{ color: 'var(--green)' }}>{hiredCount}</strong>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Applicants & Active Job Listings */}
      <div className="layout-split">
        {/* Left Column: Recent Applications */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)' }}>
                Recent Applications
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Candidates applying with verified Digital Work Identities
              </p>
            </div>
            <Link
              to="/employer/applications"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
              }}
            >
              Manage all ({receivedApplications.length}) <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {receivedApplications.slice(0, 4).map((app) => (
              <div key={app.id} className="card card--hoverable">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--sky-strong)',
                        color: 'var(--blue-dark)',
                        fontWeight: 700,
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {app.workerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                        {app.workerName}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {app.workerRole} · ★ {app.workerRating || '4.9'} ({app.workerReviews || 120}{' '}
                        reviews)
                      </p>
                    </div>
                  </div>

                  <span className={`badge badge--${app.status}`}>{app.status.toUpperCase()}</span>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '14px',
                  }}
                >
                  <strong style={{ color: 'var(--navy)' }}>Applying for: </strong>
                  {app.jobTitle}
                  <div style={{ color: 'var(--muted)', marginTop: '4px' }}>
                    "{app.coverNote || 'Ready to start immediately.'}"
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--line)',
                    paddingTop: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/identity/${app.workerId}`}>
                      <Button variant="light" size="sm">
                        <Award size={13} /> View Work Identity
                      </Button>
                    </Link>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleMessageWorker(app)}
                    >
                      <MessageSquare size={13} /> Message
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {app.status !== 'shortlisted' && (
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, 'shortlisted', app.workerName)}
                        style={{ color: '#b45309' }}
                      >
                        Shortlist
                      </Button>
                    )}
                    {app.status !== 'accepted' && (
                      <Button
                        variant="dark"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, 'accepted', app.workerName)}
                      >
                        Hire Pro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Job Postings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                Your Job Postings
              </h3>
              <Link to="/jobs/new" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>
                + Post New
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '10px',
                    padding: '14px',
                    background: job.status === 'closed' ? 'rgba(241, 245, 249, 0.5)' : 'rgba(255, 255, 255, 0.65)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="badge badge--blue">{job.category}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: job.status === 'active' ? 'var(--green)' : 'var(--muted)',
                        fontWeight: 600,
                      }}
                    >
                      {job.status === 'active' ? '● Active' : 'Closed'}
                    </span>
                  </div>

                  <Link
                    to={`/jobs/${job.id}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    {job.title}
                  </Link>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--muted)',
                    }}
                  >
                    <span>{job.payRate} ({job.payType})</span>
                    <Link
                      to={`/jobs/edit/${job.id}`}
                      style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Edit Listing →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid var(--sky-strong)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Looking for a specific trade?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
              Search our directory of certified electricians, plumbers, carpenters, and painters.
            </p>
            <Link to="/workers">
              <Button variant="blue" size="md" style={{ width: '100%' }}>
                <Search size={15} /> Search Worker Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
