import { useEffect, useState } from 'react';
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
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { mapProfile } from '../lib/mappers.js';
import './DigitalIdentityPage.css';

export default function DigitalIdentityPage() {
  const { id } = useParams();
  const { currentUser, users, workHistory, reviews } = useApp();

  const baseWorker = id ? users.find((u) => u.id === id) : currentUser;
  const [liveProfile, setLiveProfile] = useState(null);
  const worker = liveProfile?.id === baseWorker?.id
    ? { ...baseWorker, ...liveProfile }
    : baseWorker;

  useEffect(() => {
    setLiveProfile(null);
    if (!isSupabaseConfigured || !baseWorker?.id || !/^[0-9a-f-]{36}$/i.test(baseWorker.id)) return undefined;
    const profileId = baseWorker.id;
    const channel = supabase.channel(`digital-identity:${profileId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}`,
      }, (payload) => {
        const profile = mapProfile(payload.new);
        if (profile) setLiveProfile(profile);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [baseWorker?.id]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const workerHistory = workHistory.filter((h) => h.workerId === worker?.id);
  const completedJobs = workerHistory.filter((h) => h.status === 'completed');
  const workerReviews = reviews.filter((r) => r.workerId === worker?.id);
  const reviewCount = Math.max(workerReviews.length, Number(worker?.reviewsCount) || 0);
  const completedJobCount = completedJobs.length;
  const isOwnProfile = currentUser?.id === worker?.id;
  const profileUrl = `${window.location.origin}/identity/${worker?.id || ''}`;

  const isWorkerProfile = worker?.role !== 'employer';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = profileUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copiedToClipboard = document.execCommand('copy');
        input.remove();
        if (!copiedToClipboard) throw new Error('Clipboard access is unavailable.');
      }
      setCopied(true);
      setToastMsg('Public profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setToastMsg('Could not copy the link. Select and copy it from the field below.');
    }
  };

  const handleDownloadPdf = () => {
    const previousTitle = document.title;
    const safeName = (worker.name || 'Worker').replace(/[^\p{L}\p{N} -]/gu, '').trim();
    document.title = `${safeName || 'Worker'} - WorkNest Digital Identity`;
    window.addEventListener('afterprint', () => { document.title = previousTitle; }, { once: true });
    window.print();
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

  if (worker.publicProfile === false && !isOwnProfile) {
    return (
      <div className="container" style={{ padding: '32px 24px', maxWidth: '640px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <ShieldCheck size={32} color="var(--muted)" style={{ marginBottom: '12px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            This identity is private
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            The worker has turned off public access to this Digital Identity.
          </p>
          <Link to="/workers"><Button variant="dark" size="md">Browse Workers</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container digital-identity-page" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Identity Top Banner */}
      <div
        className="card hero-banner-card digital-identity-hero"
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

          <div className="digital-identity-actions" style={{ display: 'flex', gap: '10px' }}>
            {isOwnProfile && (
              <Link to="/settings" className="btn btn--light btn--md">Edit profile</Link>
            )}
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
                handleDownloadPdf();
              }}
            >
              <Download size={15} /> Download PDF
            </Button>
          </div>
        </div>

        <p className="digital-identity-print-hint">Opens the print dialog. Choose “Save as PDF” to download a copy.</p>

        {/* Aggregate Credential Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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
          className="digital-identity-summary"
        >
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Average rating</span>
            <strong style={{ fontSize: '22px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {reviewCount > 0 ? <><Star size={18} fill="#f5a524" color="#f5a524" /> {worker?.rating?.toFixed?.(1) ?? worker?.rating}</> : 'No ratings yet'}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Client reviews</span>
            <strong style={{ fontSize: '22px', color: '#ffffff' }}>
              {reviewCount}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Completed Jobs</span>
            <strong style={{ fontSize: '22px', color: '#ffffff' }}>
              {completedJobCount}
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
      <div className="layout-split--identity digital-identity-grid">
        {/* Left Column: Trust Badges & Verified Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Work profile */}
          <div className="card digital-identity-section">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
              Work profile
            </h3>
            {worker?.bio ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.65 }}>{worker.bio}</p>
            ) : (
              <p className="digital-identity-empty">No profile summary added yet.</p>
            )}
            <div className="digital-identity-profile-facts">
              <span><strong>Completed orders</strong>{completedJobCount}</span>
              <span><strong>Client reviews</strong>{reviewCount}</span>
              {worker?.location && <span><strong>Based in</strong>{worker.location}</span>}
            </div>
            <p className="digital-identity-disclosure">
              Skills and profile details are provided by the worker. Completed orders and ratings are recorded by WorkNest.
            </p>
          </div>

          {/* Skills Breakdown */}
          <div className="card digital-identity-section">
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
              Skills & Proficiencies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {worker?.skills?.length ? worker.skills.map((skill) => (
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
              )) : <p className="digital-identity-empty">No skills listed yet.</p>}
            </div>
          </div>

          {/* Portable Credential Explainer */}
          <div
            className="card digital-identity-section"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={18} color="var(--green)" />
              <strong style={{ fontSize: '14px', color: '#166534' }}>
                Shareable work profile
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: '#15803d', lineHeight: 1.5 }}>
              Share this profile with a prospective employer to show your skills, completed orders, and client feedback.
            </p>
          </div>
        </div>

          {/* Right Column: Completed Orders & Client Reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Completed Jobs Showcase */}
          <div className="card digital-identity-section">
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
                  Completed orders
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Orders marked complete by an employer
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
              {completedJobs.length ? completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="digital-identity-order"
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
                      {job.verifiedByEmployer && <span className="badge badge--green">Employer confirmed</span>}
                      {job.rating != null && <span
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
                      </span>}
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
              )) : <p className="digital-identity-empty">No completed orders have been recorded yet.</p>}
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="card digital-identity-section">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '16px' }}>
              Client Reviews & Feedback ({workerReviews.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {workerReviews.length ? workerReviews.map((rev) => (
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
              )) : <p className="digital-identity-empty">Client reviews will appear here after an order is completed and rated.</p>}
            </div>
          </div>
        </div>
      </div>

      <p className="digital-identity-print-link">WorkNest profile: {profileUrl}</p>

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
            <ShieldCheck size={64} color="var(--blue)" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
            {worker?.name}'s Work Profile Link
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            Anyone with this link can view the profile, completed orders, and client reviews shown here.
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
              value={profileUrl}
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
