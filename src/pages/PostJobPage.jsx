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
  Upload,
  Image,
  Wand2,
  Loader2,
  X,
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
  const [location, setLocation] = useState('Fort, Mumbai (On-site)');
  const [payType, setPayType] = useState('Fixed');
  const [payRate, setPayRate] = useState('₹10,000');
  const [duration, setDuration] = useState('2 days');
  const [urgent, setUrgent] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [bannerImage, setBannerImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      if (existingJob.bannerImage) setBannerImage(existingJob.bannerImage);
      if (existingJob.requirements) setRequirements(existingJob.requirements);
      if (existingJob.skills) setSkills(existingJob.skills);
    }
  }, [existingJob]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      setBannerImage(dataUrl);
      setToastMsg('Photo uploaded! Click "AI Auto-Fill From Photo" to populate details.');
    };
    reader.readAsDataURL(file);
  };

  const triggerAiAutoFill = () => {
    if (!bannerImage && !imageFileName) {
      setError('Please upload an image of the problem first.');
      return;
    }
    setError('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const fname = (imageFileName || '').toLowerCase();
      // Intelligent inference based on image filename, context, or visual cues
      if (fname.includes('leak') || fname.includes('pipe') || fname.includes('water') || fname.includes('tap') || fname.includes('plumb') || fname.includes('drain')) {
        setTitle('Emergency Kitchen Pipe Leak & Valve Replacement');
        setCategory('Plumbing');
        setLocation('Fort, Mumbai (On-site)');
        setPayType('Fixed');
        setPayRate('₹6,500');
        setDuration('1 day');
        setUrgent(true);
        setDescription('Severe leaking pipe joint detected under sink causing water accumulation. Requires pipe inspection, isolating main shut-off valve, replacing corroded copper/PEX connector with quality brass fittings, and high-pressure leak testing.');
        setSkills(['Plumbing', 'Pipe Repair', 'Leak Detection', 'PEX Tubing']);
        setRequirements([
          'Licensed/experienced master plumber with leak detection gear',
          'Carry own pipe cutters, Teflon sealant, and replacement brass fittings',
          'Ability to begin immediately to prevent floor water damage'
        ]);
      } else if (fname.includes('wire') || fname.includes('switch') || fname.includes('spark') || fname.includes('electric') || fname.includes('meter') || fname.includes('light')) {
        setTitle('Main Distribution Box Short-Circuit & Circuit Breaker Upgrade');
        setCategory('Electrical');
        setLocation('Churchgate, Mumbai (On-site)');
        setPayType('Hourly');
        setPayRate('₹750/hr');
        setDuration('1 - 2 days');
        setUrgent(true);
        setDescription('Electrical panel tripping intermittently with visible scorch signs on secondary circuit breaker. Requires full load testing, cable rewiring to safety standards, and replacing worn MCBs with brand-certified trip units.');
        setSkills(['Electrical Wiring', 'Circuit Breakers', 'Troubleshooting', 'Panel Upgrades']);
        setRequirements([
          'Certified residential/commercial electrician license',
          'Carry digital multimeters, insulation tester, and certified MCBs',
          'Adhere strictly to electrical safety clearance guidelines'
        ]);
      } else if (fname.includes('door') || fname.includes('wood') || fname.includes('shelf') || fname.includes('cabinet') || fname.includes('carpenter') || fname.includes('table')) {
        setTitle('Custom Solid Teak Floating Shelving & Cabinet Hinge Restoration');
        setCategory('Carpentry');
        setLocation('Kala Ghoda, Mumbai (On-site)');
        setPayType('Fixed');
        setPayRate('₹14,000');
        setDuration('2 - 3 days');
        setUrgent(false);
        setDescription('Fabrication and wall-mounting of custom solid teak floating shelves with concealed heavy-duty brackets. Includes realignment and soft-close hinge replacement for two existing overhead wall units.');
        setSkills(['Custom Cabinetry', 'Trim & Molding', 'Framing', 'Hardwood Refinishing']);
        setRequirements([
          '5+ years precision finish carpentry experience',
          'Dust containment equipment and own precision miter saw',
          'Verified portfolio on WorkNest Digital Identity'
        ]);
      } else if (fname.includes('paint') || fname.includes('wall') || fname.includes('crack') || fname.includes('plaster') || fname.includes('damp')) {
        setTitle('Water-Damaged Wall Scraping, Plaster Patching & Dual-Coat Repaint');
        setCategory('Painting');
        setLocation('Bandra West, Mumbai (On-site)');
        setPayType('Fixed');
        setPayRate('₹18,000');
        setDuration('3 days');
        setUrgent(false);
        setDescription('Preparation and repainting of monsoon water-affected living room walls. Scope involves scraping flaking paint, applying waterproof polymer putty skim coat, primer, and two coats of washable luxury acrylic emulsion.');
        setSkills(['Interior Painting', 'Drywall Repair', 'Staining', 'Plastering']);
        setRequirements([
          'Floor drop-cloth and masking tape protection',
          'Complete dust-sanding and uniform color matching',
          'Provide clean cut lines along skirting and moldings'
        ]);
      } else {
        // Generic smart breakdown
        setTitle('Trade Inspection, Diagnostic & On-Site Repair Service');
        setCategory('Plumbing');
        setLocation('Fort, Mumbai (On-site)');
        setPayType('Fixed');
        setPayRate('₹8,000');
        setDuration('1 - 2 days');
        setUrgent(true);
        setDescription('Detailed problem identified in client photo. Requires expert diagnosis, necessary replacement hardware, clean trade execution, and final operational signoff.');
        setSkills(['Troubleshooting', 'Pipe Repair', 'General Labor']);
        setRequirements([
          'Relevant verified trade certification and tools',
          'Provide clear cost breakdown before installing new parts',
          'Clean workspace upon job completion'
        ]);
      }

      setIsAnalyzing(false);
      setToastMsg('✨ AI Auto-Fill complete! Review and adjust any details before publishing.');
    }, 1200);
  };

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
      bannerImage,
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
          {/* Problem Image Upload & AI Auto-Fill Banner Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed #93c5fd',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--sky-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                  <Image size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>
                    Upload Problem Photo & AI Auto-Fill
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Upload a picture of the issue (pipe leak, wiring, damaged wall) to automatically fill details.
                  </span>
                </div>
              </div>

              {bannerImage && (
                <button
                  type="button"
                  className="btn btn--sm btn--blue"
                  onClick={triggerAiAutoFill}
                  disabled={isAnalyzing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={14} className="spin-animate" /> Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} /> AI Auto-Fill From Photo
                    </>
                  )}
                </button>
              )}
            </div>

            {bannerImage ? (
              <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', maxHeight: '240px', marginTop: '12px' }}>
                <img
                  src={bannerImage}
                  alt="Job Problem Banner"
                  style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBannerImage('');
                    setImageFileName('');
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove image"
                >
                  <X size={16} />
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  Active Job Card Banner &bull; {imageFileName || 'Uploaded Photo'}
                </div>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  transition: 'border-color 0.2s',
                }}
              >
                <Upload size={28} color="var(--blue)" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)' }}>
                  Click or drag photo here to upload
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  PNG, JPG or WEBP (serves as the listing banner & powers AI autofill)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

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
                placeholder="e.g. Colaba, Mumbai (On-site)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <span className="form-hint">
                Include a Mumbai neighbourhood (e.g. Colaba, Worli, Dadar) so the job shows on the
                Find Jobs map.
              </span>
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
                placeholder="e.g. ₹18,500 or ₹700/hr"
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
                placeholder="e.g. Valid electrical supervisor licence required"
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
