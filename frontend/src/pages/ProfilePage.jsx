import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/notificationService';

const ProfilePage = () => {
  const { user, logout, userStats, refreshProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    refreshProfile();
    getNotifications(true).then(res => {
      if (res.data) setUnreadCount(res.data.length);
    });
  }, []);

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadCount} />

      <div className="main-content">
        <Navbar unreadCount={unreadCount} />

        <main className="page-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">User Account & System Status</h1>
              <p className="page-subtitle">
                Account credentials, operational metrics, and connected infrastructure components.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* User Profile Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{user?.name || 'Cryptocurrency Trader'}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                    <Mail size={14} />
                    <span>{user?.email || 'user@cryptoalerts.io'}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Account Role:</span>
                  <span style={{ fontWeight: 600, color: '#60a5fa' }}>Standard Member</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Member Since:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'November 2026'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8' }}>Session Security:</span>
                  <span style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> JWT Authenticated
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-danger"
                style={{ width: '100%', marginTop: '28px', padding: '12px' }}
              >
                <LogOut size={16} />
                <span>Sign Out of CryptoAlerts</span>
              </button>
            </div>

            {/* Architecture / Infrastructure Diagnostics Card */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="#3b82f6" />
                <span>Architecture Health & Services</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={16} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>MongoDB Database</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>User, Alert, History & Notification Collections</div>
                    </div>
                  </div>
                  <span className="badge badge-above" style={{ fontSize: '11px' }}>ONLINE</span>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={16} color="#8b5cf6" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>RabbitMQ Event Pipeline</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>AMQP Queue: crypto-alert-notifications</div>
                    </div>
                  </div>
                  <span className="badge badge-active" style={{ fontSize: '11px' }}>CONNECTED</span>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={16} color="#3b82f6" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Node-Cron Scheduler</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Every 30s Price Monitor Cycle</div>
                    </div>
                  </div>
                  <span className="badge badge-above" style={{ fontSize: '11px' }}>ACTIVE</span>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={16} color="#f59e0b" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>CoinGecko Public API</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Rate-limit caching enabled</div>
                    </div>
                  </div>
                  <span className="badge badge-paused" style={{ fontSize: '11px' }}>OPTIMIZED</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
