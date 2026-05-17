const mongoose = require('mongoose');

/**
 * Usage Schema
 * Tracks AI model usage for analytics and monitoring
 */
const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  model: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['openai', 'anthropic', 'ibm', 'together'],
    required: true
  },
  inputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  outputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  totalTokens: {
    type: Number,
    required: true
  },
  creditsUsed: {
    type: Number,
    required: true
  },
  requestDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  metadata: {
    ide: String,
    ipAddress: String,
    userAgent: String,
    requestId: String
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
usageSchema.index({ userId: 1, createdAt: -1 });
usageSchema.index({ model: 1, createdAt: -1 });
usageSchema.index({ provider: 1, status: 1 });

/**
 * Record AI usage
 */
usageSchema.statics.recordUsage = async function(data) {
  return await this.create({
    userId: data.userId,
    model: data.model,
    provider: data.provider,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    totalTokens: data.inputTokens + data.outputTokens,
    creditsUsed: data.creditsUsed,
    requestDuration: data.requestDuration,
    status: data.status || 'success',
    errorMessage: data.errorMessage,
    metadata: data.metadata || {}
  });
};

/**
 * Get usage statistics for a user
 */
usageSchema.statics.getUserUsageStats = async function(userId, startDate, endDate) {
  const match = { userId: mongoose.Types.ObjectId(userId), status: 'success' };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$model',
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCredits: { $sum: '$creditsUsed' },
        avgDuration: { $avg: '$requestDuration' }
      }
    },
    { $sort: { totalRequests: -1 } }
  ]);
  
  return stats;
};

/**
 * Get usage by provider
 */
usageSchema.statics.getProviderStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: '$provider',
        requests: { $sum: 1 },
        tokens: { $sum: '$totalTokens' },
        credits: { $sum: '$creditsUsed' }
      }
    }
  ]);
};

/**
 * Get daily usage trend
 */
usageSchema.statics.getDailyTrend = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        requests: { $sum: 1 },
        tokens: { $sum: '$totalTokens' },
        credits: { $sum: '$creditsUsed' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

/**
 * Get most used models
 */
usageSchema.statics.getTopModels = async function(userId, limit = 5) {
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'success'
      }
    },
    {
      $group: {
        _id: '$model',
        count: { $sum: 1 },
        totalCredits: { $sum: '$creditsUsed' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

const Usage = mongoose.model('Usage', usageSchema);

module.exports = Usage;

// Made with Bob
