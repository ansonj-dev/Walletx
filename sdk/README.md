# WalletX SDK

Universal AI credit wallet SDK for IDE integrations. Enable any IDE extension to consume WalletX credits with just a few lines of code.

[![npm version](https://badge.fury.io/js/%40walletx%2Fsdk.svg)](https://www.npmjs.com/package/@walletx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
npm install @walletx/sdk
```

```javascript
const WalletX = require('@walletx/sdk');

// Initialize
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Your IDE Name'
});

// Authenticate
await walletx.authenticate('WX-A7B3C9D2');

// Make AI request (auto-deducts credits)
const response = await walletx.makeAIRequest('gpt-4o', [
  { role: 'user', content: 'Hello, world!' }
]);

console.log(response.data);
```

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Authentication](#authentication)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## ✨ Features

- **Universal Integration**: Works with any IDE (Cursor, Copilot, Windsurf, Antigravity, etc.)
- **Automatic Credit Management**: Auto-deducts credits for AI requests
- **Multi-Model Support**: OpenAI, Anthropic, Google Gemini, and more
- **Context Persistence**: Save and restore IDE context across sessions
- **Cross-IDE Compatibility**: Share context between different IDEs
- **Offline Support**: Queue requests when offline
- **Event-Driven**: Real-time balance updates and notifications
- **TypeScript Support**: Full type definitions included
- **Zero Configuration**: Works out of the box with sensible defaults

## 📦 Installation

### NPM
```bash
npm install @walletx/sdk
```

### Yarn
```bash
yarn add @walletx/sdk
```

### PNPM
```bash
pnpm add @walletx/sdk
```

## 🔐 Authentication

### Get Your Secret Address

1. Visit [walletx.dev](https://walletx.dev)
2. Create an account or sign in
3. Navigate to Settings → API Keys
4. Copy your secret address (format: `WX-XXXXXXXX`)

### Authenticate in Your IDE

```javascript
const WalletX = require('@walletx/sdk');

const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'My IDE',
  version: '1.0.0'
});

try {
  const { user, balance } = await walletx.authenticate('WX-A7B3C9D2');
  console.log(`Authenticated as ${user.email}`);
  console.log(`Balance: ${balance} credits`);
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

## 🧠 Core Concepts

### 1. WalletXClient

Main SDK class that provides access to all features.

```javascript
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',  // API endpoint
  ideName: 'My IDE',                   // Your IDE name
  version: '1.0.0',                    // Your IDE version
  timeout: 30000,                      // Request timeout (ms)
  retries: 3,                          // Auto-retry count
  retryDelay: 1000,                    // Delay between retries (ms)
  offlineMode: false                   // Enable offline queuing
});
```

### 2. Credit Manager

Handles all credit operations.

```javascript
// Check balance
const balance = await walletx.getBalance();

// Estimate cost
const cost = await walletx.credits.estimateCost('gpt-4o', 1500);

// Subscribe to balance changes
walletx.credits.subscribe((newBalance) => {
  console.log(`Balance updated: ${newBalance}`);
});

// Get transaction history
const history = await walletx.credits.getHistory(50);
```

### 3. AI Proxy Client

Routes AI requests through WalletX.

```javascript
// Chat completion
const response = await walletx.ai.chat('gpt-4o', [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
]);

// Text completion
const completion = await walletx.ai.complete('gpt-4o', 'Write a function to');

// Get supported models
const models = await walletx.ai.getSupportedModels();

// Get model pricing
const pricing = await walletx.ai.getModelPricing('gpt-4o');
```

### 4. Context Manager

Manages IDE context snapshots.

```javascript
// Save context
await walletx.saveContext({
  name: 'My Session',
  context: {
    chatHistory: [...],
    openFiles: [...],
    workspaceState: {...}
  }
});

// Load context
const snapshot = await walletx.loadContext(snapshotId);

// List snapshots
const snapshots = await walletx.context.list();

// Export for sharing
const exportData = await walletx.context.export(snapshotId);
console.log(`Share code: ${exportData.secretCode}`);

// Import from another IDE
const imported = await walletx.context.import(secretCode, snapshotId);
```

## 📚 API Reference

### WalletXClient

#### Constructor

```javascript
new WalletX(config: Object)
```

**Config Options:**
- `apiUrl` (string): API endpoint URL
- `ideName` (string): Your IDE name
- `version` (string): Your IDE version
- `timeout` (number): Request timeout in milliseconds
- `retries` (number): Number of retry attempts
- `retryDelay` (number): Delay between retries in milliseconds
- `offlineMode` (boolean): Enable offline request queuing

#### Methods

##### authenticate(secretAddress: string)
Authenticate with WalletX.

```javascript
const { user, balance } = await walletx.authenticate('WX-A7B3C9D2');
```

##### getBalance(forceRefresh?: boolean)
Get current credit balance.

```javascript
const balance = await walletx.getBalance(true);
```

##### makeAIRequest(model: string, messages: Array, options?: Object)
Make an AI request through WalletX proxy.

```javascript
const response = await walletx.makeAIRequest('gpt-4o', messages, {
  temperature: 0.7,
  maxTokens: 1000
});
```

##### saveContext(snapshot: Object)
Save IDE context.

```javascript
await walletx.saveContext({
  name: 'Session Name',
  context: { /* your context data */ }
});
```

##### loadContext(snapshotId: string)
Load IDE context.

```javascript
const snapshot = await walletx.loadContext('snapshot-id');
```

##### isAuthenticated()
Check if user is authenticated.

```javascript
if (walletx.isAuthenticated()) {
  // User is authenticated
}
```

##### logout()
Logout and clear session.

```javascript
await walletx.logout();
```

#### Events

Listen to events using `.on()`:

```javascript
// Balance updated
walletx.on('balance_updated', (balance) => {
  console.log(`New balance: ${balance}`);
});

// Insufficient credits
walletx.on('insufficient_credits', (error) => {
  console.log('Need more credits!');
});

// Request completed
walletx.on('request_completed', (data) => {
  console.log(`Used ${data.creditsUsed} credits`);
});

// Session expired
walletx.on('session_expired', () => {
  console.log('Session expired, please re-authenticate');
});
```

### CreditManager

Access via `walletx.credits`

#### Methods

##### checkBalance(amount?: number)
Check if sufficient balance exists.

```javascript
const canAfford = await walletx.credits.checkBalance(10);
```

##### estimateCost(model: string, tokenCount: number)
Estimate cost for a request.

```javascript
const cost = await walletx.credits.estimateCost('gpt-4o', 1500);
```

##### getHistory(limit?: number, offset?: number)
Get transaction history.

```javascript
const history = await walletx.credits.getHistory(50, 0);
```

##### subscribe(callback: Function)
Subscribe to balance changes.

```javascript
const unsubscribe = walletx.credits.subscribe((balance) => {
  console.log(`Balance: ${balance}`);
});

// Later: unsubscribe()
```

### AIProxyClient

Access via `walletx.ai`

#### Methods

##### chat(model: string, messages: Array, options?: Object)
Chat completion.

```javascript
const response = await walletx.ai.chat('gpt-4o', messages, {
  temperature: 0.7,
  maxTokens: 1000
});
```

##### complete(model: string, prompt: string, options?: Object)
Text completion.

```javascript
const response = await walletx.ai.complete('gpt-4o', 'Write a function');
```

##### getSupportedModels(forceRefresh?: boolean)
Get list of supported models.

```javascript
const models = await walletx.ai.getSupportedModels();
```

##### getModelPricing(model: string)
Get pricing for a model.

```javascript
const pricing = await walletx.ai.getModelPricing('gpt-4o');
// { input: 0.03, output: 0.06 }
```

### ContextManager

Access via `walletx.context`

#### Methods

##### save(name: string, context: Object)
Save context snapshot.

```javascript
await walletx.context.save('My Session', contextData);
```

##### load(snapshotId: string)
Load context snapshot.

```javascript
const snapshot = await walletx.context.load('snapshot-id');
```

##### list(options?: Object)
List all snapshots.

```javascript
const snapshots = await walletx.context.list({
  limit: 50,
  sortBy: 'createdAt',
  order: 'desc'
});
```

##### delete(snapshotId: string)
Delete a snapshot.

```javascript
await walletx.context.delete('snapshot-id');
```

##### export(snapshotId: string)
Export snapshot for sharing.

```javascript
const { secretCode, expiresAt } = await walletx.context.export('snapshot-id');
```

##### import(secretCode: string, snapshotId: string)
Import snapshot from another IDE.

```javascript
const snapshot = await walletx.context.import('SECRET-CODE', 'snapshot-id');
```

## 🔌 Integration Examples

### Cursor IDE

```javascript
const WalletX = require('@walletx/sdk');

const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Cursor'
});

await walletx.authenticate(process.env.WALLETX_SECRET);

// Intercept Cursor's AI requests
cursor.onAIRequest(async (model, messages) => {
  try {
    const response = await walletx.makeAIRequest(model, messages);
    return response.data;
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      cursor.showRechargePrompt();
    }
    throw error;
  }
});
```

See [examples/cursor-integration.js](examples/cursor-integration.js) for complete example.

### GitHub Copilot

```javascript
const WalletX = require('@walletx/sdk');

const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'GitHub Copilot'
});

await walletx.authenticate(process.env.WALLETX_SECRET);

copilot.onCompletion(async (prompt) => {
  const canAfford = await walletx.credits.checkBalance();
  if (!canAfford) {
    return copilot.showInsufficientCreditsError();
  }

  const completion = await walletx.ai.complete('gpt-4o', prompt);
  return completion.data;
});
```

See [examples/copilot-integration.js](examples/copilot-integration.js) for complete example.

### Windsurf IDE

```javascript
const WalletX = require('@walletx/sdk');

const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Windsurf'
});

await walletx.authenticate(windsurf.getUserSecret());

// Save context before closing
windsurf.onBeforeClose(async () => {
  await walletx.saveContext({
    name: 'Windsurf Session',
    context: windsurf.getFullContext()
  });
});

// Load context on open
windsurf.onOpen(async () => {
  const latest = await walletx.context.getLatest();
  if (latest) {
    windsurf.restoreContext(latest.context);
  }
});
```

See [examples/windsurf-integration.js](examples/windsurf-integration.js) for complete example.

### Antigravity IDE

```javascript
const WalletX = require('@walletx/sdk');

const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Antigravity'
});

await walletx.authenticate(antigravity.config.walletxSecret);

antigravity.ai.setProvider(async (model, input) => {
  // Estimate cost
  const cost = await walletx.credits.estimateCost(model, input.length);
  antigravity.showCostEstimate(cost);
  
  // Make request
  const response = await walletx.ai.chat(model, input);
  antigravity.showActualCost(response.creditsUsed);
  
  return response.data;
});
```

See [examples/antigravity-integration.js](examples/antigravity-integration.js) for complete example.

## ⚠️ Error Handling

The SDK provides custom error classes for different scenarios:

```javascript
const {
  InsufficientCreditsError,
  AuthenticationError,
  NetworkError,
  InvalidModelError,
  SnapshotError
} = require('@walletx/sdk');

try {
  await walletx.makeAIRequest('gpt-4o', messages);
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    console.log(`Need ${error.details.required} credits`);
    console.log(`Have ${error.details.available} credits`);
    // Show recharge prompt
  } else if (error instanceof AuthenticationError) {
    // Re-authenticate
  } else if (error instanceof NetworkError) {
    // Retry or show offline message
  } else if (error instanceof InvalidModelError) {
    console.log(`Available models: ${error.details.availableModels}`);
  }
}
```

### Error Codes

- `INSUFFICIENT_CREDITS`: Not enough credits for request
- `AUTHENTICATION_ERROR`: Authentication failed or expired
- `NETWORK_ERROR`: Network request failed
- `INVALID_MODEL`: Model not supported
- `INVALID_CONFIG`: Invalid configuration
- `SNAPSHOT_ERROR`: Snapshot operation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## 💡 Best Practices

### 1. Check Balance Before Expensive Operations

```javascript
const estimatedCost = await walletx.credits.estimateCost('gpt-4o', 5000);
const canAfford = await walletx.credits.checkBalance(estimatedCost);

if (!canAfford) {
  // Show warning or recharge prompt
  return;
}

// Proceed with request
```

### 2. Subscribe to Balance Updates

```javascript
walletx.credits.subscribe((balance) => {
  updateUI(balance);
  
  if (balance < 10) {
    showLowBalanceWarning();
  }
});
```

### 3. Handle Session Expiration

```javascript
walletx.on('session_expired', async () => {
  const secretAddress = await promptUserForSecret();
  await walletx.authenticate(secretAddress);
});
```

### 4. Use Offline Mode for Unreliable Connections

```javascript
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'My IDE',
  offlineMode: true  // Queue requests when offline
});

// Requests will be queued and sent when connection is restored
```

### 5. Save Context Regularly

```javascript
// Auto-save every 5 minutes
setInterval(async () => {
  if (walletx.isAuthenticated()) {
    await walletx.saveContext({
      name: `Auto-save ${new Date().toISOString()}`,
      context: getCurrentContext()
    });
  }
}, 5 * 60 * 1000);
```

### 6. Estimate Costs for User Transparency

```javascript
const cost = await walletx.credits.estimateCost(model, tokenCount);
const proceed = await showConfirmDialog(
  `This will cost approximately ${cost} credits. Continue?`
);

if (proceed) {
  await walletx.makeAIRequest(model, messages);
}
```

## ❓ FAQ

### How do I get a WalletX secret address?

Visit [walletx.dev](https://walletx.dev), create an account, and navigate to Settings → API Keys.

### Which AI models are supported?

WalletX supports all major AI models:
- OpenAI: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- Anthropic: Claude 3 Opus, Sonnet, Haiku
- Google: Gemini Pro, Gemini 1.5 Pro

Use `walletx.ai.getSupportedModels()` to get the full list.

### How are credits calculated?

Credits are based on token usage. Different models have different rates. Use `walletx.credits.estimateCost()` to estimate before making requests.

### Can I use WalletX in multiple IDEs?

Yes! That's the whole point. Use the same secret address across all your IDEs and share context between them.

### What happens if I run out of credits?

Requests will fail with an `InsufficientCreditsError`. You can catch this error and prompt the user to recharge.

### Is my data secure?

Yes. All communication is encrypted via HTTPS. Your secret address is stored locally and never shared.

### Can I use WalletX offline?

Yes, enable `offlineMode` in the config. Requests will be queued and sent when connection is restored.

### How do I share context between IDEs?

1. Export context: `const { secretCode } = await walletx.context.export(snapshotId)`
2. Share the secret code
3. Import in another IDE: `await walletx.context.import(secretCode, snapshotId)`

### What's the difference between `chat()` and `complete()`?

- `chat()`: For conversational AI with message history
- `complete()`: For single-turn text completion

### How do I handle rate limits?

The SDK automatically retries failed requests. You can configure retry behavior:

```javascript
const walletx = new WalletX({
  retries: 5,
  retryDelay: 2000
});
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- Documentation: [docs.walletx.dev](https://docs.walletx.dev)
- Email: support@walletx.dev
- Discord: [discord.gg/walletx](https://discord.gg/walletx)
- GitHub Issues: [github.com/walletx/sdk/issues](https://github.com/walletx/sdk/issues)

## 🔗 Links

- Website: [walletx.dev](https://walletx.dev)
- NPM Package: [@walletx/sdk](https://www.npmjs.com/package/@walletx/sdk)
- GitHub: [github.com/walletx/sdk](https://github.com/walletx/sdk)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

---

Made with ❤️ by the WalletX Team