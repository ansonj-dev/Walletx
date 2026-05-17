# WalletX Browser Extension

Universal AI Credit Wallet for cross-IDE AI model usage.

## 🚀 Features

- **Universal Credit System**: Pay once, use across all supported IDEs
- **Multi-IDE Support**: Cursor, Windsurf, GitHub Copilot, Antigravity
- **Multiple AI Models**: GPT-4o, Claude Sonnet, IBM Granite, Llama 3.3
- **Real-time Balance Tracking**: See your credits in real-time
- **Context Snapshots**: Save and share your IDE context
- **Secure Authentication**: JWT-based authentication with the backend
- **Payment Integration**: UPI, Card, and Crypto payment options
- **Credit Deduction Notifications**: Get notified when credits are used

## 📦 Installation

### Prerequisites

1. **Backend API Running**: Ensure the WalletX backend is running on `http://localhost:3000`
2. **Chrome/Edge Browser**: This extension is built for Chromium-based browsers

### Steps

1. **Open Extension Management**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - The WalletX extension should now appear in your extensions list

4. **Pin Extension**
   - Click the puzzle icon in the browser toolbar
   - Find "WalletX - Universal AI Credit Wallet"
   - Click the pin icon to keep it visible

## 🔧 Configuration

### API Endpoint

By default, the extension connects to `http://localhost:3000/api`. To change this:

1. Open `extension/config.js`
2. Modify the `API_BASE_URL` value:
   ```javascript
   API_BASE_URL: 'https://your-api-domain.com/api'
   ```

### Supported IDEs

The extension automatically detects and works with:
- **Cursor** (`cursor.sh`)
- **Windsurf** (`windsurf.com`)
- **GitHub Copilot** (`copilot.github.com`)
- **Antigravity** (`antigravity.com`)

## 📖 Usage

### First Time Setup

1. **Click the WalletX icon** in your browser toolbar
2. **Register/Login**:
   - Enter your email and password
   - Click "Register" if you're new, or "Login" if you have an account
3. **Your secret address** will be generated automatically

### Recharging Credits

1. Open the WalletX popup
2. Go to the **Wallet** tab
3. Select an amount ($1, $5, $10, $25) or enter a custom amount
4. Choose payment method (UPI, Card, or Crypto)
5. Click "Recharge"
6. Complete payment in the opened window
7. Credits will be added to your balance automatically

### Selecting AI Models

1. Open the WalletX popup
2. Go to the **Models** tab
3. Click on your preferred model:
   - **IBM Granite**: 0.8¢ per 1k tokens
   - **GPT-4o**: 1.5¢ per 1k tokens
   - **Claude Sonnet**: 1.2¢ per 1k tokens
   - **Llama 3.3**: 0.4¢ per 1k tokens
4. The selected model will be used for all AI requests

### Saving Context Snapshots

1. Open the WalletX popup
2. Go to the **Context** tab
3. Click "Save current context"
4. Your IDE context will be saved and can be imported later using your secret address

### Using in IDEs

1. **Navigate to a supported IDE** (e.g., cursor.sh)
2. **WalletX indicator** will appear in the top-right corner showing your balance
3. **Use AI features normally** in the IDE
4. **Credits are automatically deducted** when you use AI models
5. **Notifications appear** showing the cost of each request

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Encrypted Storage**: Tokens are stored securely in Chrome's local storage
- **HTTPS Support**: Works with HTTPS APIs for secure communication
- **No Data Collection**: Your data stays between you and the backend

## 🐛 Troubleshooting

### Extension Not Loading

- Ensure you're using a Chromium-based browser (Chrome, Edge, Brave)
- Check that Developer Mode is enabled
- Try reloading the extension from `chrome://extensions/`

### Can't Connect to Backend

- Verify the backend is running on `http://localhost:3000`
- Check the browser console for error messages (F12 → Console)
- Ensure CORS is properly configured in the backend

### Credits Not Deducting

- Check that you're logged in (click the extension icon)
- Verify your balance is sufficient
- Check the browser console for interception logs
- Ensure the IDE domain is in the supported list

### Balance Not Updating

- Click the extension icon to manually refresh
- Check your internet connection
- Verify the backend API is responding

## 📁 File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic with API integration
├── background.js         # Service worker for API interception
├── content.js            # Content script for IDE injection
├── config.js             # Configuration (API endpoints, etc.)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## 🔄 Updates

To update the extension:

1. Pull the latest code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the WalletX extension card

## 🤝 Support

For issues or questions:
- Check the backend logs for API errors
- Check browser console for extension errors
- Verify all configuration settings

## 📝 Development

### Testing Locally

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on WalletX
4. Test your changes

### Debugging

- **Popup**: Right-click the extension icon → "Inspect popup"
- **Background Script**: Go to `chrome://extensions/` → Click "service worker"
- **Content Script**: Open DevTools on the IDE page (F12)

## 🎯 Roadmap

- [ ] Firefox support
- [ ] Safari support
- [ ] Offline mode with cached credits
- [ ] Usage analytics dashboard
- [ ] Team/organization accounts
- [ ] Custom model pricing
- [ ] Webhook notifications

## 📄 License

Part of the WalletX project. See main project LICENSE for details.