import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { updateAlert, createAlert } from '../services/alertService';

const AlertModal = ({ isOpen, onClose, onSuccess, editAlert = null, supportedCoins = [] }) => {
  const [coinId, setCoinId] = useState('bitcoin');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editAlert) {
      setCoinId(editAlert.coinId);
      setTargetPrice(editAlert.targetPrice.toString());
      setCondition(editAlert.condition);
    } else {
      setCoinId('bitcoin');
      setTargetPrice('');
      setCondition('ABOVE');
    }
    setError(null);
  }, [editAlert, isOpen]);

  if (!isOpen) return null;

  const selectedCoinData = supportedCoins.find(c => c.id === coinId);
  const currentLivePrice = selectedCoinData?.current_price || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Target price must be a valid number greater than 0.');
      return;
    }

    setLoading(true);
    try {
      if (editAlert) {
        await updateAlert(editAlert._id, {
          targetPrice: priceNum,
          condition
        });
      } else {
        await createAlert({
          coinId,
          targetPrice: priceNum,
          condition
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save alert';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Price comparison calculation
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {editAlert ? `Edit Alert: ${editAlert.coinSymbol || editAlert.coinId.toUpperCase()}` : 'Create Price Alert'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="notice-banner notice-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!editAlert && (
              <div className="form-group">
                <label className="form-label">Select Cryptocurrency</label>
                <select
                  className="form-select"
                  value={coinId}
                  onChange={(e) => setCoinId(e.target.value)}
                >
                  {supportedCoins.map(coin => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol.toUpperCase()}) — ${coin.current_price?.toLocaleString() || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Alert Trigger Condition</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  style={{
                    padding: '12px',
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
                    fontSize: '14px'
                  }}
                >
                  <ArrowUpRight size={18} />
                  <span>Price Rises ABOVE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  style={{
                    padding: '12px',
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
                    fontSize: '14px'
                  }}
                >
                  <ArrowDownRight size={18} />
                  <span>Price Drops BELOW</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Price (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.00000001"
                  className="form-input"
                  style={{ paddingLeft: '32px', fontFamily: 'var(--font-mono)', fontSize: '16px' }}
                  placeholder="0.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  required
                />
              </div>
              {priceDeltaText && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  {priceDeltaText}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : editAlert ? 'Update Alert' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertModal;
