import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #0288d1 100%)',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>
            VaultPay
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6, fontSize: 15 }}>
            Nexus Corporate Services — Client Portal
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
            Sign In
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nexuscorp.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', marginTop: 6, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link
            to="/register"
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.4)',
              paddingBottom: 1,
            }}
          >
            Create a new account →
          </Link>
        </p>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 16 }}>
          Secured by 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}
