# WalletX Architecture Documentation

Comprehensive technical architecture documentation for the WalletX universal AI credit wallet system.

## Table of Contents
- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Technology Decisions](#technology-decisions)

## System Overview

WalletX is a three-tier distributed system that provides universal AI credit management across multiple IDEs and AI providers.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Cursor  │  │ Windsurf │  │ VS Code  │  │Antigravity│       │
│  │   IDE    │  │   IDE    │  │   IDE    │  │   IDE    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    WalletX SDK (Client)   │
        │  ┌──────────────────────┐ │
        │  │  Credit Manager      │ │
        │  │  Context Manager     │ │
        │  │  AI Proxy Client     │ │
        │  │  Auth Manager        │ │
        │  └──────────────────────┘ │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Browser Extension       │
        │  ┌──────────────────────┐ │
        │  │  Popup UI            │ │
        │  │  Background Worker   │ │
        │  │  Content Script      │ │
        │  └──────────────────────┘ │
        └─────────────┬─────────────┘
                      │
                      │ HTTPS/WSS
                      │
        ┌─────────────▼─────────────┐
        │   API Gateway Layer       │
        │  ┌──────────────────────┐ │
        │  │  Rate Limiter        │ │
        │  │  Auth Middleware     │ │
        │  │  Request Logger      │ │
        │  └──────────────────────┘ │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Application Layer       │
        │  ┌──────────────────────┐ │
        │  │  Auth Service        │ │
        │  │  Credit Service      │ │
        │  │  Payment Service     │ │
        │  │  AI Provider Service │ │
        │  │  Snapshot Service    │ │
        │  └──────────────────────┘ │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
   ┌────▼────┐              ┌──────▼──────┐
   │ MongoDB │              │ AI Providers│
   │ ┌─────┐ │              │ ┌─────────┐ │
   │ │Users│ │              │ │ OpenAI  │ │
   │ │Txns │ │              │ │Anthropic│ │
   │ │Usage│ │              │ │   IBM   │ │
   │ │Snaps│ │              │ │Together │ │
   │ └─────┘ │              │ └─────────┘ │
   └─────────┘              └─────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: Clear boundaries between client, API, and data layers
2. **Stateless API**: All state stored in database, enabling horizontal scaling
3. **Idempotency**: All operations designed to be safely retried
4. **Fail-Safe**: Graceful degradation when external services fail
5. **Security First**: Authentication, encryption, and validation at every layer

## Component Architecture

### 1. Backend API Server

#### Technology Stack
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 6+ with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi schema validation

#### Directory Structure
```
backend/
├── server.js                 # Application entry point
├── config/
│   ├── database.js          # MongoDB connection
│   └── models-pricing.js    # AI model pricing config
├── models/
│   ├── User.js              # User schema
│   ├── Transaction.js       # Transaction records
│   ├── Usage.js             # AI usage tracking
│   └── Snapshot.js          # Context snapshots
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── credits.js           # Credit management
│   ├── payments.js          # Payment processing
│   ├── ai-proxy.js          # AI provider routing
│   └── snapshots.js         # Context export/import
├── services/
│   ├── creditService.js     # Credit operations
│   ├── paymentService.js    # Payment logic
│   └── aiProviderService.js # AI routing
└── middleware/
    ├── auth.js              # JWT verification
    └── rateLimit.js         # Rate limiting
```

#### Service Layer Pattern

```javascript
// Service handles business logic
class CreditService {
  async deductCredits(userId, amount, metadata) {
    // 1. Start database transaction
    // 2. Validate user balance
    // 3. Deduct credits atomically
    // 4. Record transaction
    // 5. Commit or rollback
  }
}

// Route handles HTTP concerns
router.post('/deduct', auth, async (req, res) => {
  try {
    const result = await creditService.deductCredits(
      req.user.id,
      req.body.amount,
      req.body.metadata
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 2. Browser Extension

#### Technology Stack
- **Manifest**: V3 (Chrome Extension API)
- **UI**: HTML5 + CSS3 + Vanilla JavaScript
- **Storage**: chrome.storage.local
- **Background**: Service Worker

#### Architecture
```
extension/
├── manifest.json           # Extension configuration
├── popup.html             # UI structure
├── popup.css              # Styling
├── popup.js               # UI logic
├── background.js          # Service worker
├── content.js             # Page injection
└── config.js              # Configuration

Communication Flow:
popup.js → background.js → Backend API
         ← background.js ← Backend API
```

#### Message Passing
```javascript
// popup.js sends message
chrome.runtime.sendMessage({
  type: 'GET_BALANCE'
}, (response) => {
  updateUI(response.balance);
});

// background.js handles message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BALANCE') {
    fetchBalance().then(sendResponse);
    return true; // Async response
  }
});
```

### 3. IDE SDK

#### Technology Stack
- **Language**: JavaScript ES6+
- **Build**: No build step (pure JS)
- **Testing**: Jest
- **Package**: NPM

#### Architecture
```
sdk/
├── src/
│   ├── index.js              # Main entry point
│   ├── WalletXClient.js      # Core client
│   ├── CreditManager.js      # Credit operations
│   ├── AIProxyClient.js      # AI routing
│   ├── ContextManager.js     # Context handling
│   └── utils/
│       ├── auth.js           # Authentication
│       ├── storage.js        # Local storage
│       └── errors.js         # Error handling
└── examples/
    ├── cursor-integration.js
    ├── windsurf-integration.js
    └── copilot-integration.js
```

#### Client Architecture
```javascript
class WalletXClient {
  constructor(config) {
    this.auth = new AuthManager(config);
    this.credits = new CreditManager(this.auth);
    this.ai = new AIProxyClient(this.auth, this.credits);
    this.context = new ContextManager(this.auth);
  }
  
  // Fluent API
  async chat(options) {
    return this.ai.chat(options);
  }
}
```

## Data Flow Diagrams

### 1. User Registration Flow

```
User                Extension           Backend              Database
 │                     │                   │                    │
 │  Click Register     │                   │                    │
 ├────────────────────>│                   │                    │
 │                     │                   │                    │
 │  Enter Details      │                   │                    │
 ├────────────────────>│                   │                    │
 │                     │                   │                    │
 │                     │  POST /auth/register                   │
 │                     ├──────────────────>│                    │
 │                     │                   │                    │
 │                     │                   │  Check Email Exists│
 │                     │                   ├───────────────────>│
 │                     │                   │<───────────────────┤
 │                     │                   │  Email Available   │
 │                     │                   │                    │
 │                     │                   │  Hash Password     │
 │                     │                   │  (bcrypt)          │
 │                     │                   │                    │
 │                     │                   │  Create User       │
 │                     │                   ├───────────────────>│
 │                     │                   │<───────────────────┤
 │                     │                   │  User Created      │
 │                     │                   │                    │
 │                     │                   │  Generate JWT      │
 │                     │                   │                    │
 │                     │<──────────────────┤                    │
 │                     │  { token, user }  │                    │
 │                     │                   │                    │
 │                     │  Store Token      │                    │
 │                     │  (chrome.storage) │                    │
 │                     │                   │                    │
 │<────────────────────┤                   │                    │
 │  Show Dashboard     │                   │                    │
```

### 2. Credit Recharge Flow

```
User            Extension       Backend         Payment Gateway    Database
 │                 │               │                   │              │
 │  Click Recharge │               │                   │              │
 ├────────────────>│               │                   │              │
 │                 │               │                   │              │
 │  Select Amount  │               │                   │              │
 ├────────────────>│               │                   │              │
 │                 │               │                   │              │
 │                 │ POST /payments/create-order       │              │
 │                 ├──────────────>│                   │              │
 │                 │               │                   │              │
 │                 │               │  Create Order     │              │
 │                 │               ├──────────────────>│              │
 │                 │               │<──────────────────┤              │
 │                 │               │  Order ID         │              │
 │                 │               │                   │              │
 │                 │               │  Save Pending Txn │              │
 │                 │               ├──────────────────────────────────>│
 │                 │               │                   │              │
 │                 │<──────────────┤                   │              │
 │                 │  Order Details│                   │              │
 │                 │               │                   │              │
 │  Open Payment   │               │                   │              │
 │  Gateway        │               │                   │              │
 ├────────────────>│               │                   │              │
 │                 │               │                   │              │
 │                 │               │                   │              │
 │  Complete       │               │                   │              │
 │  Payment        │               │                   │              │
 ├─────────────────────────────────────────────────────>│              │
 │                 │               │                   │              │
 │                 │               │  Webhook Callback │              │
 │                 │               │<──────────────────┤              │
 │                 │               │                   │              │
 │                 │               │  Verify Signature │              │
 │                 │               │                   │              │
 │                 │               │  Update Transaction              │
 │                 │               ├──────────────────────────────────>│
 │                 │               │                   │              │
 │                 │               │  Credit User Account             │
 │                 │               ├──────────────────────────────────>│
 │                 │               │<──────────────────────────────────┤
 │                 │               │                   │              │
 │                 │  Notify Success                   │              │
 │                 │<──────────────┤                   │              │
 │<────────────────┤               │                   │              │
 │  Show Balance   │               │                   │              │
```

### 3. AI Request Flow

```
IDE          SDK            Backend         AI Provider      Database
 │            │                │                 │              │
 │  AI Request│                │                 │              │
 ├───────────>│                │                 │              │
 │            │                │                 │              │
 │            │  Authenticate  │                 │              │
 │            ├───────────────>│                 │              │
 │            │<───────────────┤                 │              │
 │            │  Token Valid   │                 │              │
 │            │                │                 │              │
 │            │  Check Balance │                 │              │
 │            ├───────────────>│                 │              │
 │            │                │  Query User     │              │
 │            │                ├────────────────────────────────>│
 │            │                │<────────────────────────────────┤
 │            │<───────────────┤  Balance: $10  │              │
 │            │  Sufficient    │                 │              │
 │            │                │                 │              │
 │            │  Estimate Cost │                 │              │
 │            ├───────────────>│                 │              │
 │            │<───────────────┤                 │              │
 │            │  ~$0.05        │                 │              │
 │            │                │                 │              │
 │            │  Deduct Credits│                 │              │
 │            ├───────────────>│                 │              │
 │            │                │  Start Transaction             │
 │            │                ├────────────────────────────────>│
 │            │                │  Deduct $0.05  │              │
 │            │                ├────────────────────────────────>│
 │            │                │<────────────────────────────────┤
 │            │<───────────────┤  New Balance   │              │
 │            │  Deducted      │                 │              │
 │            │                │                 │              │
 │            │  Forward Request                 │              │
 │            ├───────────────>│                 │              │
 │            │                │  API Call       │              │
 │            │                ├────────────────>│              │
 │            │                │<────────────────┤              │
 │            │                │  Response       │              │
 │            │                │                 │              │
 │            │                │  Calculate Actual Cost         │
 │            │                │  (based on tokens)             │
 │            │                │                 │              │
 │            │                │  Adjust Credits │              │
 │            │                ├────────────────────────────────>│
 │            │                │  Refund $0.01  │              │
 │            │                │  (if overcharged)              │
 │            │                │                 │              │
 │            │                │  Record Usage   │              │
 │            │                ├────────────────────────────────>│
 │            │                │                 │              │
 │            │<───────────────┤                 │              │
 │            │  AI Response   │                 │              │
 │<───────────┤                │                 │              │
 │  Display   │                │                 │              │
```

### 4. Context Export/Import Flow

```
IDE A        SDK A          Backend         Database        SDK B        IDE B
 │            │                │                │             │            │
 │  Export    │                │                │             │            │
 │  Context   │                │                │             │            │
 ├───────────>│                │                │             │            │
 │            │                │                │             │            │
 │            │  Serialize     │                │             │            │
 │            │  Context       │                │             │            │
 │            │                │                │             │            │
 │            │  POST /snapshots/create         │             │            │
 │            ├───────────────>│                │             │            │
 │            │                │  Compress      │             │            │
 │            │                │  Encrypt       │             │            │
 │            │                │                │             │            │
 │            │                │  Save Snapshot │             │            │
 │            │                ├───────────────>│             │            │
 │            │                │<───────────────┤             │            │
 │            │<───────────────┤  Snapshot ID   │             │            │
 │            │  snapshot_123  │                │             │            │
 │<───────────┤                │                │             │            │
 │  Show Link │                │                │             │            │
 │            │                │                │             │            │
 │            │                │                │             │            │
 │            │                │                │  Import     │            │
 │            │                │                │  Context    │            │
 │            │                │                │<────────────┤            │
 │            │                │                │             │            │
 │            │                │  GET /snapshots/snapshot_123 │            │
 │            │                │<───────────────────────────────┤          │
 │            │                │                │             │            │
 │            │                │  Fetch Snapshot│             │            │
 │            │                ├───────────────>│             │            │
 │            │                │<───────────────┤             │            │
 │            │                │                │             │            │
 │            │                │  Decrypt       │             │            │
 │            │                │  Decompress    │             │            │
 │            │                │                │             │            │
 │            │                ├────────────────────────────────>          │
 │            │                │  Context Data  │             │            │
 │            │                │                │             │            │
 │            │                │                │             │  Restore   │
 │            │                │                │             │  Context   │
 │            │                │                │             ├───────────>│
 │            │                │                │             │  Continue  │
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  name: String,
  credits: Number (default: 0, min: 0),
  apiKey: String (unique, indexed),
  settings: {
    preferredProvider: String,
    preferCheapest: Boolean,
    notifications: Boolean
  },
  createdAt: Date (indexed),
  updatedAt: Date,
  lastLoginAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ apiKey: 1 }, { unique: true })
db.users.createIndex({ createdAt: 1 })
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  type: String (enum: ['recharge', 'deduction', 'refund']),
  amount: Number,
  balanceBefore: Number,
  balanceAfter: Number,
  status: String (enum: ['pending', 'completed', 'failed']),
  paymentMethod: String (enum: ['upi', 'card', 'crypto']),
  paymentGateway: String (enum: ['stripe', 'razorpay']),
  gatewayOrderId: String,
  gatewayPaymentId: String,
  metadata: {
    provider: String,
    model: String,
    tokens: Number,
    // ... other metadata
  },
  createdAt: Date (indexed),
  updatedAt: Date
}

// Indexes
db.transactions.createIndex({ userId: 1, createdAt: -1 })
db.transactions.createIndex({ type: 1, status: 1 })
db.transactions.createIndex({ gatewayOrderId: 1 })
```

### Usage Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  provider: String (indexed),
  model: String,
  requestTokens: Number,
  responseTokens: Number,
  totalTokens: Number,
  cost: Number,
  latency: Number (milliseconds),
  status: String (enum: ['success', 'error']),
  errorMessage: String,
  metadata: {
    ide: String,
    endpoint: String,
    // ... other metadata
  },
  createdAt: Date (indexed, TTL: 30 days)
}

// Indexes
db.usage.createIndex({ userId: 1, provider: 1 })
db.usage.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })
```

### Snapshots Collection
```javascript
{
  _id: ObjectId,
  snapshotId: String (unique, indexed),
  userId: ObjectId (ref: User, indexed),
  name: String,
  description: String,
  data: Binary (compressed, encrypted),
  size: Number (bytes),
  metadata: {
    ide: String,
    messageCount: Number,
    fileCount: Number,
    version: String
  },
  expiresAt: Date (indexed, TTL),
  createdAt: Date (indexed),
  accessCount: Number (default: 0)
}

// Indexes
db.snapshots.createIndex({ snapshotId: 1 }, { unique: true })
db.snapshots.createIndex({ userId: 1, createdAt: -1 })
db.snapshots.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Schema Relationships
```
User (1) ──────< (N) Transaction
User (1) ──────< (N) Usage
User (1) ──────< (N) Snapshot
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "credits": 0
  }
}
```

#### POST /api/auth/login
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "credits": 10.50
  }
}
```

### Credit Endpoints

#### GET /api/credits/balance
Get current credit balance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "balance": 10.50,
  "lastTransaction": {
    "type": "deduction",
    "amount": 0.05,
    "timestamp": "2026-05-17T06:30:00Z"
  }
}
```

#### POST /api/credits/deduct
Deduct credits for AI usage.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 0.05,
  "metadata": {
    "provider": "openai",
    "model": "gpt-4",
    "tokens": 150
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "remainingCredits": 10.45,
  "transaction": {
    "id": "txn_123",
    "amount": 0.05,
    "timestamp": "2026-05-17T06:30:00Z"
  }
}
```

### Payment Endpoints

#### POST /api/payments/create-order
Create a payment order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 10.00,
  "currency": "USD",
  "method": "card",
  "gateway": "stripe"
}
```

**Response (200):**
```json
{
  "success": true,
  "orderId": "order_123",
  "amount": 10.00,
  "currency": "USD",
  "clientSecret": "pi_123_secret_456"
}
```

#### POST /api/payments/webhook/stripe
Stripe webhook handler (internal).

#### POST /api/payments/webhook/razorpay
Razorpay webhook handler (internal).

### AI Proxy Endpoints

#### POST /api/ai/chat
Proxy AI chat request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.7
}
```

**Response (200):**
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "Hello! How can I help you today?"
  },
  "usage": {
    "promptTokens": 10,
    "completionTokens": 15,
    "totalTokens": 25
  },
  "cost": 0.05,
  "remainingCredits": 10.45
}
```

### Snapshot Endpoints

#### POST /api/snapshots/create
Create context snapshot.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "My Project Context",
  "description": "Working on authentication feature",
  "data": {
    "messages": [...],
    "files": [...],
    "metadata": {...}
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "snapshotId": "snap_123",
  "shareUrl": "walletx://import/snap_123",
  "expiresAt": "2026-06-17T06:30:00Z"
}
```

#### GET /api/snapshots/:snapshotId
Retrieve context snapshot.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "snapshot": {
    "id": "snap_123",
    "name": "My Project Context",
    "data": {...},
    "metadata": {...},
    "createdAt": "2026-05-17T06:30:00Z"
  }
}
```

## Security Architecture

### Authentication Flow

```
1. User Registration/Login
   ↓
2. Server generates JWT with:
   - User ID
   - Email
   - Expiration (7 days)
   - Signature (HMAC-SHA256)
   ↓
3. Client stores token securely:
   - Extension: chrome.storage.local
   - SDK: Encrypted local storage
   ↓
4. Every API request includes:
   Authorization: Bearer <token>
   ↓
5. Server validates token:
   - Verify signature
   - Check expiration
   - Load user from database
   ↓
6. Request processed with user context
```

### Security Measures

#### 1. Password Security
```javascript
// Hashing with bcrypt (10 rounds)
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### 2. JWT Security
```javascript
// Token generation
const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d', algorithm: 'HS256' }
);

// Token verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### 3. Rate Limiting
```javascript
// Per-user rate limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: (req) => req.user.id
});
```

#### 4. Input Validation
```javascript
// Joi schema validation
const schema = Joi.object({
  amount: Joi.number().min(0.01).max(1000).required(),
  metadata: Joi.object().optional()
});

const { error, value } = schema.validate(req.body);
```

#### 5. Database Transaction Safety
```javascript
// Atomic credit deduction
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Deduct credits
  // Record transaction
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

#### 6. Payment Webhook Verification
```javascript
// Stripe signature verification
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Data Encryption

#### At Rest
- Database: MongoDB encryption at rest
- Snapshots: AES-256 encryption before storage
- Passwords: bcrypt hashing (irreversible)

#### In Transit
- HTTPS/TLS 1.3 for all API communication
- WSS for WebSocket connections
- Certificate pinning in production

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer (Nginx)
        │
        ├─────────┬─────────┬─────────┐
        │         │         │         │
    Server 1  Server 2  Server 3  Server N
        │         │         │         │
        └─────────┴─────────┴─────────┘
                  │
            MongoDB Cluster
         (Primary + Replicas)
```

### Database Scaling

#### Read Replicas
```javascript
// MongoDB connection with read preference
mongoose.connect(MONGODB_URI, {
  readPreference: 'secondaryPreferred',
  replicaSet: 'walletx-rs'
});
```

#### Sharding Strategy
```javascript
// Shard by userId for even distribution
sh.shardCollection("walletx.transactions", { userId: 1 })
sh.shardCollection("walletx.usage", { userId: 1 })
```

### Caching Strategy

#### Redis for Session/Pricing Cache
```javascript
// Cache pricing data (1 hour TTL)
await redis.setex('pricing:openai:gpt-4', 3600, JSON.stringify(pricing));

// Cache user sessions
await redis.setex(`session:${userId}`, 3600, JSON.stringify(user));
```

### Performance Optimizations

1. **Database Indexes**: All frequently queried fields indexed
2. **Connection Pooling**: MongoDB connection pool (10-50 connections)
3. **Query Optimization**: Use of aggregation pipelines
4. **Response Compression**: gzip compression for API responses
5. **CDN**: Static assets served via CDN

## Technology Decisions

### Why Node.js?
- **Async I/O**: Perfect for I/O-heavy operations (API calls, database)
- **JavaScript**: Same language across stack (SDK, Extension, Backend)
- **NPM Ecosystem**: Rich library ecosystem
- **Performance**: V8 engine provides excellent performance

### Why MongoDB?
- **Flexible Schema**: Easy to evolve data models
- **JSON Native**: Natural fit for JavaScript
- **Horizontal Scaling**: Built-in sharding support
- **Transactions**: ACID transactions for critical operations

### Why Express.js?
- **Simplicity**: Minimal, unopinionated framework
- **Middleware**: Rich middleware ecosystem
- **Performance**: Fast and lightweight
- **Community**: Large community and extensive documentation

### Why JWT?
- **Stateless**: No server-side session storage needed
- **Scalable**: Works across multiple servers
- **Standard**: Industry-standard authentication
- **Flexible**: Can include custom claims

### Why Chrome Extension Manifest V3?
- **Future-Proof**: Latest standard, V2 deprecated
- **Security**: Enhanced security with service workers
- **Performance**: Better resource management
- **Required**: Chrome Web Store requirement

---

**Last Updated:** May 17, 2026  
**Version:** 1.0.0  
**Architecture Review:** Pending  
**Maintained by:** WalletX Team