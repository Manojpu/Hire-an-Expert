const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Mock axios for all tests
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      firebase_uid: 'test_uid',
      name: 'Test User',
      email: 'test@example.com',
      profile_image_url: 'http://example.com/image.jpg'
    }
  }))
}));

// Setup before all tests
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Start in-memory MongoDB instance with higher timeout
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: Math.floor(Math.random() * 10000) + 40000 // Random port to avoid conflicts
    }
  });
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
}, 60000); // 60 second timeout

// Cleanup after each test
afterEach(async () => {
  // Clear all collections only if connected
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (error) {
        console.warn(`Failed to clear collection ${key}:`, error.message);
      }
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  // Stop in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Increase timeout for database operations
jest.setTimeout(60000);
