/**
 * WalletX SDK - Universal AI credit wallet for IDE integrations
 * @module @walletx/sdk
 */

const WalletXClient = require('./WalletXClient');
const CreditManager = require('./CreditManager');
const AIProxyClient = require('./AIProxyClient');
const ContextManager = require('./ContextManager');
const Storage = require('./utils/storage');
const errors = require('./utils/errors');
const auth = require('./utils/auth');

// Export main client as default
module.exports = WalletXClient;

// Export all components for advanced usage
module.exports.WalletXClient = WalletXClient;
module.exports.CreditManager = CreditManager;
module.exports.AIProxyClient = AIProxyClient;
module.exports.ContextManager = ContextManager;
module.exports.Storage = Storage;

// Export utilities
module.exports.errors = errors;
module.exports.auth = auth;

// Export error classes for convenience
module.exports.WalletXError = errors.WalletXError;
module.exports.InsufficientCreditsError = errors.InsufficientCreditsError;
module.exports.AuthenticationError = errors.AuthenticationError;
module.exports.NetworkError = errors.NetworkError;
module.exports.InvalidModelError = errors.InvalidModelError;
module.exports.InvalidConfigError = errors.InvalidConfigError;
module.exports.SnapshotError = errors.SnapshotError;
module.exports.RateLimitError = errors.RateLimitError;

// Version
module.exports.VERSION = '1.0.0';

// Made with Bob
