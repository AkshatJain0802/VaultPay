import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>
            VaultPay
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6, fontSize: 15 }}>
            Nexus Corporate Services — Create Account
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
            Register
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Evelyn Croft"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@nexuscorp.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>Company (optional)</label>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="Nexus Corporate Services"
              />
            </div>

            <div className="form-group">
              <label>Account Role *</label>
              <select value={form.role} onChange={set('role')} required>
                <option value="client">Client — can view & pay invoices</option>
                <option value="admin">Admin — can create & manage invoices</option>
              </select>
            </div>

            {/* Visual indicator of what role does */}
            <div
              style={{
                background: form.role === 'admin' ? '#fff3e0' : '#e3f2fd',
                border: `1px solid ${form.role === 'admin' ? '#ffcc80' : '#90caf9'}`,
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: 13,
                color: form.role === 'admin' ? '#e65100' : '#1565c0',
                marginBottom: 20,
              }}
            >
              {form.role === 'admin'
                ? 'Admin accounts can create invoices, view all clients, and access the admin dashboard.'
                : 'Client accounts can view their own invoices and make payments via Stripe.'}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
