// WalletX Content Script - Inject into IDE pages

console.log('WalletX content script loaded on:', window.location.href);

// Detect current IDE
const currentIDE = detectIDE();
console.log('Detected IDE:', currentIDE);

// State
let isWalletXActive = true;
let currentBalance = 0;

// Detect which IDE we're on
function detectIDE() {
  const hostname = window.location.hostname;
  
  for (const [key, ide] of Object.entries(CONFIG.SUPPORTED_IDES)) {
    if (hostname.includes(ide.domain)) {
      return { id: key, ...ide };
    }
  }
  
  return null;
}

// Initialize WalletX indicator in IDE UI
function injectWalletXIndicator() {
  if (!currentIDE) return;
  
  // Create WalletX status indicator
  const indicator = document.createElement('div');
  indicator.id = 'walletx-indicator';
  indicator.innerHTML = `
    <style>
      #walletx-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #0E1628;
        border: 1px solid #1A2845;
        border-radius: 8px;
        padding: 8px 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #00C8F0;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      #walletx-indicator:hover {
        background: #001A20;
        border-color: #00C8F0;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 200, 240, 0.2);
      }
      #walletx-indicator .wx-logo {
        width: 16px;
        height: 16px;
        background: #00C8F0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #walletx-indicator .wx-balance {
        color: #FFB020;
        font-weight: 700;
      }
      #walletx-indicator .wx-status {
        width: 6px;
        height: 6px;
        background: #2DD88A;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      #walletx-indicator.inactive .wx-status {
        background: #FF4444;
        animation: none;
      }
      
      #walletx-notification {
        position: fixed;
        top: 60px;
        right: 10px;
        background: #0E1628;
        border: 1px solid #1A2845;
        border-radius: 8px;
        padding: 10px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: #E8F0FF;
        z-index: 999998;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      #walletx-notification.show {
        opacity: 1;
        transform: translateX(0);
      }
      #walletx-notification.error {
        border-color: #FF4444;
        background: #2A0A0A;
      }
      #walletx-notification .wx-notif-title {
        font-weight: 700;
        color: #00C8F0;
        margin-bottom: 4px;
      }
      #walletx-notification.error .wx-notif-title {
        color: #FF4444;
      }
    </style>
    <div class="wx-logo">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="#000D14" stroke="#000D14" stroke-width="0.5"/>
      </svg>
    </div>
    <span>WalletX</span>
    <span class="wx-balance" id="wx-balance-display">$0.00</span>
    <div class="wx-status"></div>
  `;
  
  // Add click handler to open popup
  indicator.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });
  
  document.body.appendChild(indicator);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'walletx-notification';
  document.body.appendChild(notification);
  
  // Load initial balance
  updateBalance();
}

// Update balance display
async function updateBalance() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_BALANCE' });
    currentBalance = response.balance;
    
    const balanceEl = document.getElementById('wx-balance-display');
    if (balanceEl) {
      balanceEl.textContent = `$${currentBalance.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Failed to get balance:', error);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notif = document.getElementById('walletx-notification');
  if (!notif) return;
  
  notif.className = type === 'error' ? 'error' : '';
  notif.innerHTML = `
    <div class="wx-notif-title">${type === 'error' ? 'WalletX Error' : 'WalletX'}</div>
    <div>${message}</div>
  `;
  
  notif.classList.add('show');
  
  setTimeout(() => {
    notif.classList.remove('show');
  }, 3000);
}

// Intercept fetch requests to AI APIs
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;
  
  // Check if this is an AI API call
  if (isAIApiCall(url)) {
    console.log('WalletX: Intercepted AI API call:', url);
    
    if (!isWalletXActive) {
      console.log('WalletX: Inactive, allowing original request');
      return originalFetch.apply(this, args);
    }
    
    try {
      // Extract request data
      let requestBody = null;
      if (options && options.body) {
        requestBody = typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body;
      }
      
      // Route through WalletX backend
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_AI_REQUEST',
        url: url,
        method: options?.method || 'POST',
        body: requestBody
      });
      
      if (response.error) {
        showNotification(response.error, 'error');
        
        // If insufficient balance, allow original request
        if (response.error.includes('Insufficient')) {
          return originalFetch.apply(this, args);
        }
        
        throw new Error(response.error);
      }
      
      // Show success notification
      showNotification(`-$${response.cost.toFixed(2)} · ${response.model}`);
      
      // Update balance
      currentBalance = response.remainingBalance;
      updateBalance();
      
      // Return mocked response with AI data
      return new Response(JSON.stringify(response.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('WalletX: Failed to proxy request:', error);
      showNotification(error.message, 'error');
      
      // Fallback to original request
      return originalFetch.apply(this, args);
    }
  }
  
  // Not an AI request, proceed normally
  return originalFetch.apply(this, args);
};

// Intercept XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._walletx_url = url;
  this._walletx_method = method;
  return originalXHROpen.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(body) {
  if (isAIApiCall(this._walletx_url) && isWalletXActive) {
    console.log('WalletX: Intercepted XHR AI API call:', this._walletx_url);
    
    // Store original handlers
    const originalOnLoad = this.onload;
    const originalOnError = this.onerror;
    
    // Override handlers
    this.onload = async function() {
      try {
        const requestBody = body ? JSON.parse(body) : null;
        
        // Route through WalletX
        const response = await chrome.runtime.sendMessage({
          type: 'PROXY_AI_REQUEST',
          url: this._walletx_url,
          method: this._walletx_method,
          body: requestBody
        });
        
        if (response.error) {
          showNotification(response.error, 'error');
          if (originalOnError) originalOnError.call(this);
          return;
        }
        
        // Update response
        Object.defineProperty(this, 'responseText', {
          writable: true,
          value: JSON.stringify(response.data)
        });
        Object.defineProperty(this, 'response', {
          writable: true,
          value: response.data
        });
        
        showNotification(`-$${response.cost.toFixed(2)} · ${response.model}`);
        updateBalance();
        
        if (originalOnLoad) originalOnLoad.call(this);
      } catch (error) {
        console.error('WalletX XHR proxy error:', error);
        if (originalOnLoad) originalOnLoad.call(this);
      }
    };
  }
  
  return originalXHRSend.apply(this, [body]);
};

// Helper function to identify AI API calls
function isAIApiCall(url) {
  if (!url) return false;
  
  const aiPatterns = [
    /api\.openai\.com.*\/chat\/completions/,
    /api\.anthropic\.com.*\/messages/,
    /chat/i,
    /completion/i,
    /generate/i,
    /ai/i
  ];
  
  return aiPatterns.some(pattern => pattern.test(url));
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BALANCE_UPDATED') {
    currentBalance = message.balance;
    updateBalance();
  } else if (message.type === 'LOAD_SNAPSHOT') {
    showNotification(`Loading snapshot: ${message.snapshot.name}`);
    // Handle snapshot loading in IDE
    handleSnapshotLoad(message.snapshot);
  } else if (message.type === 'TOGGLE_WALLETX') {
    isWalletXActive = message.active;
    const indicator = document.getElementById('walletx-indicator');
    if (indicator) {
      indicator.classList.toggle('inactive', !isWalletXActive);
    }
    showNotification(isWalletXActive ? 'WalletX activated' : 'WalletX deactivated');
  }
  
  sendResponse({ success: true });
  return true;
});

// Handle snapshot loading
function handleSnapshotLoad(snapshot) {
  // This would integrate with the IDE's context loading mechanism
  // For now, just show a notification
  console.log('Loading snapshot:', snapshot);
  
  // In a real implementation, this would:
  // 1. Parse the snapshot context
  // 2. Inject it into the IDE's context window
  // 3. Restore file states, cursor positions, etc.
}

// Monitor for insufficient balance
function checkBalance() {
  if (currentBalance <= 0) {
    showNotification('Balance empty! Click to recharge.', 'error');
    const indicator = document.getElementById('walletx-indicator');
    if (indicator) {
      indicator.classList.add('inactive');
    }
  } else if (currentBalance < 1) {
    showNotification('Low balance! Consider recharging.', 'error');
  }
}

// Inject indicator when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWalletXIndicator);
} else {
  injectWalletXIndicator();
}

// Periodic balance check
setInterval(() => {
  updateBalance();
  checkBalance();
}, 30000); // Every 30 seconds

// Observe DOM changes to re-inject indicator if removed
const observer = new MutationObserver((mutations) => {
  if (!document.getElementById('walletx-indicator')) {
    injectWalletXIndicator();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: false
});

console.log('WalletX content script initialized for', currentIDE?.name || 'unknown IDE');

// Made with Bob
