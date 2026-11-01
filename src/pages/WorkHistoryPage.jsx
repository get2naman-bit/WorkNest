import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Star,
  Award,
  Calendar,
  Building2,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function WorkHistoryPage() {
  const { workHistory, currentUser, submitReview } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // all | ongoing | completed
  const [reviewModalJob, setReviewModalJob] = useState(null);
  const [rating, setRating] = useState('5.0');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Workers see their own record; employers see the records of work they commissioned.
  const isEmployer = currentUser?.role === 'employer';
  const myHistory = workHistory.filter((h) =>
    currentUser
      ? isEmployer
        ? h.employerId === currentUser.id
        : h.workerId === currentUser.id
      : false
  );

  const filteredHistory = myHistory.filter((h) => {
    if (activeTab === 'all') return true;
    return h.status === activeTab;
  });

  const ongoingCount = myHistory.filter((h) => h.status === 'ongoing').length;
  const completedCount = myHistory.filter((h) => h.status === 'completed').length;

  const handleOpenReview = (historyItem) => {
    setReviewModalJob(historyItem);
    setRating('5.0');
    setComment('');
    setError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please enter a brief review comment.');
      return;
    }
    setError('');

    await submitReview({
      historyId: reviewModalJob.id,
      workerId: reviewModalJob.workerId,
      rating: parseFloat(rating),
      comment: comment.trim(),
    });

    setReviewModalJob(null);
    setToastMsg('Review submitted and added to Digital Work Identity!');
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Work History & Past Projects</h1>
          <p className="page-header__subtitle">
            A permanent chronological record of every contract, verified payout, and client rating.
          </p>
        </div>

        <div className="page-header__actions">
          <Link to="/identity">
            <Button variant="dark" size="sm">
              <Award size={14} /> View Digital Work Identity
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }} role="tablist">
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'all' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('all')}
        >
          All Projects ({myHistory.length})
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'ongoing' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing ({ongoingCount})
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'completed' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredHistory.map((item) => (
          <div key={item.id} className="card card--hoverable">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    className={`badge ${
                      item.status === 'completed' ? 'badge--green' : 'badge--gold'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <>
                        <CheckCircle2 size={12} /> COMPLETED
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> IN PROGRESS
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {item.completionDate}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>
                  Employer: <strong>{item.employerName}</strong>
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>
                  Agreed Payout
                </span>
                <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>{item.price}</strong>
              </div>
            </div>

            {/* Review feedback if completed */}
            {item.rating ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#b45309',
                    marginBottom: '4px',
                  }}
                >
                  <Star size={14} fill="#f5a524" color="#f5a524" /> {item.rating} Star Client
                  Rating
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic' }}>
                  "{item.reviewText}"
                </p>
              </div>
            ) : item.status === 'ongoing' ? (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#92400e',
                  marginBottom: '14px',
                }}
              >
                Project is underway. Sign off upon completion to record reviews and add to your
                Digital Identity.
              </div>
            ) : null}

            {/* Skills Demonstrated */}
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
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {item.skillsDemonstrated?.map((skill) => (
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

              <div style={{ display: 'flex', gap: '8px' }}>
                {isEmployer && item.canReview && (
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => handleOpenReview(item)}
                  >
                    <Star size={13} /> Complete & Leave Review
                  </Button>
                )}
                <Link to="/messages">
                  <Button variant="light" size="sm">
                    <MessageSquare size={13} /> Message {isEmployer ? 'Worker' : 'Employer'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Submission Modal */}
      <Modal
        isOpen={Boolean(reviewModalJob)}
        onClose={() => setReviewModalJob(null)}
        title={`Signoff & Review: ${reviewModalJob?.title}`}
        maxWidth={520}
      >
        <form onSubmit={handleReviewSubmit}>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
            Mark project completed with <strong>{reviewModalJob?.employerName}</strong> and log client feedback into your permanent Digital Work Identity.
          </div>

          {error && (
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
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Rating (1 to 5 Stars) <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="5.0">★★★★★ 5.0 - Exceptional Work & Punctuality</option>
              <option value="4.8">★★★★☆ 4.8 - Very Good</option>
              <option value="4.5">★★★★☆ 4.5 - Good</option>
              <option value="4.0">★★★★☆ 4.0 - Satisfactory</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Review Comments & Feedback <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Detail the project outcome, quality of craftsmanship, and working experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
              onClick={() => setReviewModalJob(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="dark" size="md">
              Publish Review & Complete Job
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
