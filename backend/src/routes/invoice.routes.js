const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyInvoices,
  getInvoiceById,
  createPaymentIntent,
} = require('../controllers/invoice.controller');

// All invoice routes require a valid JWT
router.use(protect);

router.get('/', getMyInvoices);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', createPaymentIntent);

module.exports = router;
