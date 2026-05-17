/**
 * WalletXClient - Main SDK class for WalletX integration
 */

const axios = require('axios');
const EventEmitter = require('eventemitter3');
const CreditManager = require('./CreditManager');
const AIProxyClient = require('./AIProxyClient');
const ContextManager = require('./ContextManager');
const Storage = require('./utils/storage');
const { validateSecretAddress, parseAuthToken, isTokenExpired, createAuthHeader } = require('./utils/auth');
const { AuthenticationError, InvalidConfigError, NetworkError } = require('./utils/errors');

class WalletXClient extends EventEmitter {
  constructor(config = {}) {
    super();

    // Validate config
    this._validateConfig(config);

    // Configuration
    this.config = {
      apiUrl: config.apiUrl || 'https://api.walletx.dev',
      ideName: config.ideName || 'Unknown IDE',
      version: config.version || '1.0.0',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      offlineMode: config.offlineMode || false,
      ...config
    };

    // Initialize storage
    this.storage = new Storage(`walletx_${this.config.ideName.toLowerCase().replace(/\s+/g, '_')}`);

    // Initialize API client
    this.apiClient = this._createApiClient();

    // Initialize managers
    this.credits = new CreditManager(this.apiClient, this.storage);
    this.ai = new AIProxyClient(this.apiClient, this.credits);
    this.context = new ContextManager(this.apiClient, this.storage);

    // Authentication state
    this.authenticated = false;
    this.token = null;
    this.user = null;

    // Request queue for offline mode
    this.requestQueue = [];

    // Setup event forwarding from managers
    this._setupEventForwarding();

    // Try to restore session
    this._restoreSession();
  }

  /**
   * Authenticate with secret address
   * @param {string} secretAddress - WalletX secret address
   * @returns {Promise<Object>}
   */
  async authenticate(secretAddress) {
    // Validate secret address format
    if (!validateSecretAddress(secretAddress)) {
      throw new AuthenticationError('Invalid secret address format. Expected: WX-XXXXXXXX');
    }

    try {
      const response = await axios.post(`${this.config.apiUrl}/auth/login`, {
        secretAddress,
        ideName: this.config.ideName,
        version: this.config.version
      }, {
        timeout: this.config.timeout
      });

      // Parse and store token
      this.token = parseAuthToken(response.data);
      this.user = response.data.user;
      this.authenticated = true;

      // Store session
      this.storage.set('session', {
        token: this.token,
        user: this.user,
        authenticatedAt: Date.now()
      });

      // Update API client with token
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

      // Emit authentication event
      this.emit('authenticated', this.user);

      // Fetch initial balance
      await this.credits.refreshBalance();

      return {
        user: this.user,
        balance: this.credits.getCachedBalance()
      };
    } catch (error) {
      this.emit('authentication_failed', error);
      throw new AuthenticationError(error.response?.data?.message || 'Authentication failed');
    }
  }

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      if (this.authenticated && this.token) {
        await this.apiClient.post('/auth/logout');
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      this._clearSession();
      this.emit('logged_out');
    }
  }

  /**
   * Get current credit balance
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<number>}
   */
  async getBalance(forceRefresh = false) {
    this._ensureAuthenticated();
    return this.credits.getBalance(forceRefresh);
  }

  /**
   * Deduct credits
   * @param {number} amount - Amount to deduct
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>}
   */
  async deductCredits(amount, metadata = {}) {
    this._ensureAuthenticated();
    return this.credits.deduct(amount, metadata.reason || 'Manual deduction', metadata);
  }

  /**
   * Make AI request through WalletX proxy
   * @param {string} model - AI model name
   * @param {Array} messages - Chat messages
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async makeAIRequest(model, messages, options = {}) {
    this._ensureAuthenticated();

    // Handle offline mode
    if (this.config.offlineMode && !navigator.onLine) {
      return this._queueRequest('ai', { model, messages, options });
    }

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const response = await this.ai.chat(model, messages, options);
        
        // Emit success event
        this.emit('request_completed', {
          model,
          creditsUsed: response.creditsUsed,
          usage: response.usage
        });

        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication or insufficient credits errors
        if (error.code === 'AUTHENTICATION_ERROR' || error.code === 'INSUFFICIENT_CREDITS') {
          throw error;
        }

        // Wait before retry
        if (attempt < this.config.retries - 1) {
          await this._sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    this.emit('request_failed', { model, error: lastError });
    throw lastError;
  }

  /**
   * Save IDE context
   * @param {Object} snapshot - Context snapshot
   * @returns {Promise<Object>}
   */
  async saveContext(snapshot) {
    this._ensureAuthenticated();
    return this.context.save(snapshot.name || 'Untitled', snapshot.context || snapshot);
  }

  /**
   * Load IDE context
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>}
   */
  async loadContext(snapshotId) {
    this._ensureAuthenticated();
    return this.context.load(snapshotId);
  }

  /**
   * Get user information
   * @returns {Object|null}
   */
  getUser() {
    return this.user;
  }

  /**
   * Check if authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.authenticated && this.token && !isTokenExpired(this.token);
  }

  /**
   * Validate configuration
   * @private
   */
  _validateConfig(config) {
    if (!config.apiUrl && !config.ideName) {
      // Allow default values
      return;
    }

    if (config.apiUrl && typeof config.apiUrl !== 'string') {
      throw new InvalidConfigError('apiUrl must be a string');
    }

    if (config.ideName && typeof config.ideName !== 'string') {
      throw new InvalidConfigError('ideName must be a string');
    }
  }

  /**
   * Create axios API client
   * @private
   */
  _createApiClient() {
    const client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-IDE-Name': this.config.ideName,
        'X-IDE-Version': this.config.version
      }
    });

    // Add response interceptor for error handling
    client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          this._clearSession();
          this.emit('session_expired');
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Setup event forwarding from managers
   * @private
   */
  _setupEventForwarding() {
    // Forward credit manager events
    this.credits.on('balance_updated', (balance) => {
      this.emit('balance_updated', balance);
    });

    this.credits.on('insufficient_credits', (error) => {
      this.emit('insufficient_credits', error);
    });

    this.credits.on('credits_deducted', (data) => {
      this.emit('credits_deducted', data);
    });
  }

  /**
   * Restore session from storage
   * @private
   */
  _restoreSession() {
    const session = this.storage.get('session');
    
    if (session && session.token && !isTokenExpired(session.token)) {
      this.token = session.token;
      this.user = session.user;
      this.authenticated = true;
      
      // Update API client with token
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      // Emit restored event
      this.emit('session_restored', this.user);
    }
  }

  /**
   * Clear session
   * @private
   */
  _clearSession() {
    this.token = null;
    this.user = null;
    this.authenticated = false;
    
    // Clear storage
    this.storage.remove('session');
    
    // Clear API client token
    delete this.apiClient.defaults.headers.common['Authorization'];
    
    // Clear manager caches
    this.credits.clearCache();
    this.ai.clearCache();
    this.context.clearCache();
  }

  /**
   * Ensure user is authenticated
   * @private
   */
  _ensureAuthenticated() {
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('Not authenticated. Please call authenticate() first.');
    }
  }

  /**
   * Queue request for offline mode
   * @private
   */
  _queueRequest(type, data) {
    const request = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.requestQueue.push(request);
    this.storage.set('request_queue', this.requestQueue);
    
    this.emit('request_queued', request);
    
    return Promise.resolve({
      queued: true,
      message: 'Request queued for when connection is restored'
    });
  }

  /**
   * Process queued requests
   * @private
   */
  async _processQueue() {
    if (this.requestQueue.length === 0) return;

    const queue = [...this.requestQueue];
    this.requestQueue = [];
    this.storage.remove('request_queue');

    for (const request of queue) {
      try {
        if (request.type === 'ai') {
          await this.ai.chat(request.data.model, request.data.messages, request.data.options);
        }
        this.emit('queued_request_completed', request);
      } catch (error) {
        this.emit('queued_request_failed', { request, error });
      }
    }
  }

  /**
   * Sleep utility
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WalletXClient;

// Made with Bob
