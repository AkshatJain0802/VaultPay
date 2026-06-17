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
      <div className="container form-page">
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

            <div className="line-items">
              <div className="line-items-header">
                <label className="section-label">LINE ITEMS</label>
                <button type="button" className="btn btn-add-item" onClick={addItem}>
                  + Add Item
                </button>
              </div>

              <div className="line-items-cols">
                {['Description', 'Qty', 'Unit Price ($)', ''].map((h) => (
                  <span key={h} className="col-head">
                    {h}
                  </span>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} className="line-items-row">
                  <input
                    type="text"
                    className="line-input"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="e.g. Strategy Consulting — Q3"
                    required
                  />
                  <input
                    type="number"
                    className="line-input line-input--center"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    className="line-input"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="line-items-total">
                <span className="line-items-total-value">
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

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-submit"
                disabled={loading}
              >
                {loading ? 'Creating Invoice…' : 'Create Invoice'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin')}
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
