import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'HVAC',
  'Masonry',
  'Roofing',
  'General Labor',
];

export default function PostJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobs, postJob, setJobStatus, currentUser } = useApp();

  const isEditing = Boolean(id);
  const existingJob = isEditing ? jobs.find((j) => j.id === id) : null;
  const isOwner = !isEditing || existingJob?.employerId === currentUser?.id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [location, setLocation] = useState('Austin, TX (On-site)');
  const [payType, setPayType] = useState('Fixed');
  const [payRate, setPayRate] = useState('$500');
  const [duration, setDuration] = useState('2 days');
  const [urgent, setUrgent] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  const [requirements, setRequirements] = useState([
    'Proven experience in the specified trade',
    'Own basic tools and protective equipment',
  ]);
  const [newReq, setNewReq] = useState('');

  const [skills, setSkills] = useState(['Plumbing', 'Pipe Repair']);
  const [newSkill, setNewSkill] = useState('');

  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || '');
      setCategory(existingJob.category || 'Plumbing');
      setLocation(existingJob.location || '');
      setPayType(existingJob.payType || 'Fixed');
      setPayRate(existingJob.payRate || '');
      setDuration(existingJob.duration || '');
      setUrgent(Boolean(existingJob.urgent));
      setDescription(existingJob.description || '');
      setStatus(existingJob.status || 'active');
      if (existingJob.requirements) setRequirements(existingJob.requirements);
      if (existingJob.skills) setSkills(existingJob.skills);
    }
  }, [existingJob]);

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setRequirements([...requirements, newReq.trim()]);
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a descriptive job title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a project description and scope of work.');
      return;
    }
    if (!payRate.trim()) {
      setError('Please specify the compensation rate.');
      return;
    }

    const jobData = {
      ...(isEditing ? { id } : {}),
      title: title.trim(),
      category,
      location: location.trim(),
      payType,
      payRate: payRate.trim(),
      duration: duration.trim(),
      urgent,
      description: description.trim(),
      requirements,
      skills,
      status,
    };

    const jobId = await postJob(jobData);
    setToastMsg(isEditing ? 'Job listing updated!' : 'Job published successfully!');
    setTimeout(() => {
      navigate(`/jobs/${jobId}`);
    }, 800);
  };

  const handleToggleClose = () => {
    if (!id) return;
    const nextStatus = status === 'active' ? 'closed' : 'active';
    setStatus(nextStatus);
    setJobStatus(id, nextStatus);
    setToastMsg(`Job status updated to ${nextStatus}.`);
  };

  if (!isOwner) {
    return (
      <div className="container" style={{ padding: '32px 24px', maxWidth: '640px' }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            Job listing not found
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            This listing does not exist or belongs to another employer account.
          </p>
          <Link to="/dashboard">
            <Button variant="dark" size="md">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 24px', maxWidth: '840px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <div className="card" style={{ padding: '36px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '20px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy)' }}>
              {isEditing ? 'Edit Job Posting' : 'Post a New Job Opportunity'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
              Publish your trade requirements to reach verified, rated independent workers.
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              className={`btn btn--sm ${status === 'active' ? 'btn--light' : 'btn--dark'}`}
              onClick={handleToggleClose}
              style={{ color: status === 'active' ? '#ef4444' : 'var(--green)' }}
            >
              {status === 'active' ? 'Close / Mark Filled' : 'Re-open Job'}
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Job Title */}
          <div className="form-group">
            <label className="form-label">
              Job Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Master Plumber for Commercial Water Heater Replacement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">
                Trade Category <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Job Location <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Downtown Austin, TX (On-site)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Pay Type, Pay Rate, Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Pay Structure</label>
              <select
                className="form-select"
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
              >
                <option value="Fixed">Fixed Budget</option>
                <option value="Hourly">Hourly Rate</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Compensation Rate <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. $950 or $55/hr"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Duration</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2 days, 1 week"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Urgent hire checkbox */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--navy)',
              }}
            >
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--blue)' }}
              />
              Mark as Urgent / Immediate Hire
            </label>
            <span className="form-hint">
              Urgent jobs appear highlighted at the top of worker searches.
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Detailed Description & Scope <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Describe the exact project details, specifications, equipment provided, on-site conditions, and timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Requirements builder */}
          <div className="form-group">
            <label className="form-label">Candidate Requirements</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Texas Master Electrician license required"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn--sm btn--light"
                onClick={handleAddRequirement}
              >
                <Plus size={15} /> Add
              </button>
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requirements.map((req, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span>• {req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills Tags Builder */}
          <div className="form-group">
            <label className="form-label">Skills & Specializations</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Copper Soldering, PEX, Flue Venting"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn--sm btn--light"
                onClick={handleAddSkill}
              >
                <Plus size={15} /> Add Skill
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: 'var(--sky)',
                    color: 'var(--blue-dark)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'none', border: 'none', color: 'var(--blue-dark)', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--line)',
              paddingTop: '24px',
              marginTop: '32px',
            }}
          >
            <Link to="/dashboard">
              <Button type="button" variant="light" size="md">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="dark" size="lg">
              {isEditing ? 'Save Changes' : 'Publish Job Listing'} <CheckCircle2 size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
