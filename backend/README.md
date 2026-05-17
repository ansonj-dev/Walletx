# WalletX Backend API

Universal AI Credit Wallet Backend System for IBM Bob Hackathon

## 🚀 Overview

WalletX is a universal credit wallet that allows users to recharge once and use credits across ANY IDE (Cursor, Windsurf, Copilot, Antigravity) with ANY AI provider (Claude, GPT-4, IBM Granite, Llama).

## 📋 Features

- **Universal Credit System**: Single wallet for all AI services
- **Multi-Provider Support**: OpenAI, Anthropic, IBM Watsonx, Together AI
- **Multiple Payment Methods**: Stripe, Razorpay, Crypto
- **Context Portability**: Save and restore IDE contexts across platforms
- **First Recharge Bonus**: 2x credits on first recharge
- **Real-time Usage Tracking**: Monitor AI usage and costs
- **Secure Authentication**: JWT + Secret Address authentication

## 🛠️ Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Payment Gateways**: Stripe, Razorpay
- **AI Providers**: OpenAI, Anthropic, IBM Watsonx, Together AI
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── server.js                 # Express entry point
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── config/
│   ├── database.js          # MongoDB connection
│   └── models-pricing.js    # AI model pricing
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── credits.js           # Credit management routes
│   ├── payments.js          # Payment processing routes
│   ├── ai-proxy.js          # Universal AI gateway
│   └── snapshots.js         # Context snapshot routes
├── models/
│   ├── User.js              # User schema
│   ├── Transaction.js       # Transaction schema
│   ├── Snapshot.js          # Snapshot schema
│   └── Usage.js             # Usage tracking schema
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── rateLimit.js         # Rate limiting
└── services/
    ├── creditService.js     # Credit management logic
    ├── aiProviderService.js # AI provider routing
    └── paymentService.js    # Payment processing
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- API keys for AI providers
- Payment gateway credentials (test mode)

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure .env file:**
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/walletx
   JWT_SECRET=your-secret-key
   
   # Payment Gateways
   STRIPE_SECRET_KEY=sk_test_...
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   
   # AI Provider Keys
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   IBM_WATSONX_API_KEY=...
   TOGETHER_API_KEY=...
   ```

4. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login with email/secret address
GET    /api/auth/me                # Get current user info
GET    /api/auth/secret/:address   # Lookup by secret address
```

### Credits

```
GET    /api/credits/balance        # Get credit balance
POST   /api/credits/deduct         # Deduct credits (internal)
GET    /api/credits/history        # Transaction history
GET    /api/credits/stats          # Credit statistics
POST   /api/credits/check          # Check sufficient credits
```

### Payments

```
POST   /api/payments/stripe/create       # Create Stripe payment
POST   /api/payments/stripe/webhook      # Stripe webhook handler
POST   /api/payments/razorpay/create     # Create Razorpay order
POST   /api/payments/razorpay/verify     # Verify Razorpay payment
POST   /api/payments/crypto/verify       # Verify crypto payment
GET    /api/payments/status/:paymentId   # Get payment status
```

### AI Proxy

```
POST   /api/ai/chat                # Universal AI chat endpoint
GET    /api/ai/models              # Get available models
POST   /api/ai/estimate            # Estimate credit cost
GET    /api/ai/usage               # Get usage statistics
```

### Snapshots

```
POST   /api/snapshots/save         # Save IDE context
GET    /api/snapshots/list         # List all snapshots
GET    /api/snapshots/:id          # Get snapshot by ID
POST   /api/snapshots/import       # Import by secret code
DELETE /api/snapshots/:id          # Delete snapshot
PUT    /api/snapshots/:id          # Update snapshot name
GET    /api/snapshots/stats/overview  # Snapshot statistics
```

## 🔐 Authentication

### JWT Token Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Secret Address Authentication

For cross-IDE usage, include Secret Address in request body:
```json
{
  "secretAddress": "WX-A7B3C9D2",
  "model": "gpt-4o",
  "messages": [...]
}
```

## 💰 Credit System

- **1 credit = $0.01 USD**
- Credits are stored in cents (100 credits = $1)
- First recharge gets 2x bonus
- Credits deducted based on actual token usage

### Model Pricing (per 1K tokens)

| Model | Input | Output | Provider |
|-------|-------|--------|----------|
| GPT-4o | 0.5¢ | 1.5¢ | OpenAI |
| Claude Sonnet | 0.3¢ | 1.5¢ | Anthropic |
| Granite | 0.2¢ | 0.8¢ | IBM |
| Llama 3.3 | 0.1¢ | 0.2¢ | Together AI |

## 🔄 Usage Flow

1. **User Registration**
   - User registers with email/password
   - System generates unique Secret Address (e.g., `WX-A7B3C9D2`)
   - User receives JWT token

2. **Credit Recharge**
   - User selects payment method (Stripe/Razorpay/Crypto)
   - First recharge gets 2x bonus
   - Credits added to wallet

3. **AI Request**
   - IDE sends request to `/api/ai/chat`
   - System checks credit balance
   - Routes to appropriate AI provider
   - Deducts credits based on usage
   - Returns AI response

4. **Context Portability**
   - Save IDE context as snapshot
   - Get unique snapshot ID and secret code
   - Import snapshot in different IDE
   - Continue work seamlessly

## 🧪 Testing

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test AI Request
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ]
  }'
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation with express-validator
- MongoDB injection prevention

## 📊 Monitoring

The system tracks:
- Credit transactions
- AI usage by model and provider
- Payment history
- Snapshot access patterns
- Error rates and performance

## 🐛 Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INSUFFICIENT_CREDITS`: Not enough credits
- `INVALID_TOKEN`: JWT token invalid/expired
- `PAYMENT_FAILED`: Payment processing failed

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
STRIPE_SECRET_KEY=sk_live_...
# ... other production keys
```

### Recommended Hosting

- **API**: Heroku, Railway, Render
- **Database**: MongoDB Atlas
- **Payment Webhooks**: Configure in Stripe/Razorpay dashboard

## 📝 License

MIT License - IBM Bob Hackathon Project

## 👥 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for IBM Bob Hackathon