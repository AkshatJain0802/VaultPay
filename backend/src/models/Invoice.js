const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: { type: [lineItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    dueDate: { type: Date, required: true },
    stripePaymentIntentId: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
