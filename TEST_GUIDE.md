# WalletX Testing Guide

## ✅ Backend is Running!

Your WalletX backend is now running at: **http://localhost:3000**

Using **Mock Database** (in-memory storage) - no MongoDB installation required!

---

## Step 1: Test Backend API (Optional)

Open a new terminal and test the API:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","database":"mock"}
```

---

## Step 2: Load Browser Extension

### 2.1 Open Chrome Extensions Page
1. Open Google Chrome
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### 2.2 Enable Developer Mode
- Look for "Developer mode" toggle in the **top-right corner**
- Click to enable it

### 2.3 Load the Extension
1. Click **"Load unpacked"** button (top-left)
2. Navigate to your WalletX folder: `C:\Users\johnj\Desktop\Walletx`
3. Select the **`extension`** folder
4. Click **"Select Folder"**

### 2.4 Pin the Extension
1. Click the **puzzle icon** 🧩 in Chrome toolbar (top-right)
2. Find **"WalletX - Universal AI Credit Wallet"**
3. Click the **pin icon** 📌 next to it

---

## Step 3: Test the Extension

### 3.1 Open Extension Popup
- Click the **WalletX icon** in your Chrome toolbar
- You should see the beautiful dark-themed popup!

### 3.2 Register a New Account
1. You'll see a login/register screen
2. Enter:
   - **Email:** test@walletx.com
   - **Password:** password123
3. Click **"Register"**
4. You should see:
   - Your **Secret Address** (e.g., WX-A7B3C9D2)
   - Balance: **$0.00**
   - Bonus multiplier badge

### 3.3 Test Credit Recharge
1. Click the **"Wallet"** tab (if not already there)
2. Click the **"$5"** quick recharge button
3. Select **"UPI"** as payment method
4. Click **"Recharge Now"**
5. You should see:
   - Success toast notification
   - Balance updated to **$5.00**

### 3.4 Explore Models Tab
1. Click the **"Models"** tab
2. You'll see 4 AI models:
   - IBM Granite
   - GPT-4o
   - Claude Sonnet
   - Llama 3.3
3. Each shows:
   - Cost per 1K tokens
   - Estimated queries with your balance

### 3.5 Test Context Snapshots
1. Click the **"Context"** tab
2. Click **"Save Current Context"**
3. Enter a name: "Test Session"
4. Click **"Save"**
5. You should see the snapshot in the list

---

## Step 4: Test API Integration (Advanced)

### 4.1 Get Your Secret Address
- Open the extension
- Copy your Secret Address (e.g., WX-A7B3C9D2)

### 4.2 Test with curl
```bash
# Register (if you haven't already)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@walletx.com\",\"password\":\"password123\"}"

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@walletx.com\",\"password\":\"password123\"}"

# Copy the token from response, then:
# Get balance
curl http://localhost:3000/api/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Expected Results Checklist

✅ Backend server running on port 3000
✅ Extension loaded in Chrome without errors
✅ Can register new account
✅ Secret Address is generated
✅ Can view balance ($0.00 initially)
✅ Can recharge credits (mock payment)
✅ Balance updates correctly
✅ Can switch between tabs (Wallet/Models/Context)
✅ Can save context snapshots
✅ UI is responsive and looks good

---

## Troubleshooting

### Extension Not Loading
**Error:** "Manifest file is missing or unreadable"
- **Solution:** Make sure you selected the `extension` folder, not the root `Walletx` folder

### Extension Shows "Network Error"
**Error:** Red toast saying "Network Error"
- **Solution:** Make sure backend is running on http://localhost:3000
- Check terminal - you should see the WalletX ASCII art banner

### Balance Not Updating
**Error:** Balance stays at $0.00 after recharge
- **Solution:** 
  1. Open browser console (F12)
  2. Check for errors
  3. Make sure you're logged in (check for token in storage)

### Backend Crashes
**Error:** Server stops with error
- **Solution:** Check the terminal output for error details
- Most likely: Missing environment variable or port conflict

---

## Demo Video Recording Tips

If you want to record a demo:

1. **Preparation** (before recording)
   - Clear browser data
   - Close unnecessary tabs
   - Have terminal visible with backend running

2. **Recording Flow** (5-6 minutes)
   - Show backend terminal (server running)
   - Show extension installation
   - Register account
   - Show Secret Address
   - Recharge $10
   - Show balance update
   - Tour all 3 tabs
   - Save a context snapshot
   - Explain the universal credit concept

3. **Tools**
   - OBS Studio (free)
   - Loom (easy, web-based)
   - Windows Game Bar (Win+G)

---

## What to Test

### Core Features
- ✅ User registration and login
- ✅ Secret Address generation
- ✅ Credit balance display
- ✅ Mock payment recharge
- ✅ Model selection
- ✅ Context snapshot save/load

### UI/UX
- ✅ Dark theme looks good
- ✅ Animations are smooth
- ✅ Toast notifications work
- ✅ Tab switching is instant
- ✅ Copy Secret Address works

### API Integration
- ✅ Extension connects to backend
- ✅ Authentication works
- ✅ Balance syncs in real-time
- ✅ Transactions are logged

---

## Next Steps After Testing

1. **Add Real API Keys** (optional)
   - Edit `backend/.env`
   - Add your OpenAI, Stripe, etc. keys
   - Restart backend server

2. **Test with Real AI Requests**
   - Use the SDK to make actual AI calls
   - See credits deducted in real-time

3. **Record Demo Video**
   - Show all features working
   - Explain the innovation
   - Highlight IBM Bob usage

4. **Prepare Hackathon Submission**
   - GitHub repository
   - Demo video link
   - IBM_BOB_USAGE.md
   - HACKATHON_SUBMISSION.md

---

## Support

If you encounter any issues:
1. Check the terminal output for errors
2. Check browser console (F12) for JavaScript errors
3. Review the QUICKSTART.md guide
4. Check FAQ.md for common issues

---

**You're ready to test WalletX! 🚀**

The backend is running, now just load the extension and start testing!