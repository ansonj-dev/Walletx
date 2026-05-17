// WalletX Configuration
const CONFIG = {
  API_BASE_URL: 'https://walletx-two.vercel.app/api',
  
  SUPPORTED_IDES: {
    cursor: { 
      domain: 'cursor.sh', 
      name: 'Cursor',
      apiEndpoints: ['/api/chat', '/v1/chat/completions']
    },
    windsurf: { 
      domain: 'windsurf.com', 
      name: 'Windsurf',
      apiEndpoints: ['/api/ai', '/chat']
    },
    copilot: { 
      domain: 'copilot.github.com', 
      name: 'GitHub Copilot',
      apiEndpoints: ['/v1/engines', '/completions']
    },
    antigravity: { 
      domain: 'antigravity.com', 
      name: 'Antigravity',
      apiEndpoints: ['/api/generate']
    }
  },
  
  STORAGE_KEYS: {
    TOKEN: 'walletx_token',
    SECRET_ADDRESS: 'walletx_secret',
    BALANCE: 'walletx_balance',
    USER_DATA: 'walletx_user',
    SELECTED_MODEL: 'walletx_model',
    THEME: 'walletx_theme',
    LAST_SYNC: 'walletx_last_sync'
  },
  
  AI_PROVIDERS: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    ibm: {
      baseUrl: 'https://api.watsonx.ai/v1',
      models: ['granite-3.3-8b', 'granite-3.3-2b']
    },
    meta: {
      baseUrl: 'https://api.llama-api.com/v1',
      models: ['llama-3.3-70b', 'llama-3.1-8b']
    }
  },
  
  DEFAULT_MODEL: 'granite-3.3-8b',
  
  SYNC_INTERVAL: 30000, // 30 seconds
  
  TOAST_DURATION: 2500,
  
  MAX_RETRIES: 3,
  
  RETRY_DELAY: 1000
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// Made with Bob
