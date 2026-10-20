import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Briefcase,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Share2,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    jobs,
    currentUser,
    savedJobIds,
    toggleSaveJob,
    applyToJob,
    applications,
    sendMessage,
  } = useApp();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [expectedRate, setExpectedRate] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [applyError, setApplyError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--navy)', marginBottom: '12px' }}>
          Job Not Found
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
          The job listing you are looking for may have been removed or expired.
        </p>
        <Link to="/jobs">
          <Button variant="dark">Back to Jobs Discovery</Button>
        </Link>
      </div>
    );
  }

  const isSaved = savedJobIds.includes(job.id);
  const isClosed = job.status === 'closed';

  // Check if current user has already applied
  const existingApp = applications.find(
    (a) => a.jobId === job.id && a.workerId === currentUser?.id && a.status !== 'withdrawn'
  );

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');

    if (!coverNote.trim()) {
      setApplyError('Please write a brief note introducing your relevant experience.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await applyToJob({
        jobId: job.id,
        coverNote,
        expectedRate: expectedRate || job.payRate,
        phone: phone || currentUser?.phone,
      });

      if (res.success) {
        setIsApplyModalOpen(false);
        setToastMsg('Application submitted successfully! Track it in My Applications.');
      } else {
        setApplyError(res.error || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageEmployer = () => {
    if (!currentUser) {
      navigate('/auth?mode=login');
      return;
    }
    // Start or open conversation
    sendMessage({
      recipientId: job.employerId,
      jobId: job.id,
      jobTitle: job.title,
      text: `Hello, I'm reaching out regarding your job posting: "${job.title}".`,
    });
    navigate('/messages');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMsg('Job listing link copied to clipboard!');
    }
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Breadcrumb Navigation */}
      <div className="page-header__breadcrumb">
        <Link to="/jobs">Find Jobs</Link>
        <ChevronRight size={14} />
        <span>{job.category}</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{job.title}</span>
      </div>

      <div className="layout-split--wide" style={{ marginTop: '16px' }}>
        {/* Left Column: Job Details */}
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge--blue">{job.category}</span>
                  {job.urgent && <span className="badge badge--gold">Urgent Opening</span>}
                  {isClosed && <span className="badge badge--closed">Job Closed</span>}
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Posted {job.postedDate}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    lineHeight: 1.25,
                    marginBottom: '8px',
                  }}
                >
                  {job.title}
                </h1>

                <p style={{ fontSize: '15px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} /> <strong>{job.companyName}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    toggleSaveJob(job.id);
                    setToastMsg(isSaved ? 'Removed from saved jobs' : 'Job bookmarked!');
                  }}
                  title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                >
                  <Bookmark
                    size={16}
                    fill={isSaved ? 'var(--blue)' : 'none'}
                    color={isSaved ? 'var(--blue)' : 'var(--muted)'}
                  />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={handleShare}
                  title="Share job"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '28px',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                  Compensation
                </span>
                <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{job.payRate}</strong>{' '}
                <small style={{ color: 'var(--muted)' }}>({job.payType})</small>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                  Location
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{job.location}</strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                  Project Duration
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{job.duration}</strong>
              </div>
            </div>

            {/* Job Description */}
            <div style={{ marginBottom: '32px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: '12px',
                }}
              >
                Project Description & Scope
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.7 }}>
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            <div style={{ marginBottom: '32px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: '12px',
                }}
              >
                Candidate Requirements
              </h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {job.requirements?.map((req, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '14px',
                      color: 'var(--ink)',
                    }}
                  >
                    <CheckCircle2
                      size={16}
                      color="var(--blue)"
                      style={{ flexShrink: 0, marginTop: '3px' }}
                    />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skills & Tools */}
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: '12px',
                }}
              >
                Primary Skills & Trades Needed
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.skills?.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: 'var(--sky)',
                      color: 'var(--blue-dark)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Application Card & Employer Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Box */}
          <div
            className="card"
            style={{
              border: '1px solid var(--sky-strong)',
              boxShadow: '0 8px 24px rgba(26, 111, 224, 0.08)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Ready to work on this job?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Your verified Digital Work Identity will be presented to the employer upon submission.
            </p>

            {isClosed ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                This job posting has been filled or closed.
              </div>
            ) : existingApp ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> Application Submitted ({existingApp.status})
                </div>
                <Link to="/applications">
                  <Button variant="light" size="sm" style={{ width: '100%' }}>
                    Track in My Applications →
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button
                  variant="blue"
                  size="lg"
                  style={{ width: '100%' }}
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/auth?mode=login');
                    } else {
                      setIsApplyModalOpen(true);
                    }
                  }}
                >
                  Apply Now <Send size={15} />
                </Button>

                <Button
                  variant="light"
                  size="md"
                  style={{ width: '100%' }}
                  onClick={handleMessageEmployer}
                >
                  <MessageSquare size={15} /> Ask Employer a Question
                </Button>
              </div>
            )}
          </div>

          {/* Employer Info Card */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
              About the Employer
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: 'var(--navy)',
                }}
              >
                {job.companyName[0]}
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>
                  {job.companyName}
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={13} /> Verified Employer
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Austin-based contractor specializing in high-quality builds and ongoing trade
              collaborations.
            </p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
              <li>• Location: {job.location}</li>
              <li>• Actively reviewing applications</li>
              <li>• Prompt payout upon verified project signoff</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Application Submission Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply to ${job.title}`}
        maxWidth={580}
      >
        <form onSubmit={handleApplySubmit}>
          {applyError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {applyError}
            </div>
          )}

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '13px',
            }}
          >
            <strong>Submitting as:</strong> {currentUser?.name} ({currentUser?.title}) ·{' '}
            <span style={{ color: 'var(--blue)' }}>{currentUser?.rating} ★ Rating</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Cover Note & Experience Pitch <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Explain why you are the best fit, highlight similar past jobs, and confirm your availability..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Expected Rate</label>
              <input
                type="text"
                className="form-input"
                placeholder={job.payRate}
                value={expectedRate}
                onChange={(e) => setExpectedRate(e.target.value)}
              />
              <span className="form-hint">Default is the posted rate: {job.payRate}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (512) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
            }}
          >
            <Button
              type="button"
              variant="light"
              size="md"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="dark" size="md" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Application'} {!submitting && <Send size={14} />}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
