const mongoose = require('mongoose');

/**
 * Transaction Schema
 * Records all credit transactions (recharges, deductions, refunds)
 */
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['recharge', 'deduction', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    // For recharges
    paymentMethod: String,
    paymentId: String,
    orderId: String,
    
    // For deductions
    model: String,
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number,
    
    // For bonuses
    bonusMultiplier: Number,
    originalAmount: Number,
    
    // General
    ipAddress: String,
    userAgent: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

/**
 * Create a recharge transaction
 */
transactionSchema.statics.createRecharge = async function(userId, amount, paymentDetails, balanceBefore, balanceAfter) {
  return await this.create({
    userId,
    type: 'recharge',
    amount,
    balanceBefore,
    balanceAfter,
    description: `Credit recharge via ${paymentDetails.method}`,
    metadata: {
      paymentMethod: paymentDetails.method,
      paymentId: paymentDetails.paymentId,
      orderId: paymentDetails.orderId,
      bonusMultiplier: paymentDetails.bonusMultiplier,
      originalAmount: paymentDetails.originalAmount
    },
    status: 'completed'
  });
};

/**
 * Create a deduction transaction
 */
transactionSchema.statics.createDeduction = async function(userId, amount, usageDetails, balanceBefore, balanceAfter) {
  return await this.create({
    userId,
    type: 'deduction',
    amount,
    balanceBefore,
    balanceAfter,
    description: `AI usage: ${usageDetails.model}`,
    metadata: {
      model: usageDetails.model,
      inputTokens: usageDetails.inputTokens,
      outputTokens: usageDetails.outputTokens,
      totalTokens: usageDetails.totalTokens
    },
    status: 'completed'
  });
};

/**
 * Get transaction history for a user
 */
transactionSchema.statics.getUserHistory = async function(userId, limit = 50, skip = 0) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

/**
 * Get transaction statistics for a user
 */
transactionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    totalRecharged: 0,
    totalSpent: 0,
    rechargeCount: 0,
    usageCount: 0
  };
  
  stats.forEach(stat => {
    if (stat._id === 'recharge') {
      result.totalRecharged = stat.total;
      result.rechargeCount = stat.count;
    } else if (stat._id === 'deduction') {
      result.totalSpent = stat.total;
      result.usageCount = stat.count;
    }
  });
  
  return result;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

// Made with Bob
