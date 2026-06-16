require('dotenv').config();
// Force IPv4 DNS — Windows link-local IPv6 servers block mongodb+srv:// SRV lookups
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const adminRoutes = require('./routes/admin.routes');
const webhookRoutes = require('./routes/webhook.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use('/api/webhooks', webhookRoutes);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
