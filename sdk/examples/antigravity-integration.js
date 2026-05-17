/**
 * Antigravity IDE Integration Example
 * 
 * This example shows how to integrate WalletX SDK into Antigravity IDE
 * with advanced features like cost tracking and model switching.
 */

const WalletX = require('@walletx/sdk');

// Initialize WalletX client
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'Antigravity',
  version: '1.0.0'
});

// Track session statistics
const sessionStats = {
  totalRequests: 0,
  totalCreditsUsed: 0,
  requestsByModel: {},
  startTime: Date.now()
};

/**
 * Initialize WalletX integration
 */
async function initializeWalletX() {
  try {
    const secretAddress = antigravity.config.walletxSecret || 
                         await antigravity.settings.get('walletx.secretAddress');
    
    if (!secretAddress) {
      antigravity.ui.showError('WalletX secret address not configured');
      return false;
    }

    const { user, balance } = await walletx.authenticate(secretAddress);
    
    antigravity.ui.showSuccess(`WalletX connected! Balance: ${balance} credits`);
    antigravity.statusBar.update('walletx', {
      text: `💳 ${balance}`,
      tooltip: `WalletX Balance: ${balance} credits`,
      onClick: () => antigravity.commands.execute('walletx.showDashboard')
    });
    
    return true;
  } catch (error) {
    antigravity.ui.showError(`WalletX authentication failed: ${error.message}`);
    return false;
  }
}

/**
 * Intercept all AI model calls
 */
antigravity.ai.setProvider(async (model, input, options = {}) => {
  try {
    if (!walletx.isAuthenticated()) {
      await initializeWalletX();
    }

    // Convert input to messages format
    const messages = formatInputAsMessages(input);

    // Estimate cost before request
    const tokenCount = estimateTokenCount(messages);
    const estimatedCost = await walletx.credits.estimateCost(model, tokenCount);
    
    // Show cost estimate to user
    antigravity.ui.showCostEstimate({
      model,
      estimatedCost,
      tokenCount
    });

    // Check if user wants to proceed
    if (options.confirmCost && estimatedCost > 1) {
      const proceed = await antigravity.ui.confirm({
        title: 'Confirm AI Request',
        message: `This request will cost approximately ${estimatedCost} credits. Continue?`,
        confirmText: 'Proceed',
        cancelText: 'Cancel'
      });
      
      if (!proceed) {
        return null;
      }
    }

    // Show loading with model info
    antigravity.ui.showLoading(`Processing with ${model}...`);

    // Make request through WalletX
    const startTime = Date.now();
    const response = await walletx.makeAIRequest(model, messages, options);
    const duration = Date.now() - startTime;

    // Hide loading
    antigravity.ui.hideLoading();
    
    // Update balance
    const newBalance = await walletx.getBalance();
    antigravity.statusBar.update('walletx', {
      text: `💳 ${newBalance}`,
      tooltip: `WalletX Balance: ${newBalance} credits`
    });
    
    // Show actual cost with details
    antigravity.ui.showCostDetails({
      model,
      creditsUsed: response.creditsUsed,
      estimatedCost,
      duration,
      tokens: response.usage
    });

    // Update session statistics
    updateSessionStats(model, response.creditsUsed);
    
    return response.data;
    
  } catch (error) {
    antigravity.ui.hideLoading();
    
    if (error.code === 'INSUFFICIENT_CREDITS') {
      antigravity.ui.showRechargeDialog({
        required: error.details.required,
        available: error.details.available,
        onRecharge: () => {
          antigravity.browser.open('https://walletx.dev/recharge');
        }
      });
    } else {
      antigravity.ui.showError(`AI request failed: ${error.message}`);
    }
    
    throw error;
  }
});

/**
 * Model selector with pricing info
 */
antigravity.ai.onModelSelect(async () => {
  try {
    const models = await walletx.ai.getSupportedModels();
    const pricing = await walletx.ai.getAllPricing();
    
    const modelOptions = models.map(model => ({
      label: model.name,
      description: `${model.provider} - Input: $${pricing[model.name]?.input}/1K tokens`,
      value: model.name,
      detail: `Output: $${pricing[model.name]?.output}/1K tokens`
    }));
    
    const selected = await antigravity.ui.showQuickPick(modelOptions, {
      title: 'Select AI Model',
      placeholder: 'Choose a model based on your needs'
    });
    
    if (selected) {
      antigravity.ai.setDefaultModel(selected.value);
      antigravity.ui.showInfo(`Default model set to ${selected.value}`);
    }
  } catch (error) {
    antigravity.ui.showError(`Failed to load models: ${error.message}`);
  }
});

/**
 * Format input as messages
 */
function formatInputAsMessages(input) {
  if (Array.isArray(input)) {
    return input;
  } else if (typeof input === 'string') {
    return [{ role: 'user', content: input }];
  } else if (input.messages) {
    return input.messages;
  }
  return [{ role: 'user', content: String(input) }];
}

/**
 * Estimate token count
 */
function estimateTokenCount(messages) {
  return messages.reduce((total, msg) => {
    return total + Math.ceil((msg.content || '').length / 4);
  }, 0);
}

/**
 * Update session statistics
 */
function updateSessionStats(model, creditsUsed) {
  sessionStats.totalRequests++;
  sessionStats.totalCreditsUsed += creditsUsed;
  
  if (!sessionStats.requestsByModel[model]) {
    sessionStats.requestsByModel[model] = {
      count: 0,
      credits: 0
    };
  }
  
  sessionStats.requestsByModel[model].count++;
  sessionStats.requestsByModel[model].credits += creditsUsed;
}

/**
 * Show WalletX dashboard
 */
async function showDashboard() {
  try {
    const balance = await walletx.getBalance(true);
    const history = await walletx.credits.getHistory(20);
    const snapshots = await walletx.context.list({ limit: 10 });
    
    const sessionDuration = Math.floor((Date.now() - sessionStats.startTime) / 1000 / 60);
    
    antigravity.ui.showPanel({
      title: 'WalletX Dashboard',
      content: {
        balance: {
          current: balance,
          trend: calculateBalanceTrend(history)
        },
        session: {
          duration: `${sessionDuration} minutes`,
          requests: sessionStats.totalRequests,
          creditsUsed: sessionStats.totalCreditsUsed,
          byModel: sessionStats.requestsByModel
        },
        recentTransactions: history.slice(0, 10),
        snapshots: snapshots
      },
      actions: [
        {
          label: 'Recharge',
          action: () => antigravity.browser.open('https://walletx.dev/recharge')
        },
        {
          label: 'View History',
          action: () => showTransactionHistory()
        },
        {
          label: 'Manage Snapshots',
          action: () => showSnapshotManager()
        }
      ]
    });
  } catch (error) {
    antigravity.ui.showError(`Failed to load dashboard: ${error.message}`);
  }
}

/**
 * Calculate balance trend
 */
function calculateBalanceTrend(history) {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(0, 5);
  const totalChange = recent.reduce((sum, tx) => sum + tx.amount, 0);
  
  if (totalChange < -10) return 'decreasing';
  if (totalChange > 10) return 'increasing';
  return 'stable';
}

/**
 * Show transaction history
 */
async function showTransactionHistory() {
  try {
    const history = await walletx.credits.getHistory(100);
    
    antigravity.ui.showTable({
      title: 'Transaction History',
      columns: [
        { key: 'date', label: 'Date', width: 150 },
        { key: 'type', label: 'Type', width: 100 },
        { key: 'amount', label: 'Amount', width: 80 },
        { key: 'balance', label: 'Balance', width: 80 },
        { key: 'description', label: 'Description', width: 300 }
      ],
      rows: history.map(tx => ({
        date: new Date(tx.createdAt).toLocaleString(),
        type: tx.type,
        amount: tx.amount > 0 ? `+${tx.amount}` : tx.amount,
        balance: tx.balanceAfter,
        description: tx.description || '-'
      })),
      actions: [
        {
          label: 'Export CSV',
          action: () => exportTransactionHistory(history)
        }
      ]
    });
  } catch (error) {
    antigravity.ui.showError(`Failed to load history: ${error.message}`);
  }
}

/**
 * Export transaction history
 */
function exportTransactionHistory(history) {
  const csv = [
    'Date,Type,Amount,Balance,Description',
    ...history.map(tx => 
      `${tx.createdAt},${tx.type},${tx.amount},${tx.balanceAfter},"${tx.description || ''}"`
    )
  ].join('\n');
  
  antigravity.fs.saveFile('walletx-transactions.csv', csv);
  antigravity.ui.showSuccess('Transaction history exported!');
}

/**
 * Show snapshot manager
 */
async function showSnapshotManager() {
  try {
    const snapshots = await walletx.context.list();
    
    antigravity.ui.showList({
      title: 'Context Snapshots',
      items: snapshots.map(s => ({
        id: s.id,
        title: s.name,
        subtitle: new Date(s.createdAt).toLocaleString(),
        actions: [
          {
            icon: 'load',
            label: 'Load',
            action: () => loadSnapshot(s.id)
          },
          {
            icon: 'export',
            label: 'Export',
            action: () => exportSnapshot(s.id)
          },
          {
            icon: 'delete',
            label: 'Delete',
            action: () => deleteSnapshot(s.id)
          }
        ]
      })),
      emptyMessage: 'No snapshots saved yet',
      headerActions: [
        {
          label: 'Save Current',
          action: () => saveCurrentSnapshot()
        },
        {
          label: 'Import',
          action: () => importSnapshot()
        }
      ]
    });
  } catch (error) {
    antigravity.ui.showError(`Failed to load snapshots: ${error.message}`);
  }
}

/**
 * Save current snapshot
 */
async function saveCurrentSnapshot() {
  const name = await antigravity.ui.prompt({
    title: 'Save Snapshot',
    placeholder: 'Enter snapshot name'
  });
  
  if (name) {
    try {
      await walletx.saveContext({
        name,
        context: antigravity.getFullContext()
      });
      antigravity.ui.showSuccess('Snapshot saved!');
    } catch (error) {
      antigravity.ui.showError(`Failed to save: ${error.message}`);
    }
  }
}

/**
 * Load snapshot
 */
async function loadSnapshot(snapshotId) {
  try {
    const snapshot = await walletx.loadContext(snapshotId);
    antigravity.restoreContext(snapshot.context);
    antigravity.ui.showSuccess('Snapshot loaded!');
  } catch (error) {
    antigravity.ui.showError(`Failed to load: ${error.message}`);
  }
}

/**
 * Export snapshot
 */
async function exportSnapshot(snapshotId) {
  try {
    const exportData = await walletx.context.export(snapshotId);
    
    antigravity.ui.showDialog({
      title: 'Export Snapshot',
      message: `Share this code:\n\n${exportData.secretCode}\n\nExpires: ${new Date(exportData.expiresAt).toLocaleString()}`,
      buttons: [
        {
          label: 'Copy Code',
          action: () => antigravity.clipboard.copy(exportData.secretCode)
        }
      ]
    });
  } catch (error) {
    antigravity.ui.showError(`Failed to export: ${error.message}`);
  }
}

/**
 * Import snapshot
 */
async function importSnapshot() {
  const code = await antigravity.ui.prompt({
    title: 'Import Snapshot',
    placeholder: 'Enter import code'
  });
  
  if (code) {
    try {
      const snapshot = await walletx.context.import(code, null);
      antigravity.restoreContext(snapshot.context);
      antigravity.ui.showSuccess('Snapshot imported!');
    } catch (error) {
      antigravity.ui.showError(`Failed to import: ${error.message}`);
    }
  }
}

/**
 * Delete snapshot
 */
async function deleteSnapshot(snapshotId) {
  const confirmed = await antigravity.ui.confirm({
    title: 'Delete Snapshot',
    message: 'Are you sure you want to delete this snapshot?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    try {
      await walletx.context.delete(snapshotId);
      antigravity.ui.showSuccess('Snapshot deleted!');
      showSnapshotManager(); // Refresh list
    } catch (error) {
      antigravity.ui.showError(`Failed to delete: ${error.message}`);
    }
  }
}

/**
 * Register Antigravity commands
 */
antigravity.commands.register('walletx.showDashboard', showDashboard);
antigravity.commands.register('walletx.showHistory', showTransactionHistory);
antigravity.commands.register('walletx.showSnapshots', showSnapshotManager);
antigravity.commands.register('walletx.recharge', () => {
  antigravity.browser.open('https://walletx.dev/recharge');
});

/**
 * Listen for balance updates
 */
walletx.on('balance_updated', (balance) => {
  antigravity.statusBar.update('walletx', {
    text: `💳 ${balance}`,
    tooltip: `WalletX Balance: ${balance} credits`
  });
  
  if (balance < 10) {
    antigravity.ui.showWarning('Low balance! Consider recharging.');
  }
});

/**
 * Listen for request completion
 */
walletx.on('request_completed', (data) => {
  antigravity.analytics.track('ai_request', {
    model: data.model,
    creditsUsed: data.creditsUsed,
    tokens: data.usage
  });
});

// Initialize on startup
initializeWalletX();

module.exports = {
  walletx,
  initializeWalletX,
  showDashboard,
  sessionStats
};

// Made with Bob
