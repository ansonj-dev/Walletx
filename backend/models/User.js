const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * User Schema
 * Stores user account information, authentication, and credit balance
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  secretAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  creditBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusMultiplier: {
    type: Number,
    default: 1,
    min: 1
  },
  hasReceivedFirstRechargeBonus: {
    type: Boolean,
    default: false
  },
  totalRecharges: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Generate unique Secret Address in format: WX-XXXXXXXX
 */
userSchema.statics.generateSecretAddress = function() {
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  return `WX-${uuid.slice(0, 8)}`;
};

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password for login
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get user object without sensitive data
 */
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/**
 * Add credits to user balance
 */
userSchema.methods.addCredits = async function(amount, applyBonus = false) {
  const creditsToAdd = applyBonus ? amount * this.bonusMultiplier : amount;
  this.creditBalance += creditsToAdd;
  this.totalRecharges += amount;
  
  // Apply first recharge bonus
  if (!this.hasReceivedFirstRechargeBonus && applyBonus) {
    this.hasReceivedFirstRechargeBonus = true;
    this.bonusMultiplier = 1; // Reset multiplier after first use
  }
  
  await this.save();
  return creditsToAdd;
};

/**
 * Deduct credits from user balance
 */
userSchema.methods.deductCredits = async function(amount) {
  if (this.creditBalance < amount) {
    throw new Error('Insufficient credits');
  }
  
  this.creditBalance -= amount;
  this.totalSpent += amount;
  await this.save();
  return this.creditBalance;
};

/**
 * Check if user has sufficient credits
 */
userSchema.methods.hasCredits = function(amount) {
  return this.creditBalance >= amount;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// Made with Bob
