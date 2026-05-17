/**
 * ContextManager - Manages IDE context snapshots
 */

const { SnapshotError } = require('./utils/errors');

class ContextManager {
  constructor(apiClient, storage) {
    this.apiClient = apiClient;
    this.storage = storage;
    this.cachedSnapshots = null;
  }

  /**
   * Save current context as a snapshot
   * @param {string} name - Snapshot name
   * @param {Object} context - Context data to save
   * @returns {Promise<Object>}
   */
  async save(name, context) {
    if (!name || typeof name !== 'string') {
      throw new SnapshotError('Snapshot name is required');
    }

    if (!context || typeof context !== 'object') {
      throw new SnapshotError('Context data is required');
    }

    try {
      const response = await this.apiClient.post('/snapshots', {
        name,
        context: JSON.stringify(context),
        timestamp: new Date().toISOString(),
        metadata: {
          size: JSON.stringify(context).length,
          keys: Object.keys(context)
        }
      });

      // Invalidate cache
      this.cachedSnapshots = null;

      // Cache locally for offline access
      this._cacheSnapshot(response.data.snapshot);

      return response.data.snapshot;
    } catch (error) {
      throw new SnapshotError(`Failed to save snapshot: ${error.message}`);
    }
  }

  /**
   * Load a snapshot by ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>}
   */
  async load(snapshotId) {
    if (!snapshotId) {
      throw new SnapshotError('Snapshot ID is required');
    }

    try {
      // Try to load from server
      const response = await this.apiClient.get(`/snapshots/${snapshotId}`);
      const snapshot = response.data.snapshot;
      
      // Parse context
      snapshot.context = JSON.parse(snapshot.context);
      
      // Cache locally
      this._cacheSnapshot(snapshot);
      
      return snapshot;
    } catch (error) {
      // Try to load from local cache
      const cached = this._getCachedSnapshot(snapshotId);
      if (cached) {
        return cached;
      }
      throw new SnapshotError(`Failed to load snapshot: ${error.message}`);
    }
  }

  /**
   * List all snapshots
   * @param {Object} options - List options
   * @returns {Promise<Array>}
   */
  async list(options = {}) {
    const { limit = 50, offset = 0, sortBy = 'createdAt', order = 'desc' } = options;

    try {
      const response = await this.apiClient.get('/snapshots', {
        params: { limit, offset, sortBy, order }
      });

      this.cachedSnapshots = response.data.snapshots;
      return this.cachedSnapshots;
    } catch (error) {
      // Return cached snapshots if available
      if (this.cachedSnapshots) {
        return this.cachedSnapshots;
      }
      throw new SnapshotError(`Failed to list snapshots: ${error.message}`);
    }
  }

  /**
   * Delete a snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<boolean>}
   */
  async delete(snapshotId) {
    if (!snapshotId) {
      throw new SnapshotError('Snapshot ID is required');
    }

    try {
      await this.apiClient.delete(`/snapshots/${snapshotId}`);
      
      // Invalidate cache
      this.cachedSnapshots = null;
      this._removeCachedSnapshot(snapshotId);
      
      return true;
    } catch (error) {
      throw new SnapshotError(`Failed to delete snapshot: ${error.message}`);
    }
  }

  /**
   * Import snapshot from another IDE using secret code
   * @param {string} secretCode - Import secret code
   * @param {string} snapshotId - Snapshot ID to import
   * @returns {Promise<Object>}
   */
  async import(secretCode, snapshotId) {
    if (!secretCode || !snapshotId) {
      throw new SnapshotError('Secret code and snapshot ID are required');
    }

    try {
      const response = await this.apiClient.post('/snapshots/import', {
        secretCode,
        snapshotId
      });

      const snapshot = response.data.snapshot;
      snapshot.context = JSON.parse(snapshot.context);
      
      // Cache locally
      this._cacheSnapshot(snapshot);
      
      return snapshot;
    } catch (error) {
      throw new SnapshotError(`Failed to import snapshot: ${error.message}`);
    }
  }

  /**
   * Export snapshot for sharing
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>}
   */
  async export(snapshotId) {
    if (!snapshotId) {
      throw new SnapshotError('Snapshot ID is required');
    }

    try {
      const response = await this.apiClient.post(`/snapshots/${snapshotId}/export`);
      
      return {
        secretCode: response.data.secretCode,
        snapshotId: response.data.snapshotId,
        expiresAt: response.data.expiresAt
      };
    } catch (error) {
      throw new SnapshotError(`Failed to export snapshot: ${error.message}`);
    }
  }

  /**
   * Update snapshot metadata
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  async update(snapshotId, updates) {
    if (!snapshotId) {
      throw new SnapshotError('Snapshot ID is required');
    }

    try {
      const response = await this.apiClient.patch(`/snapshots/${snapshotId}`, updates);
      
      // Invalidate cache
      this.cachedSnapshots = null;
      
      return response.data.snapshot;
    } catch (error) {
      throw new SnapshotError(`Failed to update snapshot: ${error.message}`);
    }
  }

  /**
   * Search snapshots
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    if (!query) {
      return this.list();
    }

    try {
      const response = await this.apiClient.get('/snapshots/search', {
        params: { q: query }
      });

      return response.data.snapshots;
    } catch (error) {
      throw new SnapshotError(`Failed to search snapshots: ${error.message}`);
    }
  }

  /**
   * Get snapshot statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const response = await this.apiClient.get('/snapshots/stats');
      return response.data.stats;
    } catch (error) {
      return {
        total: 0,
        totalSize: 0,
        lastCreated: null
      };
    }
  }

  /**
   * Cache snapshot locally
   * @private
   */
  _cacheSnapshot(snapshot) {
    const cacheKey = `snapshot_${snapshot.id}`;
    this.storage.set(cacheKey, {
      ...snapshot,
      cachedAt: Date.now()
    });
  }

  /**
   * Get cached snapshot
   * @private
   */
  _getCachedSnapshot(snapshotId) {
    const cacheKey = `snapshot_${snapshotId}`;
    const cached = this.storage.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache is still valid (24 hours)
    const isValid = Date.now() - cached.cachedAt < 24 * 60 * 60 * 1000;
    
    return isValid ? cached : null;
  }

  /**
   * Remove cached snapshot
   * @private
   */
  _removeCachedSnapshot(snapshotId) {
    const cacheKey = `snapshot_${snapshotId}`;
    this.storage.remove(cacheKey);
  }

  /**
   * Clear all cached snapshots
   */
  clearCache() {
    this.cachedSnapshots = null;
    
    // Clear all snapshot cache entries
    const keys = this.storage.keys();
    keys.forEach(key => {
      if (key.startsWith('snapshot_')) {
        this.storage.remove(key);
      }
    });
  }

  /**
   * Get latest snapshot
   * @returns {Promise<Object|null>}
   */
  async getLatest() {
    const snapshots = await this.list({ limit: 1, sortBy: 'createdAt', order: 'desc' });
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Duplicate a snapshot
   * @param {string} snapshotId - Snapshot ID to duplicate
   * @param {string} newName - Name for the duplicate
   * @returns {Promise<Object>}
   */
  async duplicate(snapshotId, newName) {
    const snapshot = await this.load(snapshotId);
    return this.save(newName || `${snapshot.name} (copy)`, snapshot.context);
  }
}

module.exports = ContextManager;

// Made with Bob
