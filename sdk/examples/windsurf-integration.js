/**
 * Windsurf IDE Integration Example
 * 
 * This example shows how to integrate WalletX SDK into Windsurf IDE
 * with focus on context persistence and cross-IDE compatibility.
 */

const WalletX = require('@walletx/sdk');

// Initialize WalletX client
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Windsurf',
  version: '1.0.0'
});

/**
 * Initialize WalletX integration
 */
async function initializeWalletX() {
  try {
    const secretAddress = windsurf.getUserSecret() || 
                         await windsurf.promptForSecret();
    
    if (!secretAddress) {
      windsurf.showNotification('WalletX not configured', 'warning');
      return false;
    }

    const { user, balance } = await walletx.authenticate(secretAddress);
    
    windsurf.showNotification(`Connected to WalletX! Balance: ${balance} credits`, 'success');
    windsurf.updateBalanceIndicator(balance);
    
    return true;
  } catch (error) {
    windsurf.showNotification(`Authentication failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Intercept Windsurf AI requests
 */
windsurf.ai.setProvider(async (model, input, options) => {
  try {
    if (!walletx.isAuthenticated()) {
      await initializeWalletX();
    }

    // Convert input to messages format
    const messages = Array.isArray(input) ? input : [
      { role: 'user', content: input }
    ];

    // Estimate and show cost
    const tokenCount = messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
    const estimatedCost = await walletx.credits.estimateCost(model, tokenCount);
    
    windsurf.showCostEstimate(estimatedCost);

    // Make request through WalletX
    const response = await walletx.makeAIRequest(model, messages, options);
    
    // Update balance
    const newBalance = await walletx.getBalance();
    windsurf.updateBalanceIndicator(newBalance);
    
    // Show actual cost
    windsurf.showActualCost(response.creditsUsed);
    
    return response.data;
    
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      windsurf.showRechargeDialog(error.details.required, error.details.available);
    } else {
      windsurf.showNotification(`AI request failed: ${error.message}`, 'error');
    }
    throw error;
  }
});

/**
 * Auto-save context periodically
 */
let autoSaveInterval;
function startAutoSave() {
  // Save context every 5 minutes
  autoSaveInterval = setInterval(async () => {
    try {
      if (walletx.isAuthenticated() && windsurf.hasUnsavedChanges()) {
        await saveCurrentContext('Auto-save');
        console.log('Context auto-saved to WalletX');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 5 * 60 * 1000);
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
}

/**
 * Save current context
 */
async function saveCurrentContext(name) {
  try {
    const context = {
      chatHistory: windsurf.getChatHistory(),
      activeFiles: windsurf.getOpenFiles().map(file => ({
        path: file.path,
        content: file.content,
        cursorPosition: file.cursorPosition,
        selection: file.selection
      })),
      taskState: windsurf.getCurrentTask(),
      workspaceState: {
        layout: windsurf.getLayout(),
        panels: windsurf.getOpenPanels(),
        terminal: windsurf.getTerminalState()
      },
      timestamp: new Date().toISOString()
    };

    const snapshot = await walletx.saveContext({
      name: name || `Windsurf - ${new Date().toLocaleString()}`,
      context
    });

    windsurf.showNotification('Context saved to WalletX', 'success');
    return snapshot;
  } catch (error) {
    windsurf.showNotification(`Failed to save context: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Load context from snapshot
 */
async function loadContext(snapshotId) {
  try {
    windsurf.showLoading('Loading context from WalletX...');
    
    const snapshot = await walletx.loadContext(snapshotId);
    const context = snapshot.context;

    // Restore chat history
    if (context.chatHistory) {
      windsurf.restoreChatHistory(context.chatHistory);
    }

    // Restore open files
    if (context.activeFiles) {
      for (const file of context.activeFiles) {
        await windsurf.openFile(file.path, {
          content: file.content,
          cursorPosition: file.cursorPosition,
          selection: file.selection
        });
      }
    }

    // Restore task state
    if (context.taskState) {
      windsurf.restoreTaskState(context.taskState);
    }

    // Restore workspace state
    if (context.workspaceState) {
      windsurf.restoreLayout(context.workspaceState.layout);
      windsurf.restorePanels(context.workspaceState.panels);
      windsurf.restoreTerminal(context.workspaceState.terminal);
    }

    windsurf.hideLoading();
    windsurf.showNotification('Context restored successfully!', 'success');
    
  } catch (error) {
    windsurf.hideLoading();
    windsurf.showNotification(`Failed to load context: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Import context from another IDE
 */
async function importFromAnotherIDE() {
  try {
    const secretCode = await windsurf.promptForInput({
      title: 'Import from Another IDE',
      placeholder: 'Enter import code',
      description: 'Get this code from your other IDE (Cursor, Copilot, etc.)'
    });

    if (!secretCode) return;

    windsurf.showLoading('Importing context...');

    // List available snapshots with this code
    const snapshots = await walletx.context.import(secretCode, null);
    
    if (snapshots.length === 0) {
      windsurf.showNotification('No snapshots found with this code', 'warning');
      return;
    }

    // Let user choose which snapshot to import
    const selected = await windsurf.showQuickPick(
      snapshots.map(s => ({
        label: s.name,
        description: new Date(s.createdAt).toLocaleString(),
        value: s.id
      })),
      { title: 'Select snapshot to import' }
    );

    if (selected) {
      await loadContext(selected.value);
    }

    windsurf.hideLoading();
    
  } catch (error) {
    windsurf.hideLoading();
    windsurf.showNotification(`Import failed: ${error.message}`, 'error');
  }
}

/**
 * Export context for sharing
 */
async function exportContext(snapshotId) {
  try {
    const exportData = await walletx.context.export(snapshotId);
    
    windsurf.showDialog({
      title: 'Context Export',
      message: `Share this code with another IDE to import this context:\n\n${exportData.secretCode}\n\nExpires: ${new Date(exportData.expiresAt).toLocaleString()}`,
      buttons: [
        {
          label: 'Copy Code',
          action: () => windsurf.copyToClipboard(exportData.secretCode)
        },
        {
          label: 'Close',
          action: () => {}
        }
      ]
    });
    
  } catch (error) {
    windsurf.showNotification(`Export failed: ${error.message}`, 'error');
  }
}

/**
 * Save context before closing Windsurf
 */
windsurf.onBeforeClose(async () => {
  try {
    if (walletx.isAuthenticated()) {
      const shouldSave = await windsurf.showDialog({
        title: 'Save Context',
        message: 'Would you like to save your current session to WalletX?',
        buttons: ['Save', 'Don\'t Save']
      });

      if (shouldSave === 'Save') {
        await saveCurrentContext('Windsurf Session - Closing');
        windsurf.showNotification('Session saved!', 'success');
      }
    }
  } catch (error) {
    console.error('Failed to save on close:', error);
  } finally {
    stopAutoSave();
  }
});

/**
 * Load context when opening Windsurf
 */
windsurf.onOpen(async () => {
  try {
    if (walletx.isAuthenticated()) {
      const snapshots = await walletx.context.list({ limit: 5 });
      
      if (snapshots.length > 0) {
        const shouldRestore = await windsurf.showDialog({
          title: 'Restore Previous Session',
          message: 'Would you like to restore a previous session?',
          buttons: ['Show Sessions', 'Start Fresh']
        });

        if (shouldRestore === 'Show Sessions') {
          const selected = await windsurf.showQuickPick(
            snapshots.map(s => ({
              label: s.name,
              description: new Date(s.createdAt).toLocaleString(),
              value: s.id
            })),
            { title: 'Select session to restore' }
          );

          if (selected) {
            await loadContext(selected.value);
          }
        }
      }
    }
    
    // Start auto-save
    startAutoSave();
    
  } catch (error) {
    console.error('Failed to load on open:', error);
  }
});

/**
 * Register Windsurf commands
 */
windsurf.registerCommand('walletx.saveContext', async () => {
  const name = await windsurf.promptForInput({
    title: 'Save Context',
    placeholder: 'Enter a name for this snapshot'
  });
  
  if (name) {
    await saveCurrentContext(name);
  }
});

windsurf.registerCommand('walletx.loadContext', async () => {
  const snapshots = await walletx.context.list();
  
  const selected = await windsurf.showQuickPick(
    snapshots.map(s => ({
      label: s.name,
      description: new Date(s.createdAt).toLocaleString(),
      value: s.id
    })),
    { title: 'Select context to load' }
  );
  
  if (selected) {
    await loadContext(selected.value);
  }
});

windsurf.registerCommand('walletx.importContext', importFromAnotherIDE);

windsurf.registerCommand('walletx.exportContext', async () => {
  const snapshots = await walletx.context.list();
  
  const selected = await windsurf.showQuickPick(
    snapshots.map(s => ({
      label: s.name,
      description: new Date(s.createdAt).toLocaleString(),
      value: s.id
    })),
    { title: 'Select context to export' }
  );
  
  if (selected) {
    await exportContext(selected.value);
  }
});

windsurf.registerCommand('walletx.showBalance', async () => {
  const balance = await walletx.getBalance(true);
  windsurf.showNotification(`Current balance: ${balance} credits`, 'info');
});

/**
 * Listen for balance updates
 */
walletx.on('balance_updated', (balance) => {
  windsurf.updateBalanceIndicator(balance);
  
  if (balance < 10) {
    windsurf.showNotification('Low balance! Consider recharging.', 'warning');
  }
});

// Initialize on startup
initializeWalletX();

module.exports = {
  walletx,
  initializeWalletX,
  saveCurrentContext,
  loadContext,
  importFromAnotherIDE,
  exportContext
};

// Made with Bob
