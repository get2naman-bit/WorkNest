import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  MessageSquare,
  Send,
  Filter,
  X,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';

const PROFESSIONS = ['All', 'Plumber', 'Electrician', 'Carpenter', 'Painter', 'HVAC'];
const AVAILABILITY_OPTIONS = ['All', 'Available Now', 'Available Tomorrow'];

export default function FindWorkersPage() {
  const { users, currentUser, sendMessage, jobs } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [minRating, setMinRating] = useState('All');

  const [inviteModalWorker, setInviteModalWorker] = useState(null);
  const [selectedJobToInvite, setSelectedJobToInvite] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Workers only
  const workers = useMemo(() => {
    return users.filter((u) => u.role === 'worker');
  }, [users]);

  // Employer's active jobs to invite to
  const activeEmployerJobs = useMemo(() => {
    if (!currentUser) return [];
    return jobs.filter((j) => j.employerId === currentUser.id && j.status === 'active');
  }, [jobs, currentUser]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchProfession =
        selectedProfession === 'All' ||
        w.title?.toLowerCase().includes(selectedProfession.toLowerCase());

      const matchAvailability =
        selectedAvailability === 'All' ||
        w.availability?.toLowerCase().includes(selectedAvailability.toLowerCase());

      const matchRating =
        minRating === 'All' ||
        (minRating === '4.8' && w.rating >= 4.8) ||
        (minRating === '4.5' && w.rating >= 4.5);

      return matchSearch && matchProfession && matchAvailability && matchRating;
    });
  }, [workers, searchQuery, selectedProfession, selectedAvailability, minRating]);

  const handleMessageWorker = (worker) => {
    if (!currentUser) {
      navigate('/auth?mode=login');
      return;
    }
    sendMessage({
      recipientId: worker.id,
      jobTitle: 'Direct Project Inquiry',
      text: `Hello ${worker.name}, we would like to discuss an upcoming project opportunity with you.`,
    });
    navigate('/messages');
  };

  const handleOpenInviteModal = (worker) => {
    if (!currentUser) {
      navigate('/auth?mode=login');
      return;
    }
    setInviteModalWorker(worker);
    setSelectedJobToInvite(activeEmployerJobs[0]?.id || '');
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteModalWorker) return;

    const targetJob = jobs.find((j) => j.id === selectedJobToInvite);
    if (!targetJob) {
      setToastMsg('Publish an active job first so you can invite workers to it.');
      return;
    }

    sendMessage({
      recipientId: inviteModalWorker.id,
      jobId: targetJob.id,
      jobTitle: targetJob.title,
      text: `Hello ${inviteModalWorker.name}, we'd like to formally invite you to apply for our job "${targetJob.title}". ${inviteMessage}`,
    });

    setInviteModalWorker(null);
    setInviteMessage('');
    setToastMsg(`Invitation sent to ${inviteModalWorker.name}!`);
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Find Verified Workers</h1>
          <p className="page-header__subtitle">
            Discover and hire verified independent trade craftspeople with trusted Digital Work Identities.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px' }}
              placeholder="Search by worker name, specialty, skills (e.g. Electrician, PEX, Soldering)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
              value={selectedProfession}
              onChange={(e) => setSelectedProfession(e.target.value)}
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  Trade: {p}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            >
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  Availability: {a}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="All">All Ratings</option>
              <option value="4.8">4.8+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
        </div>

        {/* Quick Trade Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {PROFESSIONS.map((prof) => (
            <button
              key={prof}
              type="button"
              style={{
                background: selectedProfession === prof ? 'var(--blue)' : '#f1f5f9',
                color: selectedProfession === prof ? '#ffffff' : 'var(--ink)',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setSelectedProfession(prof)}
            >
              {prof}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--muted)' }}>
        Showing <strong>{filteredWorkers.length}</strong> verified trade professionals
      </div>

      {filteredWorkers.length > 0 ? (
        <div className="grid-2">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="card card--hoverable"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'var(--sky-strong)',
                        color: 'var(--blue-dark)',
                        fontWeight: 700,
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {worker.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                          {worker.name}
                        </h3>
                        <ShieldCheck size={16} color="var(--blue)" />
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{worker.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={11} /> {worker.location}
                      </p>
                    </div>
                  </div>

                  <span className="badge badge--green" style={{ fontSize: '11px' }}>
                    ● {worker.availability || 'Available Now'}
                  </span>
                </div>

                {/* Rating & Stats Metric Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.65)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                      Rating
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>
                      ★ {worker.rating}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                      Jobs Completed
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>
                      {worker.jobsCompleted ?? 0}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                      Hourly Rate
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>
                      {worker.hourlyRate || '—'}
                    </strong>
                  </div>
                </div>

                {/* Bio */}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {worker.bio}
                </p>

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {worker.skills?.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '11px',
                        background: 'var(--sky)',
                        color: 'var(--blue-dark)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  borderTop: '1px solid var(--line)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <Link to={`/identity/${worker.id}`}>
                  <Button variant="light" size="sm">
                    <Award size={13} /> Work Identity
                  </Button>
                </Link>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleMessageWorker(worker)}
                  >
                    <MessageSquare size={13} /> Message
                  </Button>
                  {currentUser?.role === 'employer' && (
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => handleOpenInviteModal(worker)}
                    >
                      <Send size={13} /> Invite to Job
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Search size={24} />
          </div>
          <h3 className="empty-state__title">No workers found</h3>
          <p className="empty-state__desc">
            Try adjusting your search keywords or resetting profession and rating filters.
          </p>
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedProfession('All');
              setSelectedAvailability('All');
              setMinRating('All');
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={Boolean(inviteModalWorker)}
        onClose={() => setInviteModalWorker(null)}
        title={`Invite ${inviteModalWorker?.name} to Apply`}
        maxWidth={540}
      >
        <form onSubmit={handleSendInvite}>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--muted)' }}>
            Send a direct invitation to <strong>{inviteModalWorker?.name}</strong> ({inviteModalWorker?.title}) for one of your open job postings.
          </div>

          <div className="form-group">
            <label className="form-label">
              Select Job Posting <span className="required">*</span>
            </label>
            {activeEmployerJobs.length > 0 ? (
              <select
                className="form-select"
                value={selectedJobToInvite}
                onChange={(e) => setSelectedJobToInvite(e.target.value)}
              >
                {activeEmployerJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.payRate})
                  </option>
                ))}
              </select>
            ) : (
              <div className="invite-empty-note">
                You have no active job postings. <Link to="/jobs/new">Post a job</Link> first, then
                invite workers to apply.
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Personal Note (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="We reviewed your Digital Work Identity and believe your expertise is a great match for this upcoming project..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid var(--line)',
              paddingTop: '16px',
            }}
          >
            <Button
              type="button"
              variant="light"
              size="md"
              onClick={() => setInviteModalWorker(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="dark"
              size="md"
              disabled={activeEmployerJobs.length === 0}
            >
              Send Invitation <Send size={14} />
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
