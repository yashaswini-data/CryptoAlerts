import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  PlusCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AlertModal from '../components/AlertModal';
import { getAlerts, pauseAlert, resumeAlert, deleteAlert } from '../services/alertService';
import { getCoins } from '../services/coinService';
import { getNotifications } from '../services/notificationService';

const filterTabs = ['ALL', 'ACTIVE', 'TRIGGERED', 'PAUSED'];

const ManageAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supportedCoins, setSupportedCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Edit modal
  const [editingAlert, setEditingAlert] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAlertsData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [alertsRes, coinsRes, notifsRes] = await Promise.all([
        getAlerts(statusFilter),
        getCoins(),
        getNotifications(true)
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (coinsRes.coins) setSupportedCoins(coinsRes.coins);
      if (notifsRes.data) setUnreadCount(notifsRes.data.length);
    } catch (err) {
      console.warn('Failed to load alerts:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [statusFilter]);

  const handleTogglePause = async (alert) => {
    try {
      if (alert.status === 'ACTIVE') {
        await pauseAlert(alert._id);
      } else if (alert.status === 'PAUSED') {
        await resumeAlert(alert._id);
      }
      fetchAlertsData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenEdit = (alert) => {
    setEditingAlert(alert);
    setIsEditModalOpen(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter === 'ALL') return true;
    return alert.status === statusFilter;
  });

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadCount} />

      <div className="main-content">
        <Navbar unreadCount={unreadCount} />

        <main className="page-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">Manage Price Alerts</h1>
              <p className="page-subtitle">
                Monitor, pause, resume, and modify your automated cryptocurrency conditions.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => fetchAlertsData(true)}
                className="btn btn-secondary"
                disabled={refreshing}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link to="/alerts/create" className="btn btn-primary">
                <PlusCircle size={16} />
                <span>Create New Alert</span>
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filters-bar">
            <div className="tabs-group">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {filteredAlerts.length} {statusFilter.toLowerCase()} alerts found
            </div>
          </div>

          {/* Alerts Table */}
          {filteredAlerts.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <BellRing size={28} />
              </div>
              <div className="empty-state-title">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} alerts found</div>
              <p className="empty-state-text">
                {statusFilter === 'ALL'
                  ? 'You have not created any price alerts yet. Set your first alert to start monitoring price changes.'
                  : `You currently have no alerts marked as ${statusFilter}.`}
              </p>
              <Link to="/alerts/create" className="btn btn-primary">
                Create An Alert
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Cryptocurrency</th>
                    <th>Condition</th>
                    <th>Target Price</th>
                    <th>Current Price</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Triggered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => (
                    <tr key={alert._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {alert.coinName || alert.coinSymbol}
                          <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({alert.coinSymbol})</span>
                        </div>
                      </td>
                      <td>
                        <span className={alert.condition === 'ABOVE' ? 'badge badge-above' : 'badge badge-below'}>
                          {alert.condition === 'ABOVE' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {alert.condition}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '15px' }}>
                        ${Number(alert.targetPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                        {alert.currentPrice !== null
                          ? `$${Number(alert.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                          : 'Evaluating...'}
                      </td>
                      <td>
                        {alert.status === 'ACTIVE' && <span className="badge badge-active">ACTIVE</span>}
                        {alert.status === 'TRIGGERED' && <span className="badge badge-triggered">TRIGGERED</span>}
                        {alert.status === 'PAUSED' && <span className="badge badge-paused">PAUSED</span>}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {alert.status !== 'TRIGGERED' && (
                            <button
                              onClick={() => handleTogglePause(alert)}
                              className="btn btn-secondary btn-sm"
                              title={alert.status === 'ACTIVE' ? 'Pause Alert' : 'Resume Alert'}
                            >
                              {alert.status === 'ACTIVE' ? <Pause size={13} /> : <Play size={13} />}
                              <span>{alert.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(alert)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Alert"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDelete(alert._id)}
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
        </main>
      </div>

      {/* Edit Alert Modal */}
      <AlertModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAlert(null);
        }}
        onSuccess={() => fetchAlertsData()}
        editAlert={editingAlert}
        supportedCoins={supportedCoins}
      />
    </div>
  );
};

export default ManageAlertsPage;
