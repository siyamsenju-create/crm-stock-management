# 🚨 Priority Fixes
## CRM Stock Management — Ordered Remediation Plan

**Generated:** 2026-06-14
**Auditor:** Antigravity (AI Security Review)
**Status:** Post Phase 1 verification · Phase 2 planning

---

## Phase 0 — Emergency (Do Today, No Deploy Until Done)

These must be resolved before any build or deployment. They are not development issues — they are active exposure risks.

---

### PF-01 — Rotate Firebase API Key

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **Finding** | C-03 (new) |
| **Impact** | Firebase Auth abuse, quota exhaustion, unauthorized app registration |
| **Effort** | 15 minutes |

**Description:** The Firebase API key `[REDACTED]` is present in the root `.env` (line 11) and baked into the compiled `dist/` bundle. The SECURITY_FIX_REPORT.md claims this was replaced, but the file was never actually updated.

**Exact Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps → Select Web App → API Key
2. Click "Regenerate API Key" (or create a new Web App entry)
3. Update `VITE_FIREBASE_API_KEY` in `.env` with the new key
4. Delete the `dist/` directory: `rm -rf dist/`
5. Rebuild: `npm run build`
6. Update `SECURITY_AUDIT_REPORT.md` to redact the old key value

---

### PF-02 — Rotate Firebase Service Account Key

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **Finding** | C-04 (new) |
| **Impact** | Full Firebase Admin access — all Firestore data, all user accounts |
| **Effort** | 20 minutes |

**Description:** `backend/firebase-service-account.json` and `backend/crm-project-management-f21f3-firebase-adminsdk-fbsvc-aaa00d527b.json` are physically present on disk with full Admin SDK credentials.

**Exact Fix:**
```bash
# Step 1: Verify files were never committed
git log --all --full-history -- "backend/firebase-service-account.json"
git log --all --full-history -- "backend/crm-project-management-f21f3-firebase-adminsdk-fbsvc-aaa00d527b.json"
# If output is empty — good, they were never committed.

# Step 2: Rotate service account in Firebase Console
# Firebase Console → Project Settings → Service accounts → Generate new private key
# Download the new JSON, replace backend/firebase-service-account.json

# Step 3: Update backend/.env to point to the new file
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json
```

---

### PF-03 — Fix ESLint CI Step (Silently Passing Failures)

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **Finding** | CI gap (new) |
| **Impact** | Lint errors never block deployments — code quality gate is bypassed |
| **Effort** | 2 minutes |

**Description:** The CI lint step uses `|| true` making it always succeed:
```yaml
run: npx eslint src/ --ext .js --max-warnings 0 || true  # ← BROKEN
```

**Exact Fix in [ci.yml](file:///Users/siyammeshak/Downloads/crm-stock-management/.github/workflows/ci.yml):**
```yaml
- name: Run ESLint
  run: npx eslint src/ --ext .js --max-warnings 0
```

---

## Phase 1 — Security Hardening (This Sprint)

Target: Complete before receiving any real user traffic.

---

### PF-04 — Migrate JWT Tokens to httpOnly Cookies

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **Finding** | H-02 |
| **Impact** | Any XSS vulnerability silently steals all active session tokens |
| **Effort** | 4 hours |

**Description:** `localStorage.setItem('token', token)` in [store.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/store.js) makes all access tokens readable by any JavaScript on the page.

**Recommended Fix:**

Backend (`auth.controller.js`) — set cookies on login:
```js
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

Auth Middleware — read from cookie first:
```js
const token = req.cookies?.accessToken ||
  (req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1] : null);
```

Frontend — remove all `localStorage.setItem('token', ...)` and `localStorage.getItem('token')` calls. Cookies are sent automatically.

---

### PF-05 — Hash Refresh Tokens Before Storing in Firestore

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **Finding** | H-05 |
| **Impact** | A Firestore data breach gives attackers all valid 7-day refresh tokens |
| **Effort** | 2 hours |

**Description:** `user.refreshToken = refreshToken` in [auth.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/auth.controller.js) stores raw tokens.

**Recommended Fix in `auth.controller.js`:**
```js
const crypto = require('crypto');

// Store hash only
user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
user.refreshToken = undefined;

// Verify during refresh
const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
if (!user || user.refreshTokenHash !== incomingHash) {
  throw AppError.forbidden('Refresh token mismatch. Please login again.');
}
```

---

### PF-06 — Fix CORS to Reject No-Origin Requests in Production

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High (demoted to Medium in original) |
| **Finding** | M-07 |
| **Impact** | Server-to-server requests bypass CORS browser protection in production |
| **Effort** | 10 minutes |

**Exact Fix in [app.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/app.js) Line 40–43:**
```js
origin: (origin, cb) => {
  // Only allow no-origin in non-production (dev tooling, Postman)
  if (process.env.NODE_ENV !== 'production' && !origin) return cb(null, true);
  if (origin && allowedOrigins.includes(origin)) return cb(null, true);
  cb(new Error(`CORS policy: origin ${origin} is not allowed.`));
},
```

---

### PF-07 — Restrict Stack Trace to Development-Only

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **Finding** | H-04 |
| **Impact** | Staging deployments not set to `production` leak full server stack traces |
| **Effort** | 10 minutes |

**Exact Fix in [error.middleware.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/middlewares/error.middleware.js) Line 78:**
```js
// Before:
const isDev = process.env.NODE_ENV === 'development';

// After:
const exposeStack = process.env.NODE_ENV === 'development'
  && process.env.EXPOSE_STACK_TRACE === 'true';
```

---

### PF-08 — Remove MongoDB/Redis Port Bindings in Docker Compose

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **Finding** | H-07 |
| **Impact** | On any VM with a misconfigured firewall, MongoDB (no-auth) and Redis are internet-reachable |
| **Effort** | 30 minutes |

**Exact Fix in [docker-compose.yml](file:///Users/siyammeshak/Downloads/crm-stock-management/docker-compose.yml):**
```yaml
# Remove or restrict port bindings
mongo:
  # Remove 'ports' entirely — internal network only
  environment:
    - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
    - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    - MONGO_INITDB_DATABASE=${MONGO_DB_NAME:-crm-stock}

redis:
  # Remove 'ports' or bind to loopback:
  # ports:
  #   - '127.0.0.1:6379:6379'
  command: redis-server --requirepass ${REDIS_PASSWORD}
```

---

### PF-09 — Fix NoSQL String-Replace Filter in Product Controller

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | M-02 |
| **Impact** | Fragile filter construction; potential operator injection if Joi schema changes |
| **Effort** | 1 hour |

**Exact Fix in [product.controller.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/controllers/product.controller.js) Lines 43–55:**
```js
exports.getProducts = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    // Escape regex special chars for safe $regex use
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: escaped, $options: 'i' };
  }

  // Explicit numeric range operators
  const numericFields = ['price', 'quantity'];
  const ops = { gt: '$gt', gte: '$gte', lt: '$lt', lte: '$lte' };
  for (const field of numericFields) {
    const cond = {};
    for (const [suffix, op] of Object.entries(ops)) {
      const queryKey = `${field}[${suffix}]`;
      if (req.query[queryKey] !== undefined) {
        const val = Number(req.query[queryKey]);
        if (!isNaN(val)) cond[op] = val;
      }
    }
    if (Object.keys(cond).length) filter[field] = cond;
  }

  const { data: products, pagination } = await req.paginate(Product, filter);
  sendSuccess(res, 200, 'Products fetched successfully', products, pagination);
});
```

---

### PF-10 — Authenticate Socket.IO Connections

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | M-03 |
| **Impact** | Any anonymous visitor receives live stock level updates |
| **Effort** | 2 hours |

**Exact Fix in `backend/src/server.js`:**
```js
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

io.on('connection', (socket) => {
  socket.join('crm:authenticated');
});
```

Frontend — pass token when connecting:
```js
const socket = io(VITE_API_BASE_URL, {
  auth: { token: localStorage.getItem('token') },
});
```

---

## Phase 2 — Code Quality & Operational Hardening

---

### PF-11 — Implement Real Forgot Password Flow

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | M-05 original |
| **Impact** | Users with lost passwords permanently locked out |
| **Effort** | 1 day |

**Description:** `handleForgotPassword` in [Login.jsx](file:///Users/siyammeshak/Downloads/crm-stock-management/src/pages/Login.jsx) shows a fake success toast.

**Recommended Implementation:**
```js
// Backend: POST /api/v1/auth/forgot-password
const token = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
user.passwordResetTokenHash = tokenHash;
user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
await user.save({ validateBeforeSave: false });

// Send email via nodemailer
const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
await sendEmail({ to: user.email, subject: 'Reset your password', html: `<a href="${resetUrl}">Reset</a>` });

// Backend: POST /api/v1/auth/reset-password/:token
const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
const user = await User.findOne({
  passwordResetTokenHash: tokenHash,
  passwordResetExpires: { $gt: Date.now() },
});
```

---

### PF-12 — Switch Zustand persist to sessionStorage

| Field | Detail |
|-------|--------|
| **Severity** | 🔵 Low |
| **Finding** | L-01 |
| **Impact** | Auth state (token + role) survives browser restarts indefinitely |
| **Effort** | 30 minutes |

**Exact Fix in [store.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/store.js) Lines 70–73:**
```js
import { createJSONStorage } from 'zustand/middleware';

persist((set, get) => ({ /* ... */ }), {
  name: 'crm-auth-storage',
  storage: createJSONStorage(() => sessionStorage), // ← sessionStorage
  partialize: (state) => ({
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    // ← Remove 'user' — re-fetch from /auth/me on load
  }),
})
```

---

### PF-13 — Sanitize X-Request-ID Header

| Field | Detail |
|-------|--------|
| **Severity** | 🔵 Low |
| **Finding** | L-02 |
| **Impact** | Arbitrary log injection via client-supplied request ID |
| **Effort** | 10 minutes |

**Exact Fix in [requestLogger.middleware.js](file:///Users/siyammeshak/Downloads/crm-stock-management/backend/src/middlewares/requestLogger.middleware.js) Line 11:**
```js
const clientId = req.headers['x-request-id'];
req.id = (clientId && /^[a-zA-Z0-9_\-]{1,64}$/.test(clientId)) ? clientId : uuidv4();
```

---

### PF-14 — Implement Soft Delete Strategy

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | Architecture gap |
| **Impact** | Deleted data is permanently gone — no recovery, no audit trail |
| **Effort** | 1 day |

**Prisma Schema Addition:**
```prisma
model Product {
  // ... existing fields
  deletedAt  DateTime?
  isDeleted  Boolean   @default(false)
}
```

**Firestore Implementation:**
```js
// Instead of deleteOne:
await item.findByIdAndUpdate(id, {
  $set: { isDeleted: true, deletedAt: new Date() }
});

// All find queries:
filter.isDeleted = { $ne: true };
```

---

### PF-15 — Add npm audit to CI Pipeline

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | CI gap |
| **Impact** | Known-vulnerable dependencies shipped to production without detection |
| **Effort** | 5 minutes |

**Add to [ci.yml](file:///Users/siyammeshak/Downloads/crm-stock-management/.github/workflows/ci.yml) after `npm ci`:**
```yaml
- name: Security audit
  run: npm audit --audit-level=high
  working-directory: backend
```

---

### PF-16 — Increase Password Complexity Requirements

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | M-04 |
| **Impact** | Trivially weak passwords accepted (e.g. `password1`) |
| **Effort** | 15 minutes |

**Fix in `backend/src/validations/auth.validation.js`:**
```js
password: Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?])/)
  .required()
  .messages({
    'string.pattern.base': 'Password must include uppercase, lowercase, a number, and a special character',
  }),
```

---

### PF-17 — Add Audit Logging for All Write Operations

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | Architecture gap |
| **Impact** | No tamper-proof record of who changed what data |
| **Effort** | 2 days |

**Recommended:** Create an `AuditLog` Firestore collection. Log all create/update/delete operations with `userId`, `action`, `resourceType`, `resourceId`, `changes`, `ip`, and `timestamp`. Consider using a write-once Firestore security rule to prevent deletion of audit records.

---

### PF-18 — Fix Supabase Client Environment Guard

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **Finding** | M-08 (new) |
| **Impact** | App crashes on import if Supabase env vars missing |
| **Effort** | 5 minutes |

**Exact Fix in [supabase.js](file:///Users/siyammeshak/Downloads/crm-stock-management/src/utils/supabase.js):**
```js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing environment variables — client not initialized');
  export const supabase = null;
} else {
  export const supabase = createClient(supabaseUrl, supabaseKey);
}
```

---

## Top 10 Next Improvements for the CRM Project

| # | Improvement | Impact | Effort |
|---|-------------|--------|--------|
| 1 | **Rotate Firebase API Key & Service Account** | Critical security risk eliminated | 30 min |
| 2 | **httpOnly Cookie JWT Storage** | XSS token theft prevention | 4 hrs |
| 3 | **Real Forgot Password Email Flow** | Users can recover accounts | 1 day |
| 4 | **Soft Delete + Data Recovery** | Prevent irreversible data loss | 1 day |
| 5 | **Audit Logging Table** | Compliance, forensics, accountability | 2 days |
| 6 | **Socket.IO Authentication** | Stop data leakage to anonymous users | 2 hrs |
| 7 | **Frontend Build in CI + npm audit** | Catch regressions and vulnerabilities | 30 min |
| 8 | **Clarify Firestore vs. Prisma/PostgreSQL Architecture** | Remove dual-DB confusion, reduce tech debt | 1 sprint |
| 9 | **Global 401 Interceptor in API Client** | Auto-redirect on token expiry | 1 hr |
| 10 | **Content Security Policy (CSP) Headers** | Defense-in-depth against XSS | 2 hrs |

---

## Recommended Next GitHub Issue

**Title:** `[Security] Phase 2 Hardening — httpOnly Cookies + Refresh Token Hashing`

**Body:**
```
## Objective
Implement the remaining Phase 2 security fixes identified in SECURITY_AUDIT_REPORT_V2.md.

## Tasks
- [ ] Rotate Firebase API Key (PF-01) — URGENT
- [ ] Rotate Firebase Service Account key (PF-02) — URGENT
- [ ] Migrate JWT from localStorage to httpOnly cookies (PF-04)
- [ ] Hash refresh tokens before Firestore storage (PF-05)
- [ ] Fix CORS no-origin bypass in production (PF-06)
- [ ] Fix Stack trace exposure gate (PF-07)
- [ ] Remove Docker Compose port bindings (PF-08)
- [ ] Fix ESLint CI || true (PF-03)

## Acceptance Criteria
- All Phase 2 items in SECURITY_AUDIT_REPORT_V2.md marked fixed
- Backend test suite continues to pass 37/37
- SECURITY_FIX_REPORT_V2.md generated documenting all changes

Labels: security, high-priority
```

---

## Recommended Next Milestone

**Milestone Name:** `v1.0.0 — Production Ready`

**Target Date:** 3–4 weeks

**Milestone Goals:**
1. All Critical and High security findings resolved
2. Frontend CI build verification added
3. Real forgot password flow implemented
4. Soft delete strategy added to all models
5. Audit logging implemented
6. SECURITY.md updated with real disclosure policy
7. Overall production readiness score ≥ 85%

**Issues to include:**
- Phase 2 security hardening (PF-01 through PF-10)
- Forgot Password implementation (PF-11)
- Soft delete strategy (PF-14)
- Audit logging (PF-17)
- CI improvements (PF-03, PF-15)

---

## Overall Production Readiness

| Metric | Value |
|--------|-------|
| **Current Score** | **58%** |
| **Phase 1 Fixes Applied** | 7/7 ✅ |
| **Critical Findings Open** | 2 (C-03, C-04) |
| **High Findings Open** | 5 |
| **Medium Findings Open** | 7 |
| **Low Findings Open** | 5 |
| **Test Suite** | ✅ 37/37 |
| **Target Score for Go-Live** | ≥ 85% |

---

*Priority Fixes document generated by Antigravity · 2026-06-14*
*Based on SECURITY_AUDIT_REPORT_V2.md and PRODUCTION_READINESS_REPORT.md*
