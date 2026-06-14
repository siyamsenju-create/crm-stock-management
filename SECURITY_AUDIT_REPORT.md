# 🔐 Security Audit Report
## CRM Stock Management — Pre-Production Security Assessment

**Audit Date:** 2026-06-06  
**Auditor:** Antigravity (AI Security Review)  
**Scope:** Full-stack (React + Vite frontend · Node.js/Express backend · MongoDB · Firebase Auth)  
**Total Findings:** 22  

---

## Executive Summary

The application has a **solid security foundation** — bcrypt password hashing, JWT-based auth with refresh rotation, Joi validation middleware, Helmet headers, role-based access control, and NoSQL injection guards are all in place. However, **two Critical findings** and **several High-severity issues** must be resolved before production deployment. The most dangerous issues are an **unauthenticated database-wipe endpoint** and **live production credentials present in `.env` files**.

---

## Severity Overview

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 7 |
| 🟡 Medium | 8 |
| 🔵 Low | 5 |
| **Total** | **22** |

---

## 🔴 CRITICAL Findings

---

### C-01 — Unauthenticated Factory Reset Endpoint

**Vulnerability:** The `factory-reset` route has **no authentication or authorization middleware**. Any anonymous user — or automated bot — can call `POST /api/v1/settings/factory-reset` over the internet and wipe the entire products and transactions database.

**Impact:** Complete, irreversible data loss with zero credentials required. This is the highest-risk endpoint in the application.

**Affected Files:**
- [settings.routes.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/routes/settings.routes.js)
- [settings.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/settings.controller.js)
- [Settings.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Settings.jsx)

**Exact Code Location:**

```js
// backend/src/routes/settings.routes.js — Line 5
router.post('/factory-reset', factoryReset);  // ❌ No protect, no authorize
```

```jsx
// src/pages/Settings.jsx — Lines 48-55
await fetch('http://localhost:5005/api/v1/settings/factory-reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})  // ⚠️ Token is optional — backend doesn't require it
  }
});
```

**Recommended Fix:**

```js
// ✅ SECURE: backend/src/routes/settings.routes.js
const { protect, authorize } = require('../middlewares/auth.middleware');

router.post(
  '/factory-reset',
  protect,                  // Must be logged in
  authorize('Admin'),       // Must be Admin role
  factoryReset
);
```

```js
// ✅ SECURE: backend/src/controllers/settings.controller.js
exports.factoryReset = asyncHandler(async (req, res) => {
  logger.warn('Factory reset initiated', {
    userId: req.user._id,
    email: req.user.email,
    role: req.user.role,
    ip: req.ip,
  });

  await Product.deleteMany({});
  await Transaction.deleteMany({});
  await Order.deleteMany({});
  await Customer.deleteMany({});

  sendSuccess(res, 200, 'Factory reset successful. All data cleared.');
});
```

---

### C-02 — Live Production Credentials in `.env` Files

**Vulnerability:** The root `.env` file contains real, live production credentials including a Neon PostgreSQL password, Firebase API key, and Supabase publishable key. Even though `.env` is in `.gitignore`, these secrets are present on disk and exposed to any CI/CD system, cloud IDE, or developer machine that clones the repo.

**Impact:** Full compromise of the Neon database (read/write all data), Firebase project abuse (auth token forgery, storage abuse), and Supabase data exposure.

**Affected File:** [.env](file:///Users/siyammeshak/Downloads/crm-stock-management/.env)

**Exact Secrets Found:**

```
# .env — Lines 2-3, 18, 21-26
VITE_SUPABASE_URL=https://ilpltxzfaemtegjykmjk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Va47EGOGrUgPTO6ClRU_rw_Nm77BQMN

DATABASE_URL="postgresql://neondb_owner:npg_GdIB6g0qvLPQ@ep-wandering-lab-..."

VITE_FIREBASE_API_KEY="AIzaSyC5zW9OwbcoqFh34SllcZq_NUrMFRx_iLo"
VITE_FIREBASE_PROJECT_ID="crm-project-management-f21f3"
```

> [!CAUTION]
> The Neon connection string contains the database password `npg_GdIB6g0qvLPQ` in plain text. **Rotate this credential immediately** in the Neon dashboard, regardless of whether it was ever git-committed.

**Recommended Fix:**
1. **Immediately rotate** all exposed credentials (Neon password, Firebase API key, Supabase key).
2. Use `.env.example` (already present in `backend/`) as the only committed reference — never actual values.
3. For CI/CD, inject secrets via pipeline secret stores (GitHub Actions Secrets, etc.).
4. Add a pre-commit hook using `detect-secrets` to prevent future leaks.

```bash
# Install pre-commit secret scanner
npm install --save-dev detect-secrets
detect-secrets scan > .secrets.baseline
echo '#!/bin/sh\ndetect-secrets-hook --baseline .secrets.baseline "$@"' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## 🟠 HIGH Findings

---

### H-01 — Privilege Escalation via Mass Assignment in `updateProfile`

**Vulnerability:** `auth.controller.js` uses a blind loop to apply all `req.body` keys directly to the user document. The Joi schema for this endpoint also explicitly allows `role` as an optional updatable field — meaning any authenticated user can promote themselves to Admin.

**Affected Files:**
- [auth.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/auth.controller.js) — Lines 219–222
- [auth.validation.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/validations/auth.validation.js) — Line 48

**Exact Code Location:**

```js
// auth.controller.js — Lines 219-222 ❌
const updates = Object.keys(req.body);
updates.forEach((update) => {
  user[update] = req.body[update];   // ❌ Any field: 'role', 'refreshToken', '_id', etc.
});
```

```js
// auth.validation.js — Line 48 ❌
role: Joi.string().valid('Admin', 'Manager', 'User').optional(),  // ❌ Any user can self-elevate
```

**Attack Scenario:** `PUT /api/v1/auth/profile` with body `{"role":"Admin"}` → attacker becomes Admin with full data deletion rights.

**Recommended Fix:**

```js
// ✅ SECURE: auth.controller.js
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw AppError.notFound('User not found');

  // Explicit allowlist — 'role' is NOT included
  const ALLOWED_FIELDS = ['name', 'company', 'language', 'timezone', 'notifications'];
  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  // Email change: check for uniqueness
  if (req.body.email && req.body.email !== user.email) {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) throw AppError.conflict('Email already in use.');
    user.email = req.body.email;
  }

  // Password change: require current password
  if (req.body.password) {
    if (!req.body.currentPassword) throw AppError.badRequest('Current password is required.');
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) throw AppError.unauthorized('Current password is incorrect.');
    user.password = req.body.password;
  }

  await user.save();
  sendSuccess(res, 200, 'Profile updated successfully', {
    _id: user._id, name: user.name, email: user.email, role: user.role,
  });
});
```

```js
// ✅ SECURE: auth.validation.js — remove 'role', add 'currentPassword'
updateProfile: {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).optional(),
    email: Joi.string().trim().email().lowercase().optional(),
    company: Joi.string().trim().allow('', null).optional(),
    language: Joi.string().trim().optional(),
    timezone: Joi.string().trim().optional(),
    currentPassword: Joi.string().min(6).optional(),
    password: Joi.string().min(8).max(72).optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
    }).optional(),
    // ❌ 'role' removed — use a dedicated admin endpoint for role changes
  }).min(1),
},
```

---

### H-02 — JWT Tokens Stored in `localStorage` (XSS-Accessible)

**Vulnerability:** Access tokens are stored in `localStorage` via `localStorage.setItem('token', token)`. Any XSS vulnerability — including in a third-party script or a browser extension — can silently exfiltrate all tokens.

**Affected Files:**
- [store.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/store.js) — Lines 13, 56, 69
- [client.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/api/client.js) — Line 14

**Exact Code Location:**

```js
// store.js — Line 13
localStorage.setItem('token', token);   // ❌ XSS-readable

// client.js — Line 14
const token = localStorage.getItem('token');  // ❌ XSS-readable
```

**Recommended Fix:** Use `httpOnly` cookies set by the server — invisible to JavaScript entirely.

```js
// ✅ SECURE: backend auth.controller.js — set cookies alongside JSON
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};
res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
res.cookie('refreshToken', refreshToken, {
  ...cookieOpts,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth/refresh',
});
```

```js
// ✅ SECURE: auth.middleware.js — read token from cookie first
const token = req.cookies?.accessToken ||
  (req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1] : null);
```

---

### H-03 — Sensitive Debug Logs Printed to stdout via `console.log` in Production Code

**Vulnerability:** The Google Login controller logs the full `req.body` (which contains the Firebase `idToken`) and internal state via `console.log`. `firebaseAuth.js` has 10+ `console.log` calls. In containerized deployments, stdout is captured in logs accessible to operators, SIEM systems, and potentially attackers.

**Affected Files:**
- [auth.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/auth.controller.js) — Lines 94–95, 101, 109, 137
- [firebaseAuth.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/utils/firebaseAuth.js) — Lines 20, 24, 25, 33, 34, 81, 83–86, 104, 113

**Exact Code Location:**

```js
// auth.controller.js — Lines 94-95 ❌
console.log("Google Login Request Received");
console.log(req.body);   // ❌ Logs the Firebase idToken — a sensitive bearer credential
```

**Recommended Fix:** Replace every `console.log/error/warn` with the Winston `logger` instance already available in the project.

```js
// ✅ SECURE: Remove all console.log; use logger for structured output
logger.info('User logged in via Google SSO', { userId: user._id }); // No token, no PII
```

---

### H-04 — Stack Traces Leaked to Clients in Non-Production Environments

**Vulnerability:** `error.middleware.js` sends `error.stack` in the API response whenever `NODE_ENV !== 'production'`. Staging environments accessible to the public but not set to `production` will leak full server-side stack traces.

**Affected File:** [error.middleware.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/middlewares/error.middleware.js) — Line 85

**Exact Code Location:**

```js
const isDev = process.env.NODE_ENV === 'development';  // ⚠️ 'staging' also exposes stack
sendError(res, ..., isDev ? error.stack : undefined);
```

**Recommended Fix:**

```js
// ✅ SECURE: Only expose stack when explicitly opted in
const exposeStack = process.env.NODE_ENV === 'development'
  && process.env.EXPOSE_STACK_TRACE === 'true';
sendError(res, error.statusCode || 500, error.message,
  error.code, error.details, exposeStack ? error.stack : undefined);
```

---

### H-05 — Refresh Token Stored in Plaintext in Database

**Vulnerability:** Refresh tokens are stored as raw strings in the `users` collection (`User.refreshToken`). A MongoDB dump or breach immediately yields valid, 7-day refresh tokens for every logged-in user.

**Affected File:** [User.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/models/User.js) — Line 29

**Recommended Fix:** Store a SHA-256 hash and compare hashes during verification.

```js
// ✅ SECURE: User.js
const crypto = require('crypto');

userSchema.add({
  refreshTokenHash: { type: String, select: false },
});

userSchema.methods.setRefreshToken = function(token) {
  this.refreshTokenHash = crypto.createHash('sha256').update(token).digest('hex');
};

userSchema.methods.verifyRefreshToken = function(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return this.refreshTokenHash === hash;
};
```

```js
// ✅ auth.controller.js — replace all refreshToken assignments
user.setRefreshToken(refreshToken);
await user.save({ validateBeforeSave: false });

// In refreshToken controller:
if (!user || !user.verifyRefreshToken(token)) {
  throw AppError.forbidden('Refresh token mismatch. Please login again.');
}
```

---

### H-06 — Any Authenticated User Can Create Stock Transactions (Missing Role Authorization)

**Vulnerability:** `POST /api/v1/transactions` has no `authorize()` middleware. A `User`-role employee can directly post arbitrary `IN`/`OUT` stock transactions, bypassing the `Admin`/`Manager` gate that protects the Order creation route.

**Affected File:** [transaction.routes.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/routes/transaction.routes.js) — Line 83

**Exact Code Location:**

```js
// transaction.routes.js — Line 83 ❌
.post(validate(transactionSchemas.create), addTransaction)  // ❌ No authorize()
```

**Recommended Fix:**

```js
// ✅ SECURE
router.route('/')
  .post(authorize('Admin', 'Manager'), validate(transactionSchemas.create), addTransaction)
  .get(validate(transactionSchemas.list), paginate, getTransactions);
```

---

### H-07 — MongoDB and Redis Ports Exposed to All Network Interfaces in Docker Compose

**Vulnerability:** `docker-compose.yml` binds MongoDB to `0.0.0.0:27017` and Redis to `0.0.0.0:6379`. On any cloud VM with a misconfigured firewall, both databases are directly reachable from the internet. MongoDB has no root authentication credentials configured.

**Affected File:** [docker-compose.yml](file:///Users/siyammeshak/Downloads/crm-stock-management/docker-compose.yml) — Lines 44–45, 65–66, 46–48

**Exact Code Location:**

```yaml
# docker-compose.yml ❌
mongo:
  ports:
    - '27017:27017'    # ❌ Bound to 0.0.0.0 — internet-reachable
  environment:
    - MONGO_INITDB_DATABASE=...  # ❌ No root credentials configured

redis:
  ports:
    - '6379:6379'      # ❌ No auth, internet-reachable
```

**Recommended Fix:**

```yaml
# ✅ SECURE: docker-compose.yml
mongo:
  # Remove 'ports' entirely — only accessible within crm-network
  environment:
    - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
    - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    - MONGO_INITDB_DATABASE=${MONGO_DB_NAME:-crm-stock}

redis:
  # Remove 'ports' entirely, OR bind to loopback only:
  # ports:
  #   - '127.0.0.1:6379:6379'
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD}
```

And update `backend/.env` and `docker-compose.yml` environment to include `REDIS_PASSWORD` and the Mongo URI with credentials: `mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongo:27017/${MONGO_DB_NAME}?authSource=admin`.

---

## 🟡 MEDIUM Findings

---

### M-01 — Swagger API Docs Exposed in Production (No Environment Guard)

**Vulnerability:** The Swagger UI (`/api-docs`) and raw JSON spec (`/api-docs.json`) are always registered with no environment check — exposing all endpoint details, request schemas, and auth mechanisms to anyone in production.

**Affected File:** [swagger.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/config/swagger.js) — Lines 110–135

**Recommended Fix:**

```js
// ✅ SECURE
const setupSwagger = (app) => {
  if (process.env.NODE_ENV === 'production') return;  // ← Completely disabled in prod
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { /* ... */ }));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
};
```

---

### M-02 — NoSQL Injection Risk via String-Replace Filter Construction in `getProducts`

**Vulnerability:** `product.controller.js` constructs a MongoDB filter by JSON-serializing raw query params and running a regex replace to inject `$` operator prefixes. While Joi's `stripUnknown` mitigates unknown keys, the pattern is fragile and a source of operator injection if future fields are added without updating the Joi schema.

**Affected File:** [product.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/product.controller.js) — Lines 43–55

**Exact Code Location:**

```js
// Lines 47-50 ⚠️
let filterStr = JSON.stringify(rawFilter);
filterStr = filterStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (m) => `$${m}`);
const filter = JSON.parse(filterStr);
```

**Recommended Fix:** Build operators explicitly from named validated fields only.

```js
// ✅ SECURE: explicit operator builder
const buildProductFilter = (q) => {
  const filter = {};
  if (q.category) filter.category = q.category;
  if (q.search) filter.name = {
    $regex: q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    $options: 'i',
  };
  const ranges = { price: ['price[gt]','price[gte]','price[lt]','price[lte]'],
                   quantity: ['quantity[gt]','quantity[gte]','quantity[lt]','quantity[lte]'] };
  const ops = { gt: '$gt', gte: '$gte', lt: '$lt', lte: '$lte' };
  for (const [field, keys] of Object.entries(ranges)) {
    const cond = {};
    keys.forEach(k => { if (q[k] !== undefined) cond[ops[k.match(/\[(.+)\]/)[1]]] = Number(q[k]); });
    if (Object.keys(cond).length) filter[field] = cond;
  }
  return filter;
};
```

---

### M-03 — Socket.IO Broadcasts to All Clients Without Authentication

**Vulnerability:** `io.emit('stock:updated', {...})` sends real-time stock data to every connected WebSocket client. There is no authentication check on socket connections — anyone can connect and receive live inventory updates.

**Affected File:** [transaction.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/transaction.controller.js) — Lines 36–44

**Recommended Fix:** Add JWT verification middleware on socket connection.

```js
// ✅ SECURE: server.js — socket auth middleware
const jwt = require('jsonwebtoken');
const User = require('./models/User');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id);
    if (!socket.user) return next(new Error('User not found'));
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Emit only to authenticated room
io.to('crm:authenticated').emit('stock:updated', { ... });

// On connect, join the authenticated room:
io.on('connection', (socket) => {
  socket.join('crm:authenticated');
});
```

---

### M-04 — Weak Password Policy (6 Characters, No Complexity)

**Vulnerability:** Registration only requires a 6-character password with no complexity requirements, allowing trivial passwords like `123456` or `aaaaaa`.

**Affected File:** [auth.validation.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/validations/auth.validation.js) — Line 15

**Recommended Fix:**

```js
// ✅ SECURE
password: Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must include uppercase, lowercase, a number, and a special character',
  }),
```

---

### M-05 — Password Change Requires No Current Password Verification

**Vulnerability:** A user with a stolen (not yet expired) access token can permanently change the victim's password via `PUT /api/v1/auth/profile` without knowing the existing password. This converts a temporary token theft into a permanent account takeover.

**Affected File:** [auth.validation.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/validations/auth.validation.js) — Line 51

**Recommended Fix:** Require `currentPassword` when `password` is present. See H-01 fix above.

---

### M-06 — Hardcoded `localhost` Backend URLs in Frontend

**Vulnerability:** `Settings.jsx` hardcodes `http://localhost:5005/api/v1/...` in two fetch calls instead of using the centralized API client. These calls silently fail in any non-local environment.

**Affected File:** [Settings.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Settings.jsx) — Lines 18, 49

**Recommended Fix:**

```jsx
// ✅ SECURE: Use the api client singleton
import api from '../api/client';

const handleSaveProfile = async () => {
  await api.put('/auth/profile', { name: localProfile.name, email: localProfile.email, company: localProfile.company });
  alert('Profile saved successfully!');
};

const handleReset = async () => {
  if (window.confirm('...')) {
    await api.post('/settings/factory-reset');
    localStorage.clear();
    window.location.reload();
  }
};
```

---

### M-07 — CORS Allows Requests Without an `Origin` Header

**Vulnerability:** `if (!origin || allowedOrigins.includes(origin))` — requests without an `Origin` header (curl, Postman, server-to-server) bypass CORS. In production this defeats CORS as a browser security control.

**Affected File:** [app.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/app.js) — Line 42

**Recommended Fix:**

```js
// ✅ SECURE
origin: (origin, cb) => {
  // Allow no-origin only in non-production (dev tooling, Postman)
  if (process.env.NODE_ENV !== 'production' && !origin) return cb(null, true);
  if (origin && allowedOrigins.includes(origin)) return cb(null, true);
  cb(new Error(`CORS policy: origin ${origin} is not allowed.`));
},
```

---

### M-08 — Forgot Password is a Non-Functional Stub

**Vulnerability:** `Login.jsx` lines 139–145 show a success toast message for "Forgot Password?" but **never send any email or trigger any backend logic**. Users have no real password recovery mechanism.

**Affected File:** [Login.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Login.jsx) — Lines 139–145

**Recommended Fix:** Implement a real reset flow:

```js
// ✅ SECURE: New backend endpoints
// POST /api/v1/auth/forgot-password — generate signed time-limited token (15 min), store hash, send email
// POST /api/v1/auth/reset-password/:token — verify hash, update password, invalidate token
```

Use `nodemailer` with an SMTP provider. Store `passwordResetTokenHash` and `passwordResetExpires` on the User model.

---

## 🔵 LOW Findings

---

### L-01 — Zustand `persist` Stores Sensitive User Data in `localStorage`

**Vulnerability:** The Zustand `persist` middleware writes `{ token, user, isAuthenticated }` to `localStorage`. The `user` object includes role, email, and user ID — data that should not outlive the session.

**Affected File:** [store.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/store.js) — Lines 75–78

**Recommended Fix:** Use `sessionStorage` (cleared on tab close) and exclude user object from persistence.

```js
// ✅ SECURE
import { createJSONStorage } from 'zustand/middleware';

persist((set, get) => ({ /* ... */ }), {
  name: 'crm-auth-storage',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
  // ❌ Remove 'user' from persistence — re-fetch from /auth/me on app load
})
```

---

### L-02 — Client-Provided `X-Request-ID` Trusted Without Sanitization

**Vulnerability:** The `requestId` middleware uses the client-supplied `X-Request-Id` header verbatim, allowing log injection with arbitrary strings.

**Affected File:** [requestLogger.middleware.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/middlewares/requestLogger.middleware.js) — Line 11

**Recommended Fix:**

```js
// ✅ SECURE: Validate format before trusting
const clientId = req.headers['x-request-id'];
req.id = (clientId && /^[a-zA-Z0-9_\-]{1,64}$/.test(clientId)) ? clientId : uuidv4();
```

---

### L-03 — Content Security Policy Disabled (Swagger XSS Risk)

**Vulnerability:** `contentSecurityPolicy: false` disables CSP entirely. The `/api-docs` Swagger UI serves HTML, and without a CSP, crafted API descriptions containing `<script>` tags could execute.

**Affected File:** [app.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/app.js) — Line 29

**Recommended Fix:**

```js
// ✅ SECURE
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? true   // Helmet defaults in production (Swagger not served)
    : {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
        },
      },
}));
```

---

### L-04 — Diagnostic `console.log` Statements in Frontend Store and Login

**Vulnerability:** `store.js` and `Login.jsx` print idToken lengths, backend responses (including tokens), Firebase config, and auth state to the browser console on every Google login and app mount. This makes token metadata trivially discoverable.

**Affected Files:**
- [store.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/store.js) — Lines 21, 33, 34, 35, 38, 54
- [Login.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Login.jsx) — Lines 30–47, 119–128

**Recommended Fix:** Remove all diagnostic `console.log` calls from production code.

---

### L-05 — Firebase API Key Logged to Browser Console on App Load

**Vulnerability:** `Login.jsx` lines 30–38 log the full Firebase configuration object (including `VITE_FIREBASE_API_KEY`) to the browser console on every page load, making the key visible to anyone opening DevTools.

**Affected File:** [Login.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Login.jsx) — Lines 28–50

**Recommended Fix:** Remove the entire `logDiagnostics` `useEffect`.

---

## 📋 Security Posture Summary — What's Already Well-Implemented

| Area | Status | Notes |
|------|--------|-------|
| Bcrypt Password Hashing | ✅ Secure | Cost factor 12 (`bcryptjs`) |
| JWT Signature Verification | ✅ Secure | App JWTs verified; Firebase uses RS256 + Google public certs |
| Token Expiry | ✅ Secure | 1h access / 7d refresh with DB rotation |
| Logout Invalidation | ✅ Secure | Refresh token cleared from DB on logout |
| Rate Limiting | ✅ Secure | Auth: 20 req/15min; API: 200 req/15min |
| Joi Input Validation | ✅ Secure | All routes validated; `stripUnknown: true` |
| NoSQL Injection (Customer) | ✅ Fixed | Explicit key/type guards + `$set` operator |
| NoSQL Injection (Order) | ✅ Fixed | All IDs validated before DB queries (CodeQL fix) |
| Helmet.js | ✅ Partial | Applied but CSP disabled (see L-03) |
| Error Handling | ✅ Secure | Global `asyncHandler` + error middleware |
| .gitignore Coverage | ✅ Secure | `.env` and `backend/.env` correctly ignored |
| File Upload Security | ✅ N/A | No file upload endpoints exist |
| SQL Injection | ✅ N/A | MongoDB used; Mongoose ODM provides type safety |
| Winston Structured Logging | ✅ Secure | JSON production format; rotating log files |
| Graceful Shutdown | ✅ Secure | SIGTERM/SIGINT handlers present |

---

## 🗺️ Prioritized Remediation Plan

### 🔴 Phase 1 — Fix Before ANY Production Deployment

| Priority | Finding | File(s) | Effort |
|----------|---------|---------|--------|
| 1 | C-01: Add `protect + authorize('Admin')` to factory-reset | `settings.routes.js`, `settings.controller.js` | 10 min |
| 2 | C-02: Rotate ALL exposed credentials (Neon, Firebase, Supabase) | External dashboards | 30 min |
| 3 | H-01: Fix mass assignment + remove `role` from profile schema | `auth.controller.js`, `auth.validation.js` | 1 hr |
| 4 | H-03: Remove `console.log` with sensitive data; use `logger` | `auth.controller.js`, `firebaseAuth.js` | 30 min |
| 5 | H-06: Add `authorize('Admin','Manager')` to transactions POST | `transaction.routes.js` | 5 min |
| 6 | M-01: Gate Swagger UI to non-production only | `swagger.js` | 10 min |
| 7 | M-06: Replace hardcoded localhost URLs in Settings.jsx | `Settings.jsx` | 15 min |

### 🟠 Phase 2 — Before Receiving Real Customer Traffic

| Priority | Finding | File(s) | Effort |
|----------|---------|---------|--------|
| 8 | H-02: Migrate JWT storage from localStorage to httpOnly cookies | `store.js`, `client.js`, `auth.controller.js`, `auth.middleware.js` | 4 hrs |
| 9 | H-04: Gate stack trace exposure to explicit env flag | `error.middleware.js` | 10 min |
| 10 | H-05: Hash refresh tokens before storing in DB | `User.js`, `auth.controller.js` | 2 hrs |
| 11 | H-07: Remove DB port bindings; add MongoDB root credentials | `docker-compose.yml` | 30 min |
| 12 | M-02: Replace string-replace filter with explicit operator builder | `product.controller.js` | 1 hr |
| 13 | M-03: Authenticate Socket.IO connections with JWT middleware | `server.js`, `transaction.controller.js` | 2 hrs |
| 14 | M-04: Increase password minimum complexity requirements | `auth.validation.js` | 15 min |
| 15 | M-05: Require current password for password change | `auth.controller.js`, `auth.validation.js` | 30 min |
| 16 | M-07: Lock CORS `!origin` bypass to development only | `app.js` | 15 min |

### 🟡 Phase 3 — Hardening & Operational Security

| Priority | Finding | File(s) | Effort |
|----------|---------|---------|--------|
| 17 | M-08: Implement real Forgot Password / Reset email flow | New endpoints + nodemailer | 1 day |
| 18 | L-01: Switch persist to sessionStorage; remove user object | `store.js` | 30 min |
| 19 | L-02: Sanitize client-provided X-Request-ID | `requestLogger.middleware.js` | 10 min |
| 20 | L-03: Enable CSP on Swagger UI | `app.js` | 30 min |
| 21 | L-04/L-05: Remove all diagnostic console.logs from frontend | `store.js`, `Login.jsx` | 20 min |
| 22 | CI: Install `detect-secrets` pre-commit hook | `.git/hooks/` | 30 min |

---

## 🏁 Production Deployment Checklist

Before going live, every item below must be verified:

- [ ] `NODE_ENV=production` set in all server environments
- [ ] All credentials rotated after C-02 discovery (Neon, Firebase, Supabase)
- [ ] `POST /api/v1/settings/factory-reset` requires Admin JWT (**C-01**)
- [ ] No `console.log` calls remain in backend controller/utility files (**H-03**)
- [ ] Swagger UI disabled in production (`NODE_ENV === 'production'` guard) (**M-01**)
- [ ] MongoDB running with root `MONGO_INITDB_ROOT_USERNAME/PASSWORD` (**H-07**)
- [ ] MongoDB port `27017` NOT bound to `0.0.0.0` (**H-07**)
- [ ] Redis port `6379` NOT bound to `0.0.0.0`; `requirepass` set (**H-07**)
- [ ] `CORS_ORIGIN` set to the real production domain, not `localhost`
- [ ] `LOG_LEVEL` set to `warn` or `error` in production
- [ ] HTTPS enforced at load balancer / reverse proxy level (TLS termination)
- [ ] `.env` files absent from Docker images and CI pipeline logs
- [ ] `detect-secrets` or equivalent pre-commit hook installed and active
- [ ] All Phase 1 findings verified fixed and tested

---

*Report generated by Antigravity Security Audit · 2026-06-06*  
*Scope: `/Users/siyammeshak/Downloads/crm-stock-management` — commit `e816bac` (HEAD)*
