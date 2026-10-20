import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
  Wrench,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function DigitalIdentityPage() {
  const { id } = useParams();
  const { currentUser, users, workHistory, reviews } = useApp();

  const worker = id ? users.find((u) => u.id === id) : currentUser;

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const workerHistory = workHistory.filter((h) => h.workerId === worker?.id);
  const completedJobs = workerHistory.filter((h) => h.status === 'completed');
  const workerReviews = reviews.filter((r) => r.workerId === worker?.id);

  const isWorkerProfile = worker?.role !== 'employer';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setToastMsg('Public profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!worker) {
    return (
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <ShieldCheck size={32} color="var(--muted)" style={{ marginBottom: '12px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            Identity not found
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            We could not find a digital work identity for this profile.
          </p>
          <Link to="/workers">
            <Button variant="dark" size="md">
              Browse Workers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Identity Top Banner */}
      <div
        className="card hero-banner-card"
        style={{
          padding: '36px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #c9d8e6 0%, #8fa6bd 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 700,
                color: '#1f3a5a',
                border: '3px solid rgba(255,255,255,0.4)',
              }}
            >
              {worker?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    background: 'rgba(26, 111, 224, 0.4)',
                    color: '#93c5fa',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={13} color="#60a5fa" /> Digital Work Identity
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#6ee7b7',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  ● {worker?.availability || 'Available Now'}
                </span>
              </div>

              <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {worker?.name}
              </h1>
              <p style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '8px' }}>
                {worker?.title}
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {worker?.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> Member since {worker?.memberSince}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> Avg response: {worker?.responseTime}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 size={15} /> Share Identity
            </Button>
            <Button
              variant="blue"
              size="md"
              onClick={() => {
                window.print();
              }}
            >
              <Download size={15} /> Export Credential
            </Button>
          </div>
        </div>

        {/* Aggregate Credential Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginTop: '32px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Client Rating</span>
            <strong style={{ fontSize: '22px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={18} fill="#f5a524" color="#f5a524" /> {worker?.rating ?? 'New'}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Verified Reviews</span>
            <strong style={{ fontSize: '22px', color: '#ffffff' }}>
              {worker?.reviewsCount ?? workerReviews.length}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Completed Jobs</span>
            <strong style={{ fontSize: '22px', color: '#ffffff' }}>
              {worker?.jobsCompleted ?? completedJobs.length}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Hourly Standard</span>
            <strong style={{ fontSize: '22px', color: '#ffffff' }}>
              {worker?.hourlyRate || 'Not set'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Verified Skills & Completed Jobs / Reviews */}
      <div className="layout-split--identity">
        {/* Left Column: Trust Badges & Verified Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Trust Badges */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
              Verified Trust Credentials
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <CheckCircle2 size={18} color="var(--blue)" />
                <div>
                  <strong>Government ID Verified</strong>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                    Identity confirmed via State of Texas registry
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <CheckCircle2 size={18} color="var(--blue)" />
                <div>
                  <strong>Master Trade License</strong>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                    Licensed & code compliant since 2018
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <CheckCircle2 size={18} color="var(--green)" />
                <div>
                  <strong>100% On-Time Completion</strong>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                    Verified on WorkNest smart job tracker
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Skills Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
              Skills & Proficiencies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {worker?.skills?.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0f172a',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} color="var(--green)" /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portable Credential Explainer */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="var(--green)" />
              <strong style={{ fontSize: '14px', color: '#166534' }}>
                Permanent Portable Identity
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: '#15803d', lineHeight: 1.5 }}>
              Every completed job and client review adds directly to this record. It belongs to
              you permanently and can be shared with any client, contractor, or financial
              institution.
            </p>
          </div>
        </div>

        {/* Right Column: Completed Jobs Record & Client Reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Completed Jobs Showcase */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                  Verified Completed Jobs
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Proof of past projects with employer verified completion
                </p>
              </div>
              <Link
                to="/history"
                style={
                  isWorkerProfile
                    ? { fontSize: '13px', color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }
                    : { display: 'none' }
                }
              >
                View Full Timeline →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    borderRadius: '12px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.65)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                        {job.title}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {job.employerName} · Completed {job.completionDate}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                        {job.price}
                      </strong>
                      <span className="badge badge--green">Paid</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#b45309',
                        }}
                      >
                        <Star size={13} fill="#f5a524" color="#f5a524" /> {job.rating}
                      </span>
                    </div>
                  </div>

                  {job.reviewText && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: 'var(--ink)',
                        fontStyle: 'italic',
                        marginTop: '8px',
                      }}
                    >
                      "{job.reviewText}"
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    {job.skillsDemonstrated?.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: '11px',
                          background: '#f1f5f9',
                          color: 'var(--muted)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>
              Client Reviews & Feedback ({workerReviews.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {workerReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>
                        {rev.employerName}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '8px' }}>
                        {rev.date}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(rev.rating) ? '#f5a524' : '#e2e8f0'}
                          color={i < Math.floor(rev.rating) ? '#f5a524' : '#e2e8f0'}
                        />
                      ))}
                      <strong style={{ fontSize: '13px', color: 'var(--navy)', marginLeft: '6px' }}>
                        {rev.rating}
                      </strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Profile Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Digital Work Identity"
        maxWidth={500}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 16px',
              background: '#f8fafc',
              border: '2px dashed var(--line)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode size={72} color="var(--navy)" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
            {worker?.name}'s Public Credential
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            Anyone with this link can view this verified work history and client ratings.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f1f5f9',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <input
              type="text"
              readOnly
              value={window.location.href}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              className="btn btn--sm btn--dark"
              onClick={handleCopyLink}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <Button
            variant="light"
            size="md"
            style={{ width: '100%' }}
            onClick={() => setIsShareModalOpen(false)}
          >
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
