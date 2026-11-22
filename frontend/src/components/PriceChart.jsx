import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { getCoinHistory } from '../services/coinService';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';

const timeRanges = [
  { label: '24H', value: 1 },
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '1Y', value: 365 }
];

const PriceChart = ({ coinId = 'bitcoin', coinName = 'Bitcoin', coinSymbol = 'BTC', currentPrice = 0 }) => {
  const [days, setDays] = useState(7);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const res = await getCoinHistory(coinId, days);
        if (isMounted && res.success && res.data) {
          setChartData(res.data.prices || []);
          if (res.data.isFallback) {
            setNotice(res.data.message || 'Displaying cached price curve due to CoinGecko rate limits');
          }
        }
      } catch (err) {
        console.warn('Failed to load chart history:', err.message);
        if (isMounted) {
          setNotice('Unable to fetch live price history from external API. Please try again in a few moments.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [coinId, days]);

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : 0;
  const priceChange = chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const isPositive = priceChange >= 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{data.date}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            ${Number(data.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {coinName} ({coinSymbol.toUpperCase()})
            </span>
            <span className={isPositive ? 'badge badge-above' : 'badge badge-below'}>
              {isPositive ? '+' : ''}{priceChange !== 0 ? ((priceChange / (chartData[0]?.price || 1)) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
            ${Number(currentPrice || chartData[chartData.length - 1]?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>

        {/* Time range pills */}
        <div className="tabs-group">
          {timeRanges.map(range => (
            <button
              key={range.value}
              className={`tab-btn ${days === range.value ? 'active' : ''}`}
              onClick={() => setDays(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="notice-banner notice-warning" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div style={{
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Clock size={24} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 8px' }} />
            <div>Loading market chart data...</div>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          No historical chart data available.
        </div>
      ) : (
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                orientation="right"
                tickFormatter={(val) => `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
