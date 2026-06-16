const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllInvoices,
  createInvoice,
  getAllClients,
} = require('../controllers/admin.controller');

// Every admin route requires a valid JWT AND admin role
router.use(protect, adminOnly);

router.get('/invoices', getAllInvoices);
router.post('/invoices', createInvoice);
router.get('/clients', getAllClients);

module.exports = router;
