<div align="center">

# VaultPay Financial Core

**A full-stack B2B invoice management and payment portal**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

*Administrators create and assign invoices. Clients view and pay them online. Payments are confirmed server-side via Stripe webhooks — never by the browser.*

</div>

---

## What Is VaultPay?

VaultPay is a corporate billing portal that replaces manual invoice PDFs and bank transfers with a self-service online payment experience. It is built with security as a primary requirement:

- No invoice can be accessed or paid by anyone other than the client it was issued to.
- An invoice is **never** marked paid by a frontend call — only by a cryptographically verified Stripe webhook event.
- On successful payment, a **PDF receipt is generated and emailed automatically** — no admin action needed.

---

## Features

| | Feature |
|---|---|
| 🔐 | **JWT authentication** with `admin` and `client` roles |
| 🧾 | **Line-item invoices** with quantities, unit prices, due dates, and auto-totals |
| 💳 | **Stripe PaymentIntents + Stripe Elements** for in-browser card collection |
| 🔒 | **Webhook-driven payment confirmation** — Stripe's signature is verified server-side before any status change |
| 📄 | **Auto-generated PDF receipts** via PDFKit |
| 📧 | **Automated email delivery** of receipts via Nodemailer |
| 🛡️ | **IDOR protection** — ownership is enforced on every invoice read and pay request |
| 📊 | **Admin dashboard** with revenue collected, outstanding totals, and full invoice table |
| 🚦 | **Rate limiting**, Helmet security headers, and strict CORS |

---

## Tech Stack

### Backend — `backend/`
| Layer | Technology |
|---|---|
| Runtime & Framework | Node.js 18 + Express 4 |
| Database | MongoDB Atlas + Mongoose 8 |
| Authentication | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` |
| Payments | Stripe Node SDK v15 |
| PDF Generation | PDFKit |
| Email | Nodemailer (SMTP) |
| Security | Helmet · CORS · express-rate-limit |

### Frontend — `frontend/`
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Payment UI | `@stripe/react-stripe-js` · `@stripe/stripe-js` |

---

## How It Works

### User Roles

**Admin**
- Creates client accounts and issues invoices with line items
- Views a live dashboard: total invoices, paid count, revenue collected, and outstanding amount
- Can see all invoices across all clients

**Client**
- Logs in and sees only their own invoices
- Opens an invoice, clicks **Pay**, and completes checkout via Stripe Elements
- Receives a PDF receipt by email automatically after payment

### Payment Flow

```
Client browser                  Backend (Express)                  Stripe
──────────────                  ─────────────────                  ──────
1. Click "Pay"       ────────►  POST /api/invoices/:id/pay
                                 • Verify JWT
                                 • Verify client owns invoice
                                 • Create PaymentIntent   ────────►  Stripe API
                                 • Return clientSecret    ◄────────
2. Stripe Elements   ◄────────  clientSecret received
   collects card
3. confirmPayment()  ────────►  Stripe charges card
                                                          ◄────────  payment_intent.succeeded
                                POST /api/webhooks/stripe ◄────────  webhook event
                                 • Verify Stripe signature
                                 • Mark invoice Paid
                                 • Generate PDF receipt
                                 • Email receipt to client
4. Frontend polls    ◄────────  GET /api/invoices/:id → status: "Paid"
   → shows success banner
```

> The frontend polls the backend after Stripe confirms in-browser. The invoice status changes **only when the webhook arrives and passes signature verification** — not when the browser reports success.

---

## Project Structure

```
Vault Pay Financial/
│
├── backend/
│   └── src/
│       ├── config/
│       │   └── db.js                    # MongoDB connection
│       │
│       ├── controllers/
│       │   ├── auth.controller.js        # register · login · /me
│       │   ├── invoice.controller.js     # client invoice reads + PaymentIntent creation
│       │   ├── admin.controller.js       # admin invoice & client management
│       │   └── webhook.controller.js     # Stripe event handler
│       │
│       ├── middleware/
│       │   ├── auth.js                    # protect (JWT) · adminOnly (RBAC)
│       │   └── errorHandler.js
│       │
│       ├── models/
│       │   ├── User.js                    # name · email · hashed password · role · company
│       │   └── Invoice.js                 # line items · status · dueDate · stripePaymentIntentId
│       │
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── invoice.routes.js
│       │   ├── admin.routes.js
│       │   └── webhook.routes.js
│       │
│       ├── utils/
│       │   ├── pdfGenerator.js            # PDFKit invoice receipt builder
│       │   └── emailSender.js             # Nodemailer receipt sender
│       │
│       └── index.js                       # App entry — middleware order is critical (webhook before express.json)
│
└── frontend/
    └── src/
        ├── api/
        │   └── axiosInstance.js           # Base Axios client with JWT Authorization header
        │
        ├── components/
        │   ├── Navbar.jsx
        │   ├── InvoiceCard.jsx
        │   └── ProtectedRoute.jsx
        │
        ├── context/
        │   └── AuthContext.jsx            # Auth state, JWT persistence in localStorage
        │
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── ClientDashboard.jsx        # Client invoice list
            ├── AdminDashboard.jsx         # Admin stats + full invoice table
            ├── InvoiceDetail.jsx          # Invoice view + Stripe Elements checkout
            └── CreateInvoice.jsx          # Admin invoice creation form
```

---

## Security Architecture

VaultPay enforces defence-in-depth at every layer.

### Authentication & Authorization

Every protected route passes through the `protect` middleware, which validates the JWT and attaches the decoded user to `req.user`. Admin routes additionally pass through `adminOnly`, which returns `403` if `req.user.role !== 'admin'`.

### IDOR Prevention

```
GET  /api/invoices/:id   →  403 if invoice.client !== req.user._id
POST /api/invoices/:id/pay  →  403 if invoice.client !== req.user._id
```

A client can never read or initiate payment on another client's invoice, regardless of whether they guess or brute-force the MongoDB ObjectId.

### Webhook Integrity

```javascript
// The Stripe signature check runs BEFORE express.json() parses the body.
// Stripe's HMAC requires the raw Buffer — a parsed object will always fail.
event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

The webhook route is registered **before** `express.json()` in the Express middleware chain and uses `express.raw()` to receive the raw buffer. Any request that fails signature verification receives a `400` and no database write occurs.

### Password Security

Passwords are hashed with bcrypt at cost factor 12 via a Mongoose pre-save hook. Plain-text passwords are never stored or logged.

### Transport Security

| Control | Implementation |
|---|---|
| Security headers | `helmet()` |
| CORS | `origin: process.env.CLIENT_URL` — no wildcard |
| Rate limiting | 100 requests / 15 minutes per IP on all `/api` routes |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- A **MongoDB** database (free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster works)
- A **Stripe** account in [test mode](https://stripe.com/docs/testing) and the [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhooks
- An **SMTP email** account (Gmail with an [App Password](https://support.google.com/accounts/answer/185833) is easiest)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/vaultpay-financial.git
cd "vaultpay-financial"
```

---

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in your own values (see [Environment Variables](#environment-variables) below).

```bash
npm run dev
# → Server running on http://localhost:5000
```

---

### 3. Set up the frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

Open `frontend/.env` and set your Stripe **publishable** key (starts with `pk_`):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
npm run dev
# → App running on http://localhost:5173
```

---

### 4. Forward Stripe webhooks (local development)

In a third terminal, start the Stripe CLI listener and copy the printed `whsec_...` signing secret into `backend/.env`:

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
# > Ready! Your webhook signing secret is whsec_abc123...
```

Update `STRIPE_WEBHOOK_SECRET` in `backend/.env` with that value, then restart the backend.

---

### 5. Create your first admin account

Register a user via `POST /api/auth/register`, then manually set `role: "admin"` in MongoDB Compass or Atlas for that user document. All subsequent accounts registered through the UI default to the `client` role.

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/vaultpay

# JWT
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=VaultPay <you@example.com>

# CORS
CLIENT_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> **Security note:** Never commit a populated `.env` file. Both `.env` files are listed in `.gitignore`. The `.env.example` files should contain only placeholder values.

---

## API Reference

**Base URL:** `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Authenticate and receive a JWT |
| `GET` | `/auth/me` | Bearer | Return the current user's profile |

### Invoices (client-facing)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/invoices` | Bearer | List the caller's own invoices |
| `GET` | `/invoices/:id` | Bearer | Get a single invoice (ownership enforced — 403 otherwise) |
| `POST` | `/invoices/:id/pay` | Bearer | Create a Stripe PaymentIntent; returns `{ clientSecret }` |

### Admin

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/admin/invoices` | Bearer + admin | List every invoice in the system |
| `POST` | `/admin/invoices` | Bearer + admin | Create a new invoice for a client |
| `GET` | `/admin/clients` | Bearer + admin | List all registered client users |

### Webhooks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/webhooks/stripe` | Stripe signature | Handles `payment_intent.succeeded` — marks invoice paid, generates PDF, sends email |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns `{ status: "OK", timestamp }` |

---

## Testing Stripe Payments

Use Stripe's test card numbers in Stripe Elements:

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Use any future expiry date, any 3-digit CVC, and any 5-digit zip code.

---

## Available Scripts

### Backend

```bash
npm run dev     # Start with nodemon (hot reload)
npm start       # Start in production mode
```

### Frontend

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
```

---

## License

Proprietary — built for Nexus Corporate Services. All rights reserved.
