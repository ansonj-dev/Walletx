const mongoose = require('mongoose');
const mockDB = require('./database-mock');

/**
 * Database connection configuration
 * Supports both MongoDB and Mock (in-memory) database
 */
const connectDB = async () => {
  // Check if mock mode is enabled
  if (process.env.DATABASE_MODE === 'mock') {
    console.log('🔧 Running in MOCK DATABASE mode (in-memory storage)');
    console.log('⚠️  Data will be lost on server restart');
    console.log('💡 Install MongoDB and set DATABASE_MODE=mongodb for persistence');
    await mockDB.connect();
    return mockDB;
  }

  // Connect to real MongoDB
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('💡 Tip: Set DATABASE_MODE=mock in .env to run without MongoDB');
    process.exit(1);
  }
};

module.exports = connectDB;

// Made with Bob
