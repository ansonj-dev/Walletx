/**
 * CreditManager - Handles credit operations for WalletX SDK
 */

const EventEmitter = require('eventemitter3');
const { InsufficientCreditsError } = require('./utils/errors');

class CreditManager extends EventEmitter {
  constructor(apiClient, storage) {
    super();
    this.apiClient = apiClient;
    this.storage = storage;
    this.balance = null;
    this.lastUpdate = null;
    this.subscribers = new Set();
  }

  /**
   * Check if user has sufficient balance
   * @param {number} amount - Required amount
   * @returns {Promise<boolean>}
   */
  async checkBalance(amount = 0) {
    await this.refreshBalance();
    return this.balance >= amount;
  }

  /**
   * Get current balance
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<number>}
   */
  async getBalance(forceRefresh = false) {
    if (forceRefresh || !this.balance || this._shouldRefresh()) {
      await this.refreshBalance();
    }
    return this.balance;
  }

  /**
   * Refresh balance from server
   * @returns {Promise<number>}
   */
  async refreshBalance() {
    try {
      const response = await this.apiClient.get('/credits/balance');
      this.balance = response.data.balance;
      this.lastUpdate = Date.now();
      
      // Cache balance
      this.storage.set('balance', {
        amount: this.balance,
        timestamp: this.lastUpdate
      });
      
      // Emit balance update event
      this.emit('balance_updated', this.balance);
      this._notifySubscribers(this.balance);
      
      return this.balance;
    } catch (error) {
      // Try to use cached balance
      const cached = this.storage.get('balance');
      if (cached) {
        this.balance = cached.amount;
        this.lastUpdate = cached.timestamp;
        return this.balance;
      }
      throw error;
    }
  }

  /**
   * Estimate cost for a request
   * @param {string} model - AI model name
   * @param {number} tokenCount - Estimated token count
   * @returns {Promise<number>}
   */
  async estimateCost(model, tokenCount) {
    try {
      const response = await this.apiClient.post('/credits/estimate', {
        model,
        tokenCount
      });
      return response.data.estimatedCost;
    } catch (error) {
      // Fallback to local estimation if API fails
      return this._estimateCostLocally(model, tokenCount);
    }
  }

  /**
   * Deduct credits
   * @param {number} amount - Amount to deduct
   * @param {string} reason - Reason for deduction
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>}
   */
  async deduct(amount, reason, metadata = {}) {
    // Check balance first
    const hasBalance = await this.checkBalance(amount);
    if (!hasBalance) {
      const error = new InsufficientCreditsError(amount, this.balance);
      this.emit('insufficient_credits', error);
      throw error;
    }

    try {
      const response = await this.apiClient.post('/credits/deduct', {
        amount,
        reason,
        metadata
      });

      // Update local balance
      this.balance = response.data.newBalance;
      this.lastUpdate = Date.now();
      
      // Cache new balance
      this.storage.set('balance', {
        amount: this.balance,
        timestamp: this.lastUpdate
      });

      // Emit events
      this.emit('credits_deducted', {
        amount,
        newBalance: this.balance,
        transaction: response.data.transaction
      });
      this.emit('balance_updated', this.balance);
      this._notifySubscribers(this.balance);

      return response.data;
    } catch (error) {
      this.emit('deduction_failed', { amount, reason, error });
      throw error;
    }
  }

  /**
   * Get transaction history
   * @param {number} limit - Number of transactions to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>}
   */
  async getHistory(limit = 50, offset = 0) {
    try {
      const response = await this.apiClient.get('/credits/history', {
        params: { limit, offset }
      });
      return response.data.transactions;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  /**
   * Subscribe to balance changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Immediately call with current balance
    if (this.balance !== null) {
      callback(this.balance);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of balance change
   * @private
   */
  _notifySubscribers(balance) {
    this.subscribers.forEach(callback => {
      try {
        callback(balance);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  /**
   * Check if balance should be refreshed
   * @private
   */
  _shouldRefresh() {
    if (!this.lastUpdate) return true;
    // Refresh if older than 5 minutes
    return Date.now() - this.lastUpdate > 5 * 60 * 1000;
  }

  /**
   * Estimate cost locally (fallback)
   * @private
   */
  _estimateCostLocally(model, tokenCount) {
    // Rough estimates (credits per 1K tokens)
    const pricing = {
      'gpt-4o': 0.03,
      'gpt-4o-mini': 0.01,
      'gpt-4-turbo': 0.03,
      'gpt-3.5-turbo': 0.005,
      'claude-3-opus': 0.04,
      'claude-3-sonnet': 0.02,
      'claude-3-haiku': 0.008,
      'gemini-pro': 0.01,
      'gemini-1.5-pro': 0.02
    };

    const rate = pricing[model] || 0.02; // Default rate
    return Math.ceil((tokenCount / 1000) * rate * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get cached balance (synchronous)
   * @returns {number|null}
   */
  getCachedBalance() {
    return this.balance;
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.balance = null;
    this.lastUpdate = null;
    this.storage.remove('balance');
  }
}

module.exports = CreditManager;

// Made with Bob
