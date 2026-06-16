const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendReceiptEmail } = require('../utils/emailSender');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // raw buffer required — Stripe HMAC verification fails on a parsed object
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (!invoiceId) {
      console.warn('[Webhook] payment_intent.succeeded missing invoiceId in metadata');
      return res.json({ received: true });
    }

    try {
      const invoice = await Invoice.findById(invoiceId).populate(
        'client',
        'name email company'
      );

      if (!invoice) {
        console.warn(`[Webhook] Invoice ${invoiceId} not found`);
        return res.json({ received: true });
      }

      if (invoice.status === 'Paid') {
        // Already processed (Stripe can send duplicate events)
        return res.json({ received: true });
      }

      invoice.status = 'Paid';
      invoice.paidAt = new Date();
      await invoice.save();
      console.log(`[Webhook] Invoice ${invoice.invoiceNumber} marked as Paid`);

      const pdfBuffer = await generateInvoicePDF(invoice);
      console.log(`[Webhook] PDF generated for ${invoice.invoiceNumber}`);

      await sendReceiptEmail(
        invoice.client.email,
        invoice.client.name,
        invoice,
        pdfBuffer
      );
      console.log(`[Webhook] Receipt emailed to ${invoice.client.email}`);
    } catch (err) {
      console.error('[Webhook] Processing error:', err);
      // Return 200 anyway so Stripe doesn't keep retrying a non-recoverable error
    }
  }

  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
