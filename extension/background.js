// WalletX Background Service Worker

import CONFIG from './config.js';

// State management
let authToken = null;
let balance = 0;
let selectedModel = CONFIG.DEFAULT_MODEL;

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('WalletX extension installed');
  
  // Load saved state
  const storage = await chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.TOKEN,
    CONFIG.STORAGE_KEYS.BALANCE,
    CONFIG.STORAGE_KEYS.SELECTED_MODEL
  ]);
  
  authToken = storage[CONFIG.STORAGE_KEYS.TOKEN];
  balance = storage[CONFIG.STORAGE_KEYS.BALANCE] || 0;
  selectedModel = storage[CONFIG.STORAGE_KEYS.SELECTED_MODEL] || CONFIG.DEFAULT_MODEL;
});

// API request helper
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear auth
        authToken = null;
        await chrome.storage.local.remove([CONFIG.STORAGE_KEYS.TOKEN]);
      }
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('Background API Error:', error);
    throw error;
  }
}

// Intercept web requests to IDE AI endpoints
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    // Check if this is an AI API call
    const isAIRequest = isAIApiCall(details.url);
    
    if (!isAIRequest) {
      return {};
    }
    
    console.log('Intercepted AI request:', details.url);
    
    // Check authentication
    if (!authToken) {
      console.log('Not authenticated, allowing request to pass');
      return {};
    }
    
    // Extract request body
    let requestBody = null;
    if (details.requestBody) {
      if (details.requestBody.raw) {
        const decoder = new TextDecoder('utf-8');
        requestBody = JSON.parse(decoder.decode(details.requestBody.raw[0].bytes));
      }
    }
    
    // Route through WalletX backend
    try {
      const response = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
          messages: requestBody?.messages || [],
          originalUrl: details.url
        })
      });
      
      // Update balance
      balance = response.remainingBalance;
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.BALANCE]: balance });
      
      // Notify popup
      chrome.runtime.sendMessage({
        type: 'CREDIT_DEDUCTED',
        amount: response.cost,
        model: selectedModel,
        balance: balance
      });
      
      // Return the AI response
      return {
        redirectUrl: 'data:application/json;charset=utf-8,' + 
                     encodeURIComponent(JSON.stringify(response.data))
      };
    } catch (error) {
      console.error('Failed to route through WalletX:', error);
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'WalletX Error',
        message: error.message || 'Failed to process AI request'
      });
      
      // Allow original request to proceed
      return {};
    }
  },
  {
    urls: [
      '*://api.openai.com/*',
      '*://api.anthropic.com/*',
      '*://*.cursor.sh/*/chat*',
      '*://*.windsurf.com/*/ai*',
      '*://copilot.github.com/*/completions*'
    ]
  },
  ['requestBody', 'blocking']
);

// Helper function to identify AI API calls
function isAIApiCall(url) {
  const aiPatterns = [
    /api\.openai\.com.*\/chat\/completions/,
    /api\.anthropic\.com.*\/messages/,
    /cursor\.sh.*\/chat/,
    /windsurf\.com.*\/ai/,
    /copilot\.github\.com.*\/completions/,
    /antigravity\.com.*\/generate/
  ];
  
  return aiPatterns.some(pattern => pattern.test(url));
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BALANCE') {
    sendResponse({ balance });
  } else if (message.type === 'MODEL_CHANGED') {
    selectedModel = message.model;
    chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.SELECTED_MODEL]: message.model });
  } else if (message.type === 'LOAD_SNAPSHOT') {
    // Handle snapshot loading
    handleSnapshotLoad(message.snapshot);
  } else if (message.type === 'DEDUCT_CREDITS') {
    // Manual credit deduction from content script
    handleCreditDeduction(message.amount, message.model);
  }
  
  return true; // Keep message channel open for async response
});

// Handle snapshot loading
async function handleSnapshotLoad(snapshot) {
  try {
    // Notify all content scripts
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'LOAD_SNAPSHOT',
        snapshot: snapshot
      }).catch(() => {
        // Tab might not have content script
      });
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'WalletX',
      message: `Loaded snapshot: ${snapshot.name}`
    });
  } catch (error) {
    console.error('Failed to load snapshot:', error);
  }
}

// Handle credit deduction
async function handleCreditDeduction(amount, model) {
  try {
    const response = await apiRequest('/credits/deduct', {
      method: 'POST',
      body: JSON.stringify({ amount, model })
    });
    
    balance = response.balance;
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.BALANCE]: balance });
    
    // Notify popup
    chrome.runtime.sendMessage({
      type: 'BALANCE_UPDATED',
      balance: balance
    });
    
    return response;
  } catch (error) {
    console.error('Credit deduction failed:', error);
    throw error;
  }
}

// Sync balance periodically
setInterval(async () => {
  if (authToken) {
    try {
      const data = await apiRequest('/credits/balance');
      balance = data.balance;
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEYS.BALANCE]: balance });
      
      // Notify popup if open
      chrome.runtime.sendMessage({
        type: 'BALANCE_UPDATED',
        balance: balance
      }).catch(() => {
        // Popup might be closed
      });
    } catch (error) {
      console.error('Balance sync failed:', error);
    }
  }
}, CONFIG.SYNC_INTERVAL);

// Handle token updates from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes[CONFIG.STORAGE_KEYS.TOKEN]) {
      authToken = changes[CONFIG.STORAGE_KEYS.TOKEN].newValue;
    }
    if (changes[CONFIG.STORAGE_KEYS.BALANCE]) {
      balance = changes[CONFIG.STORAGE_KEYS.BALANCE].newValue;
    }
    if (changes[CONFIG.STORAGE_KEYS.SELECTED_MODEL]) {
      selectedModel = changes[CONFIG.STORAGE_KEYS.SELECTED_MODEL].newValue;
    }
  }
});

// Show notification when credits are low
function checkLowBalance() {
  if (balance < 1 && balance > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'WalletX - Low Balance',
      message: `Your balance is low: $${balance.toFixed(2)}. Please recharge.`,
      priority: 2
    });
  } else if (balance <= 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'WalletX - No Credits',
      message: 'Your balance is empty. Recharge to continue using AI models.',
      priority: 2
    });
  }
}

// Monitor balance changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[CONFIG.STORAGE_KEYS.BALANCE]) {
    const newBalance = changes[CONFIG.STORAGE_KEYS.BALANCE].newValue;
    if (newBalance !== balance) {
      balance = newBalance;
      checkLowBalance();
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.action.openPopup();
});

// Context menu for quick actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'walletx-balance',
    title: 'Check WalletX Balance',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'walletx-recharge',
    title: 'Recharge Credits',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'walletx-balance') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'WalletX Balance',
      message: `Current balance: $${balance.toFixed(2)}`
    });
  } else if (info.menuItemId === 'walletx-recharge') {
    chrome.action.openPopup();
  }
});

console.log('WalletX background service worker loaded');

// Made with Bob
