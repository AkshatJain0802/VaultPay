const Invoice = require('../models/Invoice');
const User = require('../models/User');

const getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { clientId, items, dueDate, notes } = req.body;

    if (!clientId || !items?.length || !dueDate) {
      return res
        .status(400)
        .json({ message: 'clientId, items, and dueDate are required' });
    }

    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({ message: 'Client not found' });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      client: clientId,
      items,
      totalAmount,
      dueDate,
      notes,
    });

    await invoice.populate('client', 'name email company');
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

const getAllClients = async (req, res, next) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password').sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllInvoices, createInvoice, getAllClients };
