import { useState, useEffect } from 'react';
import { User, Eye, Lock, Save, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';
import { changeAccountEmail } from '../services/supabaseService.js';

export default function SettingsPage() {
  const { currentUser, updateProfile, changePassword, isSupabaseConfigured } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // profile | availability | preferences | security
  const [toastMsg, setToastMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [hourlyRate, setHourlyRate] = useState(currentUser?.hourlyRate || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [availability, setAvailability] = useState(currentUser?.availability || 'Available Now');

  // Preferences
  const [publicProfile, setPublicProfile] = useState(currentUser?.publicProfile !== false);

  // Security
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setLocation(currentUser.location || '');
      setTitle(currentUser.title || '');
      setCompanyName(currentUser.companyName || '');
      setHourlyRate(currentUser.hourlyRate || '');
      setBio(currentUser.bio || '');
      setAvailability(currentUser.availability || 'Available Now');
      setPublicProfile(currentUser.publicProfile !== false);
    }
  }, [currentUser]);

  const savePrivacy = async () => {
    setPrivacySaving(true);
    setFormError('');
    try {
      await updateProfile({ publicProfile });
      setToastMsg('Privacy settings saved.');
    } catch (error) {
      setFormError(error.message || 'Could not save privacy settings.');
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setFormError('');
    try {
      const emailChanged = email.trim().toLowerCase() !== currentUser?.email?.toLowerCase();
      const emailResult = isSupabaseConfigured && emailChanged
        ? await changeAccountEmail(email)
        : null;
      const profileUpdates = {
        name,
        phone,
        location,
        title: currentUser?.role === 'worker' ? title : undefined,
        companyName: currentUser?.role === 'employer' ? companyName : undefined,
        hourlyRate: currentUser?.role === 'worker' ? hourlyRate : undefined,
        bio,
        availability,
        ...(!emailResult?.confirmationRequired ? { email: email.trim() } : {}),
      };
      await updateProfile(profileUpdates);
      setToastMsg(emailResult?.confirmationRequired
        ? 'Profile saved. Confirm the email change using the link sent to your inbox.'
        : 'Profile settings saved.');
    } catch (error) {
      setFormError(error.message || 'Could not save profile settings.');
    } finally {
      setProfileSaving(false);
    }
  };

  const saveAvailability = async () => {
    setAvailabilitySaving(true);
    setFormError('');
    try {
      await updateProfile({ availability });
      setToastMsg('Availability status updated.');
    } catch (error) {
      setFormError(error.message || 'Could not update availability.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError('');

    if (!currentPass) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassSaving(true);
    try {
      const res = await changePassword(currentPass, newPass);
      if (!res.success) {
        setPassError(res.error || 'Could not update password.');
        return;
      }
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setToastMsg('Password changed successfully!');
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 24px', maxWidth: '840px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Account & Profile Settings</h1>
          <p className="page-header__subtitle">
            Update your account details, work availability, privacy, and password.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'profile' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={14} /> Profile & Bio
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'availability' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('availability')}
        >
          <Sparkles size={14} /> Availability
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'preferences' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Eye size={14} /> Privacy
        </button>
        <button
          type="button"
          className={`btn btn--sm ${activeTab === 'security' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={14} /> Security
        </button>
      </div>

      {formError && (
        <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
          {formError}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '20px' }}>
            Public Profile Information
          </h2>

          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {currentUser?.role === 'worker' ? (
                <div className="form-group">
                  <label className="form-label">Primary Trade / Specialty</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Company / Contractor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Location (City, State)</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {currentUser?.role === 'worker' && (
                <div className="form-group">
                  <label className="form-label">Standard Hourly Rate</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹550/hr"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary & Bio</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="dark" size="md" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : <><Save size={14} /> Save Profile Changes</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            Work Availability Schedule
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
            Employers filter workers by current dispatch availability. Keep this status updated to
            receive immediate project offers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {[
              { val: 'Available Now', desc: 'Ready to take on new projects and respond within 1 hour' },
              { val: 'Available Tomorrow', desc: 'Booking projects starting tomorrow morning' },
              { val: 'Booked until Friday', desc: 'Currently engaged on active site, open for weekend jobs' },
              { val: 'On Leave / Unavailable', desc: 'Temporarily paused from receiving new job matches' },
            ].map((opt) => (
              <label
                key={opt.val}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  background: availability === opt.val ? '#f0fdf4' : '#ffffff',
                  borderColor: availability === opt.val ? '#86efac' : 'var(--line)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="avail"
                  checked={availability === opt.val}
                  onChange={() => setAvailability(opt.val)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--green)' }}
                />
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{opt.val}</strong>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                    {opt.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="dark"
              size="md"
              onClick={saveAvailability}
              disabled={availabilitySaving}
            >
              {availabilitySaving ? 'Saving…' : <><Save size={14} /> Update Availability</>}
            </Button>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'preferences' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            Public Digital Identity
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            Control whether other people can open your shareable Digital Identity page. Your private profile settings remain available to you.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '10px', marginBottom: '24px' }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>Allow public access to my identity</strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                  When turned off, only you can view this page while signed in.
                </span>
              </div>
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--blue)' }}
              />
          </label>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="dark"
              size="md"
              onClick={savePrivacy}
              disabled={privacySaving}
            >
              {privacySaving ? 'Saving…' : <><Save size={14} /> Save Privacy Settings</>}
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
              Change Password
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              {isSupabaseConfigured
                ? 'Enter your current password, then choose a new one for your WorkNest account.'
                : 'Enter your current password, then choose a new one for the account on this device.'}
            </p>

            {passError && (
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
                {passError}
              </div>
            )}

            <form onSubmit={handlePasswordSave}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="dark" size="md" disabled={passSaving}>
                  {passSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
