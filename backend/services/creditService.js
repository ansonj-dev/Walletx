const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Credit Management Service
 * Handles all credit-related operations
 */
class CreditService {
  /**
   * Get user's credit balance
   */
  async getBalance(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      balance: user.creditBalance,
      bonusMultiplier: user.bonusMultiplier,
      hasReceivedFirstRechargeBonus: user.hasReceivedFirstRechargeBonus
    };
  }

  /**
   * Add credits to user account
   */
  async addCredits(userId, amount, paymentDetails) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.creditBalance;
    
    // Apply bonus multiplier for first recharge
    const applyBonus = !user.hasReceivedFirstRechargeBonus && paymentDetails.applyBonus;
    const creditsAdded = await user.addCredits(amount, applyBonus);
    
    const balanceAfter = user.creditBalance;

    // Create transaction record
    await Transaction.createRecharge(
      userId,
      creditsAdded,
      {
        method: paymentDetails.method,
        paymentId: paymentDetails.paymentId,
        orderId: paymentDetails.orderId,
        bonusMultiplier: applyBonus ? user.bonusMultiplier : 1,
        originalAmount: amount
      },
      balanceBefore,
      balanceAfter
    );

    return {
      creditsAdded,
      newBalance: balanceAfter,
      bonusApplied: applyBonus,
      bonusMultiplier: applyBonus ? 2 : 1
    };
  }

  /**
   * Deduct credits from user account
   */
  async deductCredits(userId, amount, usageDetails) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasCredits(amount)) {
      throw new Error('Insufficient credits');
    }

    const balanceBefore = user.creditBalance;
    const newBalance = await user.deductCredits(amount);

    // Create transaction record
    await Transaction.createDeduction(
      userId,
      amount,
      usageDetails,
      balanceBefore,
      newBalance
    );

    return {
      creditsDeducted: amount,
      newBalance
    };
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(userId, amount) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.hasCredits(amount);
  }

  /**
   * Get transaction history
   */
  async getHistory(userId, limit = 50, skip = 0) {
    return await Transaction.getUserHistory(userId, limit, skip);
  }

  /**
   * Get credit statistics
   */
  async getStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const transactionStats = await Transaction.getUserStats(userId);

    return {
      currentBalance: user.creditBalance,
      totalRecharged: transactionStats.totalRecharged,
      totalSpent: transactionStats.totalSpent,
      rechargeCount: transactionStats.rechargeCount,
      usageCount: transactionStats.usageCount,
      bonusMultiplier: user.bonusMultiplier,
      hasReceivedFirstRechargeBonus: user.hasReceivedFirstRechargeBonus
    };
  }

  /**
   * Validate recharge amount
   */
  validateRechargeAmount(amount) {
    const minAmount = parseInt(process.env.MIN_RECHARGE_AMOUNT) || 500; // 500 cents = $5
    
    if (amount < minAmount) {
      throw new Error(`Minimum recharge amount is ${minAmount} credits ($${minAmount / 100})`);
    }

    if (amount > 1000000) { // Max $10,000
      throw new Error('Maximum recharge amount is 1,000,000 credits ($10,000)');
    }

    return true;
  }

  /**
   * Calculate bonus credits for first recharge
   */
  calculateBonusCredits(amount, isFirstRecharge) {
    if (!isFirstRecharge) {
      return amount;
    }

    const multiplier = parseInt(process.env.BONUS_MULTIPLIER_FIRST_RECHARGE) || 2;
    return amount * multiplier;
  }
}

module.exports = new CreditService();

// Made with Bob
