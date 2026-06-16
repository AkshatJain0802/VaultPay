import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import InvoiceCard from '../components/InvoiceCard';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices').then(({ data }) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const paid = invoices.filter((i) => i.status === 'Paid');
  const unpaid = invoices.filter((i) => i.status === 'Unpaid');
  const totalOwed = unpaid.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px' }}>
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user.name}</h1>
        </div>

        <div className="stat-grid stat-grid-3">
          {[
            { label: 'Total Invoices', value: invoices.length, color: 'var(--primary)' },
            { label: 'Unpaid', value: unpaid.length, color: 'var(--warning)' },
            {
              label: 'Amount Owed',
              value: `$${totalOwed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              color: totalOwed > 0 ? 'var(--danger)' : 'var(--success)',
            },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Your Invoices</h2>
          {loading ? (
            <div className="empty-state">Loading your invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">You have no invoices yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Billed By</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceCard key={inv._id} invoice={inv} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
