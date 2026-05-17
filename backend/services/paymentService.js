const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Payment Service
 * Handles payment processing for multiple payment gateways
 */
class PaymentService {
  constructor() {
    // Initialize Razorpay
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  /**
   * Create Stripe Payment Intent
   */
  async createStripePayment(amount, userId, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: 'usd',
        metadata: {
          userId: userId.toString(),
          type: 'credit_recharge',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Verify Stripe Webhook Signature
   */
  verifyStripeWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Create Razorpay Order
   */
  async createRazorpayOrder(amount, userId, metadata = {}) {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount, // Amount in paise (1 INR = 100 paise)
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          type: 'credit_recharge',
          ...metadata
        }
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Razorpay order failed: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
      const text = `${orderId}|${paymentId}`;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      return generated_signature === signature;
    } catch (error) {
      console.error('Razorpay signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify Crypto Payment (Mock Implementation)
   * In production, integrate with blockchain APIs
   */
  async verifyCryptoPayment(txHash, expectedAmount, walletAddress) {
    try {
      // Mock implementation for POC
      // In production, verify transaction on blockchain
      
      // Simulate blockchain verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock verification logic
      if (!txHash || txHash.length < 32) {
        throw new Error('Invalid transaction hash');
      }

      // In production, check:
      // 1. Transaction exists on blockchain
      // 2. Transaction is confirmed
      // 3. Amount matches expected amount
      // 4. Recipient address matches your wallet
      
      return {
        verified: true,
        txHash,
        amount: expectedAmount,
        confirmations: 6,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Crypto payment verification error:', error);
      throw new Error(`Crypto verification failed: ${error.message}`);
    }
  }

  /**
   * Get Stripe Payment Status
   */
  async getStripePaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Stripe payment status error:', error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Get Razorpay Payment Status
   */
  async getRazorpayPaymentStatus(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        orderId: payment.order_id
      };
    } catch (error) {
      console.error('Razorpay payment status error:', error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Process Refund (Stripe)
   */
  async processStripeRefund(paymentIntentId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount // If null, refunds full amount
      });

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Process Refund (Razorpay)
   */
  async processRazorpayRefund(paymentId, amount = null) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount // If null, refunds full amount
      });

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      };
    } catch (error) {
      console.error('Razorpay refund error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Convert currency (mock implementation)
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    // Mock conversion rates
    const rates = {
      'USD_INR': 83,
      'INR_USD': 0.012,
      'USD_USD': 1,
      'INR_INR': 1
    };

    const key = `${fromCurrency}_${toCurrency}`;
    const rate = rates[key] || 1;

    return Math.round(amount * rate);
  }
}

module.exports = new PaymentService();

// Made with Bob
