import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getNotifications(unreadOnly);
      if (data.data) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [unreadOnly]);

  const handleMarkSingleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Mark single read error:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadCount} />

      <div className="main-content">
        <Navbar unreadCount={unreadCount} />

        <main className="page-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">Notification History</h1>
              <p className="page-subtitle">
                Asynchronous event notifications published by RabbitMQ when alerts are triggered.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => fetchNotifs(true)}
                className="btn btn-secondary"
                disabled={refreshing}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-secondary"
                >
                  <CheckCheck size={16} />
                  <span>Mark All As Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <div className="tabs-group">
              <button
                className={`tab-btn ${!unreadOnly ? 'active' : ''}`}
                onClick={() => setUnreadOnly(false)}
              >
                All Notifications
              </button>
              <button
                className={`tab-btn ${unreadOnly ? 'active' : ''}`}
                onClick={() => setUnreadOnly(true)}
              >
                Unread Only {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <Bell size={32} />
              </div>
              <div className="empty-state-title">
                {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <p className="empty-state-text">
                When your active cryptocurrency alerts are triggered by market movements, your alert events will appear here in real-time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    background: notif.isRead ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.06)',
                    borderColor: notif.isRead ? 'var(--border-subtle)' : 'rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: notif.isRead ? 'rgba(255, 255, 255, 0.04)' : 'rgba(16, 185, 129, 0.15)',
                      border: notif.isRead ? '1px solid var(--border-subtle)' : '1px solid rgba(16, 185, 129, 0.3)',
                      color: notif.isRead ? '#94a3b8' : '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Bell size={20} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                          {notif.coinId.toUpperCase()} Trigger Event
                        </span>
                        {!notif.isRead && (
                          <span className="badge badge-below" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            NEW
                          </span>
                        )}
                      </div>

                      <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>
                        {notif.message}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: '#64748b',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <div>
                          Trigger Price: <span style={{ color: '#fff', fontWeight: 600 }}>${Number(notif.currentPrice).toLocaleString()}</span>
                        </div>
                        <div>•</div>
                        <div>
                          Target: <span style={{ color: '#94a3b8' }}>${Number(notif.targetPrice).toLocaleString()}</span>
                        </div>
                        <div>•</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkSingleRead(notif._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0 }}
                      title="Mark as read"
                    >
                      <Check size={14} />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
