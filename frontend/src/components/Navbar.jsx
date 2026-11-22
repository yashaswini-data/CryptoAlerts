import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Activity, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ unreadCount = 0 }) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Activity size={20} />
        </div>
        <span>CryptoAlerts</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          padding: '2px 8px',
          borderRadius: '4px',
          letterSpacing: '0.05em'
        }}>
          PRO
        </span>
      </div>

      <div className="nav-actions">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '6px 12px',
          borderRadius: '9999px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          Engine Active
        </div>

        {isAuthenticated && (
          <>
            <Link
              to="/notifications"
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', padding: '8px' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Account'}
              </span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
