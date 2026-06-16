import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InvoiceCard from '../components/InvoiceCard';
import api from '../api/axiosInstance';

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/invoices').then(({ data }) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const paid = invoices.filter((i) => i.status === 'Paid');
  const unpaid = invoices.filter((i) => i.status === 'Unpaid');
  const revenue = paid.reduce((s, i) => s + i.totalAmount, 0);
  const outstanding = unpaid.reduce((s, i) => s + i.totalAmount, 0);

  const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px' }}>
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <Link to="/admin/invoices/new" className="btn btn-primary">
            + Create Invoice
          </Link>
        </div>

        <div className="stat-grid stat-grid-4">
          {[
            { label: 'Total Invoices', value: invoices.length, color: 'var(--primary)' },
            { label: 'Paid', value: paid.length, color: 'var(--success)' },
            { label: 'Revenue Collected', value: fmt(revenue), color: 'var(--success)' },
            { label: 'Outstanding', value: fmt(outstanding), color: 'var(--warning)' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>All Invoices</h2>
          {loading ? (
            <div className="empty-state">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              No invoices yet.{' '}
              <Link to="/admin/invoices/new" style={{ color: 'var(--primary)' }}>
                Create the first one.
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
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
