const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Invoice = require('../models/Invoice');

const getMyInvoices = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { client: req.user._id };
    const invoices = await Invoice.find(filter)
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'client',
      'name email company'
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (
      req.user.role === 'client' &&
      invoice.client._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You do not have access to this invoice' });
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

const createPaymentIntent = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.client.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Forbidden: This invoice does not belong to you' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({ message: 'This invoice has already been paid' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.totalAmount * 100),
      currency: 'usd',
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    invoice.stripePaymentIntentId = paymentIntent.id;
    await invoice.save();

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyInvoices, getInvoiceById, createPaymentIntent };
