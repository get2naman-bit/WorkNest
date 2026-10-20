import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Logo from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import './AuthPage.css';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialRole = searchParams.get('role') === 'employer' ? 'employer' : 'worker';

  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [trade, setTrade] = useState('');
  const [location, setLocation] = useState('Austin, TX');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // First-time account creation: 6-digit email OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, register, verifyOtp, resendOtp, requestPasswordReset, isSupabaseConfigured } = useApp();
  const navigate = useNavigate();

  const resendTimerRef = useRef(null);

  const startResendCooldown = () => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setResendCooldown(60);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // Never leave a countdown running after the page unmounts.
  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  const enterOtpStep = (emailAddress) => {
    setOtpStep(true);
    setOtp('');
    setOtpEmail(emailAddress);
    setError('');
    setNotice(`We sent a 6-digit verification code to ${emailAddress}.`);
    startResendCooldown();
  };

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          navigate('/dashboard');
        } else {
          setError(res.error || 'Unable to sign in with those credentials.');
        }
        return;
      }

      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (role === 'employer' && !companyName.trim()) {
        setError('Please enter your company or business name.');
        return;
      }
      if (role === 'worker' && !trade.trim()) {
        setError('Please enter your primary trade or specialty (e.g. Electrician, Plumber).');
        return;
      }

      const res = await register({
        email: email.trim(),
        password,
        role,
        name: name.trim(),
        companyName: role === 'employer' ? companyName.trim() : undefined,
        title: role === 'worker' ? trade.trim() : undefined,
        location: location.trim(),
        skills: role === 'worker' ? [trade.trim()] : [],
      });

      if (res.success && res.requiresOtp) {
        enterOtpStep(res.email || email.trim());
        return;
      }

      if (res.success && res.requiresConfirmation) {
        setMode('login');
        setPassword('');
        setNotice(
          'Account created. Check your inbox and confirm your email address, then sign in.'
        );
      } else if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Failed to register.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    setResetLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setNotice(res.message);
      } else {
        setError(res.error);
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Verify the 6-digit code from the first-time signup email.
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const digits = otp.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyOtp(otpEmail, digits, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'That code is not correct. Please try again.');
        setOtp('');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    clearMessages();
    setResending(true);
    try {
      const res = await resendOtp(otpEmail);
      if (res.success) {
        setNotice(res.message);
        startResendCooldown();
      } else {
        setError(res.error);
      }
    } finally {
      setResending(false);
    }
  };

  const handleBackFromOtp = () => {
    setOtpStep(false);
    setOtp('');
    clearMessages();
  };

  return (
    <div className="auth-wrapper">
      {/* Cloud-like soft background ambient blobs */}
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />
      <div className="auth-blob auth-blob--3" />

      <div className="auth-header-bar">
        <Logo size="md" to="/" />
        <Link to="/" className="auth-back-link">
          Back to home
        </Link>
      </div>

      <main className="auth-container">
        <div className="auth-card-frosted">
          <div className="auth-card-top">
            <span className="auth-badge">
              <ShieldCheck size={13} color="var(--blue)" />
              Verified WorkNest Account
            </span>
            <h1 className="auth-title">
              {otpStep
                ? 'Verify your email'
                : mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h1>
            <p className="auth-sub">
              {otpStep
                ? 'Enter the 6-digit code we emailed you to finish creating your account.'
                : mode === 'login'
                ? 'Sign in to access your dashboard, jobs, and digital work identity.'
                : 'Join WorkNest to build portable work credentials or hire verified pros.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {!otpStep && (
            <div className="auth-mode-tabs" role="tablist">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('login');
                clearMessages();
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('register');
                clearMessages();
              }}
            >
              Create Account
            </button>
            </div>
          )}

          {/* Role selector if registering */}
          {mode === 'register' && !otpStep && (
            <div className="auth-role-select">
              <label className="auth-role-label">I want to:</label>
              <div className="auth-role-options">
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'worker' ? 'is-active' : ''}`}
                  onClick={() => setRole('worker')}
                >
                  <User size={18} />
                  <div>
                    <strong>Work as a Pro</strong>
                    <small>Build digital work identity & get hired</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'employer' ? 'is-active' : ''}`}
                  onClick={() => setRole('employer')}
                >
                  <Building2 size={18} />
                  <div>
                    <strong>Hire Workers</strong>
                    <small>Post jobs & review verified profiles</small>
                  </div>
                </button>
              </div>
            </div>
          )}

          {error && <div className="auth-error-box">{error}</div>}
          {notice && (
            <div className="auth-notice-box">
              <CheckCircle2 size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* First-time signup: email OTP verification */}
          {otpStep && (
            <form onSubmit={handleOtpSubmit} className="auth-form auth-otp-form">
              <div className="auth-otp-head">
                <span className="auth-otp-icon">
                  <Mail size={20} />
                </span>
                <p>
                  Enter the code sent to <strong>{otpEmail}</strong>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-otp">
                  6-digit verification code <span className="required">*</span>
                </label>
                <input
                  id="auth-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="form-input auth-otp-input"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="dark"
                size="lg"
                disabled={verifying || otp.replace(/\D/g, '').length !== 6}
                style={{ width: '100%', marginTop: '8px' }}
              >
                {verifying ? 'Verifying...' : 'Verify & Continue'}
                {!verifying && <ArrowRight size={16} />}
              </Button>

              <div className="auth-otp-actions">
                <button
                  type="button"
                  className="auth-otp-link"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : resending
                    ? 'Sending...'
                    : 'Resend code'}
                </button>
                <button type="button" className="auth-otp-link" onClick={handleBackFromOtp}>
                  Use a different email
                </button>
              </div>

              <p className="auth-otp-hint">
                The code expires after 10 minutes. Check your spam folder if it has not arrived.
              </p>
            </form>
          )}

          {/* Auth Form */}
          {!otpStep && (
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {role === 'employer' ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-company">
                      Company / Organization Name <span className="required">*</span>
                    </label>
                    <input
                      id="auth-company"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Skyline Renovation Group"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-trade">
                      Primary Profession / Trade <span className="required">*</span>
                    </label>
                    <input
                      id="auth-trade"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Master Electrician, HVAC Tech, Plumber"
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-location">Location</label>
                  <input
                    id="auth-location"
                    type="text"
                    className="form-input"
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address <span className="required">*</span>
              </label>
              <div className="auth-input-icon-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="form-input auth-input-with-icon"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="auth-label-row">
                <label className="form-label" htmlFor="auth-password">
                  Password <span className="required">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="auth-input-icon-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type="password"
                  className="form-input auth-input-with-icon"
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="dark"
              size="lg"
              disabled={submitting}
              style={{ width: '100%', marginTop: '8px', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In to WorkNest'
                : 'Complete Registration'}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </form>
          )}

          {!isSupabaseConfigured && (
            <p className="auth-local-note">
              Accounts on this device are stored securely in your browser.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
