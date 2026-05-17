/**
 * AI Model Pricing Configuration
 * Prices are per 1,000 tokens (input and output)
 * All prices in USD cents (100 cents = $1)
 */

const MODEL_PRICING = {
  // OpenAI Models
  'gpt-4o': {
    input: 0.5,    // $0.005 per 1K tokens = 0.5 cents
    output: 1.5,   // $0.015 per 1K tokens = 1.5 cents
    provider: 'openai',
    displayName: 'GPT-4o'
  },
  'gpt-4-turbo': {
    input: 1.0,
    output: 3.0,
    provider: 'openai',
    displayName: 'GPT-4 Turbo'
  },
  'gpt-3.5-turbo': {
    input: 0.05,
    output: 0.15,
    provider: 'openai',
    displayName: 'GPT-3.5 Turbo'
  },

  // Anthropic Models
  'claude-sonnet': {
    input: 0.3,    // $0.003 per 1K tokens = 0.3 cents
    output: 1.5,   // $0.015 per 1K tokens = 1.5 cents
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    apiModel: 'claude-3-5-sonnet-20241022'
  },
  'claude-opus': {
    input: 1.5,
    output: 7.5,
    provider: 'anthropic',
    displayName: 'Claude 3 Opus',
    apiModel: 'claude-3-opus-20240229'
  },
  'claude-haiku': {
    input: 0.025,
    output: 0.125,
    provider: 'anthropic',
    displayName: 'Claude 3 Haiku',
    apiModel: 'claude-3-haiku-20240307'
  },

  // IBM Watsonx Models
  'granite': {
    input: 0.2,    // $0.002 per 1K tokens = 0.2 cents
    output: 0.8,   // $0.008 per 1K tokens = 0.8 cents
    provider: 'ibm',
    displayName: 'IBM Granite',
    apiModel: 'ibm/granite-13b-chat-v2'
  },
  'granite-34b': {
    input: 0.4,
    output: 1.6,
    provider: 'ibm',
    displayName: 'IBM Granite 34B',
    apiModel: 'ibm/granite-34b-code-instruct'
  },

  // Meta Llama Models (via Together AI)
  'llama-3.3': {
    input: 0.1,    // $0.001 per 1K tokens = 0.1 cents
    output: 0.2,   // $0.002 per 1K tokens = 0.2 cents
    provider: 'together',
    displayName: 'Llama 3.3 70B',
    apiModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
  },
  'llama-3.1': {
    input: 0.09,
    output: 0.18,
    provider: 'together',
    displayName: 'Llama 3.1 70B',
    apiModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
  }
};

/**
 * Calculate credit cost for a given model and token usage
 * @param {string} modelName - Model identifier
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Cost in credits (cents)
 */
function calculateCreditCost(modelName, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[modelName];
  
  if (!pricing) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  // Calculate cost: (tokens / 1000) * price_per_1k
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  
  // Round to 2 decimal places (cents)
  return Math.round((inputCost + outputCost) * 100) / 100;
}

/**
 * Get all available models grouped by provider
 * @returns {Object} Models grouped by provider
 */
function getAvailableModels() {
  const grouped = {};
  
  Object.entries(MODEL_PRICING).forEach(([key, value]) => {
    if (!grouped[value.provider]) {
      grouped[value.provider] = [];
    }
    grouped[value.provider].push({
      id: key,
      name: value.displayName,
      inputPrice: value.input,
      outputPrice: value.output
    });
  });
  
  return grouped;
}

/**
 * Get model configuration by name
 * @param {string} modelName - Model identifier
 * @returns {Object|null} Model configuration or null
 */
function getModelConfig(modelName) {
  return MODEL_PRICING[modelName] || null;
}

module.exports = {
  MODEL_PRICING,
  calculateCreditCost,
  getAvailableModels,
  getModelConfig
};

// Made with Bob
