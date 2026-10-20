import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Masonry'];
const PAY_TYPES = ['All', 'Fixed', 'Hourly'];

export default function FindJobsPage() {
  const { jobs, savedJobIds, toggleSaveJob, applications, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPayType, setSelectedPayType] = useState('All');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Filter logic
  const filteredJobs = useMemo(() => {
    const myAppJobIds = applications
      .filter((a) => a.workerId === currentUser?.id && a.status !== 'withdrawn')
      .map((a) => a.jobId);

    return jobs.filter((job) => {
      // Only show open listings, plus any the worker has already applied to.
      const isOpen = job.status !== 'closed' && job.status !== 'filled';
      if (!isOpen && !myAppJobIds.includes(job.id)) return false;

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        (job.title || '').toLowerCase().includes(query) ||
        (job.companyName || '').toLowerCase().includes(query) ||
        (job.location || '').toLowerCase().includes(query) ||
        (job.description || '').toLowerCase().includes(query) ||
        (job.skills || []).some((s) => s.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'All' ||
        (job.category || '').toLowerCase() === selectedCategory.toLowerCase();

      const matchesPayType =
        selectedPayType === 'All' ||
        (job.payType || '').toLowerCase() === selectedPayType.toLowerCase();

      const matchesUrgent = !urgentOnly || job.urgent;

      const matchesSaved = !viewSavedOnly || savedJobIds.includes(job.id);

      return matchesSearch && matchesCategory && matchesPayType && matchesUrgent && matchesSaved;
    });
  }, [
    jobs,
    applications,
    currentUser,
    searchQuery,
    selectedCategory,
    selectedPayType,
    urgentOnly,
    viewSavedOnly,
    savedJobIds,
  ]);

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPayType !== 'All' ? 1 : 0) +
    (urgentOnly ? 1 : 0) +
    (viewSavedOnly ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPayType('All');
    setUrgentOnly(false);
    setViewSavedOnly(false);
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Find Work Opportunities</h1>
          <p className="page-header__subtitle">
            Browse verified jobs from reputable employers across Austin and Central Texas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={`btn btn--sm ${viewSavedOnly ? 'btn--blue' : 'btn--light'}`}
            onClick={() => setViewSavedOnly(!viewSavedOnly)}
          >
            <Bookmark size={14} fill={viewSavedOnly ? '#fff' : 'none'} />
            Saved Jobs ({savedJobIds.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
              placeholder="Search by job title, trade, skills (e.g. Plumber, PEX, Water Heater)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '130px' }}
              value={selectedPayType}
              onChange={(e) => setSelectedPayType(e.target.value)}
            >
              {PAY_TYPES.map((p) => (
                <option key={p} value={p}>
                  Pay: {p}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`btn btn--sm ${urgentOnly ? 'btn--blue' : 'btn--light'}`}
              onClick={() => setUrgentOnly(!urgentOnly)}
            >
              <Sparkles size={13} /> Urgent Only
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="btn btn--sm btn--light"
                onClick={resetFilters}
                style={{ color: '#ef4444' }}
              >
                <X size={13} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              style={{
                background: selectedCategory === cat ? 'var(--blue)' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : 'var(--ink)',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Meta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
          Showing <strong>{filteredJobs.length}</strong> available jobs
        </span>
      </div>

      {/* Desktop 3-Column Job Cards Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid-3">
          {filteredJobs.map((job) => {
            const isSaved = savedJobIds.includes(job.id);
            const myApp = applications.find(
              (a) =>
                a.jobId === job.id &&
                a.workerId === currentUser?.id &&
                a.status !== 'withdrawn'
            );

            return (
              <div
                key={job.id}
                className="card card--hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge--blue">{job.category || 'General'}</span>
                      {job.urgent && <span className="badge badge--gold">Urgent</span>}
                      {job.status === 'closed' && (
                        <span className="badge badge--closed">Closed</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => {
                        toggleSaveJob(job.id);
                        setToastMsg(
                          isSaved ? 'Removed from saved jobs' : 'Job added to saved bookmarks!'
                        );
                      }}
                      title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                    >
                      <Bookmark
                        size={14}
                        fill={isSaved ? 'var(--blue)' : 'none'}
                        color={isSaved ? 'var(--blue)' : 'var(--muted)'}
                      />
                    </button>
                  </div>

                  <Link
                    to={`/jobs/${job.id}`}
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      lineHeight: 1.35,
                      marginBottom: '8px',
                      display: 'block',
                    }}
                  >
                    {job.title}
                  </Link>

                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    <strong>{job.companyName || 'Independent Employer'}</strong>
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {job.location || 'Location flexible'}
                    </span>
                    {job.duration && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {job.duration}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {job.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '16px',
                    }}
                  >
                    {job.skills?.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: '11px',
                          background: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                          color: '#334155',
                          fontWeight: 500,
                          padding: '3px 9px',
                          borderRadius: '6px',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                      Compensation
                    </span>
                    <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                      {job.payRate || 'Rate on request'}
                    </strong>{' '}
                    {job.payType && <small style={{ color: 'var(--muted)' }}>({job.payType})</small>}
                  </div>

                  {myApp ? (
                    <span className={`badge badge--${myApp.status}`}>
                      <CheckCircle2 size={11} /> {myApp.status}
                    </span>
                  ) : (
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="dark" size="sm">
                        Details <ChevronRight size={13} />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Search size={24} />
          </div>
          <h3 className="empty-state__title">No matching jobs found</h3>
          <p className="empty-state__desc">
            Try adjusting your search query, clearing filters, or checking back later as new
            jobs are posted hourly.
          </p>
          <Button variant="light" size="sm" onClick={resetFilters}>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
