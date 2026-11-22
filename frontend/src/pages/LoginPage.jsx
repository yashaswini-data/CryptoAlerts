import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('trader@cryptoalerts.io');
    setPassword('crypto123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #111a2e 0%, #0a0e17 70%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '40px', height: '40px' }}>
              <Activity size={22} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>CryptoAlerts</span>
          </Link>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            Sign in to manage your active cryptocurrency alerts
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {error && (
            <div className="notice-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  required
                  placeholder="trader@example.com"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Credentials shortcut for evaluation */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
            >
              <Sparkles size={14} color="#60a5fa" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
