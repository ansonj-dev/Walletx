/**
 * Custom error classes for WalletX SDK
 */

class WalletXError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class InsufficientCreditsError extends WalletXError {
  constructor(required, available) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CREDITS',
      { required, available }
    );
  }
}

class AuthenticationError extends WalletXError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
  }
}

class NetworkError extends WalletXError {
  constructor(message = 'Network request failed', originalError = null) {
    super(message, 'NETWORK_ERROR', { originalError });
  }
}

class InvalidModelError extends WalletXError {
  constructor(model, availableModels = []) {
    super(
      `Invalid model: ${model}. Available models: ${availableModels.join(', ')}`,
      'INVALID_MODEL',
      { model, availableModels }
    );
  }
}

class InvalidConfigError extends WalletXError {
  constructor(message = 'Invalid configuration') {
    super(message, 'INVALID_CONFIG');
  }
}

class SnapshotError extends WalletXError {
  constructor(message = 'Snapshot operation failed') {
    super(message, 'SNAPSHOT_ERROR');
  }
}

class RateLimitError extends WalletXError {
  constructor(retryAfter = null) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    );
  }
}

module.exports = {
  WalletXError,
  InsufficientCreditsError,
  AuthenticationError,
  NetworkError,
  InvalidModelError,
  InvalidConfigError,
  SnapshotError,
  RateLimitError
};

// Made with Bob
