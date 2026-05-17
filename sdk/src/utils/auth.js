/**
 * Authentication utilities for WalletX SDK
 */

const { AuthenticationError } = require('./errors');

/**
 * Validate secret address format
 * @param {string} secretAddress - WalletX secret address (e.g., WX-A7B3C9D2)
 * @returns {boolean} - True if valid
 */
function validateSecretAddress(secretAddress) {
  if (!secretAddress || typeof secretAddress !== 'string') {
    return false;
  }
  
  // Format: WX-XXXXXXXX (8 alphanumeric characters after WX-)
  const pattern = /^WX-[A-Z0-9]{8}$/;
  return pattern.test(secretAddress);
}

/**
 * Parse authentication token from response
 * @param {Object} response - API response
 * @returns {string} - JWT token
 */
function parseAuthToken(response) {
  if (!response || !response.token) {
    throw new AuthenticationError('No token in response');
  }
  return response.token;
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    // Parse JWT payload (base64 decode middle part)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
function getTokenExpiration(token) {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Create authorization header
 * @param {string} token - JWT token
 * @returns {Object} - Headers object
 */
function createAuthHeader(token) {
  if (!token) {
    throw new AuthenticationError('No token provided');
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

module.exports = {
  validateSecretAddress,
  parseAuthToken,
  isTokenExpired,
  getTokenExpiration,
  createAuthHeader
};

// Made with Bob
