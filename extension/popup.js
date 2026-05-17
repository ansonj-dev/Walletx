// WalletX Popup Script with API Integration

// State management
let state = {
  selectedAmt: 10,
  selectedPay: 'upi',
  balance: 0,
  modelRate: 0.8,
  selectedModel: 'granite-3.3-8b',
  isAuthenticated: false,
  user: null,
  token: null,
  secretAddress: null
};

// API Client
class WalletXAPI {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await this.handleUnauthorized();
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getToken() {
    const result = await chrome.storage.local.get([CONFIG.STORAGE_KEYS.TOKEN]);
    return result[CONFIG.STORAGE_KEYS.TOKEN];
  }

  async setToken(token) {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.TOKEN]: token });
  }

  async handleUnauthorized() {
    await chrome.storage.local.remove([CONFIG.STORAGE_KEYS.TOKEN, CONFIG.STORAGE_KEYS.USER_DATA]);
    state.isAuthenticated = false;
    state.token = null;
    showAuthPanel();
  }

  // Auth endpoints
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    await this.setToken(data.token);
    return data;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  // Credits endpoints
  async getBalance() {
    return await this.request('/credits/balance');
  }

  async getHistory() {
    return await this.request('/credits/history');
  }

  // Payment endpoints
  async createStripePayment(amount) {
    return await this.request('/payments/stripe/create', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async createRazorpayPayment(amount) {
    return await this.request('/payments/razorpay/create', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  // Snapshot endpoints
  async saveSnapshot(name, context) {
    return await this.request('/snapshots/save', {
      method: 'POST',
      body: JSON.stringify({ name, context })
    });
  }

  async listSnapshots() {
    return await this.request('/snapshots/list');
  }

  async loadSnapshot(id) {
    return await this.request(`/snapshots/${id}`);
  }
}

const api = new WalletXAPI();

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

async function initializeApp() {
  try {
    // Check authentication
    const token = await api.getToken();
    if (token) {
      state.token = token;
      const userData = await api.getMe();
      state.user = userData.user;
      state.isAuthenticated = true;
      state.secretAddress = userData.user.secretAddress;
      
      // Load balance
      await loadBalance();
      
      // Show main UI
      showMainUI();
      
      // Load snapshots
      await loadSnapshots();
    } else {
      showAuthPanel();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showAuthPanel();
  }
}

function showAuthPanel() {
  document.body.innerHTML = `
    <div class="wx-popup">
      <div class="wx-header">
        <div class="wx-logo">
          <div class="wx-logo-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="#000D14" stroke="#000D14" stroke-width="0.5"/>
              <circle cx="8" cy="8" r="1.5" fill="#000D14"/>
            </svg>
          </div>
          <span class="wx-logo-name">Wallet<span>X</span></span>
        </div>
      </div>
      
      <div class="wx-auth-panel" id="auth-panel">
        <div class="wx-auth-title">Welcome to WalletX</div>
        <div class="wx-auth-subtitle">Universal AI Credit Wallet</div>
        
        <input type="email" class="wx-auth-input" id="auth-email" placeholder="Email">
        <input type="password" class="wx-auth-input" id="auth-password" placeholder="Password">
        <input type="text" class="wx-auth-input" id="auth-name" placeholder="Name (optional)" style="display:none;">
        
        <button class="wx-auth-btn" id="auth-submit-btn" onclick="handleAuth()">Login</button>
        
        <div class="wx-auth-switch">
          <span id="auth-switch-text">Don't have an account?</span>
          <a onclick="toggleAuthMode()">Register</a>
        </div>
      </div>
    </div>
    <div id="toast"></div>
  `;
}

let authMode = 'login';

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const nameInput = document.getElementById('auth-name');
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchText = document.getElementById('auth-switch-text');
  
  if (authMode === 'register') {
    nameInput.style.display = 'block';
    submitBtn.textContent = 'Register';
    switchText.textContent = 'Already have an account?';
  } else {
    nameInput.style.display = 'none';
    submitBtn.textContent = 'Login';
    switchText.textContent = "Don't have an account?";
  }
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name')?.value.trim();
  const submitBtn = document.getElementById('auth-submit-btn');
  
  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (authMode === 'register' && password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = authMode === 'login' ? 'Logging in...' : 'Registering...';
  
  try {
    let response;
    if (authMode === 'register') {
      response = await api.register(email, password, name || email.split('@')[0]);
    } else {
      response = await api.login(email, password);
    }
    
    console.log('Auth response:', response);
    
    // Extract user data from response.data
    const userData = response.data || response;
    state.user = userData;
    state.isAuthenticated = true;
    state.secretAddress = userData.secretAddress;
    state.token = userData.token;
    
    showToast(`Welcome! Secret Address: ${userData.secretAddress}`);
    
    // Reload the app
    await initializeApp();
  } catch (error) {
    console.error('Auth error:', error);
    showToast(error.message || 'Authentication failed', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'login' ? 'Login' : 'Register';
  }
}

function showMainUI() {
  // Restore the main UI from the original HTML
  document.body.innerHTML = `
    <div class="wx-popup">
      <div class="wx-header">
        <div class="wx-logo">
          <div class="wx-logo-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="#000D14" stroke="#000D14" stroke-width="0.5"/>
              <circle cx="8" cy="8" r="1.5" fill="#000D14"/>
            </svg>
          </div>
          <span class="wx-logo-name">Wallet<span>X</span></span>
        </div>
        <div class="wx-status">
          <div class="wx-dot"></div>
          ${state.user?.name || 'User'}
        </div>
      </div>

      <div class="wx-balance-card">
        <div class="wx-balance-label">Available Credits</div>
        <div class="wx-balance-amount" id="balance-display"><span>$</span><span id="balance-val">0.00</span></div>
        <div class="wx-balance-sub">
          <div class="wx-bonus-badge">⚡ 2x active · 18h left</div>
          <div class="wx-model-pill" id="model-pill-header">◈ Granite</div>
        </div>
      </div>

      <div class="wx-address-row">
        <div>
          <div class="wx-address-label">Secret Address</div>
          <div class="wx-address-code" id="secret-addr">${state.secretAddress || 'Loading...'}</div>
        </div>
        <button class="wx-copy-btn" id="copy-addr-btn" onclick="copyAddr()">copy</button>
      </div>

      <div class="wx-tabs">
        <button class="wx-tab active" onclick="switchTab('wallet', this)">
          <i class="ti ti-credit-card"></i> Wallet
        </button>
        <button class="wx-tab" onclick="switchTab('models', this)">
          <i class="ti ti-cpu"></i> Models
        </button>
        <button class="wx-tab" onclick="switchTab('context', this)">
          <i class="ti ti-brain"></i> Context
        </button>
      </div>

      <div class="wx-panel active" id="panel-wallet">
        <div class="wx-section-label">Quick Recharge</div>
        <div class="wx-amount-row">
          <button class="wx-amount-btn" onclick="selectAmt(this, 1)">$1</button>
          <button class="wx-amount-btn" onclick="selectAmt(this, 5)">$5</button>
          <button class="wx-amount-btn selected" onclick="selectAmt(this, 10)">$10</button>
          <button class="wx-amount-btn" onclick="selectAmt(this, 25)">$25</button>
        </div>
        <input class="wx-custom-input" type="number" placeholder="Custom amount ($)" id="custom-amt" oninput="clearQuick()">

        <div class="wx-section-label">Payment Method</div>
        <div class="wx-pay-methods">
          <button class="wx-pay-btn selected" onclick="selectPay(this, 'upi')">
            <span class="pay-icon">⬡</span> UPI
          </button>
          <button class="wx-pay-btn" onclick="selectPay(this, 'card')">
            <span class="pay-icon">▣</span> Card
          </button>
          <button class="wx-pay-btn" onclick="selectPay(this, 'crypto')">
            <span class="pay-icon">◈</span> Crypto
          </button>
        </div>

        <button class="wx-recharge-btn" id="recharge-btn" onclick="doRecharge()">
          Recharge $10 via UPI
        </button>
      </div>

      <div class="wx-panel" id="panel-models">
        <div class="wx-section-label">Select Model</div>
        <div class="wx-model-select">
          <div class="wx-model-card selected" onclick="selectModel(this, 'Granite 3.3', '0.8', 'granite-3.3-8b')">
            <div class="wx-model-name">IBM Granite</div>
            <div class="wx-model-cost">0.8¢ / 1k tokens</div>
          </div>
          <div class="wx-model-card" onclick="selectModel(this, 'GPT-4o', '1.5', 'gpt-4o')">
            <div class="wx-model-name">GPT-4o</div>
            <div class="wx-model-cost">1.5¢ / 1k tokens</div>
          </div>
          <div class="wx-model-card" onclick="selectModel(this, 'Claude Sonnet', '1.2', 'claude-3-sonnet')">
            <div class="wx-model-name">Claude Sonnet</div>
            <div class="wx-model-cost">1.2¢ / 1k tokens</div>
          </div>
          <div class="wx-model-card" onclick="selectModel(this, 'Llama 3.3', '0.4', 'llama-3.3-70b')">
            <div class="wx-model-name">Llama 3.3</div>
            <div class="wx-model-cost">0.4¢ / 1k tokens</div>
          </div>
        </div>
        <hr class="wx-divider">
        <div class="wx-section-label">Est. remaining queries</div>
        <div style="font-family:'JetBrains Mono',monospace; font-size:18px; color:#FFB020; font-weight:700; margin-bottom:4px;" id="queries-est">~0</div>
        <div style="font-family:'JetBrains Mono',monospace; font-size:9px; color:#3A5070;">at selected model rate · 2x bonus active</div>
      </div>

      <div class="wx-panel" id="panel-context">
        <div class="wx-section-label">Saved Snapshots</div>
        <div id="snapshots-list">
          <div style="text-align:center; padding:20px; color:#3A5070; font-size:11px;">No snapshots yet</div>
        </div>

        <button class="wx-save-btn" id="save-btn" onclick="saveSnap()">
          <i class="ti ti-device-floppy"></i> Save current context
        </button>

        <div class="wx-section-label">Import via Secret Address</div>
        <div class="wx-import-row">
          <input class="wx-import-input" placeholder="WX-XXXX·XXXX·XXXX·XXXX" id="import-code">
          <button class="wx-import-btn" onclick="doImport()">Import</button>
        </div>
      </div>
    </div>
    <div id="toast"></div>
  `;
  
  // Update balance display
  updateBalanceDisplay();
  updateQueriesEst();
}

async function loadBalance() {
  try {
    const data = await api.getBalance();
    state.balance = data.balance;
    updateBalanceDisplay();
    updateQueriesEst();
  } catch (error) {
    console.error('Failed to load balance:', error);
    showToast('Failed to load balance', 'error');
  }
}

function updateBalanceDisplay() {
  const balanceEl = document.getElementById('balance-val');
  if (balanceEl) {
    balanceEl.textContent = state.balance.toFixed(2);
  }
}

// Tab switching
function switchTab(id, btn) {
  document.querySelectorAll('.wx-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wx-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + id).classList.add('active');
}

// Amount selection
function selectAmt(btn, amt) {
  document.querySelectorAll('.wx-amount-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.selectedAmt = amt;
  document.getElementById('custom-amt').value = '';
  updateRechargeBtn();
}

function clearQuick() {
  document.querySelectorAll('.wx-amount-btn').forEach(b => b.classList.remove('selected'));
  const v = parseFloat(document.getElementById('custom-amt').value);
  if (!isNaN(v) && v > 0) { 
    state.selectedAmt = v; 
    updateRechargeBtn(); 
  }
}

// Payment method selection
function selectPay(btn, method) {
  document.querySelectorAll('.wx-pay-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.selectedPay = method;
  updateRechargeBtn();
}

function updateRechargeBtn() {
  const labels = { upi: 'UPI', card: 'Card', crypto: 'Crypto' };
  const btn = document.getElementById('recharge-btn');
  if (btn) {
    btn.textContent = 'Recharge $' + state.selectedAmt + ' via ' + labels[state.selectedPay];
    btn.classList.remove('success');
  }
}

// Recharge function
async function doRecharge() {
  const btn = document.getElementById('recharge-btn');
  btn.textContent = 'Processing...';
  btn.disabled = true;
  
  try {
    let paymentData;
    
    if (state.selectedPay === 'upi' || state.selectedPay === 'card') {
      // Use Razorpay for UPI/Card
      paymentData = await api.createRazorpayPayment(state.selectedAmt);
    } else {
      // Use Stripe for crypto (or implement crypto payment)
      paymentData = await api.createStripePayment(state.selectedAmt);
    }
    
    // Open payment URL in new tab
    if (paymentData.url) {
      chrome.tabs.create({ url: paymentData.url });
      showToast('Payment window opened');
    }
    
    // Poll for payment confirmation
    setTimeout(async () => {
      await loadBalance();
      btn.classList.add('success');
      btn.textContent = '✓ $' + state.selectedAmt + ' added!';
      showToast('+$' + state.selectedAmt + ' credited · 2x bonus applied');
      setTimeout(() => {
        btn.disabled = false;
        updateRechargeBtn();
      }, 2500);
    }, 3000);
    
  } catch (error) {
    console.error('Recharge error:', error);
    showToast(error.message || 'Recharge failed', 'error');
    btn.disabled = false;
    updateRechargeBtn();
  }
}

// Model selection
function selectModel(card, name, rate, modelId) {
  document.querySelectorAll('.wx-model-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.modelRate = parseFloat(rate);
  state.selectedModel = modelId;
  
  // Save to storage
  chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.SELECTED_MODEL]: modelId });
  
  const pillEl = document.getElementById('model-pill-header');
  if (pillEl) {
    pillEl.textContent = '◈ ' + name.split(' ')[0];
  }
  updateQueriesEst();
  
  // Notify background script
  chrome.runtime.sendMessage({ 
    type: 'MODEL_CHANGED', 
    model: modelId 
  });
}

function updateQueriesEst() {
  const queries = Math.round((state.balance / (state.modelRate / 100)) / 1000);
  const estEl = document.getElementById('queries-est');
  if (estEl) {
    estEl.textContent = '~' + queries.toLocaleString();
  }
}

// Copy address
function copyAddr() {
  const addr = document.getElementById('secret-addr').textContent;
  navigator.clipboard.writeText(addr).then(() => {
    const btn = document.getElementById('copy-addr-btn');
    btn.textContent = 'copied!';
    btn.classList.add('copied');
    showToast('Secret address copied');
    setTimeout(() => { 
      btn.textContent = 'copy'; 
      btn.classList.remove('copied'); 
    }, 2000);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Snapshot functions
async function loadSnapshots() {
  try {
    const data = await api.listSnapshots();
    const listEl = document.getElementById('snapshots-list');
    
    if (!listEl) return;
    
    if (data.snapshots && data.snapshots.length > 0) {
      listEl.innerHTML = data.snapshots.map(snap => `
        <div class="wx-snapshot-item">
          <div class="wx-snapshot-left">
            <div class="wx-snapshot-icon">⬡</div>
            <div>
              <div class="wx-snapshot-name">${snap.name}</div>
              <div class="wx-snapshot-meta">${snap.ide || 'Unknown'} · ${snap.fileCount || 0} files · ${formatDate(snap.createdAt)}</div>
            </div>
          </div>
          <button class="wx-snapshot-load" onclick="loadSnap('${snap._id}')">load</button>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#3A5070; font-size:11px;">No snapshots yet</div>';
    }
  } catch (error) {
    console.error('Failed to load snapshots:', error);
  }
}

async function saveSnap() {
  const btn = document.getElementById('save-btn');
  btn.innerHTML = '<i class="ti ti-loader"></i> Saving...';
  btn.disabled = true;
  
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const context = {
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString()
    };
    
    const name = `Snapshot ${new Date().toLocaleString()}`;
    await api.saveSnapshot(name, context);
    
    btn.innerHTML = '<i class="ti ti-check"></i> Snapshot saved!';
    showToast('Context saved · importable via secret address');
    
    // Reload snapshots
    await loadSnapshots();
    
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save current context';
      btn.disabled = false;
    }, 2200);
  } catch (error) {
    console.error('Save snapshot error:', error);
    showToast(error.message || 'Failed to save snapshot', 'error');
    btn.innerHTML = '<i class="ti ti-device-floppy"></i> Save current context';
    btn.disabled = false;
  }
}

async function loadSnap(id) {
  try {
    const data = await api.loadSnapshot(id);
    showToast(`Loading "${data.snapshot.name}" context...`);
    
    // Notify background script to load context
    chrome.runtime.sendMessage({ 
      type: 'LOAD_SNAPSHOT', 
      snapshot: data.snapshot 
    });
  } catch (error) {
    console.error('Load snapshot error:', error);
    showToast(error.message || 'Failed to load snapshot', 'error');
  }
}

function doImport() {
  const code = document.getElementById('import-code').value.trim();
  if (!code) { 
    showToast('Enter a secret address first', 'error'); 
    return; 
  }
  showToast('Importing context from ' + code.slice(0, 10) + '...');
  setTimeout(() => { 
    document.getElementById('import-code').value = ''; 
  }, 1000);
}

// Toast notifications
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  
  t.textContent = msg;
  t.classList.remove('error');
  if (type === 'error') {
    t.classList.add('error');
  }
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'yesterday';
  return date.toLocaleDateString();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BALANCE_UPDATED') {
    state.balance = message.balance;
    updateBalanceDisplay();
    updateQueriesEst();
  } else if (message.type === 'CREDIT_DEDUCTED') {
    showToast(`-$${message.amount.toFixed(2)} · ${message.model}`);
    loadBalance();
  }
});

// Sync balance periodically
setInterval(async () => {
  if (state.isAuthenticated) {
    await loadBalance();
  }
}, CONFIG.SYNC_INTERVAL);

// Made with Bob
