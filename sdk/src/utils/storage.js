/**
 * Storage utilities for WalletX SDK
 * Provides a unified interface for localStorage (browser) and file storage (Node.js)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class Storage {
  constructor(namespace = 'walletx') {
    this.namespace = namespace;
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    
    if (!this.isBrowser) {
      // Node.js: Use file-based storage
      this.storageDir = path.join(os.homedir(), '.walletx');
      this.storageFile = path.join(this.storageDir, 'storage.json');
      this._ensureStorageDir();
    }
  }

  /**
   * Ensure storage directory exists (Node.js only)
   */
  _ensureStorageDir() {
    if (!this.isBrowser && !fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Get namespaced key
   */
  _getKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @returns {any} - Stored value or null
   */
  get(key) {
    const namespacedKey = this._getKey(key);
    
    if (this.isBrowser) {
      const value = localStorage.getItem(namespacedKey);
      return value ? JSON.parse(value) : null;
    } else {
      try {
        if (!fs.existsSync(this.storageFile)) {
          return null;
        }
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        return data[namespacedKey] || null;
      } catch (error) {
        return null;
      }
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  set(key, value) {
    const namespacedKey = this._getKey(key);
    
    if (this.isBrowser) {
      localStorage.setItem(namespacedKey, JSON.stringify(value));
    } else {
      try {
        let data = {};
        if (fs.existsSync(this.storageFile)) {
          data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        }
        data[namespacedKey] = value;
        fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Storage write error:', error);
      }
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    const namespacedKey = this._getKey(key);
    
    if (this.isBrowser) {
      localStorage.removeItem(namespacedKey);
    } else {
      try {
        if (!fs.existsSync(this.storageFile)) {
          return;
        }
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        delete data[namespacedKey];
        fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Storage remove error:', error);
      }
    }
  }

  /**
   * Clear all namespaced items
   */
  clear() {
    if (this.isBrowser) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.namespace}:`)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      try {
        if (!fs.existsSync(this.storageFile)) {
          return;
        }
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        const filteredData = {};
        Object.keys(data).forEach(key => {
          if (!key.startsWith(`${this.namespace}:`)) {
            filteredData[key] = data[key];
          }
        });
        fs.writeFileSync(this.storageFile, JSON.stringify(filteredData, null, 2));
      } catch (error) {
        console.error('Storage clear error:', error);
      }
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Get all keys in namespace
   * @returns {string[]}
   */
  keys() {
    const prefix = `${this.namespace}:`;
    
    if (this.isBrowser) {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    } else {
      try {
        if (!fs.existsSync(this.storageFile)) {
          return [];
        }
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        return Object.keys(data)
          .filter(key => key.startsWith(prefix))
          .map(key => key.substring(prefix.length));
      } catch (error) {
        return [];
      }
    }
  }
}

module.exports = Storage;

// Made with Bob
