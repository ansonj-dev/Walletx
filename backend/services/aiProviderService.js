const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { calculateCreditCost, getModelConfig } = require('../config/models-pricing');

/**
 * AI Provider Service
 * Routes requests to appropriate AI providers and handles responses
 */
class AIProviderService {
  constructor() {
    // Initialize API clients
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Together AI for Llama models
    this.togetherApiKey = process.env.TOGETHER_API_KEY;
  }

  /**
   * Route chat request to appropriate provider
   */
  async chat(model, messages, options = {}) {
    const modelConfig = getModelConfig(model);
    
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const startTime = Date.now();
    let response;
    let usage;

    try {
      switch (modelConfig.provider) {
        case 'openai':
          response = await this.chatOpenAI(model, messages, options);
          usage = response.usage;
          break;
        
        case 'anthropic':
          response = await this.chatAnthropic(modelConfig.apiModel, messages, options);
          usage = response.usage;
          break;
        
        case 'ibm':
          response = await this.chatIBM(modelConfig.apiModel, messages, options);
          usage = response.usage;
          break;
        
        case 'together':
          response = await this.chatTogether(modelConfig.apiModel, messages, options);
          usage = response.usage;
          break;
        
        default:
          throw new Error(`Provider ${modelConfig.provider} not implemented`);
      }

      const duration = Date.now() - startTime;

      // Calculate credit cost
      const creditsUsed = calculateCreditCost(
        model,
        usage.inputTokens,
        usage.outputTokens
      );

      return {
        content: response.content,
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.inputTokens + usage.outputTokens
        },
        creditsUsed,
        duration,
        model,
        provider: modelConfig.provider
      };

    } catch (error) {
      console.error(`AI Provider Error (${model}):`, error.message);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  /**
   * OpenAI Chat Completion
   */
  async chatOpenAI(model, messages, options) {
    const completion = await this.openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      ...options
    });

    return {
      content: completion.choices[0].message.content,
      usage: {
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens
      }
    };
  }

  /**
   * Anthropic Chat Completion
   */
  async chatAnthropic(model, messages, options) {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: model,
      max_tokens: options.maxTokens || 2000,
      system: systemMessage?.content || '',
      messages: userMessages,
      temperature: options.temperature || 0.7,
      ...options
    });

    return {
      content: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  }

  /**
   * IBM Watsonx Chat Completion
   */
  async chatIBM(model, messages, options) {
    // Mock implementation for POC
    // In production, use @ibm-cloud/watsonx-ai SDK
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResponse = "This is a mock response from IBM Granite. In production, this would call the IBM Watsonx API.";
    const inputTokens = JSON.stringify(messages).length / 4; // Rough estimate
    const outputTokens = mockResponse.length / 4;

    return {
      content: mockResponse,
      usage: {
        inputTokens: Math.round(inputTokens),
        outputTokens: Math.round(outputTokens)
      }
    };
  }

  /**
   * Together AI Chat Completion (for Llama models)
   */
  async chatTogether(model, messages, options) {
    // Using fetch for Together AI API
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens
      }
    };
  }

  /**
   * Estimate credit cost before making request
   */
  estimateCost(model, messageLength) {
    const modelConfig = getModelConfig(model);
    
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Rough estimation: 1 token ≈ 4 characters
    const estimatedInputTokens = Math.ceil(messageLength / 4);
    const estimatedOutputTokens = 500; // Average response length

    return calculateCreditCost(model, estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    const { getAvailableModels } = require('../config/models-pricing');
    return getAvailableModels();
  }
}

module.exports = new AIProviderService();

// Made with Bob
