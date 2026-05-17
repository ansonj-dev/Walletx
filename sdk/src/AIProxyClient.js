/**
 * AIProxyClient - Routes AI requests through WalletX
 */

const { InvalidModelError, NetworkError } = require('./utils/errors');

class AIProxyClient {
  constructor(apiClient, creditManager) {
    this.apiClient = apiClient;
    this.creditManager = creditManager;
    this.supportedModels = null;
    this.modelPricing = null;
  }

  /**
   * Universal chat endpoint
   * @param {string} model - AI model name
   * @param {Array} messages - Chat messages
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async chat(model, messages, options = {}) {
    // Validate model
    await this._ensureModelSupported(model);

    // Estimate cost
    const tokenCount = this._estimateTokenCount(messages);
    const estimatedCost = await this.creditManager.estimateCost(model, tokenCount);

    // Check balance
    const hasBalance = await this.creditManager.checkBalance(estimatedCost);
    if (!hasBalance) {
      throw new Error('Insufficient credits for this request');
    }

    try {
      const response = await this.apiClient.post('/ai/chat', {
        model,
        messages,
        ...options
      }, {
        timeout: options.timeout || 60000
      });

      return {
        data: response.data.response,
        creditsUsed: response.data.creditsUsed,
        model: response.data.model,
        usage: response.data.usage
      };
    } catch (error) {
      throw new NetworkError('AI chat request failed', error);
    }
  }

  /**
   * Completion endpoint
   * @param {string} model - AI model name
   * @param {string} prompt - Completion prompt
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async complete(model, prompt, options = {}) {
    // Validate model
    await this._ensureModelSupported(model);

    // Estimate cost
    const tokenCount = this._estimateTokenCount(prompt);
    const estimatedCost = await this.creditManager.estimateCost(model, tokenCount);

    // Check balance
    const hasBalance = await this.creditManager.checkBalance(estimatedCost);
    if (!hasBalance) {
      throw new Error('Insufficient credits for this request');
    }

    try {
      const response = await this.apiClient.post('/ai/complete', {
        model,
        prompt,
        ...options
      }, {
        timeout: options.timeout || 60000
      });

      return {
        data: response.data.completion,
        creditsUsed: response.data.creditsUsed,
        model: response.data.model,
        usage: response.data.usage
      };
    } catch (error) {
      throw new NetworkError('AI completion request failed', error);
    }
  }

  /**
   * Embedding endpoint
   * @param {string} model - Embedding model name
   * @param {string|Array} text - Text to embed
   * @returns {Promise<Object>}
   */
  async embed(model, text, options = {}) {
    try {
      const response = await this.apiClient.post('/ai/embed', {
        model,
        text,
        ...options
      });

      return {
        data: response.data.embeddings,
        creditsUsed: response.data.creditsUsed,
        model: response.data.model
      };
    } catch (error) {
      throw new NetworkError('AI embedding request failed', error);
    }
  }

  /**
   * Stream chat responses
   * @param {string} model - AI model name
   * @param {Array} messages - Chat messages
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async streamChat(model, messages, onChunk, options = {}) {
    // Validate model
    await this._ensureModelSupported(model);

    // Estimate cost
    const tokenCount = this._estimateTokenCount(messages);
    const estimatedCost = await this.creditManager.estimateCost(model, tokenCount);

    // Check balance
    const hasBalance = await this.creditManager.checkBalance(estimatedCost);
    if (!hasBalance) {
      throw new Error('Insufficient credits for this request');
    }

    try {
      const response = await this.apiClient.post('/ai/chat/stream', {
        model,
        messages,
        stream: true,
        ...options
      }, {
        responseType: 'stream',
        timeout: options.timeout || 120000
      });

      let fullResponse = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const text = chunk.toString();
          fullResponse += text;
          onChunk(text);
        });

        response.data.on('end', () => {
          resolve({
            data: fullResponse,
            model
          });
        });

        response.data.on('error', (error) => {
          reject(new NetworkError('Stream error', error));
        });
      });
    } catch (error) {
      throw new NetworkError('AI stream request failed', error);
    }
  }

  /**
   * Get list of supported models
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>}
   */
  async getSupportedModels(forceRefresh = false) {
    if (!forceRefresh && this.supportedModels) {
      return this.supportedModels;
    }

    try {
      const response = await this.apiClient.get('/ai/models');
      this.supportedModels = response.data.models;
      return this.supportedModels;
    } catch (error) {
      // Return cached models or defaults
      return this.supportedModels || this._getDefaultModels();
    }
  }

  /**
   * Get pricing for a specific model
   * @param {string} model - Model name
   * @returns {Promise<Object>}
   */
  async getModelPricing(model) {
    if (!this.modelPricing) {
      await this._fetchModelPricing();
    }

    return this.modelPricing[model] || null;
  }

  /**
   * Get all model pricing
   * @returns {Promise<Object>}
   */
  async getAllPricing() {
    if (!this.modelPricing) {
      await this._fetchModelPricing();
    }

    return this.modelPricing;
  }

  /**
   * Ensure model is supported
   * @private
   */
  async _ensureModelSupported(model) {
    const models = await this.getSupportedModels();
    const modelNames = models.map(m => m.name || m);
    
    if (!modelNames.includes(model)) {
      throw new InvalidModelError(model, modelNames);
    }
  }

  /**
   * Fetch model pricing from server
   * @private
   */
  async _fetchModelPricing() {
    try {
      const response = await this.apiClient.get('/ai/pricing');
      this.modelPricing = response.data.pricing;
    } catch (error) {
      this.modelPricing = this._getDefaultPricing();
    }
  }

  /**
   * Estimate token count from text
   * @private
   */
  _estimateTokenCount(input) {
    if (Array.isArray(input)) {
      // For messages array
      return input.reduce((total, msg) => {
        const content = msg.content || '';
        return total + Math.ceil(content.length / 4);
      }, 0);
    } else if (typeof input === 'string') {
      // For plain text
      return Math.ceil(input.length / 4);
    }
    return 1000; // Default estimate
  }

  /**
   * Get default models list
   * @private
   */
  _getDefaultModels() {
    return [
      { name: 'gpt-4o', provider: 'openai' },
      { name: 'gpt-4o-mini', provider: 'openai' },
      { name: 'gpt-4-turbo', provider: 'openai' },
      { name: 'gpt-3.5-turbo', provider: 'openai' },
      { name: 'claude-3-opus', provider: 'anthropic' },
      { name: 'claude-3-sonnet', provider: 'anthropic' },
      { name: 'claude-3-haiku', provider: 'anthropic' },
      { name: 'gemini-pro', provider: 'google' },
      { name: 'gemini-1.5-pro', provider: 'google' }
    ];
  }

  /**
   * Get default pricing
   * @private
   */
  _getDefaultPricing() {
    return {
      'gpt-4o': { input: 0.03, output: 0.06 },
      'gpt-4o-mini': { input: 0.01, output: 0.02 },
      'gpt-4-turbo': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.005, output: 0.01 },
      'claude-3-opus': { input: 0.04, output: 0.08 },
      'claude-3-sonnet': { input: 0.02, output: 0.04 },
      'claude-3-haiku': { input: 0.008, output: 0.016 },
      'gemini-pro': { input: 0.01, output: 0.02 },
      'gemini-1.5-pro': { input: 0.02, output: 0.04 }
    };
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.supportedModels = null;
    this.modelPricing = null;
  }
}

module.exports = AIProxyClient;

// Made with Bob
