# WalletX Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ MongoDB installed and running (`mongod --version`)
- ✅ Chrome browser

## Step 1: Backend Setup (5 minutes)

### 1.1 Install Dependencies
```bash
cd backend
npm install
```

### 1.2 Configure Environment
```bash
# Copy the example environment file
cp .env.example .env
```

### 1.3 Edit .env File
Open `backend/.env` and add your API keys:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/walletx
JWT_SECRET=your-super-secret-jwt-key-change-this
STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
IBM_WATSONX_API_KEY=your_ibm_key
```

**Note:** For testing, you can use placeholder values for payment keys. The app will work without them for basic testing.

### 1.4 Start MongoDB
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

### 1.5 Start Backend Server
```bash
npm run dev
```

You should see:
```
🚀 WalletX Backend Server
📡 Server running on http://localhost:3000
🗄️  MongoDB connected successfully
✅ All routes registered
```

## Step 2: Load Browser Extension (2 minutes)

### 2.1 Open Chrome Extensions
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)

### 2.2 Load Extension
1. Click "Load unpacked"
2. Navigate to your WalletX folder
3. Select the `extension/` folder
4. Click "Select Folder"

### 2.3 Pin Extension
1. Click the puzzle icon in Chrome toolbar
2. Find "WalletX - Universal AI Credit Wallet"
3. Click the pin icon to pin it to toolbar

## Step 3: Test the Extension (3 minutes)

### 3.1 Open Extension
Click the WalletX icon in your Chrome toolbar

### 3.2 Register Account
1. Click "Register" (if not logged in)
2. Enter email and password
3. Click "Register"
4. You'll see your Secret Address (e.g., WX-A7B3C9D2)

### 3.3 Check Balance
- You should see $0.00 balance initially
- The extension is now connected to the backend!

### 3.4 Test Recharge (Mock)
1. Click "Wallet" tab
2. Click "$5" quick recharge button
3. Select "UPI" payment method
4. Click "Recharge Now"
5. Balance should update to $5.00

## Step 4: Test AI Request (Optional)

### 4.1 Using the SDK
```bash
cd sdk
npm install
```

### 4.2 Run Example
```javascript
const WalletX = require('./src/index.js');

const walletx = new WalletX({
  apiUrl: 'http://localhost:3000/api',
  ideName: 'Test'
});

// Authenticate with your secret address
await walletx.authenticate('WX-YOUR-SECRET-ADDRESS');

// Make AI request
const response = await walletx.makeAIRequest('gpt-4o', [
  { role: 'user', content: 'Hello!' }
]);

console.log(response);
```

## Troubleshooting

### Backend won't start
- **Error:** "MongoDB connection failed"
  - **Solution:** Make sure MongoDB is running (`mongod`)
  
- **Error:** "Port 3000 already in use"
  - **Solution:** Change PORT in .env to 3001

### Extension won't load
- **Error:** "Manifest file is missing or unreadable"
  - **Solution:** Make sure you selected the `extension/` folder, not the root folder

### Balance not updating
- **Error:** Extension shows "Network Error"
  - **Solution:** Make sure backend is running on http://localhost:3000
  - Check browser console (F12) for errors

### Payment fails
- **Note:** Payment gateways require real API keys
- For testing, the mock payment flow will work without real keys

## Quick Test Checklist

✅ Backend running on http://localhost:3000
✅ Extension loaded in Chrome
✅ Can register new account
✅ Can see Secret Address
✅ Can view balance
✅ Can mock recharge credits
✅ Extension UI is responsive

## Next Steps

1. **Add Real API Keys:** Get real API keys for Stripe, OpenAI, etc.
2. **Test AI Requests:** Try making real AI requests through the SDK
3. **Test Context Save/Load:** Save and restore IDE contexts
4. **Integrate with IDE:** Use the SDK to integrate with your favorite IDE

## Need Help?

- Check `README.md` for detailed documentation
- See `DEPLOYMENT.md` for production setup
- Review `FAQ.md` for common questions
- Check `backend/README.md` for API documentation

## Demo Video Script

Want to record a demo? Follow this script:

1. **Introduction** (30 sec)
   - "Hi, I'm demonstrating WalletX, a universal AI credit wallet"
   - "It solves the problem of paying for multiple AI tools"

2. **Backend Start** (30 sec)
   - Show terminal with `npm run dev`
   - Show "Server running" message

3. **Extension Install** (1 min)
   - Show chrome://extensions/
   - Load unpacked extension
   - Pin to toolbar

4. **Registration** (1 min)
   - Click extension icon
   - Register new account
   - Show Secret Address

5. **Recharge** (1 min)
   - Click Wallet tab
   - Select $10 recharge
   - Choose payment method
   - Show balance update

6. **Features Tour** (2 min)
   - Show Models tab with pricing
   - Show Context tab with snapshots
   - Explain cross-IDE usage

7. **Conclusion** (30 sec)
   - "WalletX makes AI tools affordable and portable"
   - "One wallet, any IDE, zero friction"

Total: ~6 minutes

---

**You're ready to test WalletX! 🎉**