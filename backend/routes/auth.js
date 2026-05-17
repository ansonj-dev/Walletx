const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Generate unique Secret Address
      let secretAddress;
      let isUnique = false;
      while (!isUnique) {
        secretAddress = User.generateSecretAddress();
        const existing = await User.findOne({ secretAddress });
        if (!existing) isUnique = true;
      }

      // Apply first recharge bonus multiplier
      const bonusMultiplier = parseInt(process.env.BONUS_MULTIPLIER_FIRST_RECHARGE) || 2;

      // Create new user
      const user = await User.create({
        email,
        password, // Will be hashed by pre-save hook
        name: name || email.split('@')[0],
        secretAddress,
        bonusMultiplier,
        creditBalance: 0,
        hasReceivedFirstRechargeBonus: false,
        totalRecharges: 0,
        totalSpent: 0,
        isActive: true,
        lastLogin: new Date()
      });

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId: user._id,
          email: user.email,
          name: user.name,
          secretAddress: user.secretAddress,
          creditBalance: user.creditBalance,
          bonusMultiplier: user.bonusMultiplier,
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('secretAddress').optional().isString(),
    body('password').notEmpty().withMessage('Password is required')
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

      const { email, secretAddress, password } = req.body;

      // User must provide either email or secretAddress
      if (!email && !secretAddress) {
        return res.status(400).json({
          success: false,
          error: 'Email or Secret Address is required'
        });
      }

      // Find user by email or secretAddress
      const user = email
        ? await User.findOne({ email })
        : await User.findOne({ secretAddress });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          userId: user._id,
          email: user.email,
          name: user.name,
          secretAddress: user.secretAddress,
          creditBalance: user.creditBalance,
          bonusMultiplier: user.bonusMultiplier,
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        secretAddress: user.secretAddress,
        creditBalance: user.creditBalance,
        bonusMultiplier: user.bonusMultiplier,
        hasReceivedFirstRechargeBonus: user.hasReceivedFirstRechargeBonus,
        totalRecharges: user.totalRecharges,
        totalSpent: user.totalSpent,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

/**
 * @route   GET /api/auth/secret/:secretAddress
 * @desc    Get user info by Secret Address (for cross-IDE login)
 * @access  Public (but requires valid secret address)
 */
router.get('/secret/:secretAddress', async (req, res) => {
  try {
    const { secretAddress } = req.params;

    const user = await User.findOne({ secretAddress }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid Secret Address'
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        secretAddress: user.secretAddress,
        creditBalance: user.creditBalance,
        exists: true
      }
    });

  } catch (error) {
    console.error('Secret address lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup Secret Address'
    });
  }
});

module.exports = router;

// Made with Bob
