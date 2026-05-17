# WalletX - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- MongoDB Atlas account with connection string

---

## Step 1: Push to GitHub

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Add Vercel deployment configuration"

# Push to GitHub
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select your WalletX repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty

5. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```
   NODE_ENV=production
   DATABASE_MODE=mongodb
   MONGODB_URI=mongodb+srv://josephjohn200225_db_user:1tKnxZjRnlt2hxWe@cluster0.xvco0gs.mongodb.net/walletx?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://your-app.vercel.app,chrome-extension://
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   BONUS_MULTIPLIER_FIRST_RECHARGE=2
   MIN_RECHARGE_AMOUNT=500
   ```

   **Optional (if you have API keys):**
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   OPENAI_API_KEY=sk-your-openai-api-key
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
   IBM_WATSONX_API_KEY=your-ibm-watsonx-api-key
   ```

6. **Click "Deploy"**

7. **Wait for deployment** (usually 1-2 minutes)

8. **Get your deployment URL:**
   - Example: `https://walletx-abc123.vercel.app`

---

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? walletx
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 3: Update MongoDB Atlas IP Whitelist

1. **Go to [MongoDB Atlas](https://cloud.mongodb.com)**

2. **Navigate to Network Access**

3. **Add IP Address:**
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Vercel's IP ranges
   - Click "Confirm"

4. **Wait 2-3 minutes** for changes to apply

---

## Step 4: Update Extension Configuration

Update the API URL in your extension to point to Vercel:

**File:** `extension/config.js`

```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-app.vercel.app/api',
  // ... rest of config
};
```

Replace `your-app.vercel.app` with your actual Vercel URL.

---

## Step 5: Test Your Deployment

### Test Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "WalletX API is running",
  "timestamp": "2026-05-17T...",
  "uptime": 123.45
}
```

### Test Registration
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🐛 Troubleshooting

### Issue 1: "Internal Server Error"

**Cause:** Missing environment variables

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables from Step 2
3. Redeploy: Deployments → Click "..." → Redeploy

---

### Issue 2: "MongoDB Connection Failed"

**Cause:** MongoDB Atlas IP whitelist

**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Add IP: 0.0.0.0/0 (allow all)
3. Wait 2-3 minutes
4. Redeploy on Vercel

---

### Issue 3: "CORS Error" in Extension

**Cause:** Vercel URL not in ALLOWED_ORIGINS

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Update ALLOWED_ORIGINS:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,chrome-extension://
   ```
3. Redeploy

---

### Issue 4: "Function Timeout"

**Cause:** Vercel free tier has 10s timeout

**Fix:**
1. Optimize database queries
2. Or upgrade to Vercel Pro (60s timeout)

---

## 📊 Vercel Configuration Files

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/health",
      "dest": "backend/server.js"
    },
    {
      "src": "/",
      "dest": "backend/server.js"
    }
  ]
}
```

This file tells Vercel:
- Use Node.js runtime
- Route all `/api/*` requests to backend
- Route health check to backend
- Route root to backend

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Add real payment gateway API keys
- [ ] Update ALLOWED_ORIGINS with your actual domain
- [ ] Enable MongoDB Atlas authentication
- [ ] Set up MongoDB Atlas IP whitelist properly
- [ ] Enable Vercel password protection (optional)
- [ ] Set up custom domain (optional)

---

## 📝 Environment Variables Reference

### Required Variables:
```
NODE_ENV=production
DATABASE_MODE=mongodb
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<strong-random-string>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=<your-vercel-url>,chrome-extension://
```

### Optional Variables:
```
STRIPE_SECRET_KEY=<stripe-key>
RAZORPAY_KEY_ID=<razorpay-key>
RAZORPAY_KEY_SECRET=<razorpay-secret>
OPENAI_API_KEY=<openai-key>
ANTHROPIC_API_KEY=<anthropic-key>
IBM_WATSONX_API_KEY=<ibm-key>
TOGETHER_API_KEY=<together-key>
```

---

## 🎯 Post-Deployment

### Update Extension
1. Update `extension/config.js` with Vercel URL
2. Reload extension in Chrome
3. Test registration and login

### Monitor Logs
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs <deployment-url>
```

### Check Analytics
- Go to Vercel Dashboard → Your Project → Analytics
- Monitor requests, errors, and performance

---

## 🚀 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys!
```

---

## 💡 Tips

1. **Use Environment Variables:** Never commit secrets to Git
2. **Test Locally First:** Use `vercel dev` to test locally
3. **Monitor Logs:** Check Vercel logs for errors
4. **Set Up Alerts:** Configure Vercel to notify you of deployment failures
5. **Use Preview Deployments:** Test changes before merging to main

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Vercel Community:** https://github.com/vercel/vercel/discussions

---

**Deployment Checklist:**
- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Add environment variables
- [ ] Update MongoDB Atlas IP whitelist
- [ ] Test health endpoint
- [ ] Test registration endpoint
- [ ] Update extension config
- [ ] Test full flow

**Your deployment URL will be:** `https://walletx-<random>.vercel.app`

Good luck! 🚀
