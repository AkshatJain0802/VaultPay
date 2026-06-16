const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendReceiptEmail = async (toEmail, clientName, invoice, pdfBuffer) => {
  const transporter = createTransporter();
  const formattedAmount = invoice.totalAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const paidDate = new Date(invoice.paidAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Payment Confirmed — Invoice ${invoice.invoiceNumber} | Nexus Corporate Services`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
        <div style="background:#1a237e;padding:24px 32px;">
          <h1 style="color:white;margin:0;font-size:22px;">Nexus Corporate Services</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Billing & Finance Department</p>
        </div>
        <div style="padding:32px;">
          <div style="background:#e8f5e9;border-left:4px solid #2e7d32;padding:14px 20px;border-radius:4px;margin-bottom:24px;">
            <h2 style="color:#2e7d32;margin:0;font-size:18px;">✓ Payment Successfully Received</h2>
          </div>
          <p style="color:#424242;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#424242;">Your payment has been received and processed. Here is a summary:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:10px 0;color:#757575;font-size:13px;">Invoice Number</td>
              <td style="padding:10px 0;font-weight:600;text-align:right;">${invoice.invoiceNumber}</td>
            </tr>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <td style="padding:10px 0;color:#757575;font-size:13px;">Amount Paid</td>
              <td style="padding:10px 0;font-weight:600;text-align:right;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#757575;font-size:13px;">Payment Date</td>
              <td style="padding:10px 0;font-weight:600;text-align:right;">${paidDate}</td>
            </tr>
          </table>
          <p style="color:#424242;">Your official PDF receipt is attached to this email for your records.</p>
          <p style="color:#424242;">Thank you for your prompt payment.</p>
          <p style="color:#424242;">Best regards,<br><strong>Nexus Corporate Services — Finance Team</strong></p>
        </div>
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#9e9e9e;">
          © ${new Date().getFullYear()} Nexus Corporate Services. All rights reserved.<br>
          123 Business Ave, New York, NY 10001
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Receipt-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log(
    `[Email] messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response="${info.response}"`
  );
  return info;
};

module.exports = { sendReceiptEmail };
