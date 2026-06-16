import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

const blankItem = () => ({ description: '', quantity: 1, unitPrice: '' });

export default function CreateInvoice() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([blankItem()]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/clients').then(({ data }) => setClients(data));
  }, []);

  const updateItem = (index, field, value) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/invoices', {
        clientId,
        items: items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
        dueDate,
        notes,
      });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px', maxWidth: 780 }}>
        <button className="back-link" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Create New Invoice</h1>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ''} — {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={minDate}
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>
                  LINE ITEMS
                </label>
                <button
                  type="button"
                  className="btn"
                  onClick={addItem}
                  style={{ background: '#e3f2fd', color: '#1565c0', padding: '6px 14px', fontSize: 13 }}
                >
                  + Add Item
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 120px 32px',
                  gap: 8,
                  marginBottom: 6,
                  paddingLeft: 2,
                }}
              >
                {['Description', 'Qty', 'Unit Price ($)', ''].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {h}
                  </span>
                ))}
              </div>

              {items.map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 32px', gap: 8, marginBottom: 8 }}
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="e.g. Strategy Consulting — Q3"
                    style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                    required
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    min="1"
                    style={{ padding: '10px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                    required
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: items.length === 1 ? 'default' : 'pointer',
                      color: items.length === 1 ? '#ccc' : 'var(--danger)',
                      fontSize: 22,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div
                style={{
                  textAlign: 'right',
                  padding: '14px 0 0',
                  borderTop: '2px solid var(--border)',
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Payment terms, project reference, additional instructions…"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '13px' }}
                disabled={loading}
              >
                {loading ? 'Creating Invoice…' : 'Create Invoice'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => navigate('/admin')}
                style={{ background: '#f5f5f5', color: '#424242', padding: '13px 24px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
