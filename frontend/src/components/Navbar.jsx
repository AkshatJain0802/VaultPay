import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homeLink = user?.role === 'admin' ? '/admin' : '/';

  return (
    <nav
      style={{
        background: 'var(--primary)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        to={homeLink}
        style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}
      >
        VaultPay
        <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>
          Nexus Corporate Services
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user?.role === 'admin' && (
          <Link
            to="/admin/invoices/new"
            style={{ color: '#90caf9', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
          >
            + New Invoice
          </Link>
        )}

        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{user?.name}</span>

        <span
          style={{
            background: user?.role === 'admin' ? '#ef6c00' : '#1565c0',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {user?.role}
        </span>

        <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: 13, padding: '5px 14px' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
