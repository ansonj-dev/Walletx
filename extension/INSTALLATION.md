# WalletX Extension - Installation Guide

## 📋 Prerequisites

Before installing the WalletX browser extension, ensure you have:

1. ✅ **WalletX Backend Running**
   - The backend API must be running on `http://localhost:3000`
   - See `backend/README.md` for backend setup instructions
   - Verify by visiting: `http://localhost:3000/api/health`

2. ✅ **Chromium-Based Browser**
   - Google Chrome (recommended)
   - Microsoft Edge
   - Brave Browser
   - Any Chromium-based browser

3. ✅ **Node.js & MongoDB** (for backend)
   - Required for the backend API to function

## 🚀 Installation Steps

### Step 1: Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
```

Verify the backend is running by checking the console output:
```
✓ MongoDB connected
✓ Server running on port 3000
```

### Step 2: Open Browser Extensions Page

**For Chrome:**
1. Open Chrome browser
2. Type `chrome://extensions/` in the address bar
3. Press Enter

**For Edge:**
1. Open Edge browser
2. Type `edge://extensions/` in the address bar
3. Press Enter

### Step 3: Enable Developer Mode

1. Look for the **"Developer mode"** toggle in the top-right corner
2. Click to enable it
3. You should now see additional options appear

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to your WalletX project directory
3. Select the **`extension`** folder
4. Click **"Select Folder"** (or "Open" on some systems)

### Step 5: Verify Installation

You should see the WalletX extension card appear with:
- ✅ Extension name: "WalletX - Universal AI Credit Wallet"
- ✅ Version: 1.0.0
- ✅ A cyan circular icon
- ✅ Status: Enabled (toggle should be ON)

### Step 6: Pin the Extension

1. Click the **puzzle icon** (🧩) in the browser toolbar
2. Find "WalletX - Universal AI Credit Wallet"
3. Click the **pin icon** (📌) next to it
4. The WalletX icon should now appear in your toolbar

## ✅ First-Time Setup

### 1. Open the Extension

Click the WalletX icon in your browser toolbar

### 2. Create an Account

**If you're a new user:**
1. Click "Register" at the bottom
2. Enter your email address
3. Create a strong password
4. (Optional) Enter your name
5. Click "Register"

**If you already have an account:**
1. Enter your email
2. Enter your password
3. Click "Login"

### 3. Verify Your Setup

After logging in, you should see:
- ✅ Your balance (initially $0.00)
- ✅ Your unique secret address (e.g., `WX-8F2A·C4D1·9E3B·7A0F`)
- ✅ Three tabs: Wallet, Models, Context
- ✅ Status indicator showing your name

## 💰 Adding Credits

### Quick Recharge

1. Open WalletX popup
2. Stay on the **Wallet** tab
3. Select an amount: $1, $5, $10, or $25
4. Or enter a custom amount
5. Choose payment method:
   - **UPI** (for Indian users)
   - **Card** (Visa, Mastercard, etc.)
   - **Crypto** (Bitcoin, Ethereum, etc.)
6. Click **"Recharge $X via [Method]"**
7. Complete payment in the opened window
8. Credits will be added automatically

### Payment Methods

**UPI (Razorpay):**
- Instant credit addition
- Supports all major UPI apps
- No additional fees

**Card (Razorpay/Stripe):**
- Visa, Mastercard, Amex supported
- Secure 3D authentication
- Small processing fee may apply

**Crypto (Stripe):**
- Bitcoin, Ethereum supported
- Blockchain confirmation required
- May take 10-30 minutes

## 🤖 Selecting AI Models

1. Open WalletX popup
2. Go to **Models** tab
3. Click on your preferred model:

| Model | Cost per 1k tokens | Best For |
|-------|-------------------|----------|
| **IBM Granite** | 0.8¢ | Cost-effective, general purpose |
| **Llama 3.3** | 0.4¢ | Budget-friendly, fast responses |
| **Claude Sonnet** | 1.2¢ | Balanced performance |
| **GPT-4o** | 1.5¢ | Highest quality, complex tasks |

4. The selected model will be used for all AI requests
5. See estimated remaining queries based on your balance

## 🌐 Using with IDEs

### Supported IDEs

The extension automatically works with:
- ✅ **Cursor** (cursor.sh)
- ✅ **Windsurf** (windsurf.com)
- ✅ **GitHub Copilot** (copilot.github.com)
- ✅ **Antigravity** (antigravity.com)

### How It Works

1. **Navigate to a supported IDE** in your browser
2. **WalletX indicator appears** in the top-right corner
   - Shows your current balance
   - Green dot = Active
   - Red dot = Inactive/No credits
3. **Use AI features normally** in the IDE
4. **Credits are deducted automatically**
5. **Notifications show** the cost of each request

### Example Usage

```
1. Open Cursor IDE (cursor.sh)
2. See WalletX indicator: "WalletX $10.00 🟢"
3. Ask AI: "Write a React component"
4. Notification: "-$0.02 · Granite"
5. Updated balance: "WalletX $9.98 🟢"
```

## 💾 Context Snapshots

### Saving Context

1. Open WalletX popup
2. Go to **Context** tab
3. Click **"Save current context"**
4. Your IDE state is saved with your secret address

### Loading Context

1. Go to **Context** tab
2. Click **"load"** on any saved snapshot
3. Context is restored in your IDE

### Importing via Secret Address

1. Get a secret address from another user
2. Enter it in the import field
3. Click **"Import"**
4. Their context is loaded into your IDE

## 🔧 Configuration

### Changing API Endpoint

If your backend is hosted elsewhere:

1. Open `extension/config.js`
2. Find the line:
   ```javascript
   API_BASE_URL: 'http://localhost:3000/api',
   ```
3. Change to your API URL:
   ```javascript
   API_BASE_URL: 'https://api.walletx.com/api',
   ```
4. Reload the extension

### Updating the Extension

When new features are added:

1. Pull the latest code
2. Go to `chrome://extensions/`
3. Find WalletX
4. Click the **refresh icon** (🔄)
5. Extension is updated

## 🐛 Troubleshooting

### Extension Won't Load

**Problem:** "Load unpacked" fails or extension doesn't appear

**Solutions:**
- ✅ Ensure Developer Mode is enabled
- ✅ Select the `extension` folder, not the root project folder
- ✅ Check that all files exist (manifest.json, popup.html, etc.)
- ✅ Look for errors in the Extensions page

### Can't Login/Register

**Problem:** "Failed to authenticate" or network errors

**Solutions:**
- ✅ Verify backend is running: `http://localhost:3000`
- ✅ Check backend console for errors
- ✅ Ensure MongoDB is connected
- ✅ Check browser console (F12) for CORS errors
- ✅ Verify API_BASE_URL in config.js

### Credits Not Deducting

**Problem:** Using AI in IDE but balance doesn't change

**Solutions:**
- ✅ Check that you're logged in (click extension icon)
- ✅ Verify sufficient balance
- ✅ Check browser console for interception logs
- ✅ Ensure IDE domain is supported
- ✅ Try refreshing the IDE page

### Balance Shows $0.00

**Problem:** Added credits but balance is zero

**Solutions:**
- ✅ Wait 30 seconds for auto-sync
- ✅ Click extension icon to manually refresh
- ✅ Check backend logs for payment webhook
- ✅ Verify payment was successful
- ✅ Check transaction history in backend

### WalletX Indicator Not Showing

**Problem:** No indicator appears on IDE page

**Solutions:**
- ✅ Refresh the IDE page
- ✅ Check that content script is injected (F12 → Console)
- ✅ Verify IDE domain is in manifest.json
- ✅ Reload the extension
- ✅ Check for JavaScript errors

## 📊 Monitoring Usage

### Check Balance

- Click the WalletX icon anytime
- Balance updates every 30 seconds
- Real-time updates after each AI request

### View Transaction History

Currently available via backend API:
```bash
curl http://localhost:3000/api/credits/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔒 Security Best Practices

1. **Never share your JWT token**
2. **Keep your secret address private** (unless sharing context)
3. **Use strong passwords** for your account
4. **Log out on shared computers**
5. **Monitor your balance regularly**

## 📱 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Fully Supported | Recommended |
| Edge | ✅ Fully Supported | Chromium-based |
| Brave | ✅ Fully Supported | Chromium-based |
| Opera | ✅ Should Work | Chromium-based |
| Firefox | ❌ Not Supported | Manifest V3 differences |
| Safari | ❌ Not Supported | Different extension format |

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review backend logs** for API errors
3. **Check browser console** (F12) for extension errors
4. **Verify configuration** in config.js
5. **Ensure all prerequisites** are met

## 🎉 Success!

You're all set! Start using WalletX across your favorite IDEs with a unified credit system.

**Next Steps:**
1. ✅ Add some credits
2. ✅ Select your preferred AI model
3. ✅ Navigate to an IDE
4. ✅ Start coding with AI assistance!

---

**Version:** 1.0.0  
**Last Updated:** May 2026