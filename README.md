# WalletX - Universal AI Credit Wallet

**IBM Bob Hackathon Submission | May 2026**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-green)](https://www.mongodb.com/)

## 🎯 Problem & Solution

### The Problem
Modern developers face three critical pain points when using AI-powered IDEs:

1. **Multiple Subscriptions** 💸
   - Cursor IDE: $20/month
   - Windsurf: $15/month
   - GitHub Copilot: $10/month
   - Total: $45/month for basic AI features

2. **Vendor Lock-in** 🔒
   - Each IDE has its own credit system
   - Can't transfer credits between tools
   - Forced to stick with one IDE or waste money

3. **Context Loss** 📝
   - Switching IDEs means losing conversation history
   - No way to export/import AI context
   - Start from scratch every time

### The Solution
**WalletX** is a universal AI credit wallet that works across ANY IDE and ANY AI provider:

✅ **One Wallet, All IDEs** - Buy credits once, use everywhere  
✅ **True Portability** - Export context from Cursor, import to Windsurf  
✅ **Pay-as-you-go** - Only pay for what you use, no subscriptions  
✅ **Multi-Provider** - Choose between OpenAI, Anthropic, IBM Watsonx, Together AI  
✅ **Full Transparency** - See exact costs per request in real-time  

## 🚀 Key Innovation

WalletX introduces a **universal credit system** that decouples AI credits from IDE vendors:

```
Traditional Model:          WalletX Model:
┌─────────────┐            ┌─────────────┐
│  Cursor     │            │  WalletX    │
│  Credits    │            │  Universal  │
└─────────────┘            │  Credits    │
                           └──────┬──────┘
┌─────────────┐                   │
│  Windsurf   │            ┌──────┴──────┐
│  Credits    │            │             │
└─────────────┘         ┌──▼──┐      ┌──▼──┐
                        │Cursor│      │Wind-│
┌─────────────┐         │      │      │surf │
│  Copilot    │         └──────┘      └─────┘
│  Credits    │            │             │
└─────────────┘         ┌──▼──┐      ┌──▼──┐
                        │ VS  │      │Anti-│
Siloed & Expensive      │Code │      │grav │
                        └─────┘      └─────┘
                        
                        Universal & Flexible
```

## 📦 Project Structure

WalletX consists of three integrated components:

```
WalletX/
├── backend/              # Node.js API Server (23 files)
│   ├── server.js         # Express server
│   ├── routes/           # API endpoints
│   ├── models/           # MongoDB schemas
│   ├── services/         # Business logic
│   ├── middleware/       # Auth & rate limiting
│   └── config/           # Configuration
│
├── extension/            # Chrome Extension (13 files)
│   ├── manifest.json     # Extension config
│   ├── popup.html/js     # User interface
│   ├── background.js     # Service worker
│   └── content.js        # Page injection
│
└── sdk/                  # IDE Integration SDK (17 files)
    ├── src/
    │   ├── WalletXClient.js    # Main client
    │   ├── CreditManager.js    # Credit operations
    │   ├── AIProxyClient.js    # AI provider proxy
    │   └── ContextManager.js   # Context export/import
    └── examples/               # IDE integrations
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Chrome/Edge browser

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### 2. Extension Setup
```bash
# Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension/ folder
```

### 3. SDK Integration (for IDE developers)
```bash
cd sdk
npm install
npm test
```

### 4. Test the System
```bash
# Register a user via extension
# Recharge credits ($10 minimum)
# Make an AI request from any IDE
# Watch credits deduct in real-time!
```

## 🎥 Demo

### User Flow
1. **Install Extension** → Register account
2. **Recharge Credits** → $10 via UPI/Stripe/Crypto
3. **Open Cursor IDE** → Make AI request
4. **Credits Auto-Deduct** → See exact cost
5. **Export Context** → Save conversation
6. **Switch to Windsurf** → Import context
7. **Continue Seamlessly** → Same conversation, different IDE

### Screenshots
```
[Extension Popup]        [Credit Balance]       [Context Export]
┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐
│ WalletX         │     │ Balance: $8.47  │    │ Export Context  │
│ Balance: $10.00 │     │ Last: -$0.03    │    │ ✓ 15 messages   │
│                 │     │ GPT-4 request   │    │ ✓ 3 files       │
│ [Recharge]      │     │                 │    │ [Download JSON] │
│ [History]       │     │ [View Details]  │    │ [Share Link]    │
└─────────────────┘     └─────────────────┘    └─────────────────┘
```

## 🏗️ Architecture

### High-Level System Design
```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Cursor  │  │ Windsurf │  │ VS Code  │  │Antigravity│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    WalletX SDK (Client)   │
        │  - Credit Management      │
        │  - Context Export/Import  │
        │  - AI Provider Routing    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Browser Extension       │
        │  - Balance Display        │
        │  - Payment UI             │
        │  - Transaction History    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Backend API Server      │
        │  - Authentication         │
        │  - Credit Management      │
        │  - Payment Processing     │
        │  - AI Provider Proxy      │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
   ┌────▼────┐              ┌──────▼──────┐
   │ MongoDB │              │ AI Providers│
   │ - Users │              │ - OpenAI    │
   │ - Txns  │              │ - Anthropic │
   │ - Usage │              │ - IBM       │
   └─────────┘              │ - Together  │
                            └─────────────┘
```

## 💡 How It Works

### Credit Recharge Flow
```
1. User clicks "Recharge" in extension
2. Selects payment method (UPI/Stripe/Crypto)
3. Completes payment via gateway
4. Webhook confirms payment
5. Backend credits user account
6. Extension updates balance display
```

### AI Request Flow
```
1. Developer makes AI request in IDE
2. SDK intercepts request
3. SDK calls WalletX backend with auth token
4. Backend checks user balance
5. Backend estimates cost based on model
6. If sufficient balance:
   a. Deducts estimated credits
   b. Forwards request to AI provider
   c. Receives response
   d. Adjusts final cost (refund if overestimated)
   e. Returns response to IDE
7. SDK delivers response to IDE
8. Extension shows updated balance
```

### Context Export/Import Flow
```
Export:
1. User clicks "Export Context" in IDE
2. SDK gathers conversation history + files
3. SDK uploads to WalletX backend
4. Backend generates snapshot ID
5. User receives shareable link/JSON

Import:
1. User opens different IDE
2. Clicks "Import Context"
3. Provides snapshot ID or JSON
4. SDK downloads from backend
5. SDK reconstructs conversation in new IDE
6. User continues from where they left off
```

## 🔧 Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB 6+ with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Payment:** Stripe, Razorpay (UPI), Crypto integrations
- **Rate Limiting:** express-rate-limit
- **Security:** bcrypt, helmet, cors

### Browser Extension
- **Manifest:** V3 (latest Chrome standard)
- **UI:** HTML5 + CSS3 + Vanilla JavaScript
- **Storage:** chrome.storage.local
- **Background:** Service Worker
- **Content Scripts:** DOM injection for IDE detection

### SDK
- **Language:** JavaScript (ES6+)
- **Build:** No build step (pure JS for compatibility)
- **Testing:** Jest
- **Package Manager:** NPM
- **License:** MIT

### AI Providers
- OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- IBM Watsonx (Granite models)
- Together AI (Open source models)

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions (planned)
- **Deployment:** Docker + Docker Compose
- **Monitoring:** Winston logging
- **Environment:** dotenv for config

## 📊 Features

### Core Features
✅ **Universal Credit System**
- Single balance works across all IDEs
- Pay-as-you-go pricing
- No subscriptions or commitments

✅ **Multi-Payment Support**
- UPI (India) via Razorpay
- Credit/Debit cards via Stripe
- Cryptocurrency (planned)

✅ **Cross-IDE Context Portability**
- Export conversations from any IDE
- Import into any other IDE
- Preserve file references and history

✅ **Multi-Provider AI Routing**
- Choose provider per request
- Automatic failover
- Cost comparison

✅ **Real-Time Balance Tracking**
- Live balance updates
- Per-request cost breakdown
- Transaction history

✅ **Cost Estimation**
- Pre-request cost preview
- Token counting
- Model-specific pricing

✅ **Offline Support**
- Queue requests when offline
- Sync when connection restored
- Local balance caching

### Security Features
🔒 **Authentication**
- JWT-based auth
- Secure token storage
- Auto-refresh tokens

🔒 **Rate Limiting**
- Per-user request limits
- DDoS protection
- Abuse prevention

🔒 **Data Privacy**
- Encrypted storage
- No conversation logging
- GDPR compliant

### Developer Features
🛠️ **SDK Integration**
- Simple 5-line integration
- Framework agnostic
- TypeScript support (planned)

🛠️ **API Documentation**
- RESTful API design
- Comprehensive docs
- Postman collection

🛠️ **Testing**
- Unit tests
- Integration tests
- E2E tests (planned)

## 🤖 IBM Bob Usage

This project was built with extensive assistance from **IBM Bob**, an AI-powered development assistant. Bob helped with:

- 🏗️ **Architecture Design** - System design and component structure
- 💻 **Code Generation** - Backend routes, models, and services
- 🔍 **Cross-File Reasoning** - Dependency analysis and refactoring
- 🐛 **Debugging** - Issue identification and fixes
- 📝 **Documentation** - README files and API docs
- ✅ **Testing** - Test case generation

**Total Development Time Saved:** ~40 hours  
**Lines of Code Generated:** ~3,500+  
**Bob Sessions:** 15+

For detailed documentation of Bob's contributions, see [IBM_BOB_USAGE.md](./IBM_BOB_USAGE.md)

## 📚 Documentation

- [Architecture Details](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Hackathon Submission](./HACKATHON_SUBMISSION.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [FAQ](./FAQ.md)
- [IBM Bob Usage](./IBM_BOB_USAGE.md)

## 🚀 Roadmap

### Phase 1 (Current - Hackathon MVP)
- ✅ Core credit system
- ✅ Browser extension
- ✅ SDK for IDE integration
- ✅ Multi-provider support

### Phase 2 (Post-Hackathon)
- [ ] Chrome Web Store publication
- [ ] NPM package publication
- [ ] Production deployment
- [ ] User onboarding flow

### Phase 3 (Future)
- [ ] Team accounts
- [ ] Usage analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Enterprise features

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Team

**Team WalletX**
- Built for IBM Bob Hackathon 2026
- Developed with ❤️ and lots of ☕

## 🙏 Acknowledgments

- **IBM Bob** - For accelerating development and providing intelligent assistance
- **IBM Watsonx** - For AI model access
- **Open Source Community** - For amazing tools and libraries

## 📞 Contact

- **GitHub Issues:** [Report bugs or request features](https://github.com/yourusername/walletx/issues)
- **Email:** support@walletx.dev (planned)
- **Discord:** Join our community (planned)

---

**Built with IBM Bob | Powered by Universal Credits | Made for Developers**