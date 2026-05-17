/**
 * CreditManager Tests
 */

const CreditManager = require('../src/CreditManager');
const { InsufficientCreditsError } = require('../src/utils/errors');

describe('CreditManager', () => {
  let creditManager;
  let mockApiClient;
  let mockStorage;

  beforeEach(() => {
    // Mock API client
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn()
    };

    // Mock storage
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    };

    creditManager = new CreditManager(mockApiClient, mockStorage);
  });

  describe('Balance Operations', () => {
    test('should fetch balance from API', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { balance: 100 }
      });

      const balance = await creditManager.getBalance();
      
      expect(balance).toBe(100);
      expect(mockApiClient.get).toHaveBeenCalledWith('/credits/balance');
    });

    test('should cache balance', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { balance: 100 }
      });

      await creditManager.getBalance();
      
      expect(mockStorage.set).toHaveBeenCalledWith('balance', {
        amount: 100,
        timestamp: expect.any(Number)
      });
    });

    test('should use cached balance when available', async () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = Date.now();

      const balance = await creditManager.getBalance();
      
      expect(balance).toBe(100);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    test('should refresh balance when forced', async () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = Date.now();

      mockApiClient.get.mockResolvedValue({
        data: { balance: 150 }
      });

      const balance = await creditManager.getBalance(true);
      
      expect(balance).toBe(150);
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    test('should use cached balance on API error', async () => {
      mockStorage.get.mockReturnValue({
        amount: 100,
        timestamp: Date.now()
      });

      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const balance = await creditManager.refreshBalance();
      
      expect(balance).toBe(100);
    });
  });

  describe('Balance Checking', () => {
    test('should return true when balance is sufficient', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { balance: 100 }
      });

      const canAfford = await creditManager.checkBalance(50);
      
      expect(canAfford).toBe(true);
    });

    test('should return false when balance is insufficient', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { balance: 30 }
      });

      const canAfford = await creditManager.checkBalance(50);
      
      expect(canAfford).toBe(false);
    });

    test('should check balance without amount', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { balance: 100 }
      });

      const canAfford = await creditManager.checkBalance();
      
      expect(canAfford).toBe(true);
    });
  });

  describe('Cost Estimation', () => {
    test('should estimate cost from API', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { estimatedCost: 5 }
      });

      const cost = await creditManager.estimateCost('gpt-4o', 1000);
      
      expect(cost).toBe(5);
      expect(mockApiClient.post).toHaveBeenCalledWith('/credits/estimate', {
        model: 'gpt-4o',
        tokenCount: 1000
      });
    });

    test('should use local estimation on API error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API error'));

      const cost = await creditManager.estimateCost('gpt-4o', 1000);
      
      expect(cost).toBeGreaterThan(0);
    });

    test('should estimate different models correctly', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Use local'));

      const gpt4Cost = await creditManager.estimateCost('gpt-4o', 1000);
      const gpt35Cost = await creditManager.estimateCost('gpt-3.5-turbo', 1000);
      
      expect(gpt4Cost).toBeGreaterThan(gpt35Cost);
    });
  });

  describe('Credit Deduction', () => {
    test('should deduct credits successfully', async () => {
      creditManager.balance = 100;

      mockApiClient.post.mockResolvedValue({
        data: {
          newBalance: 90,
          transaction: { id: 1, amount: -10 }
        }
      });

      const result = await creditManager.deduct(10, 'Test deduction');
      
      expect(result.newBalance).toBe(90);
      expect(creditManager.balance).toBe(90);
    });

    test('should throw error when insufficient credits', async () => {
      creditManager.balance = 5;
      creditManager.lastUpdate = Date.now();

      await expect(
        creditManager.deduct(10, 'Test deduction')
      ).rejects.toThrow(InsufficientCreditsError);
    });

    test('should emit events on successful deduction', async () => {
      creditManager.balance = 100;

      mockApiClient.post.mockResolvedValue({
        data: {
          newBalance: 90,
          transaction: { id: 1, amount: -10 }
        }
      });

      const deductedSpy = jest.fn();
      const balanceSpy = jest.fn();

      creditManager.on('credits_deducted', deductedSpy);
      creditManager.on('balance_updated', balanceSpy);

      await creditManager.deduct(10, 'Test');

      expect(deductedSpy).toHaveBeenCalled();
      expect(balanceSpy).toHaveBeenCalledWith(90);
    });

    test('should emit event on insufficient credits', async () => {
      creditManager.balance = 5;
      creditManager.lastUpdate = Date.now();

      const insufficientSpy = jest.fn();
      creditManager.on('insufficient_credits', insufficientSpy);

      try {
        await creditManager.deduct(10, 'Test');
      } catch (error) {
        // Expected
      }

      expect(insufficientSpy).toHaveBeenCalled();
    });
  });

  describe('Transaction History', () => {
    test('should fetch transaction history', async () => {
      const mockHistory = [
        { id: 1, amount: -10, type: 'deduction' },
        { id: 2, amount: 50, type: 'recharge' }
      ];

      mockApiClient.get.mockResolvedValue({
        data: { transactions: mockHistory }
      });

      const history = await creditManager.getHistory(50);
      
      expect(history).toEqual(mockHistory);
      expect(mockApiClient.get).toHaveBeenCalledWith('/credits/history', {
        params: { limit: 50, offset: 0 }
      });
    });

    test('should handle pagination', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { transactions: [] }
      });

      await creditManager.getHistory(25, 50);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/credits/history', {
        params: { limit: 25, offset: 50 }
      });
    });

    test('should return empty array on error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API error'));

      const history = await creditManager.getHistory();
      
      expect(history).toEqual([]);
    });
  });

  describe('Subscriptions', () => {
    test('should subscribe to balance changes', () => {
      const callback = jest.fn();
      
      const unsubscribe = creditManager.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('should call subscriber on balance update', () => {
      const callback = jest.fn();
      
      creditManager.subscribe(callback);
      creditManager.balance = 100;
      creditManager._notifySubscribers(100);
      
      expect(callback).toHaveBeenCalledWith(100);
    });

    test('should unsubscribe correctly', () => {
      const callback = jest.fn();
      
      const unsubscribe = creditManager.subscribe(callback);
      unsubscribe();
      
      creditManager._notifySubscribers(100);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should call subscriber immediately with current balance', () => {
      creditManager.balance = 100;
      const callback = jest.fn();
      
      creditManager.subscribe(callback);
      
      expect(callback).toHaveBeenCalledWith(100);
    });
  });

  describe('Cache Management', () => {
    test('should get cached balance', () => {
      creditManager.balance = 100;
      
      expect(creditManager.getCachedBalance()).toBe(100);
    });

    test('should return null when no cached balance', () => {
      expect(creditManager.getCachedBalance()).toBeNull();
    });

    test('should clear cache', () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = Date.now();
      
      creditManager.clearCache();
      
      expect(creditManager.balance).toBeNull();
      expect(creditManager.lastUpdate).toBeNull();
      expect(mockStorage.remove).toHaveBeenCalledWith('balance');
    });
  });

  describe('Refresh Logic', () => {
    test('should refresh when balance is null', () => {
      creditManager.balance = null;
      
      expect(creditManager._shouldRefresh()).toBe(true);
    });

    test('should refresh when lastUpdate is null', () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = null;
      
      expect(creditManager._shouldRefresh()).toBe(true);
    });

    test('should refresh when cache is old', () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      
      expect(creditManager._shouldRefresh()).toBe(true);
    });

    test('should not refresh when cache is fresh', () => {
      creditManager.balance = 100;
      creditManager.lastUpdate = Date.now() - (2 * 60 * 1000); // 2 minutes ago
      
      expect(creditManager._shouldRefresh()).toBe(false);
    });
  });
});

// Made with Bob
