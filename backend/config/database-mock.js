/**
 * Mock Database for Testing Without MongoDB
 * This allows WalletX to run without MongoDB installation
 * Data is stored in memory and will be lost on restart
 */

class MockDatabase {
  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.snapshots = new Map();
    this.usage = new Map();
    this.connected = false;
  }

  async connect() {
    console.log('📦 Using Mock Database (In-Memory Storage)');
    console.log('⚠️  Data will be lost on server restart');
    console.log('💡 Install MongoDB for persistent storage');
    this.connected = true;
    return true;
  }

  async disconnect() {
    this.connected = false;
    return true;
  }

  isConnected() {
    return this.connected;
  }

  // User operations
  async createUser(userData) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      _id: id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserBySecretAddress(secretAddress) {
    for (const user of this.users.values()) {
      if (user.secretAddress === secretAddress) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  // Transaction operations
  async createTransaction(transactionData) {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = {
      _id: id,
      ...transactionData,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async findTransactionsByUserId(userId, limit = 10) {
    const userTransactions = [];
    for (const txn of this.transactions.values()) {
      if (txn.userId === userId) {
        userTransactions.push(txn);
      }
    }
    return userTransactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // Snapshot operations
  async createSnapshot(snapshotData) {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snapshot = {
      _id: id,
      ...snapshotData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  async findSnapshotsByUserId(userId) {
    const userSnapshots = [];
    for (const snap of this.snapshots.values()) {
      if (snap.userId === userId) {
        userSnapshots.push(snap);
      }
    }
    return userSnapshots.sort((a, b) => b.createdAt - a.createdAt);
  }

  async findSnapshotById(id) {
    return this.snapshots.get(id) || null;
  }

  async deleteSnapshot(id) {
    return this.snapshots.delete(id);
  }

  // Usage operations
  async createUsage(usageData) {
    const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const usage = {
      _id: id,
      ...usageData,
      createdAt: new Date()
    };
    this.usage.set(id, usage);
    return usage;
  }

  async findUsageByUserId(userId, limit = 10) {
    const userUsage = [];
    for (const use of this.usage.values()) {
      if (use.userId === userId) {
        userUsage.push(use);
      }
    }
    return userUsage
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // Stats
  getStats() {
    return {
      users: this.users.size,
      transactions: this.transactions.size,
      snapshots: this.snapshots.size,
      usage: this.usage.size
    };
  }
}

// Create singleton instance
const mockDB = new MockDatabase();

module.exports = mockDB;

// Made with Bob
