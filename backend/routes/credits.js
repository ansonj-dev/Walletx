const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const creditService = require('../services/creditService');

const router = express.Router();

/**
 * @route   GET /api/credits/balance
 * @desc    Get user's credit balance
 * @access  Private
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.userId);

    res.json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance'
    });
  }
});

/**
 * @route   POST /api/credits/deduct
 * @desc    Deduct credits (used by AI proxy)
 * @access  Private
 */
router.post(
  '/deduct',
  authenticate,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('model').notEmpty().withMessage('Model is required'),
    body('inputTokens').isNumeric().withMessage('Input tokens must be a number'),
    body('outputTokens').isNumeric().withMessage('Output tokens must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { amount, model, inputTokens, outputTokens } = req.body;

      // Check if user has sufficient credits
      const hasCredits = await creditService.hasCredits(req.userId, amount);
      if (!hasCredits) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS'
        });
      }

      // Deduct credits
      const result = await creditService.deductCredits(req.userId, amount, {
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      });

      res.json({
        success: true,
        message: 'Credits deducted successfully',
        data: result
      });

    } catch (error) {
      console.error('Deduct credits error:', error);
      
      if (error.message === 'Insufficient credits') {
        return res.status(402).json({
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_CREDITS'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to deduct credits'
      });
    }
  }
);

/**
 * @route   GET /api/credits/history
 * @desc    Get transaction history
 * @access  Private
 */
router.get(
  '/history',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a positive number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      const history = await creditService.getHistory(req.userId, limit, skip);

      res.json({
        success: true,
        data: {
          transactions: history,
          count: history.length,
          limit,
          skip
        }
      });

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transaction history'
      });
    }
  }
);

/**
 * @route   GET /api/credits/stats
 * @desc    Get credit statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await creditService.getStats(req.userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * @route   POST /api/credits/check
 * @desc    Check if user has sufficient credits
 * @access  Private
 */
router.post(
  '/check',
  authenticate,
  [
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { amount } = req.body;
      const hasCredits = await creditService.hasCredits(req.userId, amount);

      res.json({
        success: true,
        data: {
          hasCredits,
          amount
        }
      });

    } catch (error) {
      console.error('Check credits error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check credits'
      });
    }
  }
);

module.exports = router;

// Made with Bob
