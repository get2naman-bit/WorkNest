import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Navigation,
  Clock,
  KeyRound,
  ShieldCheck,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  RotateCw,
  Compass,
  ArrowRight,
  Info,
  Sliders,
  Sparkles,
  Locate,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';
import TrackingMap from '../components/ui/TrackingMap.jsx';
import { isSupabaseConfigured } from '../lib/supabase.js';
import * as db from '../services/supabaseService.js';
import './LiveTrackingPage.css';

const generateFourDigitOtp = () => {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return String(1000 + (values[0] % 9000));
};

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, currentUser, verifyOrderOtp, updateBookingSchedule } = useApp();

  // Find targeted application (must be status === 'accepted')
  const application = useMemo(() => {
    return (
      applications.find(
        (a) =>
          (a.id === id || a.jobId === id) &&
          (a.status === 'accepted' || a.status === 'hired')
      ) ||
      applications.find((a) => a.id === id || a.jobId === id) ||
      applications.find((a) => a.status === 'accepted')
    );
  }, [applications, id]);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [toastMsg, setToastMsg] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [employerOtp, setEmployerOtp] = useState('');
  const [otpLoadError, setOtpLoadError] = useState('');
  const [orderOtpVerified, setOrderOtpVerified] = useState(false);
  const [overrideWindow, setOverrideWindow] = useState(false);

  // Real GPS state
  const [workerGps, setWorkerGps] = useState(null);
  const [employerGps, setEmployerGps] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const isWorker = currentUser?.role === 'worker' || currentUser?.id === application?.workerId;
  const isEmployer = currentUser?.role === 'employer' || currentUser?.id === application?.employerId || (!currentUser?.role && !isWorker);

  useEffect(() => {
    setOrderOtpVerified(Boolean(application?.otpVerified));
    if (!application?.id || !/^[0-9a-f-]{36}$/i.test(application.id)) return undefined;
    return db.subscribeToApplicationOrder(application.id, (updated) => {
      setOrderOtpVerified(Boolean(updated?.otpVerified));
    });
  }, [application?.id, application?.otpVerified]);

  useEffect(() => {
    if (!isEmployer || !application?.id) return undefined;
    const isCloudOrder = isSupabaseConfigured && /^[0-9a-f-]{36}$/i.test(application.id);
    setEmployerOtp(isCloudOrder ? '' : (application.otp || ''));
    setOtpLoadError('');
    if (!isCloudOrder) return undefined;
    let active = true;
    db.fetchApplicationOtp(application.id)
      .then(async (otp) => {
        const code = otp || await db.ensureApplicationOtp(application.id, generateFourDigitOtp());
        if (active && code) setEmployerOtp(code);
      })
      .catch((error) => { if (active) setOtpLoadError(error.message); });
    return () => { active = false; };
  }, [isEmployer, application?.id, application?.otp]);

  // Start real GPS tracking via browser Geolocation API
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setGpsAccuracy(Math.round(pos.coords.accuracy || 5));
        setGpsActive(true);

        // Worker's position updates the worker GPS
        // Employer's position is the destination
        if (isWorker) {
          setWorkerGps(coords);
          if (isSupabaseConfigured && application?.id && currentUser?.id) {
            db.publishWorkerLocation(application.id, currentUser.id, coords)
              .catch((error) => setGpsError(`Could not share live location: ${error.message}`));
          }
        } else {
          setEmployerGps(coords);
        }
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setGpsError(`Location access: ${err.message}. Please enable location permissions.`);
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setWatchId(wid);
  }, [isWorker, application?.id, currentUser?.id]);

  // Employers receive the worker's current position through Supabase Realtime.
  useEffect(() => {
    if (!isEmployer || !application?.id || !isSupabaseConfigured) return undefined;
    let active = true;
    db.fetchWorkerLocation(application.id).then((location) => {
      if (active && location) setWorkerGps(location);
    }).catch((error) => setGpsError(`Could not load worker location: ${error.message}`));
    const unsubscribe = db.subscribeToWorkerLocation(application.id, setWorkerGps);
    return () => { active = false; unsubscribe(); };
  }, [isEmployer, application?.id]);

  // Auto-start GPS when page opens and window is active
  useEffect(() => {
    if (application) {
      startGpsTracking();
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [application?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!application) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2>No Accepted Order Found</h2>
        <p style={{ color: 'var(--muted)', marginTop: '8px', marginBottom: '24px' }}>
          Live tracking and OTP verification activate once a worker's application is accepted.
        </p>
        <Link to="/applications">
          <Button variant="blue">Return to Applications</Button>
        </Link>
      </div>
    );
  }

  // Calculate booking time delta
  const bookingTimeMs = application.bookingDateTime
    ? new Date(application.bookingDateTime).getTime()
    : Date.now() + 20 * 60 * 1000;

  const msUntilBooking = bookingTimeMs - currentTime;
  const minutesUntilBooking = Math.ceil(msUntilBooking / (60 * 1000));
  const isWithin30MinWindow = msUntilBooking <= 30 * 60 * 1000 && msUntilBooking > -180 * 60 * 1000;
  const isWindowActive = isWithin30MinWindow || overrideWindow;

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA based on real GPS positions
  const currentLat = workerGps?.lat || 0;
  const currentLng = workerGps?.lng || 0;
  const destLat = employerGps?.lat || 0;
  const destLng = employerGps?.lng || 0;

  let distanceKm = 0;
  let etaMinutes = 0;

  if (workerGps && employerGps) {
    distanceKm = calculateDistance(currentLat, currentLng, destLat, destLng);
    // Assume average speed of 25 km/h in urban areas
    etaMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
  } else if (workerGps) {
    // If only worker GPS, show a message that we need employer location
    distanceKm = 0;
    etaMinutes = 0;
  }

  // OTP verification handler — only worker enters OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpInput.trim()) {
      setOtpError('Please enter the 4-digit OTP provided by the employer.');
      return;
    }
    const res = await verifyOrderOtp(application.id, otpInput);
    if (res.success) {
      setOrderOtpVerified(true);
      setToastMsg('OTP Verified Successfully! Worker arrival confirmed and job session started.');
    } else {
      setOtpError(res.error || 'Incorrect OTP code. Please verify with the employer on site.');
    }
  };

  const handleSetBookingOffset = (offsetMinutes) => {
    const targetMs = Date.now() + offsetMinutes * 60 * 1000;
    const targetDate = new Date(targetMs);
    updateBookingSchedule(application.id, {
      bookingDateTime: targetDate.toISOString(),
      bookingDate: targetDate.toISOString().slice(0, 10),
      bookingTime: targetDate.toTimeString().slice(0, 5),
    });
    setToastMsg(`Booking time adjusted to ${offsetMinutes}m from now for preview.`);
  };

  return (
    <div className="tracking-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Header Summary */}
        <div className="tracking-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="badge badge--accepted">
                  <CheckCircle2 size={13} /> ORDER ACCEPTED
                </span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Order #{application.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--navy)' }}>
                {application.jobTitle}
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '4px' }}>
                Employer: <strong>{application.companyName}</strong> &bull; Worker: <strong>{application.workerName}</strong>
              </p>
            </div>

            {/* Live Status Pill */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isWindowActive ? '#ecfdf5' : '#fef3c7',
                  border: `1px solid ${isWindowActive ? '#a7f3d0' : '#fde68a'}`,
                  color: isWindowActive ? '#065f46' : '#92400e',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {isWindowActive ? (
                  <>
                    <span className="pulse-dot" /> Live GPS & Tracking Active
                  </>
                ) : (
                  <>
                    <Clock size={16} /> Tracking Locked Until 30m Before Booking
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demo / Tester toolbar */}
        <div
          style={{
            background: 'rgba(238, 242, 255, 0.75)',
            border: '1px solid #c7d2fe',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#3730a3' }}>
            <Sliders size={16} />
            <strong>Booking Time Controls:</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`time-adjust-pill ${minutesUntilBooking <= 25 && minutesUntilBooking > 0 ? 'active' : ''}`}
              onClick={() => handleSetBookingOffset(20)}
            >
              Set 20m from now (Within Window)
            </button>
            <button
              type="button"
              className={`time-adjust-pill ${minutesUntilBooking > 40 ? 'active' : ''}`}
              onClick={() => handleSetBookingOffset(120)}
            >
              Set 2 Hours (Outside Window)
            </button>
            <button
              type="button"
              className={`time-adjust-pill ${overrideWindow ? 'active' : ''}`}
              onClick={() => setOverrideWindow(!overrideWindow)}
              title="Force display live GPS & OTP regardless of scheduled time"
            >
              {overrideWindow ? 'Disable Override' : '⚡ Preview Live'}
            </button>
          </div>
        </div>

        {/* Conditional Rendering: Locked Gate vs Active Live GPS Tracking */}
        {!isWindowActive ? (
          <div className="tracking-gate-card">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Clock size={32} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px' }}>
              Live GPS Tracking Activates Closer to Booking Time
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 20px', color: 'var(--muted)', fontSize: '15px' }}>
              For privacy and battery optimization, real-time GPS coordinates, estimated arrival time, and OTP verification unlock <strong>within 30 minutes</strong> before the scheduled appointment.
            </p>

            <div
              style={{
                maxWidth: '420px',
                margin: '0 auto 24px',
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Scheduled Time:</span>
                <strong style={{ color: 'var(--navy)' }}>
                  {application.bookingDate} at {application.bookingTime || 'Scheduled'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Time Remaining:</span>
                <strong style={{ color: '#d97706' }}>
                  {minutesUntilBooking > 60
                    ? `${Math.floor(minutesUntilBooking / 60)}h ${minutesUntilBooking % 60}m`
                    : `${minutesUntilBooking} minutes`}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Tracking Window:</span>
                <span style={{ color: 'var(--navy)', fontWeight: 600 }}>T - 30 minutes</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button
                variant="blue"
                onClick={() => setOverrideWindow(true)}
              >
                <Sparkles size={15} /> Preview Live GPS & OTP Now
              </Button>
              <Link to="/applications">
                <Button variant="light">Return to Applications</Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Live Tracking Interface */
          <div className="tracking-grid">
            {/* Left: Live GPS Map Component */}
            <div className="tracking-map-card">
              <div className="tracking-map-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={18} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>Real-Time GPS Tracking</span>
                </div>
                <div className="tracking-live-indicator">
                  <span className={`pulse-dot ${gpsActive ? '' : 'inactive'}`} />
                  {gpsActive ? 'Live GPS Active' : 'Acquiring GPS...'}
                </div>
              </div>

              {/* GPS Error Banner */}
              {gpsError && (
                <div style={{
                  padding: '10px 16px',
                  background: '#fef2f2',
                  borderBottom: '1px solid #fecaca',
                  fontSize: '13px',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={14} />
                  {gpsError}
                  <button
                    type="button"
                    onClick={startGpsTracking}
                    style={{
                      marginLeft: 'auto',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Map Canvas */}
              <div className="tracking-map-viewport">
                <TrackingMap workerGps={workerGps} employerGps={employerGps} />

                {/* Real-Time ETA Card */}
                <div className="tracking-eta-overlay">
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                      ETA
                    </span>
                    <div className="tracking-eta-value">
                      {orderOtpVerified
                        ? 'Arrived & Started'
                        : workerGps && employerGps
                          ? `${etaMinutes} mins`
                          : 'Acquiring...'}
                    </div>
                  </div>
                  <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                      Distance
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      {workerGps && employerGps ? `${distanceKm.toFixed(1)} km` : '—'}
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates telemetry badge */}
                <div className="tracking-gps-coords">
                  {workerGps ? (
                    <>
                      Worker: {workerGps.lat.toFixed(5)}°N, {workerGps.lng.toFixed(5)}°E
                      {gpsAccuracy ? ` • ±${gpsAccuracy}m` : ''}
                    </>
                  ) : (
                    'Acquiring worker GPS coordinates...'
                  )}
                </div>

                {/* Recenter GPS button */}
                <button
                  type="button"
                  className="tracking-recenter-btn"
                  onClick={startGpsTracking}
                  title="Re-acquire GPS position"
                >
                  <Locate size={12} /> Refresh GPS
                </button>
              </div>

              {/* Route Endpoints */}
              <div className="tracking-route-footer">
                <div className="tracking-address-item">
                  <div style={{ color: '#3b82f6', marginTop: '2px' }}>
                    <Compass size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Worker Location (Live GPS)
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                      {workerGps
                        ? `${workerGps.lat.toFixed(4)}°N, ${workerGps.lng.toFixed(4)}°E`
                        : 'Acquiring position...'}
                    </p>
                  </div>
                </div>

                <div className="tracking-address-item">
                  <div style={{ color: '#10b981', marginTop: '2px' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Employer / Job Location (Live GPS)
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                      {employerGps
                        ? `${employerGps.lat.toFixed(4)}°N, ${employerGps.lng.toFixed(4)}°E`
                        : 'Waiting for employer GPS...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: OTP Verification & Worker Dispatch Card */}
            <div className="tracking-sidebar">
              {/* OTP Security Verification Box */}
              <div className="tracking-otp-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={20} color="#38bdf8" />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                      Service Verification OTP
                    </h3>
                  </div>
                  {orderOtpVerified && (
                    <span className="tracking-otp-verified-badge">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '13px', color: '#93c5fd', marginTop: '8px', lineHeight: 1.5 }}>
                  {isEmployer
                    ? 'Share this OTP with the worker when they arrive on site. They will enter it to confirm arrival.'
                    : 'When you arrive at the job site, ask the employer for the 4-digit OTP and enter it below to confirm your arrival.'}
                </p>

                {/* EMPLOYER VIEW: Show the OTP code (employer is given OTP) */}
                {isEmployer && (
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Your OTP Code (share with worker on arrival):
                    </span>
                    <div className="tracking-otp-display">
                      {String(employerOtp || '----')
                        .split('')
                        .map((digit, idx) => (
                          <div key={idx} className="tracking-otp-digit">
                            {digit}
                          </div>
                        ))}
                    </div>
                    {otpLoadError && (
                      <p role="alert" style={{ color: '#fca5a5', fontSize: '12px', marginTop: '8px' }}>
                        Could not load this order OTP: {otpLoadError}
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      Do not share this code until the worker physically arrives at your location.
                    </p>
                  </div>
                )}

                {/* WORKER VIEW: OTP entry form (only worker enters OTP) */}
                {isWorker && !orderOtpVerified && (
                  <form onSubmit={handleVerifyOtp} style={{ marginTop: '16px' }}>
                    <label
                      htmlFor="otpInput"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#cbd5e1',
                        marginBottom: '6px',
                      }}
                    >
                      Enter the OTP given by the employer:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="otpInput"
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.07)',
                          color: '#fff',
                          fontSize: '15px',
                          fontWeight: 700,
                          letterSpacing: '3px',
                          textAlign: 'center',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: '#38bdf8',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Verify & Start
                      </button>
                    </div>
                    {otpError && (
                      <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                        {otpError}
                      </p>
                    )}
                  </form>
                )}

                {/* Verified state */}
                {orderOtpVerified && (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      marginTop: '12px',
                    }}
                  >
                    <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                      ✓ Worker arrival confirmed. Job session officially started and recorded on Digital Work Identity.
                    </p>
                  </div>
                )}

                {/* Employer waiting for worker to verify */}
                {isEmployer && !orderOtpVerified && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      marginTop: '12px',
                    }}
                  >
                    <p style={{ color: '#7dd3fc', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                      ⏳ Waiting for worker to enter the OTP upon arrival...
                    </p>
                  </div>
                )}
              </div>

              {/* Order & Contact Card */}
              <div className="card">
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>
                  Job Booking Details
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--muted)' }}>Booking Date & Time</span>
                    <strong style={{ color: 'var(--navy)' }}>
                      {application.bookingDate} at {application.bookingTime || 'Scheduled'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--muted)' }}>Agreed Compensation</span>
                    <strong style={{ color: 'var(--green)', fontSize: '16px' }}>
                      {application.expectedRate || application.payRate}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--muted)' }}>Phone Contact</span>
                    <strong style={{ color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} /> {application.phone || 'Not provided'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Order Status</span>
                    <strong style={{ color: 'var(--blue)' }}>
                      {orderOtpVerified ? 'In-Progress (Arrived)' : 'En Route / Live GPS'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                  <Link to={`/jobs/${application.jobId}`} style={{ flex: 1 }}>
                    <Button variant="light" size="sm" style={{ width: '100%' }}>
                      View Job Specs
                    </Button>
                  </Link>
                  <Link to="/messages" style={{ flex: 1 }}>
                    <Button variant="blue" size="sm" style={{ width: '100%' }}>
                      Live Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
}
