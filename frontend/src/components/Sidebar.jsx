import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  BellRing,
  Bell,
  User,
  LogOut,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff', lineHeight: 1 }}>CryptoAlerts</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Real-time Sentinel</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/market"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <TrendingUp size={18} />
          <span>Cryptocurrencies</span>
        </NavLink>

        <NavLink
          to="/alerts/create"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={18} />
          <span>Create Alert</span>
        </NavLink>

        <NavLink
          to="/alerts"
          end
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <BellRing size={18} />
          <span>Manage Alerts</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Bell size={18} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="badge-count">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-pill" style={{ marginBottom: '12px' }}>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email || 'user@example.com'}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', color: '#94a3b8' }}
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
