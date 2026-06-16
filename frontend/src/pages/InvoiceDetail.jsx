import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ invoiceId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message);
      setLoading(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/invoices/${invoiceId}?paid=true`,
      },
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      <button
        type="submit"
        className="btn btn-success"
        style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: 15 }}
        disabled={!stripe || loading}
      >
        {loading ? 'Processing payment…' : 'Confirm Payment'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [clientSecret, setClientSecret] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [payInitLoading, setPayInitLoading] = useState(false);
  const [payInitError, setPayInitError] = useState('');
  const [paid, setPaid] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollTimeout, setPollTimeout] = useState(false);

  useEffect(() => {
    api
      .get(`/invoices/${id}`)
      .then(({ data }) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || 'Failed to load invoice.');
        setLoading(false);
      });
  }, [id]);

  const handlePayClick = async () => {
    setPayInitError('');
    setPayInitLoading(true);
    try {
      const { data } = await api.post(`/invoices/${id}/pay`);
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (err) {
      setPayInitError(err.response?.data?.message || 'Could not initiate payment.');
    } finally {
      setPayInitLoading(false);
    }
  };

  // Poll until the webhook updates the DB — the backend is the source of truth, not the browser
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setPolling(true);

    let attempts = 0;
    const MAX = 20; // 2s interval × 20 = 40s max

    const poll = async () => {
      attempts++;
      try {
        const { data } = await api.get(`/invoices/${id}`);
        if (data.status === 'Paid') {
          setInvoice(data);
          setPaid(true);
          setPolling(false);
          return;
        }
      } catch {}

      if (attempts < MAX) {
        setTimeout(poll, 2000);
      } else {
        setPolling(false);
        setPollTimeout(true);
      }
    };

    poll();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="empty-state" style={{ paddingTop: 80 }}>Loading invoice…</div>
      </>
    );
  }

  if (fetchError) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '40px 20px' }}>
          <div className="alert alert-error" style={{ maxWidth: 500, margin: '40px auto' }}>
            {fetchError}
          </div>
        </div>
      </>
    );
  }

  const isOverdue = invoice.status === 'Unpaid' && new Date(invoice.dueDate) < new Date();

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px', maxWidth: 780 }}>
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {polling && (
          <div
            style={{
              background: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: 'var(--radius)',
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 14,
              color: '#1565c0',
            }}
          >
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <strong>Payment received by Stripe.</strong> Confirming with server…
              <br />
              <span style={{ fontSize: 12, opacity: 0.8 }}>This usually takes a few seconds.</span>
            </div>
          </div>
        )}

        {pollTimeout && !paid && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            <strong>Payment was captured by Stripe</strong>, but our server hasn't confirmed it yet.
            The Stripe CLI webhook listener may not be running.{' '}
            <button
              onClick={() => { setPollTimeout(false); setPolling(true); handlePaymentSuccess(); }}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Retry
            </button>{' '}
            or refresh in a minute.
          </div>
        )}

        {paid && (
          <div className="alert alert-success" style={{ marginBottom: 24, fontSize: 15 }}>
            Payment confirmed! A PDF receipt has been dispatched to your email address.
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {invoice.invoiceNumber}
              </h1>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Issued {new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <span
              className={`badge ${
                invoice.status === 'Paid'
                  ? 'badge-paid'
                  : isOverdue
                  ? 'badge-overdue'
                  : 'badge-unpaid'
              }`}
              style={{ fontSize: 13, padding: '5px 16px' }}
            >
              {invoice.status === 'Paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Bill To
              </p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{invoice.client?.name}</p>
              {invoice.client?.company && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{invoice.client.company}</p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{invoice.client?.email}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Payment Details
              </p>
              <p style={{ fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Due:</span>{' '}
                <span style={{ fontWeight: 600, color: isOverdue && invoice.status !== 'Paid' ? 'var(--danger)' : undefined }}>
                  {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </p>
              {invoice.paidAt && (
                <p style={{ fontSize: 14, marginTop: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Paid on:</span>{' '}
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </p>
              )}
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              textAlign: 'right',
              padding: '16px 0 0',
              borderTop: '2px solid var(--border)',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              Total: $
              {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {invoice.notes && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: 'var(--radius)',
                borderLeft: '3px solid var(--border)',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Notes
              </p>
              <p style={{ fontSize: 14 }}>{invoice.notes}</p>
            </div>
          )}
        </div>

        {invoice.status === 'Unpaid' && user?.role === 'client' && !showPayment && (
          <>
            {payInitError && <div className="alert alert-error">{payInitError}</div>}
            <button
              onClick={handlePayClick}
              className="btn btn-success"
              style={{ width: '100%', padding: '15px', fontSize: 16 }}
              disabled={payInitLoading}
            >
              {payInitLoading
                ? 'Initialising payment…'
                : `Pay $${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Now`}
            </button>
          </>
        )}

        {showPayment && clientSecret && (
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Secure Card Payment</h2>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#1a237e' } },
              }}
            >
              <CheckoutForm invoiceId={id} onSuccess={handlePaymentSuccess} />
            </Elements>
          </div>
        )}
      </div>
    </>
  );
}
