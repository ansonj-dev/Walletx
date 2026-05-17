const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authenticateBySecretAddress } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const aiProviderService = require('../services/aiProviderService');
const creditService = require('../services/creditService');
const Usage = require('../models/Usage');

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @desc    Universal AI chat endpoint - routes to appropriate provider
 * @access  Private (JWT or Secret Address)
 */
router.post(
  '/chat',
  aiLimiter,
  [
    body('model').notEmpty().withMessage('Model is required'),
    body('messages').isArray({ min: 1 }).withMessage('Messages array is required')
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { model, messages, secretAddress, options = {} } = req.body;

      // Authenticate by JWT or Secret Address
      let userId;
      if (req.headers.authorization) {
        // Use JWT authentication middleware
        await new Promise((resolve, reject) => {
          authenticate(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        userId = req.userId;
      } else if (secretAddress) {
        // Use Secret Address authentication
        await new Promise((resolve, reject) => {
          authenticateBySecretAddress(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        userId = req.userId;
      } else {
        return res.status(401).json({
          success: false,
          error: 'Authentication required. Provide JWT token or Secret Address.'
        });
      }

      // Estimate credit cost
      const messageLength = JSON.stringify(messages).length;
      const estimatedCost = aiProviderService.estimateCost(model, messageLength);

      // Check if user has sufficient credits
      const hasCredits = await creditService.hasCredits(userId, estimatedCost);
      if (!hasCredits) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          estimatedCost,
          message: 'Please recharge your account to continue using AI services'
        });
      }

      // Make AI request
      const aiResponse = await aiProviderService.chat(model, messages, options);

      // Deduct actual credits used
      await creditService.deductCredits(userId, aiResponse.creditsUsed, {
        model: aiResponse.model,
        inputTokens: aiResponse.usage.inputTokens,
        outputTokens: aiResponse.usage.outputTokens,
        totalTokens: aiResponse.usage.totalTokens
      });

      // Record usage for analytics
      await Usage.recordUsage({
        userId,
        model: aiResponse.model,
        provider: aiResponse.provider,
        inputTokens: aiResponse.usage.inputTokens,
        outputTokens: aiResponse.usage.outputTokens,
        creditsUsed: aiResponse.creditsUsed,
        requestDuration: aiResponse.duration,
        status: 'success',
        metadata: {
          ide: req.headers['x-ide'] || 'unknown',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const totalDuration = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          content: aiResponse.content,
          model: aiResponse.model,
          provider: aiResponse.provider,
          usage: aiResponse.usage,
          creditsUsed: aiResponse.creditsUsed,
          duration: totalDuration
        }
      });

    } catch (error) {
      console.error('AI chat error:', error);

      // Record failed usage
      if (req.userId) {
        await Usage.recordUsage({
          userId: req.userId,
          model: req.body.model || 'unknown',
          provider: 'unknown',
          inputTokens: 0,
          outputTokens: 0,
          creditsUsed: 0,
          requestDuration: Date.now() - startTime,
          status: 'error',
          errorMessage: error.message
        }).catch(err => console.error('Failed to record error usage:', err));
      }

      if (error.message.includes('Insufficient credits')) {
        return res.status(402).json({
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_CREDITS'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'AI request failed'
      });
    }
  }
);

/**
 * @route   GET /api/ai/models
 * @desc    Get available AI models
 * @access  Public
 */
router.get('/models', (req, res) => {
  try {
    const models = aiProviderService.getAvailableModels();

    res.json({
      success: true,
      data: models
    });

  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available models'
    });
  }
});

/**
 * @route   POST /api/ai/estimate
 * @desc    Estimate credit cost for a request
 * @access  Public
 */
router.post(
  '/estimate',
  [
    body('model').notEmpty().withMessage('Model is required'),
    body('messageLength').isInt({ min: 1 }).withMessage('Message length is required')
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { model, messageLength } = req.body;
      const estimatedCost = aiProviderService.estimateCost(model, messageLength);

      res.json({
        success: true,
        data: {
          model,
          estimatedCost,
          estimatedCostUSD: (estimatedCost / 100).toFixed(4)
        }
      });

    } catch (error) {
      console.error('Estimate cost error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to estimate cost'
      });
    }
  }
);

/**
 * @route   GET /api/ai/usage
 * @desc    Get user's AI usage statistics
 * @access  Private
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await Usage.getUserUsageStats(req.userId);
    const providerStats = await Usage.getProviderStats(req.userId, parseInt(days));
    const dailyTrend = await Usage.getDailyTrend(req.userId, 7);
    const topModels = await Usage.getTopModels(req.userId, 5);

    res.json({
      success: true,
      data: {
        overview: stats,
        byProvider: providerStats,
        dailyTrend,
        topModels
      }
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics'
    });
  }
});

module.exports = router;

// Made with Bob
