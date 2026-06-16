import { Link } from 'react-router-dom';

export default function InvoiceCard({ invoice }) {
  const isOverdue =
    invoice.status === 'Unpaid' && new Date(invoice.dueDate) < new Date();

  const badgeClass = invoice.status === 'Paid'
    ? 'badge badge-paid'
    : isOverdue
    ? 'badge badge-overdue'
    : 'badge badge-unpaid';

  const badgeLabel = invoice.status === 'Paid'
    ? 'Paid'
    : isOverdue
    ? 'Overdue'
    : 'Unpaid';

  return (
    <tr>
      <td>
        <span style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</span>
      </td>
      <td>{invoice.client?.name ?? '—'}</td>
      <td>${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td style={{ color: isOverdue ? 'var(--danger)' : undefined }}>
        {new Date(invoice.dueDate).toLocaleDateString('en-US')}
      </td>
      <td>
        <span className={badgeClass}>{badgeLabel}</span>
      </td>
      <td>
        <Link
          to={`/invoices/${invoice._id}`}
          className="btn btn-primary"
          style={{ padding: '5px 14px', fontSize: 13 }}
        >
          View
        </Link>
      </td>
    </tr>
  );
}
