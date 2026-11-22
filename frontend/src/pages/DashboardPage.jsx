import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  Bell,
  Coins,
  TrendingUp,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AlertModal from '../components/AlertModal';
import PriceChart from '../components/PriceChart';
import { getCoins } from '../services/coinService';
import { getAlerts, pauseAlert, resumeAlert, deleteAlert } from '../services/alertService';
import { getNotifications, markAsRead } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [coins, setCoins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartCoin, setChartCoin] = useState(null);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [coinsRes, alertsRes, notifsRes] = await Promise.all([
        getCoins(isManualRefresh),
        getAlerts(),
        getNotifications()
      ]);

      if (coinsRes.coins) {
        setCoins(coinsRes.coins);
        if (coinsRes.notice) setNotice(coinsRes.notice);
        else setNotice(null);
      }
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (notifsRes.data) setNotifications(notifsRes.data);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const handlePauseResume = async (alert) => {
    try {
      if (alert.status === 'ACTIVE') {
        await pauseAlert(alert._id);
      } else {
        await resumeAlert(alert._id);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Mark notif read failed:', err.message);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED');
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadNotifications.length} />

      <div className="main-content">
        <Navbar unreadCount={unreadNotifications.length} />

        <main className="page-wrapper">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Welcome back, {user?.name || 'Trader'}</h1>
              <p className="page-subtitle">
                Automated monitoring active across {coins.length || 10} major cryptocurrency markets.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => fetchData(true)}
                className="btn btn-secondary"
                disabled={refreshing}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                <PlusCircle size={16} />
                <span>Create Alert</span>
              </button>
            </div>
          </div>

          {notice && (
            <div className="notice-banner notice-warning">
              <AlertTriangle size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard
              title="Active Alerts"
              value={activeAlerts.length}
              icon={BellRing}
              color="blue"
              subtitle="Monitored 24/7"
            />
            <StatCard
              title="Triggered Alerts"
              value={triggeredAlerts.length}
              icon={CheckCircle2}
              color="green"
              subtitle="Conditions satisfied"
            />
            <StatCard
              title="Notifications"
              value={unreadNotifications.length}
              icon={Bell}
              color="purple"
              subtitle={`${notifications.length} total events`}
            />
            <StatCard
              title="Supported Assets"
              value={coins.length || 10}
              icon={Coins}
              color="amber"
              subtitle="CoinGecko Live API"
            />
          </div>

          {/* Price Chart Preview if selected */}
          {chartCoin && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Market Price Chart</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setChartCoin(null)}
                >
                  Close Chart
                </button>
              </div>
              <PriceChart
                coinId={chartCoin.id}
                coinName={chartCoin.name}
                coinSymbol={chartCoin.symbol}
                currentPrice={chartCoin.current_price}
              />
            </div>
          )}

          {/* Main Grid: Market Overview & Active Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '28px', marginBottom: '32px' }}>
            {/* Top Cryptos Market Overview */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Market Overview</h3>
                <Link to="/market" style={{ fontSize: '13px', fontWeight: 600 }}>
                  View All &rarr;
                </Link>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Price</th>
                      <th>24h Change</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.slice(0, 5).map((coin) => {
                      const isUp = (coin.price_change_percentage_24h || 0) >= 0;
                      return (
                        <tr key={coin.id}>
                          <td>
                            <div className="coin-cell">
                              {coin.image && (
                                <img src={coin.image} alt={coin.name} style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                              )}
                              <div>
                                <div className="coin-name">{coin.name}</div>
                                <div className="coin-symbol">{coin.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            ${Number(coin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td>
                            <span className={isUp ? 'badge badge-above' : 'badge badge-below'}>
                              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => setChartCoin(coin)}
                              className="btn btn-secondary btn-sm"
                              title="View Chart"
                            >
                              <TrendingUp size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Notifications Feed */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Recent Notifications</h3>
                  {unreadNotifications.length > 0 && (
                    <span className="badge badge-below" style={{ fontSize: '11px' }}>
                      {unreadNotifications.length} New
                    </span>
                  )}
                </div>
                <Link to="/notifications" style={{ fontSize: '13px', fontWeight: 600 }}>
                  View All &rarr;
                </Link>
              </div>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px' }}>No price alert notifications yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>When conditions are met, notifications appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(59, 130, 246, 0.08)',
                        border: n.isRead ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(59, 130, 246, 0.25)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: n.isRead ? '#64748b' : '#3b82f6',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkNotifRead(n._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60a5fa',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Alerts Table */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Active Alerts</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Currently evaluated against live market rates on scheduled cron cycles.
                </p>
              </div>
              <Link to="/alerts" className="btn btn-secondary btn-sm">
                Manage All ({alerts.length})
              </Link>
            </div>

            {activeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <BellRing size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>No active alerts set up.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                >
                  Create Your First Alert
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Condition</th>
                      <th>Target Price</th>
                      <th>Current Price</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAlerts.slice(0, 5).map((alert) => (
                      <tr key={alert._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {alert.coinName || alert.coinSymbol} <span style={{ color: '#64748b', fontSize: '12px' }}>({alert.coinSymbol})</span>
                          </div>
                        </td>
                        <td>
                          <span className={alert.condition === 'ABOVE' ? 'badge badge-above' : 'badge badge-below'}>
                            {alert.condition === 'ABOVE' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {alert.condition}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          ${Number(alert.targetPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                          {alert.currentPrice !== null ? `$${Number(alert.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : 'Syncing...'}
                        </td>
                        <td>
                          <span className="badge badge-active">ACTIVE</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handlePauseResume(alert)}
                              className="btn btn-secondary btn-sm"
                              title="Pause Alert"
                            >
                              <Pause size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert._id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Alert"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Alert Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
        supportedCoins={coins}
      />
    </div>
  );
};

export default DashboardPage;
