# WalletX - Frequently Asked Questions

Common questions and answers about WalletX, the universal AI credit wallet.

## Table of Contents
- [General Questions](#general-questions)
- [Getting Started](#getting-started)
- [Credits & Pricing](#credits--pricing)
- [Payment & Billing](#payment--billing)
- [IDE Integration](#ide-integration)
- [AI Providers](#ai-providers)
- [Context Export/Import](#context-exportimport)
- [Security & Privacy](#security--privacy)
- [Technical Questions](#technical-questions)
- [Troubleshooting](#troubleshooting)

## General Questions

### What is WalletX?

WalletX is a universal AI credit wallet that works across multiple AI-powered IDEs. Instead of paying for separate subscriptions for each IDE (Cursor, Windsurf, GitHub Copilot, etc.), you buy credits once and use them everywhere.

### How is WalletX different from IDE subscriptions?

| Feature | Traditional IDEs | WalletX |
|---------|-----------------|---------|
| Cost | $20-45/month | Pay-as-you-go |
| Works across IDEs | ❌ No | ✅ Yes |
| Context portability | ❌ No | ✅ Yes |
| Multiple AI providers | ❌ No | ✅ Yes |
| No commitment | ❌ No | ✅ Yes |

### Who is WalletX for?

- **Freelance Developers** who use multiple IDEs for different projects
- **Students** who want affordable AI assistance without subscriptions
- **Teams** who need flexible credit allocation
- **Developers** who want to try different IDEs without financial commitment
- **Anyone** tired of paying for multiple AI subscriptions

### Is WalletX free?

WalletX is free to install and use. You only pay for the AI credits you consume. There are no monthly subscriptions, no hidden fees, and credits never expire.

### How much does it cost?

You pay only for what you use:
- **Minimum recharge:** $5
- **Average usage:** $10-20/month (vs. $45/month for subscriptions)
- **Pricing:** Based on actual AI provider costs + small markup
- **No expiration:** Credits never expire

## Getting Started

### How do I get started with WalletX?

1. **Install Extension**
   - Visit Chrome Web Store
   - Search for "WalletX"
   - Click "Add to Chrome"

2. **Create Account**
   - Click extension icon
   - Click "Register"
   - Enter email and password

3. **Recharge Credits**
   - Click "Recharge"
   - Select amount ($5 minimum)
   - Complete payment

4. **Start Using**
   - Open your IDE
   - Make AI requests
   - Credits auto-deduct

### Which IDEs are supported?

Currently supported:
- ✅ Cursor
- ✅ Windsurf
- ✅ VS Code (with Copilot)
- ✅ Antigravity

Coming soon:
- 🔄 JetBrains IDEs
- 🔄 Sublime Text
- 🔄 Vim/Neovim
- 🔄 Emacs

Any IDE can integrate using our SDK!

### Do I need to install anything in my IDE?

For officially supported IDEs, WalletX works automatically through our SDK. For other IDEs, developers can integrate using our open-source SDK (5 lines of code).

### Can I use WalletX without the browser extension?

The browser extension provides the best experience (balance display, recharge, history), but you can use the SDK directly in your IDE with just an API key.

## Credits & Pricing

### How are credits calculated?

Credits are calculated based on:
1. **AI Provider** (OpenAI, Anthropic, IBM, etc.)
2. **Model** (GPT-4, Claude 3, etc.)
3. **Token Usage** (input + output tokens)

Example:
```
GPT-4 Request:
- Input: 100 tokens × $0.00003 = $0.003
- Output: 50 tokens × $0.00006 = $0.003
- Total: $0.006 (rounded to $0.01)
```

### How much do different models cost?

Approximate costs per 1,000 tokens:

**OpenAI:**
- GPT-3.5 Turbo: $0.001 - $0.002
- GPT-4: $0.03 - $0.06
- GPT-4 Turbo: $0.01 - $0.03

**Anthropic:**
- Claude 3 Haiku: $0.00025 - $0.00125
- Claude 3 Sonnet: $0.003 - $0.015
- Claude 3 Opus: $0.015 - $0.075

**IBM Watsonx:**
- Granite models: $0.001 - $0.005

**Together AI:**
- Open source models: $0.0001 - $0.001

### Do credits expire?

No! Your credits never expire. Buy once, use whenever you want.

### Can I get a refund?

Yes, unused credits can be refunded within 30 days of purchase. Contact support@walletx.dev with your request.

### Is there a minimum purchase?

Yes, the minimum recharge amount is $5. This helps cover payment processing fees.

### Are there volume discounts?

Currently:
- $5-50: Standard pricing
- $50-200: 5% bonus credits
- $200+: 10% bonus credits

Enterprise pricing available for teams.

## Payment & Billing

### What payment methods are accepted?

- **Credit/Debit Cards** (Visa, Mastercard, Amex) via Stripe
- **UPI** (India only) via Razorpay
- **Cryptocurrency** (Coming soon)

### Is my payment information secure?

Yes! We use industry-standard payment processors:
- **Stripe** for card payments (PCI DSS Level 1 certified)
- **Razorpay** for UPI payments (PCI DSS compliant)

We never store your card details on our servers.

### Can I set up auto-recharge?

Yes! You can enable auto-recharge in settings:
- Set minimum balance threshold
- Set recharge amount
- Choose payment method

When your balance drops below the threshold, we'll automatically recharge.

### How do I view my transaction history?

1. Click extension icon
2. Click "History" tab
3. View all transactions with:
   - Date and time
   - Amount
   - Type (recharge/deduction)
   - Balance after transaction

### Can I download invoices?

Yes! Go to Settings → Billing → Download Invoices. Invoices are available for all recharge transactions.

### Do you offer team/business accounts?

Yes! Team accounts include:
- Shared credit pool
- Usage analytics per member
- Centralized billing
- Admin controls

Contact sales@walletx.dev for pricing.

## IDE Integration

### How does WalletX integrate with my IDE?

WalletX uses a lightweight SDK that:
1. Intercepts AI requests from your IDE
2. Checks your credit balance
3. Forwards request to AI provider
4. Deducts credits based on usage
5. Returns response to your IDE

All of this happens transparently in milliseconds.

### Will it slow down my IDE?

No! WalletX adds less than 50ms latency to AI requests. The SDK is optimized for performance and runs asynchronously.

### Can I use WalletX with multiple IDEs simultaneously?

Yes! Your credits work across all IDEs. You can have Cursor, Windsurf, and VS Code all using the same WalletX account simultaneously.

### What if my IDE isn't supported?

You can:
1. Request support (open GitHub issue)
2. Integrate it yourself using our SDK
3. Wait for community contributions

Our SDK makes integration easy (5 lines of code).

### How do I integrate WalletX into a custom IDE?

```javascript
// Install SDK
npm install @walletx/sdk

// Initialize client
import WalletX from '@walletx/sdk';
const client = new WalletX({ apiKey: 'your-api-key' });

// Make AI request
const response = await client.ai.chat({
  provider: 'openai',
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

See [SDK documentation](./sdk/README.md) for details.

## AI Providers

### Which AI providers are supported?

Currently supported:
- ✅ OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
- ✅ Anthropic (Claude 3 Haiku, Sonnet, Opus)
- ✅ IBM Watsonx (Granite models)
- ✅ Together AI (Open source models)

Coming soon:
- 🔄 Google Gemini
- 🔄 Cohere
- 🔄 Mistral AI

### Can I choose which AI provider to use?

Yes! You can:
1. Set a default provider in settings
2. Choose per request in your IDE
3. Let WalletX auto-select the cheapest option

### What if an AI provider is down?

WalletX automatically fails over to alternative providers. If OpenAI is down, your request will be routed to Anthropic or another available provider.

### Can I use my own API keys?

Not currently. WalletX manages API keys centrally to provide:
- Automatic failover
- Cost optimization
- Usage tracking
- Unified billing

### How do I know which provider was used?

Check your transaction history in the extension. Each transaction shows:
- Provider used
- Model used
- Token count
- Exact cost

## Context Export/Import

### What is context portability?

Context portability lets you export your AI conversation from one IDE and import it into another, preserving:
- Message history
- File references
- Code snippets
- Conversation context

### How do I export context?

In your IDE:
1. Click "Export Context" (WalletX menu)
2. Choose what to include
3. Get shareable link or JSON file

### How do I import context?

In your IDE:
1. Click "Import Context" (WalletX menu)
2. Paste link or upload JSON
3. Context restored instantly

### Is exported context secure?

Yes! Exported contexts are:
- Encrypted at rest
- Accessible only with the link
- Automatically expire after 30 days (configurable)
- Can be password-protected

### Can I share context with teammates?

Yes! Share the export link with anyone. They can import it into their IDE and continue the conversation.

### How long are contexts stored?

Default: 30 days. You can configure:
- 7 days (minimum)
- 30 days (default)
- 90 days (maximum)
- Never expire (premium)

## Security & Privacy

### Is my data secure?

Yes! We implement multiple security layers:
- **Encryption:** All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Authentication:** JWT tokens with secure storage
- **Rate Limiting:** Protection against abuse
- **Payment Security:** PCI DSS compliant processors

### Do you store my AI conversations?

No! We only store:
- Transaction metadata (provider, model, cost)
- Usage statistics (anonymous)
- Exported contexts (encrypted, temporary)

We never log conversation content.

### Is WalletX GDPR compliant?

Yes! We comply with GDPR:
- Data minimization
- Right to access
- Right to deletion
- Data portability
- Consent management

### Can I delete my account?

Yes! Go to Settings → Account → Delete Account. This will:
- Delete all your data
- Refund unused credits (within 30 days)
- Remove all exported contexts

### How do you handle API keys?

Your WalletX API key:
- Is stored encrypted
- Can be regenerated anytime
- Can be revoked instantly
- Has configurable permissions

### What data do you collect?

We collect only what's necessary:
- Email (for account)
- Payment info (via processors, not stored)
- Usage statistics (anonymous)
- Transaction history

We never collect:
- Conversation content
- Code snippets
- Personal files

## Technical Questions

### What technologies does WalletX use?

**Backend:**
- Node.js 18+ with Express.js
- MongoDB 6+ database
- JWT authentication
- Stripe & Razorpay payments

**Extension:**
- Chrome Extension Manifest V3
- Vanilla JavaScript
- Service Worker

**SDK:**
- Framework-agnostic JavaScript
- NPM package

### Is WalletX open source?

Yes! WalletX is MIT licensed:
- Backend: Open source
- Extension: Open source
- SDK: Open source

Contribute on [GitHub](https://github.com/yourusername/walletx)!

### Can I self-host WalletX?

Yes! See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions. Self-hosting is great for:
- Enterprise deployments
- Custom integrations
- Privacy requirements

### What are the system requirements?

**For Users:**
- Chrome/Edge browser (latest)
- Internet connection
- Any supported IDE

**For Developers:**
- Node.js 18+
- MongoDB 6+
- 2GB RAM minimum

### Does WalletX work offline?

Partially:
- Extension works offline (shows cached balance)
- AI requests queued when offline
- Syncs when connection restored

### How do I report a bug?

1. Check [existing issues](https://github.com/yourusername/walletx/issues)
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs
3. We'll respond within 24-48 hours

## Troubleshooting

### Extension not loading

**Solution:**
1. Check Chrome version (must be latest)
2. Disable conflicting extensions
3. Reload extension:
   - chrome://extensions/
   - Click reload icon
4. Clear browser cache

### Balance not updating

**Solution:**
1. Click extension icon to refresh
2. Check internet connection
3. Log out and log back in
4. Clear extension storage:
   - chrome://extensions/
   - WalletX → Details → Clear storage

### Payment failed

**Solution:**
1. Check card details
2. Ensure sufficient funds
3. Try different payment method
4. Contact your bank
5. Contact support@walletx.dev

### AI request failed

**Solution:**
1. Check credit balance
2. Verify internet connection
3. Try different AI provider
4. Check IDE console for errors
5. Restart IDE

### Context import failed

**Solution:**
1. Verify link is correct
2. Check if context expired
3. Ensure you have permission
4. Try downloading JSON and importing manually

### SDK integration not working

**Solution:**
1. Verify API key is correct
2. Check SDK version (must be latest)
3. Review integration code
4. Check console for errors
5. See [SDK documentation](./sdk/README.md)

### High latency on AI requests

**Solution:**
1. Check internet speed
2. Try different AI provider
3. Use closer server region (coming soon)
4. Check IDE performance

### Credits deducted but no response

**Solution:**
1. Check transaction history
2. If deducted, response should arrive
3. If not, credits will be refunded automatically
4. Contact support if issue persists

## Still Have Questions?

### Contact Support

- **Email:** support@walletx.dev
- **GitHub Issues:** [Report bugs](https://github.com/yourusername/walletx/issues)
- **GitHub Discussions:** [Ask questions](https://github.com/yourusername/walletx/discussions)
- **Discord:** [Join community](https://discord.gg/walletx) (coming soon)

### Documentation

- [README](./README.md) - Project overview
- [Architecture](./ARCHITECTURE.md) - Technical details
- [Deployment](./DEPLOYMENT.md) - Setup guide
- [Contributing](./CONTRIBUTING.md) - Contribution guide
- [IBM Bob Usage](./IBM_BOB_USAGE.md) - Development story

### Response Times

- **Critical issues:** Within 4 hours
- **Bug reports:** Within 24 hours
- **Feature requests:** Within 48 hours
- **General questions:** Within 48 hours

---

**Last Updated:** May 17, 2026  
**Version:** 1.0.0  

**Can't find your question?** [Open an issue](https://github.com/yourusername/walletx/issues/new) or email support@walletx.dev