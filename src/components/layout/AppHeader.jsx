import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  LogOut,
  Settings as SettingsIcon,
  Search,
  FileText,
  ChevronDown,
  PlusCircle,
  Users,
  Award,
  History,
  LayoutDashboard,
} from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function AppHeader() {
  const {
    currentUser,
    logout,
    unreadNotifsCount,
    conversations,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const myConversations = conversations.filter(
    (c) =>
      c.participant1Id === currentUser?.id || c.participant2Id === currentUser?.id
  );

  const totalUnreadMessages = myConversations.reduce(
    (acc, c) => acc + (c.unreadBy?.[currentUser?.id] ?? c.unreadCount ?? 0),
    0
  );

  const isWorker = currentUser?.role === 'worker';
  const isEmployer = currentUser?.role === 'employer';

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      {/* Main Navigation Header */}
      <header className="app-header">
        <div className="container app-header__inner">
          <div className="app-header__left">
            <Logo size="sm" to={currentUser ? '/dashboard' : '/'} />

            <nav className="app-nav" aria-label="Main Application">
              {currentUser ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`app-nav__link ${
                      location.pathname === '/dashboard' ? 'is-active' : ''
                    }`}
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>

                  {isWorker && (
                    <>
                      <Link
                        to="/jobs"
                        className={`app-nav__link ${
                          location.pathname.startsWith('/jobs') ? 'is-active' : ''
                        }`}
                      >
                        <Search size={15} /> Find Jobs
                      </Link>
                      <Link
                        to="/applications"
                        className={`app-nav__link ${
                          location.pathname === '/applications' ? 'is-active' : ''
                        }`}
                      >
                        <FileText size={15} /> My Applications
                      </Link>
                      <Link
                        to="/identity"
                        className={`app-nav__link ${
                          location.pathname === '/identity' ? 'is-active' : ''
                        }`}
                      >
                        <Award size={15} /> Digital Identity
                      </Link>
                      <Link
                        to="/history"
                        className={`app-nav__link ${
                          location.pathname === '/history' ? 'is-active' : ''
                        }`}
                      >
                        <History size={15} /> Work History
                      </Link>
                    </>
                  )}

                  {isEmployer && (
                    <>
                      <Link
                        to="/jobs/new"
                        className={`app-nav__link ${
                          location.pathname === '/jobs/new' ? 'is-active' : ''
                        }`}
                      >
                        <PlusCircle size={15} /> Post a Job
                      </Link>
                      <Link
                        to="/employer/applications"
                        className={`app-nav__link ${
                          location.pathname === '/employer/applications' ? 'is-active' : ''
                        }`}
                      >
                        <FileText size={15} /> Manage Applications
                      </Link>
                      <Link
                        to="/workers"
                        className={`app-nav__link ${
                          location.pathname === '/workers' ? 'is-active' : ''
                        }`}
                      >
                        <Users size={15} /> Find Workers
                      </Link>
                    </>
                  )}

                  <Link
                    to="/messages"
                    className={`app-nav__link ${
                      location.pathname === '/messages' ? 'is-active' : ''
                    }`}
                  >
                    <MessageSquare size={15} /> Messages
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="app-nav__link">
                    Home
                  </Link>
                  <Link to="/jobs" className="app-nav__link">
                    Find Jobs
                  </Link>
                  <Link to="/workers" className="app-nav__link">
                    Find Workers
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="app-header__right">
            {currentUser ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="icon-button"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadNotifsCount > 0 && (
                    <span className="icon-button__badge">{unreadNotifsCount}</span>
                  )}
                </Link>

                {/* Messages shortcut */}
                <Link
                  to="/messages"
                  className="icon-button"
                  title="Messages"
                  aria-label="Messages"
                >
                  <MessageSquare size={18} />
                  {totalUnreadMessages > 0 && (
                    <span className="icon-button__badge">{totalUnreadMessages}</span>
                  )}
                </Link>

                {/* User menu dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="user-profile-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-expanded={menuOpen}
                  >
                    <span className="user-avatar-sm">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                    <div className="user-profile-info">
                      <span className="user-profile-name">{currentUser.name}</span>
                      <span className="user-profile-role">{currentUser.role}</span>
                    </div>
                    <ChevronDown size={14} color="var(--muted)" />
                  </button>

                  {menuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '110%',
                        background: '#fff',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(10, 17, 32, 0.1)',
                        width: 220,
                        padding: '8px 0',
                        zIndex: 100,
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 16px',
                          borderBottom: '1px solid var(--line)',
                          fontSize: '12px',
                          color: 'var(--muted)',
                        }}
                      >
                        Signed in as<br />
                        <strong style={{ color: 'var(--navy)' }}>{currentUser.email}</strong>
                      </div>

                      {isWorker && (
                        <Link
                          to="/identity"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            fontSize: '14px',
                            color: 'var(--ink)',
                            textDecoration: 'none',
                          }}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Award size={16} color="var(--blue)" /> Digital Work Identity
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: 'var(--ink)',
                          textDecoration: 'none',
                        }}
                        onClick={() => setMenuOpen(false)}
                      >
                        <SettingsIcon size={16} color="var(--muted)" /> Settings
                      </Link>

                      <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '14px',
                          color: '#ef4444',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/auth?mode=login"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  Log in
                </Link>
                <Link
                  to="/auth?mode=register"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'var(--ink)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
