# Message Service Test Suite

This document provides comprehensive information about the test suite for the Message Service, including setup, execution, and maintenance guidelines.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Setup and Installation](#setup-and-installation)
4. [Running Tests](#running-tests)
5. [Test Coverage](#test-coverage)
6. [Test Categories](#test-categories)
7. [Writing New Tests](#writing-new-tests)
8. [Troubleshooting](#troubleshooting)

## Overview

The Message Service test suite provides comprehensive testing for:
- Real-time messaging functionality via Socket.IO
- RESTful API endpoints for messages and conversations
- Database models and operations
- Error handling and edge cases
- Integration between different components

### Technologies Used

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **Socket.IO Client**: For testing real-time functionality
- **MongoDB Memory Server**: In-memory database for testing
- **Mongoose**: ODM for MongoDB

## Test Structure

```
tests/
├── setup.js                 # Test configuration and database setup
├── unit/                    # Unit tests
│   ├── messageModel.test.js      # Message model tests
│   ├── conversationModel.test.js # Conversation model tests
│   ├── messageController.test.js # Message controller tests
│   ├── conversationController.test.js # Conversation controller tests
│   └── dbConfig.test.js          # Database configuration tests
└── integration/             # Integration tests
    ├── messageRoutes.test.js     # Message API endpoint tests
    ├── conversationRoutes.test.js # Conversation API endpoint tests
    └── socketIO.test.js          # Real-time messaging tests
```

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB (for integration tests, or use in-memory database)

### Installation

1. Install dependencies:
```bash
cd services/msg-service
npm install
```

2. Install test dependencies:
```bash
npm install --save-dev jest supertest socket.io-client mongodb-memory-server @types/jest
```

3. Verify installation:
```bash
npm run test:check
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

### Advanced Options

```bash
# Run specific test file
npx jest tests/unit/messageModel.test.js

# Run tests matching a pattern
npx jest --testNamePattern="should create"

# Run tests with verbose output
npx jest --verbose

# Run tests and generate coverage for specific files
npx jest --coverage --collectCoverageFrom="controllers/**/*.js"
```

### Custom Test Runner

Use the custom test runner for enhanced features:

```bash
# Check test setup and dependencies
node test-runner.js check

# Run tests with colored output and progress
c

# Show help
node test-runner.js help
```

## Test Coverage

### Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Displayed in terminal
- **LCOV Format**: `coverage/lcov.info`

### Coverage Targets

- **Unit Tests**: Aim for 90%+ coverage
- **Integration Tests**: Focus on critical user flows
- **Overall Coverage**: Target 85%+ for the entire service

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage

# Open HTML coverage report (Windows)
start coverage/lcov-report/index.html

# Open HTML coverage report (macOS)
open coverage/lcov-report/index.html

# Open HTML coverage report (Linux)
xdg-open coverage/lcov-report/index.html
```

## Test Categories

### Unit Tests

**Purpose**: Test individual components in isolation

#### Model Tests (`messageModel.test.js`, `conversationModel.test.js`)
- Schema validation
- Default values
- Required fields
- Data types
- Model methods

#### Controller Tests (`messageController.test.js`, `conversationController.test.js`)
- Business logic
- Request/response handling
- Error scenarios
- Database operations (mocked)

#### Configuration Tests (`dbConfig.test.js`)
- Database connection logic
- Error handling
- Environment variable handling

### Integration Tests

**Purpose**: Test component interactions and real-world scenarios

#### API Endpoint Tests (`messageRoutes.test.js`, `conversationRoutes.test.js`)
- HTTP request/response cycle
- Database operations
- Authentication (if implemented)
- Error responses
- Data validation

#### Real-time Tests (`socketIO.test.js`)
- Socket.IO connections
- Message broadcasting
- Room management
- Typing indicators
- Read receipts
- Error handling

## Writing New Tests

### Test File Naming Convention

- Unit tests: `[componentName].test.js`
- Integration tests: `[featureName].test.js`
- Place tests in appropriate directories (`unit/` or `integration/`)

### Unit Test Template

```javascript
const ComponentName = require('../../path/to/component');

describe('Component Name', () => {
  describe('Feature Group', () => {
    test('should perform specific action', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = ComponentName.method(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const app = require('../../app');

describe('API Endpoint', () => {
  test('should handle request correctly', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200);
      
    expect(response.body).toHaveProperty('id');
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Test Edge Cases**: Include boundary conditions and error scenarios
4. **Isolated Tests**: Ensure tests don't depend on each other
5. **Mock External Dependencies**: Use mocks for external services
6. **Clean Setup/Teardown**: Properly clean up after tests

### Socket.IO Test Template

```javascript
const Client = require('socket.io-client');

describe('Socket.IO Feature', () => {
  let clientSocket;
  
  beforeEach((done) => {
    clientSocket = new Client('http://localhost:port');
    clientSocket.on('connect', done);
  });
  
  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });
  
  test('should handle real-time event', (done) => {
    clientSocket.on('eventName', (data) => {
      expect(data).toHaveProperty('field');
      done();
    });
    
    clientSocket.emit('triggerEvent', { test: 'data' });
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Tests Timeout
```
Error: Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solution**: Increase timeout or check for unresolved promises
```javascript
jest.setTimeout(30000); // Increase timeout
```

#### 2. Database Connection Issues
```
Error: MongooseError: Operation `messages.insertOne()` buffering timed out
```

**Solution**: Ensure MongoDB Memory Server is properly set up
```javascript
// In setup.js
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});
```

#### 3. Socket.IO Connection Problems
```
Error: xhr poll error
```

**Solution**: Ensure server is running and ports are available
```javascript
// Check if server is listening
httpServer.listen(() => {
  const port = httpServer.address().port;
  clientSocket = new Client(`http://localhost:${port}`);
});
```

#### 4. Jest Not Finding Tests
```
No tests found, exiting with code 1
```

**Solution**: Check test file naming and configuration
```javascript
// In jest.config.js
testMatch: [
  '**/tests/**/*.test.js',
  '**/tests/**/*.spec.js'
]
```

### Debugging Tests

#### Enable Debug Output
```bash
DEBUG=* npm test
```

#### Run Single Test File
```bash
npx jest tests/unit/messageModel.test.js --verbose
```

#### Use Node.js Debugger
```bash
node --inspect-brk node_modules/.bin/jest tests/unit/messageModel.test.js
```

### Performance Issues

#### Slow Tests
- Check for unresolved promises
- Reduce database operations
- Use mocks for external services
- Optimize setup/teardown

#### Memory Leaks
- Ensure proper cleanup in `afterEach`
- Close database connections
- Disconnect Socket.IO clients

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Message Service

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: |
        cd services/msg-service
        npm ci
        
    - name: Run tests
      run: |
        cd services/msg-service
        npm run test:coverage
        
    - name: Upload coverage
      uses: codecov/codecov-action@v2
      with:
        file: ./services/msg-service/coverage/lcov.info
```

## Test Data Management

### Test Fixtures

Create reusable test data:

```javascript
// tests/fixtures/messages.js
module.exports = {
  validMessage: {
    senderId: 'user123',
    receiverId: 'user456',
    text: 'Test message',
    conversationId: '507f1f77bcf86cd799439011'
  },
  
  invalidMessage: {
    senderId: 'user123',
    // Missing required fields
  }
};
```

### Factory Functions

```javascript
// tests/factories/messageFactory.js
const mongoose = require('mongoose');

function createMessage(overrides = {}) {
  return {
    conversationId: new mongoose.Types.ObjectId(),
    senderId: 'user123',
    receiverId: 'user456',
    text: 'Default test message',
    ...overrides
  };
}

module.exports = { createMessage };
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep test dependencies up to date
2. **Review Coverage**: Regularly check coverage reports
3. **Performance Monitoring**: Monitor test execution times
4. **Clean Up**: Remove obsolete tests and update existing ones

### Test Review Checklist

- [ ] Test names are descriptive
- [ ] Tests are independent
- [ ] Edge cases are covered
- [ ] Error scenarios are tested
- [ ] Performance considerations are addressed
- [ ] Documentation is updated

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Socket.IO Testing Guide](https://socket.io/docs/v4/testing/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Mongoose Testing](https://mongoosejs.com/docs/jest.html)
