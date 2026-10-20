import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  Star,
  Briefcase,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Button from '../components/ui/Button.jsx';
import Toast from '../components/ui/Toast.jsx';

export default function NotificationsPage() {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useApp();

  const [filter, setFilter] = useState('all'); // all | unread
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  const userNotifs = useMemo(() => {
    return notifications.filter(
      (n) => n.userId === currentUser?.id || (!currentUser && n.userId === 'w1')
    );
  }, [notifications, currentUser]);

  const filteredNotifs = useMemo(() => {
    if (filter === 'unread') return userNotifs.filter((n) => !n.read);
    return userNotifs;
  }, [userNotifs, filter]);

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'application':
        return <FileText size={18} color="var(--blue)" />;
      case 'message':
        return <MessageSquare size={18} color="var(--green)" />;
      case 'review':
        return <Star size={18} color="#f5a524" />;
      default:
        return <Briefcase size={18} color="var(--blue)" />;
    }
  };

  return (
    <div className="container" style={{ padding: '32px 24px', maxWidth: '780px' }}>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="page-header__inner" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-header__title">Activity & Notifications</h1>
          <p className="page-header__subtitle">
            Stay updated on application status changes, interview requests, and client feedback.
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="page-header__actions">
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                markAllNotificationsAsRead();
                setToastMsg('All notifications marked as read.');
              }}
            >
              <Check size={14} /> Mark All as Read
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn btn--sm ${filter === 'all' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setFilter('all')}
        >
          All Activity ({userNotifs.length})
        </button>
        <button
          type="button"
          className={`btn btn--sm ${filter === 'unread' ? 'btn--dark' : 'btn--light'}`}
          onClick={() => setFilter('unread')}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notification Items */}
      {filteredNotifs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                background: notif.read ? '#ffffff' : '#f0f7ff',
                border: notif.read ? '1px solid var(--line)' : '1px solid #bfdbfe',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: notif.read ? '#f1f5f9' : '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon(notif.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong
                    style={{
                      fontSize: '14px',
                      color: notif.read ? 'var(--navy)' : 'var(--blue-dark)',
                    }}
                  >
                    {notif.title}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{notif.date}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.4 }}>
                  {notif.message}
                </p>
              </div>

              <ChevronRight size={16} color="var(--muted)" />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <Bell size={24} />
          </div>
          <h3 className="empty-state__title">No notifications</h3>
          <p className="empty-state__desc">
            You're all caught up! New application milestones, job invites, and messages will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
