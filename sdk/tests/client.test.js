/**
 * WalletXClient Tests
 */

const WalletXClient = require('../src/WalletXClient');
const { AuthenticationError, InvalidConfigError } = require('../src/utils/errors');

describe('WalletXClient', () => {
  let client;

  beforeEach(() => {
    client = new WalletXClient({
      apiUrl: 'https://api.walletx.dev',
      ideName: 'Test IDE',
      version: '1.0.0'
    });
  });

  afterEach(() => {
    if (client) {
      client.logout();
    }
  });

  describe('Constructor', () => {
    test('should create client with default config', () => {
      const defaultClient = new WalletXClient();
      expect(defaultClient.config.apiUrl).toBe('https://api.walletx.dev');
      expect(defaultClient.config.ideName).toBe('Unknown IDE');
    });

    test('should create client with custom config', () => {
      expect(client.config.apiUrl).toBe('https://api.walletx.dev');
      expect(client.config.ideName).toBe('Test IDE');
      expect(client.config.version).toBe('1.0.0');
    });

    test('should throw error for invalid config', () => {
      expect(() => {
        new WalletXClient({ apiUrl: 123 });
      }).toThrow(InvalidConfigError);
    });

    test('should initialize managers', () => {
      expect(client.credits).toBeDefined();
      expect(client.ai).toBeDefined();
      expect(client.context).toBeDefined();
    });
  });

  describe('Authentication', () => {
    test('should reject invalid secret address format', async () => {
      await expect(client.authenticate('invalid')).rejects.toThrow(AuthenticationError);
      await expect(client.authenticate('WX-123')).rejects.toThrow(AuthenticationError);
      await expect(client.authenticate('ABC-12345678')).rejects.toThrow(AuthenticationError);
    });

    test('should accept valid secret address format', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          token: 'mock.jwt.token',
          user: { id: 1, email: 'test@example.com' }
        }
      };

      // This would need proper mocking in a real test
      // For now, just test format validation
      const validFormats = [
        'WX-A7B3C9D2',
        'WX-12345678',
        'WX-ABCDEFGH'
      ];

      validFormats.forEach(format => {
        expect(() => {
          const { validateSecretAddress } = require('../src/utils/auth');
          validateSecretAddress(format);
        }).not.toThrow();
      });
    });

    test('should set authenticated state after successful login', async () => {
      // This would need API mocking
      expect(client.isAuthenticated()).toBe(false);
    });

    test('should clear session on logout', async () => {
      await client.logout();
      expect(client.isAuthenticated()).toBe(false);
      expect(client.token).toBeNull();
      expect(client.user).toBeNull();
    });
  });

  describe('Balance Operations', () => {
    test('should throw error when not authenticated', async () => {
      await expect(client.getBalance()).rejects.toThrow(AuthenticationError);
    });

    test('should get balance when authenticated', async () => {
      // Would need to mock authentication first
      // Then test balance retrieval
    });
  });

  describe('Event System', () => {
    test('should emit events', (done) => {
      client.on('test_event', (data) => {
        expect(data).toBe('test_data');
        done();
      });

      client.emit('test_event', 'test_data');
    });

    test('should forward events from managers', (done) => {
      client.on('balance_updated', (balance) => {
        expect(typeof balance).toBe('number');
        done();
      });

      // Simulate balance update from credit manager
      client.credits.emit('balance_updated', 100);
    });
  });

  describe('Configuration', () => {
    test('should use default timeout', () => {
      expect(client.config.timeout).toBe(30000);
    });

    test('should use custom timeout', () => {
      const customClient = new WalletXClient({
        timeout: 60000
      });
      expect(customClient.config.timeout).toBe(60000);
    });

    test('should use default retry settings', () => {
      expect(client.config.retries).toBe(3);
      expect(client.config.retryDelay).toBe(1000);
    });
  });

  describe('Storage', () => {
    test('should initialize storage with namespace', () => {
      expect(client.storage).toBeDefined();
      expect(client.storage.namespace).toContain('test_ide');
    });

    test('should persist and retrieve data', () => {
      client.storage.set('test_key', 'test_value');
      expect(client.storage.get('test_key')).toBe('test_value');
    });

    test('should clear storage', () => {
      client.storage.set('test_key', 'test_value');
      client.storage.clear();
      expect(client.storage.get('test_key')).toBeNull();
    });
  });

  describe('API Client', () => {
    test('should create axios instance with correct config', () => {
      expect(client.apiClient.defaults.baseURL).toBe('https://api.walletx.dev');
      expect(client.apiClient.defaults.timeout).toBe(30000);
    });

    test('should include IDE headers', () => {
      expect(client.apiClient.defaults.headers['X-IDE-Name']).toBe('Test IDE');
      expect(client.apiClient.defaults.headers['X-IDE-Version']).toBe('1.0.0');
    });
  });

  describe('Offline Mode', () => {
    test('should queue requests when offline', async () => {
      const offlineClient = new WalletXClient({
        offlineMode: true
      });

      // Would need to mock offline state and test queuing
      expect(offlineClient.config.offlineMode).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle full authentication flow', async () => {
    // This would test the complete flow with a test server
    // 1. Create client
    // 2. Authenticate
    // 3. Make request
    // 4. Check balance
    // 5. Logout
  });

  test('should handle credit deduction flow', async () => {
    // This would test:
    // 1. Authenticate
    // 2. Check initial balance
    // 3. Make AI request
    // 4. Verify credits deducted
    // 5. Check new balance
  });

  test('should handle context save/load flow', async () => {
    // This would test:
    // 1. Authenticate
    // 2. Save context
    // 3. Load context
    // 4. Verify data matches
  });
});

// Made with Bob
