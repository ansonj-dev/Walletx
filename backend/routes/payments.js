const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const paymentService = require('../services/paymentService');
const creditService = require('../services/creditService');

const router = express.Router();

/**
 * @route   POST /api/payments/stripe/create
 * @desc    Create Stripe payment intent
 * @access  Private
 */
router.post(
  '/stripe/create',
  authenticate,
  paymentLimiter,
  [
    body('amount').isInt({ min: 500 }).withMessage('Minimum amount is 500 credits ($5)')
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

      // Validate recharge amount
      creditService.validateRechargeAmount(amount);

      // Create Stripe payment intent
      const paymentIntent = await paymentService.createStripePayment(
        amount,
        req.userId,
        { email: req.user.email }
      );

      res.json({
        success: true,
        data: paymentIntent
      });

    } catch (error) {
      console.error('Stripe payment creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create payment'
      });
    }
  }
);

/**
 * @route   POST /api/payments/stripe/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe webhook)
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook signature
    const event = paymentService.verifyStripeWebhook(req.body, signature);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const amount = paymentIntent.amount;

        // Add credits to user account
        await creditService.addCredits(userId, amount, {
          method: 'stripe',
          paymentId: paymentIntent.id,
          orderId: paymentIntent.id,
          applyBonus: true
        });

        console.log(`✅ Payment succeeded: ${paymentIntent.id} - ${amount} credits added to user ${userId}`);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook error'
    });
  }
});

/**
 * @route   POST /api/payments/razorpay/create
 * @desc    Create Razorpay order
 * @access  Private
 */
router.post(
  '/razorpay/create',
  authenticate,
  paymentLimiter,
  [
    body('amount').isInt({ min: 500 }).withMessage('Minimum amount is 500 credits')
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

      // Validate recharge amount
      creditService.validateRechargeAmount(amount);

      // Convert USD cents to INR paise (1 USD = 83 INR, 1 INR = 100 paise)
      const amountInPaise = paymentService.convertCurrency(amount, 'USD', 'INR') * 100;

      // Create Razorpay order
      const order = await paymentService.createRazorpayOrder(
        amountInPaise,
        req.userId,
        { email: req.user.email, creditsAmount: amount }
      );

      res.json({
        success: true,
        data: {
          ...order,
          key: process.env.RAZORPAY_KEY_ID,
          creditsAmount: amount
        }
      });

    } catch (error) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create order'
      });
    }
  }
);

/**
 * @route   POST /api/payments/razorpay/verify
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post(
  '/razorpay/verify',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('amount').isInt({ min: 500 }).withMessage('Amount is required')
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

      const { orderId, paymentId, signature, amount } = req.body;

      // Verify payment signature
      const isValid = paymentService.verifyRazorpaySignature(orderId, paymentId, signature);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature'
        });
      }

      // Add credits to user account
      const result = await creditService.addCredits(req.userId, amount, {
        method: 'razorpay',
        paymentId,
        orderId,
        applyBonus: true
      });

      res.json({
        success: true,
        message: 'Payment verified and credits added',
        data: result
      });

    } catch (error) {
      console.error('Razorpay verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Payment verification failed'
      });
    }
  }
);

/**
 * @route   POST /api/payments/crypto/verify
 * @desc    Verify crypto payment (Mock implementation)
 * @access  Private
 */
router.post(
  '/crypto/verify',
  authenticate,
  paymentLimiter,
  [
    body('txHash').notEmpty().withMessage('Transaction hash is required'),
    body('amount').isInt({ min: 500 }).withMessage('Amount is required'),
    body('walletAddress').notEmpty().withMessage('Wallet address is required')
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

      const { txHash, amount, walletAddress } = req.body;

      // Validate recharge amount
      creditService.validateRechargeAmount(amount);

      // Verify crypto transaction (mock implementation)
      const verification = await paymentService.verifyCryptoPayment(
        txHash,
        amount,
        walletAddress
      );

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          error: 'Transaction verification failed'
        });
      }

      // Add credits to user account
      const result = await creditService.addCredits(req.userId, amount, {
        method: 'crypto',
        paymentId: txHash,
        orderId: txHash,
        applyBonus: true
      });

      res.json({
        success: true,
        message: 'Crypto payment verified and credits added',
        data: {
          ...result,
          verification
        }
      });

    } catch (error) {
      console.error('Crypto verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Crypto payment verification failed'
      });
    }
  }
);

/**
 * @route   GET /api/payments/status/:paymentId
 * @desc    Get payment status
 * @access  Private
 */
router.get('/status/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { method } = req.query; // 'stripe' or 'razorpay'

    let status;
    if (method === 'stripe') {
      status = await paymentService.getStripePaymentStatus(paymentId);
    } else if (method === 'razorpay') {
      status = await paymentService.getRazorpayPaymentStatus(paymentId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment method must be specified (stripe or razorpay)'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
});

module.exports = router;

// Made with Bob
