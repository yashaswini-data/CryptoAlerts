import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Bell,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { getCoins } from '../services/coinService';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const data = await getCoins();
        if (data.coins) {
          setCoins(data.coins.slice(0, 4));
        }
      } catch (err) {
        console.warn('Landing market fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <span>CryptoAlerts</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '250px',
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#60a5fa',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <Zap size={14} />
            Real-Time Automated Price Sentinel
          </div>

          <h1 style={{
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: '#ffffff'
          }}>
            Never Miss a Crypto Move with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Event-Driven Alerts
            </span>
          </h1>

          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            maxWidth: '680px',
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Set customized ABOVE or BELOW price threshold conditions. Monitored continuously via CoinGecko, orchestrated by RabbitMQ message queues, and delivered instantly.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
              <span>Start Monitoring Now</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/market" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '16px' }}>
              Explore Live Market
            </Link>
          </div>
        </div>
      </section>

      {/* Live Market Ticker Cards */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {coins.map((coin) => {
            const isUp = (coin.price_change_percentage_24h || 0) >= 0;
            return (
              <div key={coin.id} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {coin.image && (
                      <img src={coin.image} alt={coin.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{coin.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{coin.symbol}</div>
                    </div>
                  </div>
                  <span className={isUp ? 'badge badge-above' : 'badge badge-below'}>
                    {isUp ? '+' : ''}{(coin.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  ${Number(coin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture & Feature Highlights */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 100px',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Enterprise-Grade Architecture
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Built for reliability and low-latency alert dispatching with production software patterns.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
              marginBottom: '18px'
            }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              CoinGecko Market Feed
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              Batch-fetched cryptocurrency rates for top assets with in-memory caching to eliminate redundant external calls and honor API rate limits.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a78bfa',
              marginBottom: '18px'
            }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              RabbitMQ Event Pipeline
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              Decoupled asynchronous notification publishing with durable queues, manual message acknowledgments, and dead-letter queue routing.
            </p>
          </div>

          <div className="card">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              marginBottom: '18px'
            }}>
              <Database size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              MongoDB Idempotency
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              Atomic trigger status state transitions prevent race conditions, while unique event IDs guarantee no duplicate notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '40px 24px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <Activity size={18} color="#3b82f6" />
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>CryptoAlerts</span>
        </div>
        <div>Engineered for real-time cryptocurrency threshold monitoring and event-driven notifications.</div>
        <div style={{ marginTop: '8px' }}>&copy; {new Date().getFullYear()} CryptoAlerts. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
