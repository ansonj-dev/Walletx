# 🚀 Deploy WalletX to Vercel - Quick Guide

## ✅ Code is Ready and Pushed to GitHub!

Your code has been successfully pushed to GitHub: `https://github.com/ansonj-dev/Walletx`

---

## 📋 Deploy in 5 Minutes

### Step 1: Go to Vercel
👉 **[Click here to open Vercel](https://vercel.com/new)**

### Step 2: Import Repository
1. Click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Find and select: **`ansonj-dev/Walletx`**
4. Click **"Import"**

### Step 3: Configure Project
Leave these as default:
- **Framework Preset:** Other
- **Root Directory:** `./`
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add these **ONE BY ONE**:

#### Required Variables (Copy-Paste These):

```
NODE_ENV
production
```

```
DATABASE_MODE
mongodb
```

```
MONGODB_URI
mongodb+srv://josephjohn200225_db_user:1tKnxZjRnlt2hxWe@cluster0.xvco0gs.mongodb.net/walletx?retryWrites=true&w=majority
```

```
JWT_SECRET
WalletX-Super-Secret-Key-2026-IBM-Bob-Hackathon-Change-This
```

```
JWT_EXPIRES_IN
7d
```

```
ALLOWED_ORIGINS
https://your-app.vercel.app,chrome-extension://
```

```
RATE_LIMIT_WINDOW_MS
900000
```

```
RATE_LIMIT_MAX_REQUESTS
100
```

```
BONUS_MULTIPLIER_FIRST_RECHARGE
2
```

```
MIN_RECHARGE_AMOUNT
500
```

### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 1-2 minutes ⏳
3. You'll get a URL like: `https://walletx-abc123.vercel.app`

---

## 🔧 After Deployment

### 1. Update MongoDB Atlas IP Whitelist

**Important:** Allow Vercel to connect to your database

1. Go to **[MongoDB Atlas](https://cloud.mongodb.com)**
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**
6. Wait 2-3 minutes

### 2. Test Your API

Replace `YOUR-VERCEL-URL` with your actual Vercel URL:

```bash
# Test health endpoint
curl https://YOUR-VERCEL-URL.vercel.app/health

# Test registration
curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Update Extension Config

**File:** `extension/config.js`

Change line 2:
```javascript
API_BASE_URL: 'https://YOUR-VERCEL-URL.vercel.app/api',
```

Then reload your extension in Chrome!

---

## 🐛 If Deployment Fails

### Error: "Internal Server Error"

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure ALL variables from Step 4 are added
3. Go to Deployments → Click "..." → Redeploy

### Error: "MongoDB Connection Failed"

**Fix:**
1. Check MongoDB Atlas IP whitelist (Step 1 above)
2. Make sure you added `0.0.0.0/0` to allow all IPs
3. Wait 2-3 minutes and redeploy

### Error: "Build Failed"

**Fix:**
1. Check Vercel logs for specific error
2. Make sure `vercel.json` is in root directory
3. Redeploy

---

## 📊 View Logs

To see what's happening:

1. Go to Vercel Dashboard
2. Click your project
3. Click **"Deployments"**
4. Click on the latest deployment
5. Click **"View Function Logs"**

---

## ✅ Success Checklist

- [ ] Deployed to Vercel
- [ ] Got deployment URL
- [ ] Updated MongoDB Atlas IP whitelist
- [ ] Tested `/health` endpoint
- [ ] Tested `/api/auth/register` endpoint
- [ ] Updated extension config with Vercel URL
- [ ] Reloaded extension in Chrome
- [ ] Tested registration in extension

---

## 🎯 Your Deployment URLs

After deployment, you'll have:

- **API Base:** `https://your-app.vercel.app`
- **Health Check:** `https://your-app.vercel.app/health`
- **Auth API:** `https://your-app.vercel.app/api/auth`
- **Credits API:** `https://your-app.vercel.app/api/credits`

---

## 💡 Pro Tips

1. **Bookmark your Vercel dashboard** for easy access
2. **Save your deployment URL** - you'll need it for the extension
3. **Check logs** if something doesn't work
4. **Redeploy** after fixing any issues

---

## 🆘 Need Help?

If you see errors:
1. Check Vercel logs (Deployments → Latest → Function Logs)
2. Check MongoDB Atlas connection (Network Access)
3. Verify all environment variables are set
4. Try redeploying

---

## 🎉 You're Almost Done!

1. Deploy to Vercel (5 minutes)
2. Update MongoDB whitelist (2 minutes)
3. Test API (1 minute)
4. Update extension (1 minute)
5. **Start using WalletX!** 🚀

**Total time: ~10 minutes**

---

**Repository:** https://github.com/ansonj-dev/Walletx  
**Deployment Guide:** See VERCEL_DEPLOYMENT.md for detailed instructions
