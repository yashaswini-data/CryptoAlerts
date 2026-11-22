import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AlertModal from '../components/AlertModal';
import PriceChart from '../components/PriceChart';
import { getCoins } from '../services/coinService';
import { getNotifications } from '../services/notificationService';

const MarketPage = () => {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals
  const [chartCoin, setChartCoin] = useState(null);
  const [alertCoin, setAlertCoin] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const fetchMarket = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const [coinsRes, notifsRes] = await Promise.all([
        getCoins(force),
        getNotifications(true)
      ]);

      if (coinsRes.coins) {
        setCoins(coinsRes.coins);
        setLastUpdated(coinsRes.lastUpdated);
        if (coinsRes.notice) setNotice(coinsRes.notice);
        else setNotice(null);
      }
      if (notifsRes.data) {
        setUnreadCount(notifsRes.data.length);
      }
    } catch (err) {
      console.warn('Failed to fetch market data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(() => fetchMarket(false), 45000);
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAlert = (coin) => {
    setAlertCoin(coin);
    setIsAlertModalOpen(true);
  };

  return (
    <div className="app-container">
      <Sidebar unreadCount={unreadCount} />

      <div className="main-content">
        <Navbar unreadCount={unreadCount} />

        <main className="page-wrapper">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Cryptocurrency Market</h1>
              <p className="page-subtitle">
                Live cryptocurrency prices and market metrics via CoinGecko.
                {lastUpdated && ` Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => fetchMarket(true)}
                className="btn btn-secondary"
                disabled={refreshing}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{refreshing ? 'Updating...' : 'Refresh Prices'}</span>
              </button>
            </div>
          </div>

          {notice && (
            <div className="notice-banner notice-warning">
              <AlertTriangle size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* Interactive Chart Preview Modal / Box if open */}
          {chartCoin && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Historical Price Visualization</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setChartCoin(null)}
                >
                  <X size={14} />
                  <span>Close Chart</span>
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

          {/* Search bar */}
          <div className="filters-bar">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or symbol (e.g. Bitcoin, BTC)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {filteredCoins.length} of {coins.length} supported cryptocurrencies
            </div>
          </div>

          {/* Market Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cryptocurrency</th>
                  <th>Price (USD)</th>
                  <th>24h Change</th>
                  <th>24h Range</th>
                  <th>Market Cap</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin) => {
                  const isUp = (coin.price_change_percentage_24h || 0) >= 0;
                  return (
                    <tr key={coin.id}>
                      <td>
                        <div className="coin-cell">
                          {coin.image && (
                            <img src={coin.image} alt={coin.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          )}
                          <div>
                            <div className="coin-name">{coin.name}</div>
                            <div className="coin-symbol">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px' }}>
                        ${Number(coin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td>
                        <span className={isUp ? 'badge badge-above' : 'badge badge-below'}>
                          {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        <div>H: ${Number(coin.high_24h || coin.current_price * 1.02).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                        <div>L: ${Number(coin.low_24h || coin.current_price * 0.98).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', fontSize: '13px' }}>
                        ${Number(coin.market_cap || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => setChartCoin(coin)}
                            className="btn btn-secondary btn-sm"
                            title="View Historical Price Chart"
                          >
                            <TrendingUp size={14} />
                            <span>Chart</span>
                          </button>
                          <button
                            onClick={() => handleOpenAlert(coin)}
                            className="btn btn-primary btn-sm"
                            title="Set Price Alert"
                          >
                            <PlusCircle size={14} />
                            <span>Set Alert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal for setting alert */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSuccess={() => {}}
        supportedCoins={coins}
        editAlert={alertCoin ? { coinId: alertCoin.id, coinSymbol: alertCoin.symbol, targetPrice: alertCoin.current_price, condition: 'ABOVE' } : null}
      />
    </div>
  );
};

export default MarketPage;
