/**
 * GitHub Copilot Integration Example
 * 
 * This example shows how to integrate WalletX SDK into GitHub Copilot
 * to route completions through WalletX credit system.
 */

const WalletX = require('@walletx/sdk');

// Initialize WalletX client
const walletx = new WalletX({
  apiUrl: 'https://api.walletx.dev',
  ideName: 'GitHub Copilot',
  version: '1.0.0'
});

/**
 * Initialize WalletX integration
 */
async function initializeWalletX() {
  try {
    // Get secret from environment or VS Code settings
    const secretAddress = process.env.WALLETX_SECRET || 
                         vscode.workspace.getConfiguration('walletx').get('secretAddress');
    
    if (!secretAddress) {
      vscode.window.showErrorMessage('WalletX secret address not configured.');
      return false;
    }

    // Authenticate
    const { user, balance } = await walletx.authenticate(secretAddress);
    
    vscode.window.showInformationMessage(`WalletX connected! Balance: ${balance} credits`);
    
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = `$(credit-card) ${balance}`;
    statusBarItem.tooltip = 'WalletX Credits';
    statusBarItem.command = 'walletx.showBalance';
    statusBarItem.show();
    
    return true;
  } catch (error) {
    vscode.window.showErrorMessage(`WalletX authentication failed: ${error.message}`);
    return false;
  }
}

/**
 * Intercept Copilot completion requests
 */
copilot.onCompletion(async (document, position, context) => {
  try {
    // Ensure authenticated
    if (!walletx.isAuthenticated()) {
      const initialized = await initializeWalletX();
      if (!initialized) {
        return copilot.getDefaultCompletion(document, position, context);
      }
    }

    // Get code context
    const prompt = buildPromptFromContext(document, position, context);
    
    // Estimate cost before request
    const estimatedCost = await walletx.credits.estimateCost('gpt-4o', prompt.length);
    
    // Check if user has sufficient balance
    const canAfford = await walletx.credits.checkBalance(estimatedCost);
    if (!canAfford) {
      const balance = walletx.credits.getCachedBalance();
      vscode.window.showWarningMessage(
        `Insufficient credits. Need ${estimatedCost}, have ${balance}. Click to recharge.`,
        'Recharge'
      ).then(selection => {
        if (selection === 'Recharge') {
          vscode.env.openExternal(vscode.Uri.parse('https://walletx.dev/recharge'));
        }
      });
      return null;
    }

    // Make completion request through WalletX
    const response = await walletx.ai.complete('gpt-4o', prompt, {
      maxTokens: 100,
      temperature: 0.2,
      stopSequences: ['\n\n']
    });

    // Update balance display
    const newBalance = await walletx.getBalance();
    updateStatusBar(newBalance);
    
    // Log usage
    console.log(`Completion used ${response.creditsUsed} credits`);
    
    return response.data;
    
  } catch (error) {
    console.error('Copilot completion error:', error);
    
    if (error.code === 'INSUFFICIENT_CREDITS') {
      vscode.window.showErrorMessage('Insufficient WalletX credits for completion');
    } else {
      vscode.window.showErrorMessage(`Completion failed: ${error.message}`);
    }
    
    return null;
  }
});

/**
 * Intercept Copilot chat requests
 */
copilot.onChatRequest(async (messages, options) => {
  try {
    if (!walletx.isAuthenticated()) {
      await initializeWalletX();
    }

    // Route through WalletX
    const response = await walletx.makeAIRequest('gpt-4o', messages, options);
    
    // Update balance
    const newBalance = await walletx.getBalance();
    updateStatusBar(newBalance);
    
    return response.data;
    
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      vscode.window.showErrorMessage(
        'Insufficient credits for chat request',
        'Recharge'
      ).then(selection => {
        if (selection === 'Recharge') {
          vscode.env.openExternal(vscode.Uri.parse('https://walletx.dev/recharge'));
        }
      });
    }
    throw error;
  }
});

/**
 * Build prompt from editor context
 */
function buildPromptFromContext(document, position, context) {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);
  const lineSuffix = document.lineAt(position).text.substr(position.character);
  
  // Get surrounding lines for context
  const startLine = Math.max(0, position.line - 10);
  const endLine = Math.min(document.lineCount - 1, position.line + 5);
  const contextLines = [];
  
  for (let i = startLine; i <= endLine; i++) {
    contextLines.push(document.lineAt(i).text);
  }
  
  return `Complete the following code:\n\n${contextLines.join('\n')}\n\nCursor is at: ${linePrefix}|${lineSuffix}`;
}

/**
 * Update status bar with balance
 */
let statusBarItem;
function updateStatusBar(balance) {
  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'walletx.showBalance';
    statusBarItem.show();
  }
  
  statusBarItem.text = `$(credit-card) ${balance}`;
  statusBarItem.tooltip = `WalletX Credits: ${balance}`;
  
  // Change color if balance is low
  if (balance < 10) {
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  } else {
    statusBarItem.backgroundColor = undefined;
  }
}

/**
 * Register VS Code commands
 */
function registerCommands(context) {
  // Show balance command
  context.subscriptions.push(
    vscode.commands.registerCommand('walletx.showBalance', async () => {
      try {
        const balance = await walletx.getBalance(true);
        vscode.window.showInformationMessage(`WalletX Balance: ${balance} credits`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch balance: ${error.message}`);
      }
    })
  );

  // Show transaction history
  context.subscriptions.push(
    vscode.commands.registerCommand('walletx.showHistory', async () => {
      try {
        const history = await walletx.credits.getHistory(50);
        
        // Create webview to display history
        const panel = vscode.window.createWebviewPanel(
          'walletxHistory',
          'WalletX Transaction History',
          vscode.ViewColumn.One,
          {}
        );
        
        panel.webview.html = generateHistoryHTML(history);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch history: ${error.message}`);
      }
    })
  );

  // Recharge command
  context.subscriptions.push(
    vscode.commands.registerCommand('walletx.recharge', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://walletx.dev/recharge'));
    })
  );

  // Configure secret address
  context.subscriptions.push(
    vscode.commands.registerCommand('walletx.configure', async () => {
      const secret = await vscode.window.showInputBox({
        prompt: 'Enter your WalletX secret address',
        placeHolder: 'WX-XXXXXXXX',
        validateInput: (value) => {
          if (!/^WX-[A-Z0-9]{8}$/.test(value)) {
            return 'Invalid format. Expected: WX-XXXXXXXX';
          }
          return null;
        }
      });
      
      if (secret) {
        await vscode.workspace.getConfiguration('walletx').update('secretAddress', secret, true);
        vscode.window.showInformationMessage('WalletX secret address saved!');
        await initializeWalletX();
      }
    })
  );
}

/**
 * Generate HTML for transaction history
 */
function generateHistoryHTML(history) {
  const rows = history.map(tx => `
    <tr>
      <td>${new Date(tx.createdAt).toLocaleString()}</td>
      <td>${tx.type}</td>
      <td>${tx.amount}</td>
      <td>${tx.description || '-'}</td>
    </tr>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>WalletX Transaction History</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Listen for balance updates
 */
walletx.on('balance_updated', (balance) => {
  updateStatusBar(balance);
});

/**
 * Extension activation
 */
function activate(context) {
  console.log('WalletX Copilot integration activated');
  
  // Register commands
  registerCommands(context);
  
  // Initialize WalletX
  initializeWalletX();
}

function deactivate() {
  walletx.logout();
}

module.exports = { activate, deactivate };

// Made with Bob
