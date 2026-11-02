import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';
import './LiveTrackingPage.css';

// Mumbai geographical coordinates along route
// Start near Dadar West (19.0178, 72.8478) to Nariman Point / Fort (18.9256, 72.8244)
const START_LAT = 19.0178;
const START_LNG = 72.8478;
const END_LAT = 18.9256;
const END_LNG = 72.8244;

export default function LiveTrackingPage() {
  const { id } = useParams(); // Can be application id or job id
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
  const [isSimulatingMove, setIsSimulatingMove] = useState(true);
  const [progressRatio, setProgressRatio] = useState(0.45); // 0 to 1 along route
  const [overrideWindow, setOverrideWindow] = useState(false); // Quick toggle for demo preview
  const [liveGpsCoords, setLiveGpsCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);

  // Attempt real device GPS position via browser Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(Math.round(pos.coords.accuracy || 8));
        setGpsActive(true);
      },
      (err) => {
        console.warn('Live device GPS unavailable or permission denied:', err.message);
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Tick timer every second to keep live countdown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Worker GPS vehicle movement along route
  useEffect(() => {
    if (!isSimulatingMove || application?.otpVerified) return;
    const interval = setInterval(() => {
      setProgressRatio((prev) => {
        if (prev >= 0.96) return 0.96; // Arrived
        return prev + 0.015;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isSimulatingMove, application?.otpVerified]);

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

  // Real-time calculated worker coordinates (uses live hardware GPS if available, otherwise route interpolation)
  const currentLat = liveGpsCoords ? liveGpsCoords.lat : START_LAT + (END_LAT - START_LAT) * progressRatio;
  const currentLng = liveGpsCoords ? liveGpsCoords.lng : START_LNG + (END_LNG - START_LNG) * progressRatio;

  // Minutes required to arrive based on remaining distance
  const minutesRequired = Math.max(1, Math.round((1 - progressRatio) * 18));
  const distanceRemainingKm = Math.max(0.2, ((1 - progressRatio) * 11.2)).toFixed(1);

  const isWorker = currentUser?.role === 'worker' || currentUser?.id === application.workerId;
  const isEmployer = currentUser?.role === 'employer' || currentUser?.id === application.employerId || (!currentUser?.role && !isWorker);

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpInput.trim()) {
      setOtpError('Please enter the 4-digit OTP provided by the worker.');
      return;
    }
    const res = verifyOrderOtp(application.id, otpInput);
    if (res.success) {
      setToastMsg('OTP Verified Successfully! Worker arrival confirmed and job session started.');
      setIsSimulatingMove(false);
      setProgressRatio(1);
    } else {
      setOtpError(res.error || 'Incorrect OTP code. Please verify with the worker on site.');
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

  // SVG Map coordinate mapping (0% to 100%)
  // Start point on canvas: X=120, Y=310; End point: X=520, Y=70
  const markerX = 120 + (520 - 120) * progressRatio;
  const markerY = 310 + (70 - 310) * progressRatio;

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

        {/* Demo / Tester toolbar so user can immediately inspect both states */}
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
            <strong>Interactive Booking Time Controls (Test Window):</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`time-adjust-pill ${minutesUntilBooking <= 25 && minutesUntilBooking > 0 ? 'active' : ''}`}
              onClick={() => handleSetBookingOffset(20)}
            >
              Set Booking to 20m from now (Within 30m Window)
            </button>
            <button
              type="button"
              className={`time-adjust-pill ${minutesUntilBooking > 40 ? 'active' : ''}`}
              onClick={() => handleSetBookingOffset(120)}
            >
              Set Booking to 2 Hours from now (Outside Window)
            </button>
            <button
              type="button"
              className={`time-adjust-pill ${overrideWindow ? 'active' : ''}`}
              onClick={() => setOverrideWindow(!overrideWindow)}
              title="Force display live GPS & OTP regardless of scheduled time"
            >
              {overrideWindow ? 'Disable Window Override' : '⚡ Preview Live Window'}
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
              For worker privacy and battery optimization, real-time GPS location coordinates, estimated minutes required, and OTP verification code unlock <strong>within 30 minutes</strong> before the scheduled appointment time.
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
                <Sparkles size={15} /> Preview Live GPS & OTP Right Now
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
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>Live Satellite Route & GPS</span>
                </div>
                <div className="tracking-live-indicator">
                  <span className="pulse-dot" /> Live Signals Streaming
                </div>
              </div>

              {/* Vector/Interactive Map Canvas */}
              <div className="tracking-map-viewport">
                {/* SVG Map Grid & Route */}
                <svg className="map-svg-grid" viewBox="0 0 640 380" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <radialGradient id="workerGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Dark Map Street Mesh */}
                  <rect width="640" height="380" fill="#0f172a" />
                  {/* Subtle Grid Lines representing streets */}
                  <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                    <line x1="0" y1="80" x2="640" y2="80" />
                    <line x1="0" y1="160" x2="640" y2="160" />
                    <line x1="0" y1="240" x2="640" y2="240" />
                    <line x1="0" y1="320" x2="640" y2="320" />
                    <line x1="100" y1="0" x2="100" y2="380" />
                    <line x1="220" y1="0" x2="220" y2="380" />
                    <line x1="340" y1="0" x2="340" y2="380" />
                    <line x1="460" y1="0" x2="460" y2="380" />
                    <line x1="580" y1="0" x2="580" y2="380" />
                  </g>

                  {/* Curving River / Major Highway */}
                  <path
                    d="M 0,260 Q 180,240 300,190 T 640,110"
                    fill="none"
                    stroke="rgba(30, 58, 138, 0.5)"
                    strokeWidth="14"
                  />
                  <path
                    d="M 0,260 Q 180,240 300,190 T 640,110"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />

                  {/* Active Route Path from Start to Destination */}
                  <path
                    d="M 120,310 C 200,310 240,240 340,200 C 440,160 460,90 520,70"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 120,310 C 200,310 240,240 340,200 C 440,160 460,90 520,70"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />

                  {/* Start Point Marker */}
                  <circle cx="120" cy="310" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <text x="120" y="334" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="600">
                    Dispatch Point
                  </text>

                  {/* Destination Marker */}
                  <circle cx="520" cy="70" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                  <text x="520" y="52" fill="#4ade80" fontSize="12" textAnchor="middle" fontWeight="700">
                    Job Location
                  </text>

                  {/* Moving Worker GPS Vehicle Marker */}
                  <circle cx={markerX} cy={markerY} r="28" fill="url(#workerGlow)" />
                  <circle cx={markerX} cy={markerY} r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
                  {/* Direction Arrow on vehicle */}
                  <polygon
                    points={`${markerX},${markerY - 5} ${markerX - 4},${markerY + 4} ${markerX + 4},${markerY + 4}`}
                    fill="#ffffff"
                  />
                </svg>

                {/* Real-Time ETA Card on Map */}
                <div className="tracking-eta-overlay">
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                      Minutes Required
                    </span>
                    <div className="tracking-eta-value">
                      {application.otpVerified ? 'Arrived & Started' : `${minutesRequired} mins`}
                    </div>
                  </div>
                  <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                      Distance
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      {distanceRemainingKm} km
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates telemetry badge */}
                <div className="tracking-gps-coords">
                  GPS: {currentLat.toFixed(5)}° N, {Math.abs(currentLng).toFixed(5)}° W &bull; Accuracy &plusmn;3m
                </div>

                {/* Recenter / Speed up toggle */}
                <button
                  type="button"
                  className="tracking-recenter-btn"
                  onClick={() => {
                    setProgressRatio(0.1);
                    setToastMsg('Worker simulation reset to origin.');
                  }}
                  title="Reset worker GPS origin"
                >
                  <RotateCw size={12} /> Reset Route
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
                      Worker Starting Location
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                      {application.startAddress || 'Dadar Dispatch Hub, Mumbai'}
                    </p>
                  </div>
                </div>

                <div className="tracking-address-item">
                  <div style={{ color: '#10b981', marginTop: '2px' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Destination / Client Address
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                      {application.destinationAddress || 'Nariman Point, Mumbai (Client Job Site)'}
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
                      Client-Verified Service OTP
                    </h3>
                  </div>
                  {application.otpVerified && (
                    <span className="tracking-otp-verified-badge">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '13px', color: '#93c5fd', marginTop: '8px', lineHeight: 1.5 }}>
                  {isWorker
                    ? 'Provide this secure 4-digit code to the user/client upon reaching their address to verify your arrival.'
                    : 'Ask the worker for their 4-digit arrival code and enter it below to confirm worker arrival on site.'}
                </p>

                {/* Worker View: Big OTP Digits Display */}
                {isWorker && (
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Your Worker Arrival Code:
                    </span>
                    <div className="tracking-otp-display">
                      {String(application.otp || '5921')
                        .split('')
                        .map((digit, idx) => (
                          <div key={idx} className="tracking-otp-digit">
                            {digit}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Employer / User View: OTP Verification Form */}
                {!application.otpVerified ? (
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
                      {isEmployer
                        ? 'Enter Worker OTP Code to Confirm Arrival:'
                        : 'Simulate User-Side Verification (Test):'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="otpInput"
                        type="text"
                        maxLength={4}
                        placeholder={isWorker ? `Worker code: ${application.otp || '5921'}` : 'Enter 4-digit OTP'}
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
                ) : (
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
                      ✓ Job session officially unlocked. Work is recorded on Digital Work Identity.
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
                      <Phone size={13} /> {application.phone || '+1 (512) 555-0149'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Order Status</span>
                    <strong style={{ color: 'var(--blue)' }}>
                      {application.otpVerified ? 'In-Progress (Arrived)' : 'En Route / Live GPS'}
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
