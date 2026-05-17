const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { snapshotLimiter } = require('../middleware/rateLimit');
const Snapshot = require('../models/Snapshot');

const router = express.Router();

/**
 * @route   POST /api/snapshots/save
 * @desc    Save IDE context snapshot
 * @access  Private
 */
router.post(
  '/save',
  authenticate,
  snapshotLimiter,
  [
    body('name').notEmpty().trim().withMessage('Snapshot name is required'),
    body('ide').isIn(['cursor', 'windsurf', 'copilot', 'antigravity', 'vscode', 'other']).withMessage('Valid IDE is required'),
    body('context').isObject().withMessage('Context object is required')
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

      const { name, ide, context } = req.body;

      // Create snapshot
      const snapshot = await Snapshot.createSnapshot(
        req.userId,
        name,
        ide,
        context
      );

      res.status(201).json({
        success: true,
        message: 'Snapshot saved successfully',
        data: {
          snapshotId: snapshot.snapshotId,
          secretCode: snapshot.secretCode,
          name: snapshot.name,
          ide: snapshot.ide,
          size: snapshot.size,
          createdAt: snapshot.createdAt
        }
      });

    } catch (error) {
      console.error('Save snapshot error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save snapshot'
      });
    }
  }
);

/**
 * @route   GET /api/snapshots/list
 * @desc    Get all snapshots for current user
 * @access  Private
 */
router.get(
  '/list',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

      const snapshots = await Snapshot.getUserSnapshots(req.userId, limit);

      res.json({
        success: true,
        data: {
          snapshots,
          count: snapshots.length
        }
      });

    } catch (error) {
      console.error('List snapshots error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list snapshots'
      });
    }
  }
);

/**
 * @route   GET /api/snapshots/:id
 * @desc    Get snapshot by ID or secret code
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await Snapshot.getSnapshot(id);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Snapshot not found'
      });
    }

    // Check if user owns this snapshot
    if (snapshot.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        snapshotId: snapshot.snapshotId,
        name: snapshot.name,
        ide: snapshot.ide,
        context: snapshot.context,
        size: snapshot.size,
        accessCount: snapshot.accessCount,
        createdAt: snapshot.createdAt,
        lastAccessed: snapshot.lastAccessed
      }
    });

  } catch (error) {
    console.error('Get snapshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get snapshot'
    });
  }
});

/**
 * @route   POST /api/snapshots/import
 * @desc    Import snapshot by secret code (cross-IDE)
 * @access  Private
 */
router.post(
  '/import',
  authenticate,
  [
    body('secretCode').notEmpty().withMessage('Secret code is required')
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

      const { secretCode } = req.body;

      const snapshot = await Snapshot.getSnapshot(secretCode);

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: 'Invalid secret code'
        });
      }

      // Check if user owns this snapshot
      if (snapshot.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'This snapshot belongs to a different user'
        });
      }

      res.json({
        success: true,
        message: 'Snapshot imported successfully',
        data: {
          snapshotId: snapshot.snapshotId,
          name: snapshot.name,
          ide: snapshot.ide,
          context: snapshot.context,
          createdAt: snapshot.createdAt
        }
      });

    } catch (error) {
      console.error('Import snapshot error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import snapshot'
      });
    }
  }
);

/**
 * @route   DELETE /api/snapshots/:id
 * @desc    Delete snapshot
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Snapshot.deleteSnapshot(id, req.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Snapshot not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Snapshot deleted successfully'
    });

  } catch (error) {
    console.error('Delete snapshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete snapshot'
    });
  }
});

/**
 * @route   GET /api/snapshots/stats/overview
 * @desc    Get snapshot statistics for user
 * @access  Private
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const stats = await Snapshot.getUserStats(req.userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get snapshot stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get snapshot statistics'
    });
  }
});

/**
 * @route   PUT /api/snapshots/:id
 * @desc    Update snapshot name
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  [
    body('name').notEmpty().trim().withMessage('Snapshot name is required')
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

      const { id } = req.params;
      const { name } = req.body;

      const snapshot = await Snapshot.findOne({ snapshotId: id, userId: req.userId });

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: 'Snapshot not found'
        });
      }

      snapshot.name = name;
      await snapshot.save();

      res.json({
        success: true,
        message: 'Snapshot updated successfully',
        data: {
          snapshotId: snapshot.snapshotId,
          name: snapshot.name
        }
      });

    } catch (error) {
      console.error('Update snapshot error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update snapshot'
      });
    }
  }
);

module.exports = router;

// Made with Bob
