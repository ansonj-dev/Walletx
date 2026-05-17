/**
 * Cursor IDE Integration Example
 * 
 * This example shows how to integrate WalletX SDK into Cursor IDE
 * to route all AI requests through WalletX credit system.
 */

const WalletX = require('@walletx/sdk');

// Initialize WalletX client
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Cursor',
  version: '1.0.0'
});

/**
 * Initialize WalletX integration
 */
async function initializeWalletX() {
  try {
    // Get secret address from user settings or environment
    const secretAddress = process.env.WALLETX_SECRET || await cursor.getUserSetting('walletx.secretAddress');
    
    if (!secretAddress) {
      cursor.showError('WalletX secret address not configured. Please set it in settings.');
      return false;
    }

    // Authenticate with WalletX
    const { user, balance } = await walletx.authenticate(secretAddress);
    
    cursor.showInfo(`WalletX connected! Balance: ${balance} credits`);
    console.log('Authenticated as:', user.email);
    
    // Update UI with balance
    cursor.updateStatusBar(`WalletX: ${balance} credits`);
    
    return true;
  } catch (error) {
    cursor.showError(`WalletX authentication failed: ${error.message}`);
    return false;
  }
}

/**
 * Intercept Cursor's AI requests
 */
cursor.onAIRequest(async (model, messages, options) => {
  try {
    // Check if WalletX is authenticated
    if (!walletx.isAuthenticated()) {
      const initialized = await initializeWalletX();
      if (!initialized) {
        return cursor.showDefaultAIResponse(model, messages);
      }
    }

    // Show loading indicator
    cursor.showLoading('Processing with WalletX...');

    // Route request through WalletX (auto-deducts credits)
    const response = await walletx.makeAIRequest(model, messages, options);
    
    // Hide loading
    cursor.hideLoading();
    
    // Update balance display
    const newBalance = await walletx.getBalance();
    cursor.updateStatusBar(`WalletX: ${newBalance} credits`);
    
    // Show cost notification
    cursor.showNotification(`Used ${response.creditsUsed} credits`, 'info');
    
    return response.data;
    
  } catch (error) {
    cursor.hideLoading();
    
    if (error.code === 'INSUFFICIENT_CREDITS') {
      // Show recharge prompt
      const shouldRecharge = await cursor.showDialog({
        title: 'Insufficient Credits',
        message: `You need ${error.details.required} credits but only have ${error.details.available}. Would you like to recharge?`,
        buttons: ['Recharge', 'Cancel']
      });
      
      if (shouldRecharge === 'Recharge') {
        cursor.openURL('https://walletx.dev/recharge');
      }
      
      return null;
    }
    
    cursor.showError(`AI request failed: ${error.message}`);
    throw error;
  }
});

/**
 * Listen for balance updates
 */
walletx.on('balance_updated', (newBalance) => {
  cursor.updateStatusBar(`WalletX: ${newBalance} credits`);
  
  // Warn if balance is low
  if (newBalance < 10) {
    cursor.showWarning('Your WalletX balance is low. Consider recharging.');
  }
});

/**
 * Listen for session expiration
 */
walletx.on('session_expired', async () => {
  cursor.showWarning('WalletX session expired. Reconnecting...');
  await initializeWalletX();
});

/**
 * Save context before closing Cursor
 */
cursor.onBeforeClose(async () => {
  try {
    if (walletx.isAuthenticated()) {
      await walletx.saveContext({
        name: `Cursor Session ${new Date().toISOString()}`,
        context: {
          chatHistory: cursor.getChatHistory(),
          activeFiles: cursor.getOpenFiles(),
          workspaceState: cursor.getWorkspaceState(),
          cursorPosition: cursor.getCursorPosition()
        }
      });
      console.log('Context saved to WalletX');
    }
  } catch (error) {
    console.error('Failed to save context:', error);
  }
});

/**
 * Load context when opening Cursor
 */
cursor.onOpen(async () => {
  try {
    if (walletx.isAuthenticated()) {
      const latest = await walletx.context.getLatest();
      
      if (latest) {
        const shouldRestore = await cursor.showDialog({
          title: 'Restore Previous Session',
          message: 'Would you like to restore your previous Cursor session?',
          buttons: ['Restore', 'Start Fresh']
        });
        
        if (shouldRestore === 'Restore') {
          const context = await walletx.loadContext(latest.id);
          cursor.restoreContext(context.context);
          cursor.showInfo('Previous session restored!');
        }
      }
    }
  } catch (error) {
    console.error('Failed to load context:', error);
  }
});

/**
 * Add WalletX commands to Cursor
 */
cursor.registerCommand('walletx.showBalance', async () => {
  try {
    const balance = await walletx.getBalance(true);
    cursor.showInfo(`Current balance: ${balance} credits`);
  } catch (error) {
    cursor.showError(`Failed to fetch balance: ${error.message}`);
  }
});

cursor.registerCommand('walletx.showHistory', async () => {
  try {
    const history = await walletx.credits.getHistory(20);
    cursor.showPanel('WalletX Transaction History', history);
  } catch (error) {
    cursor.showError(`Failed to fetch history: ${error.message}`);
  }
});

cursor.registerCommand('walletx.recharge', () => {
  cursor.openURL('https://walletx.dev/recharge');
});

cursor.registerCommand('walletx.disconnect', async () => {
  await walletx.logout();
  cursor.showInfo('Disconnected from WalletX');
  cursor.updateStatusBar('WalletX: Disconnected');
});

// Initialize on startup
initializeWalletX();

module.exports = { walletx, initializeWalletX };

// Made with Bob
