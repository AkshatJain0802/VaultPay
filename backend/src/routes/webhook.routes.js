const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhook.controller');

// express.raw() is critical — Stripe signature verification requires the raw request body
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

module.exports = router;
