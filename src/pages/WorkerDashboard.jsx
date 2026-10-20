import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  MessageSquare,
  Award,
  ChevronRight,
  Bookmark,
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function WorkerDashboard() {
  const {
    currentUser,
    jobs,
    applications,
    savedJobIds,
    toggleSaveJob,
    workHistory,
    conversations,
  } = useApp();

  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  // Dynamic calculations from records
  const myApplications = useMemo(
    () => applications.filter((a) => a.workerId === currentUser?.id && a.status !== 'withdrawn'),
    [applications, currentUser]
  );
  const activeApplications = myApplications.filter(
    (a) => a.status !== 'rejected' && a.status !== 'withdrawn'
  );
  const shortlistedCount = myApplications.filter((a) => a.status === 'shortlisted').length;
  const acceptedCount = myApplications.filter((a) => a.status === 'accepted').length;

  const myHistory = workHistory.filter((h) => h.workerId === currentUser?.id);
  const completedJobsCount = myHistory.filter((h) => h.status === 'completed').length;

  // Recommended jobs based on matching skills or category
  const workerCategory = currentUser?.title?.toLowerCase().includes('plumb')
    ? 'Plumbing'
    : currentUser?.title?.toLowerCase().includes('electr')
    ? 'Electrical'
    : currentUser?.title?.toLowerCase().includes('carp')
    ? 'Carpentry'
    : 'All';

  const recommendedJobs = jobs
    .filter(
      (j) =>
        j.status === 'active' &&
        (workerCategory === 'All' ||
          (j.category || '').toLowerCase() === workerCategory.toLowerCase() ||
          (j.skills || []).some((s) => currentUser?.skills?.includes(s)))
    )
    .slice(0, 3);

  // Recent messages
  const recentConversations = conversations
    .filter(
      (c) => c.participant1Id === currentUser?.id || c.participant2Id === currentUser?.id
    )
    .slice(0, 2);

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Welcome Banner */}
      <div
        className="card hero-banner-card"
        style={{
          padding: '32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                background: 'rgba(26, 111, 224, 0.35)',
                color: '#93c5fd',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <CheckCircle2 size={13} color="#60a5fa" /> Digital Work Identity Verified
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Austin, TX · Member since {currentUser?.memberSince}
            </span>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Welcome back, {currentUser?.name}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
            Your Digital Work Identity is active with a <strong>{currentUser?.rating} ★</strong> rating from{' '}
            <strong>{currentUser?.reviewsCount} verified clients</strong>. You have{' '}
            <strong>{shortlistedCount} shortlisted</strong> and <strong>{acceptedCount} accepted</strong>{' '}
            applications requiring your review.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="blue"
              size="md"
              onClick={() => navigate('/jobs')}
            >
              <Search size={15} /> Discover Matching Jobs
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/identity')}
            >
              <Award size={15} /> View Full Work Identity
            </Button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            bottom: '-40px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,111,224,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Dynamic Statistics Grid */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'var(--sky)', color: 'var(--blue)' }}>
            <FileText size={22} />
          </div>
          <div className="stat-card__content">
            <small>Active Applications</small>
            <strong>{activeApplications.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Sparkles size={22} />
          </div>
          <div className="stat-card__content">
            <small>Shortlisted by Employers</small>
            <strong style={{ color: '#b45309' }}>{shortlistedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#ecfdf5', color: 'var(--green)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card__content">
            <small>Accepted / Hired</small>
            <strong style={{ color: 'var(--green)' }}>{acceptedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: '#f8fafc', color: 'var(--navy)' }}>
            <Star size={22} fill="#f5a524" color="#f5a524" />
          </div>
          <div className="stat-card__content">
            <small>Work Identity Rating</small>
            <strong>
              {currentUser?.rating} <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}>/ 5.0</span>
            </strong>
          </div>
        </div>
      </div>

      {/* 2-Column Main Layout: Recommended Jobs & Profile Readiness */}
      <div className="layout-split">
        {/* Left Column: Recommended Jobs */}
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
                Recommended Jobs For You
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Matched based on your specialty: <strong>{currentUser?.title}</strong>
              </p>
            </div>
            <Link
              to="/jobs"
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
              Browse all {jobs.length} jobs <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recommendedJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);
              const hasApplied = applications.some(
                (a) => a.jobId === job.id && a.workerId === currentUser?.id
              );

              return (
                <div key={job.id} className="card card--hoverable">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge--blue">{job.category}</span>
                        {job.urgent && (
                          <span className="badge badge--gold">Urgent Hire</span>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Posted {job.postedDate}
                        </span>
                      </div>
                      <Link
                        to={`/jobs/${job.id}`}
                        style={{
                          fontSize: '17px',
                          fontWeight: 700,
                          color: 'var(--navy)',
                          textDecoration: 'none',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        {job.title}
                      </Link>
                      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                        {job.companyName} · <MapPin size={11} style={{ display: 'inline' }} /> {job.location}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => {
                        toggleSaveJob(job.id);
                        setToastMsg(isSaved ? 'Removed from saved jobs' : 'Job saved to your bookmarks!');
                      }}
                      title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                    >
                      <Bookmark
                        size={16}
                        fill={isSaved ? 'var(--blue)' : 'none'}
                        color={isSaved ? 'var(--blue)' : 'var(--muted)'}
                      />
                    </button>
                  </div>

                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--ink)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {job.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--line)',
                      paddingTop: '14px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Compensation: </span>
                      <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                        {job.payRate}
                      </strong>{' '}
                      <small style={{ color: 'var(--muted)' }}>({job.payType})</small>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {hasApplied ? (
                        <span className="badge badge--green">
                          <CheckCircle2 size={12} /> Applied
                        </span>
                      ) : (
                        <Link to={`/jobs/${job.id}`}>
                          <Button variant="dark" size="sm">
                            View & Apply <ChevronRight size={13} />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Work Identity Preview & Profile Completion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Completion Meter */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Profile Strength: {currentUser?.profileCompletion ?? 0}%
            </h3>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--line)',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: `${currentUser?.profileCompletion ?? 0}%`,
                  height: '100%',
                  background: 'var(--blue)',
                  borderRadius: '999px',
                }}
              />
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)' }}>
                <CheckCircle2 size={15} /> Government ID Verified
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)' }}>
                <CheckCircle2 size={15} /> Master Trade License Uploaded
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)' }}>
                <CheckCircle2 size={15} /> 8 Core Skills Documented
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
                <Clock size={15} /> Add insurance liability certificate (+8%)
              </li>
            </ul>

            <Link
              to="/settings"
              style={{
                display: 'block',
                marginTop: '16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--blue)',
                textDecoration: 'none',
              }}
            >
              Update Profile Details →
            </Link>
          </div>

          {/* Digital Work Identity Preview Card */}
          <div
            className="card"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 24px rgba(26, 111, 224, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="id-verified-pill">
                <CheckCircle2 size={11} /> Digital Identity
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                PORTABLE RECORD
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'var(--sky-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: 'var(--blue-dark)',
                }}
              >
                {currentUser?.name
                  ?.split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'WN'}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                  {currentUser?.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{currentUser?.title}</p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.65)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Rating</span>
                <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{currentUser?.rating} ★</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Reviews</span>
                <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{currentUser?.reviewsCount}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Completed</span>
                <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{completedJobsCount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {currentUser?.skills?.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: '11px',
                    background: '#f1f5f9',
                    color: 'var(--ink)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>

            <Button
              variant="light"
              size="sm"
              style={{ width: '100%' }}
              onClick={() => navigate('/identity')}
            >
              <Award size={14} /> Open Full Work Identity & Share
            </Button>
          </div>

          {/* Recent Messages Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
                Recent Messages
              </h3>
              <Link to="/messages" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>
                View all
              </Link>
            </div>

            {recentConversations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentConversations.map((conv) => {
                  const partnerName =
                    conv.participant1Id === currentUser?.id
                      ? conv.participant2Name
                      : conv.participant1Name;
                  return (
                    <Link
                      key={conv.id}
                      to="/messages"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.65)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--sky)',
                          color: 'var(--blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {partnerName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>
                            {partnerName}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conv.lastMessage}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No recent messages.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
