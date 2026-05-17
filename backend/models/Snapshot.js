const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Snapshot Schema
 * Stores IDE context snapshots for cross-IDE portability
 */
const snapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  snapshotId: {
    type: String,
    required: true,
    unique: true
  },
  secretCode: {
    type: String,
    required: true,
    unique: true
  },
  ide: {
    type: String,
    enum: ['cursor', 'windsurf', 'copilot', 'antigravity', 'vscode', 'other'],
    required: true
  },
  context: {
    chatHistory: [{
      role: String,
      content: String,
      timestamp: Date
    }],
    activeFiles: [{
      path: String,
      content: String,
      language: String
    }],
    taskState: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    modelUsed: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 0
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
snapshotSchema.index({ userId: 1, createdAt: -1 });
snapshotSchema.index({ snapshotId: 1 });
snapshotSchema.index({ secretCode: 1 });

/**
 * Generate unique snapshot ID
 */
snapshotSchema.statics.generateSnapshotId = function() {
  return `snap_${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Generate secret code for snapshot sharing
 */
snapshotSchema.statics.generateSecretCode = function() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

/**
 * Create a new snapshot
 */
snapshotSchema.statics.createSnapshot = async function(userId, name, ide, context) {
  const snapshotId = this.generateSnapshotId();
  const secretCode = this.generateSecretCode();
  
  // Calculate approximate size
  const size = JSON.stringify(context).length;
  
  return await this.create({
    userId,
    name,
    snapshotId,
    secretCode,
    ide,
    context,
    size
  });
};

/**
 * Get snapshot by ID or secret code
 */
snapshotSchema.statics.getSnapshot = async function(identifier) {
  // Try to find by snapshotId first, then by secretCode
  let snapshot = await this.findOne({ snapshotId: identifier });
  
  if (!snapshot) {
    snapshot = await this.findOne({ secretCode: identifier });
  }
  
  if (snapshot) {
    snapshot.accessCount += 1;
    snapshot.lastAccessed = new Date();
    await snapshot.save();
  }
  
  return snapshot;
};

/**
 * Get all snapshots for a user
 */
snapshotSchema.statics.getUserSnapshots = async function(userId, limit = 50) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-context') // Exclude large context field for list view
    .lean();
};

/**
 * Delete snapshot
 */
snapshotSchema.statics.deleteSnapshot = async function(snapshotId, userId) {
  return await this.findOneAndDelete({ snapshotId, userId });
};

/**
 * Get snapshot statistics for a user
 */
snapshotSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$ide',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    }
  ]);
  
  return {
    totalSnapshots: stats.reduce((sum, s) => sum + s.count, 0),
    totalSize: stats.reduce((sum, s) => sum + s.totalSize, 0),
    byIDE: stats
  };
};

const Snapshot = mongoose.model('Snapshot', snapshotSchema);

module.exports = Snapshot;

// Made with Bob
