import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellPlus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getCoins } from '../services/coinService';
import { createAlert } from '../services/alertService';
import { getNotifications } from '../services/notificationService';

const CreateAlertPage = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCoins = async () => {
      try {
        const [coinsRes, notifsRes] = await Promise.all([
          getCoins(),
          getNotifications(true)
        ]);
        if (coinsRes.coins) {
          setCoins(coinsRes.coins);
          // Set initial target price close to current price
          const btc = coinsRes.coins.find(c => c.id === 'bitcoin');
          if (btc) {
            setTargetPrice(Math.round(btc.current_price * 1.05).toString());
          }
        }
        if (notifsRes.data) {
          setUnreadCount(notifsRes.data.length);
        }
      } catch (err) {
        console.warn('Load coins failed:', err.message);
      }
    };
    loadCoins();
  }, []);

  const selectedCoin = coins.find(c => c.id === selectedCoinId);
  const currentLivePrice = selectedCoin?.current_price || 0;

  // Handle coin change
  const handleCoinChange = (coinId) => {
    setSelectedCoinId(coinId);
    const coin = coins.find(c => c.id === coinId);
    if (coin) {
      const mult = condition === 'ABOVE' ? 1.05 : 0.95;
      setTargetPrice(Number((coin.current_price * mult).toFixed(coin.current_price > 10 ? 2 : 4)).toString());
    }
  };

  // Quick percentage shortcuts
  const handleQuickPercent = (pct) => {
    if (!currentLivePrice) return;
    const newPrice = currentLivePrice * (1 + pct / 100);
    setTargetPrice(Number(newPrice.toFixed(newPrice > 10 ? 2 : 4)).toString());
    if (pct > 0) setCondition('ABOVE');
    else if (pct < 0) setCondition('BELOW');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Target price must be a valid positive number.');
      return;
    }

    setLoading(true);
    try {
      await createAlert({
        coinId: selectedCoinId,
        targetPrice: priceNum,
        condition
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/alerts');
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create price alert';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Delta calculation
  let priceDeltaText = '';
  if (currentLivePrice > 0 && targetPrice && !isNaN(parseFloat(targetPrice))) {
    const diff = parseFloat(targetPrice) - currentLivePrice;
    const pct = ((diff / currentLivePrice) * 100).toFixed(2);
    if (diff > 0) {
      priceDeltaText = `Target is +${pct}% above current market price ($${currentLivePrice.toLocaleString()})`;
    } else if (diff < 0) {
      priceDeltaText = `Target is ${pct}% below current market price ($${currentLivePrice.toLocaleString()})`;
    } else {
      priceDeltaText = 'Target price equals current market price';
    }
  }

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadCount} />

      <div className="main-content">
        <Navbar unreadCount={unreadCount} />

        <main className="page-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">Create Price Alert</h1>
              <p className="page-subtitle">
                Set conditions to receive automated alerts when threshold prices are satisfied.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="card">
              {error && (
                <div className="notice-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="notice-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                  <CheckCircle2 size={16} />
                  <span>Alert successfully registered! Redirecting to Manage Alerts...</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Coin selection */}
                <div className="form-group">
                  <label className="form-label">1. Choose Cryptocurrency</label>
                  <select
                    className="form-select"
                    value={selectedCoinId}
                    onChange={(e) => handleCoinChange(e.target.value)}
                  >
                    {coins.map((coin) => (
                      <option key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()}) — ${Number(coin.current_price).toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {/* Selected Coin live reference box */}
                  {selectedCoin && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {selectedCoin.image && (
                          <img src={selectedCoin.image} alt={selectedCoin.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        )}
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Current Live Price:</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '16px', color: '#fff' }}>
                        ${Number(selectedCoin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Condition Selector */}
                <div className="form-group">
                  <label className="form-label">2. Trigger Condition</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setCondition('ABOVE')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: condition === 'ABOVE' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: condition === 'ABOVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: condition === 'ABOVE' ? '#10b981' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ArrowUpRight size={18} />
                      <span>Rises ABOVE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCondition('BELOW')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: condition === 'BELOW' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: condition === 'BELOW' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        color: condition === 'BELOW' ? '#ef4444' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ArrowDownRight size={18} />
                      <span>Drops BELOW</span>
                    </button>
                  </div>
                </div>

                {/* Target Price */}
                <div className="form-group">
                  <label className="form-label">3. Target Price (USD)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '18px',
                      fontWeight: 600
                    }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.00000001"
                      className="form-input"
                      style={{ paddingLeft: '36px', fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      required
                    />
                  </div>

                  {priceDeltaText && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                      {priceDeltaText}
                    </div>
                  )}

                  {/* Quick percentage adjustment buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>Quick Presets:</span>
                    {[-10, -5, -2, 2, 5, 10].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleQuickPercent(pct)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '16px' }}
                  disabled={loading || success}
                >
                  <BellPlus size={18} />
                  <span>{loading ? 'Creating Alert...' : 'Activate Price Alert'}</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateAlertPage;
