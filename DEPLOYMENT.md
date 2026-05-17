# WalletX Deployment Guide

Complete guide for deploying WalletX in development, staging, and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Extension Deployment](#extension-deployment)
- [SDK Deployment](#sdk-deployment)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js:** 18.0.0 or higher
- **MongoDB:** 6.0 or higher
- **npm:** 9.0.0 or higher
- **Chrome/Edge:** Latest version (for extension)
- **Git:** For version control

### Required API Keys
You'll need accounts and API keys for:
- **Stripe** (Payment processing) - [Get API keys](https://dashboard.stripe.com/apikeys)
- **Razorpay** (UPI payments) - [Get API keys](https://dashboard.razorpay.com/app/keys)
- **OpenAI** (AI provider) - [Get API key](https://platform.openai.com/api-keys)
- **Anthropic** (AI provider) - [Get API key](https://console.anthropic.com/)
- **IBM Watsonx** (AI provider) - [Get API key](https://cloud.ibm.com/watsonx)
- **Together AI** (Optional) - [Get API key](https://api.together.xyz/)

### Development Tools
- **Postman** or **curl** for API testing
- **MongoDB Compass** for database management
- **VS Code** (recommended IDE)

## Backend Deployment

### Local Development Setup

#### 1. Clone and Install
```bash
# Clone repository
git clone https://github.com/yourusername/walletx.git
cd walletx/backend

# Install dependencies
npm install
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

Required environment variables:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/walletx
MONGODB_TEST_URI=mongodb://localhost:27017/walletx_test

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI Providers
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
IBM_WATSONX_API_KEY=your-ibm-watsonx-key
IBM_WATSONX_PROJECT_ID=your-project-id
TOGETHER_API_KEY=your-together-api-key

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,chrome-extension://*

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/walletx.log
```

#### 3. Start MongoDB
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

#### 4. Initialize Database
```bash
# Run database migrations
npm run migrate

# Seed development data (optional)
npm run seed
```

#### 5. Start Development Server
```bash
# Start with hot reload
npm run dev

# Or start normally
npm start
```

Server should be running at `http://localhost:3000`

#### 6. Verify Installation
```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-05-17T06:30:00.000Z"}
```

### Production Deployment

#### Option 1: Docker Deployment (Recommended)

##### 1. Create Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

##### 2. Create docker-compose.yml
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: walletx-mongodb
    restart: always
    environment:
      MONGO_INITDB_DATABASE: walletx
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - walletx-network

  backend:
    build: ./backend
    container_name: walletx-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/walletx
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    networks:
      - walletx-network
    volumes:
      - ./backend/logs:/app/logs

  redis:
    image: redis:7-alpine
    container_name: walletx-redis
    restart: always
    ports:
      - "6379:6379"
    networks:
      - walletx-network
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:

networks:
  walletx-network:
    driver: bridge
```

##### 3. Deploy with Docker Compose
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

#### Option 2: Traditional Server Deployment

##### 1. Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for process management
sudo npm install -g pm2
```

##### 2. Deploy Application
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/walletx.git
cd walletx/backend

# Install dependencies
npm ci --only=production

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with production values

# Start with PM2
pm2 start server.js --name walletx-backend
pm2 save
pm2 startup
```

##### 3. Configure Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/walletx
server {
    listen 80;
    server_name api.walletx.dev;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/walletx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.walletx.dev
```

#### Option 3: Cloud Platform Deployment

##### Heroku
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create walletx-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set STRIPE_SECRET_KEY=your-key
# ... set all other env vars

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

##### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 walletx-backend

# Create environment
eb create walletx-production

# Set environment variables
eb setenv NODE_ENV=production JWT_SECRET=your-secret

# Deploy
eb deploy

# View logs
eb logs
```

## Extension Deployment

### Development Setup

#### 1. Load Unpacked Extension
```bash
# Navigate to extension directory
cd extension

# Open Chrome
# Go to: chrome://extensions/
# Enable "Developer mode" (top right)
# Click "Load unpacked"
# Select the extension/ folder
```

#### 2. Configure Extension
Edit `extension/config.js`:
```javascript
const CONFIG = {
  API_URL: 'http://localhost:3000',  // Development
  // API_URL: 'https://api.walletx.dev',  // Production
  VERSION: '1.0.0'
};
```

#### 3. Test Extension
- Click extension icon in Chrome toolbar
- Register a new account
- Test recharge flow
- Verify balance updates

### Production Deployment

#### 1. Prepare for Chrome Web Store

##### Update manifest.json
```json
{
  "name": "WalletX - Universal AI Credit Wallet",
  "version": "1.0.0",
  "description": "One wallet for all your AI-powered IDEs. Pay-as-you-go credits that work everywhere.",
  "homepage_url": "https://walletx.dev",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

##### Update config for production
```javascript
const CONFIG = {
  API_URL: 'https://api.walletx.dev',
  VERSION: '1.0.0'
};
```

#### 2. Create Store Assets

##### Screenshots (1280x800 or 640x400)
- Screenshot 1: Extension popup with balance
- Screenshot 2: Recharge flow
- Screenshot 3: Transaction history
- Screenshot 4: Settings page

##### Promotional Images
- Small tile: 440x280
- Large tile: 920x680
- Marquee: 1400x560

##### Store Listing
```
Title: WalletX - Universal AI Credit Wallet

Short Description:
One wallet for all AI-powered IDEs. Pay-as-you-go credits that work with Cursor, Windsurf, VS Code, and more.

Detailed Description:
WalletX is a universal credit wallet for AI-powered development tools. Instead of paying for multiple IDE subscriptions, buy credits once and use them everywhere.

Features:
✓ Universal Credits - One balance for all IDEs
✓ Pay-as-you-go - Only pay for what you use
✓ Multi-Provider - Choose between OpenAI, Anthropic, IBM Watsonx
✓ Context Portability - Export from one IDE, import to another
✓ Real-time Balance - See exact costs per request
✓ Secure Payments - UPI, Credit Card, Crypto support

Supported IDEs:
- Cursor
- Windsurf
- VS Code with Copilot
- Antigravity
- Any IDE with WalletX SDK integration

Privacy:
- No conversation logging
- Encrypted storage
- GDPR compliant
```

#### 3. Package Extension
```bash
cd extension

# Remove development files
rm -rf node_modules .git

# Create zip file
zip -r walletx-extension-v1.0.0.zip . -x "*.git*" "node_modules/*"
```

#### 4. Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer fee (if first submission)
3. Click "New Item"
4. Upload `walletx-extension-v1.0.0.zip`
5. Fill in store listing details
6. Upload screenshots and promotional images
7. Set pricing (Free)
8. Submit for review

Review typically takes 1-3 business days.

#### 5. Auto-Update Configuration

Extensions auto-update from Chrome Web Store. For manual updates:

```json
// manifest.json
{
  "update_url": "https://clients2.google.com/service/update2/crx"
}
```

## SDK Deployment

### NPM Package Publication

#### 1. Prepare Package
```bash
cd sdk

# Update version
npm version patch  # or minor, or major

# Run tests
npm test

# Build (if needed)
npm run build
```

#### 2. Update package.json
```json
{
  "name": "@walletx/sdk",
  "version": "1.0.0",
  "description": "Universal AI credit wallet SDK for IDE integration",
  "main": "src/index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/walletx.git"
  },
  "keywords": [
    "ai",
    "credits",
    "wallet",
    "ide",
    "openai",
    "anthropic",
    "ibm-watsonx"
  ],
  "author": "WalletX Team",
  "license": "MIT"
}
```

#### 3. Publish to NPM
```bash
# Login to NPM
npm login

# Publish package
npm publish --access public

# Verify publication
npm view @walletx/sdk
```

#### 4. Create GitHub Release
```bash
# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Create release on GitHub
# Go to: https://github.com/yourusername/walletx/releases/new
# Select tag: v1.0.0
# Add release notes
```

### CDN Distribution

#### 1. Build for CDN
```bash
# Create minified bundle
npm run build:cdn

# This creates: dist/walletx.min.js
```

#### 2. Upload to CDN
```bash
# Using AWS S3 + CloudFront
aws s3 cp dist/walletx.min.js s3://cdn.walletx.dev/sdk/v1.0.0/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/sdk/*"
```

#### 3. Usage via CDN
```html
<script src="https://cdn.walletx.dev/sdk/v1.0.0/walletx.min.js"></script>
<script>
  const client = new WalletX({ apiKey: 'your-key' });
</script>
```

## Database Setup

### MongoDB Configuration

#### 1. Create Database
```javascript
// Connect to MongoDB
mongosh

// Create database
use walletx

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password"],
      properties: {
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        credits: { bsonType: "number", minimum: 0 }
      }
    }
  }
})
```

#### 2. Create Indexes
```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: 1 })

// Transaction indexes
db.transactions.createIndex({ userId: 1, createdAt: -1 })
db.transactions.createIndex({ type: 1, status: 1 })

// Usage indexes
db.usage.createIndex({ userId: 1, provider: 1 })
db.usage.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })  // 30 days

// Snapshot indexes
db.snapshots.createIndex({ userId: 1, createdAt: -1 })
db.snapshots.createIndex({ snapshotId: 1 }, { unique: true })
```

#### 3. Create Admin User
```javascript
// Create admin user for monitoring
db.createUser({
  user: "walletx_admin",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "walletx" },
    { role: "dbAdmin", db: "walletx" }
  ]
})
```

#### 4. Backup Configuration
```bash
# Create backup script
cat > /usr/local/bin/backup-walletx.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/walletx"
mkdir -p $BACKUP_DIR

mongodump --db walletx --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-walletx.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-walletx.sh" | crontab -
```

## Environment Configuration

### Development Environment
```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/walletx
LOG_LEVEL=debug
CORS_ORIGIN=*
```

### Staging Environment
```env
NODE_ENV=staging
PORT=3000
API_URL=https://staging-api.walletx.dev
MONGODB_URI=mongodb://staging-db:27017/walletx
LOG_LEVEL=info
CORS_ORIGIN=https://staging.walletx.dev
```

### Production Environment
```env
NODE_ENV=production
PORT=3000
API_URL=https://api.walletx.dev
MONGODB_URI=mongodb://prod-db:27017/walletx
LOG_LEVEL=warn
CORS_ORIGIN=https://walletx.dev,chrome-extension://*
RATE_LIMIT_MAX_REQUESTS=50
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- services/creditService.test.js

# Run in watch mode
npm test -- --watch
```

### Extension Tests
```bash
cd extension

# Manual testing checklist:
# [ ] Extension loads without errors
# [ ] User can register
# [ ] User can login
# [ ] Balance displays correctly
# [ ] Recharge flow works
# [ ] Transaction history loads
# [ ] Settings save properly
```

### SDK Tests
```bash
cd sdk

# Run tests
npm test

# Test in different IDEs
npm run test:cursor
npm run test:windsurf
```

### Integration Tests
```bash
# Test complete flow
npm run test:integration

# Test payment webhooks
npm run test:webhooks

# Load testing
npm run test:load
```

## Monitoring & Logging

### Application Logging

#### Winston Configuration
```javascript
// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Checks
```javascript
// backend/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: 'disconnected',
    redis: 'disconnected'
  };

  try {
    await mongoose.connection.db.admin().ping();
    health.mongodb = 'connected';
  } catch (error) {
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

### Monitoring Tools

#### PM2 Monitoring
```bash
# View process status
pm2 status

# View logs
pm2 logs walletx-backend

# Monitor resources
pm2 monit

# Web dashboard
pm2 web
```

#### Docker Monitoring
```bash
# View container stats
docker stats walletx-backend

# View logs
docker logs -f walletx-backend

# Inspect container
docker inspect walletx-backend
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI

# Solution: Ensure MongoDB is running and URI is correct
```

#### 2. Extension Not Loading
```bash
# Check manifest.json syntax
cat extension/manifest.json | jq .

# Check Chrome console
# Open chrome://extensions/ → Details → Inspect views: background page

# Solution: Fix JSON syntax errors, check permissions
```

#### 3. API Rate Limiting
```bash
# Check rate limit settings
grep RATE_LIMIT .env

# Temporarily disable for testing
# Set RATE_LIMIT_MAX_REQUESTS=1000

# Solution: Adjust rate limits or implement API key tiers
```

#### 4. Payment Webhook Failures
```bash
# Check webhook logs
tail -f logs/webhooks.log

# Test webhook locally with ngrok
ngrok http 3000

# Update webhook URL in Stripe/Razorpay dashboard

# Solution: Verify webhook signature, check endpoint accessibility
```

#### 5. High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart walletx-backend

# Solution: Implement connection pooling, add caching
```

### Debug Mode

Enable debug mode for detailed logging:
```bash
# Set environment variable
export DEBUG=walletx:*

# Or in .env
DEBUG=walletx:*
LOG_LEVEL=debug

# Restart application
pm2 restart walletx-backend
```

### Support

For deployment issues:
- Check logs: `pm2 logs` or `docker logs`
- Review documentation: [docs.walletx.dev](https://docs.walletx.dev)
- Open issue: [GitHub Issues](https://github.com/yourusername/walletx/issues)
- Contact: support@walletx.dev

---

**Last Updated:** May 17, 2026  
**Version:** 1.0.0  
**Maintained by:** WalletX Team