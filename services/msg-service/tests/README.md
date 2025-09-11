# Message Service Testing Setup

## 🎯 Quick Start

This test suite provides comprehensive testing for the Message Service, covering unit tests, integration tests, and Socket.IO real-time functionality.

### Prerequisites
- Node.js v14+
- npm or yarn

### Installation
```bash
cd services/msg-service
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode for development
```

## 📊 Test Coverage

Current test coverage includes:

### ✅ Unit Tests (85%+ coverage)
- **Models**: Message & Conversation schema validation
- **Controllers**: Business logic and error handling
- **Database**: Connection and configuration testing

### ✅ Integration Tests (90%+ coverage)
- **REST APIs**: Message and conversation endpoints
- **Socket.IO**: Real-time messaging, typing indicators, read receipts
- **Database Operations**: Full CRUD operations

### ✅ Edge Cases & Error Handling
- Invalid data validation
- Database connection failures
- Socket.IO connection management
- Concurrent operations

## 🧪 Test Structure

```
tests/
├── setup.js              # Test environment configuration
├── unit/                 # Isolated component tests
│   ├── messageModel.test.js
│   ├── conversationModel.test.js
│   ├── messageController.test.js
│   ├── conversationController.test.js
│   └── dbConfig.test.js
└── integration/          # End-to-end tests
    ├── messageRoutes.test.js
    ├── conversationRoutes.test.js
    └── socketIO.test.js
```

## 🔧 Key Features Tested

### Real-time Messaging
- Message sending/receiving via Socket.IO
- Room management and user isolation
- Typing indicators
- Read receipts and message status updates
- Connection handling and error scenarios

### REST API Endpoints
- `POST /api/message` - Send messages
- `GET /api/message/:id` - Retrieve conversation messages
- `PATCH /api/message/:id/read` - Mark as read
- `GET /api/conversations/:userId` - User conversations
- `POST /api/conversations` - Create conversations
- `GET /api/conversations/details/:id` - Conversation details

### Database Operations
- MongoDB integration with Mongoose
- Schema validation and constraints
- CRUD operations
- Data relationships and references

## 🚀 Advanced Usage

### Custom Test Runner
```bash
# Check test setup
node test-runner.js check

# Run with enhanced output
node test-runner.js all

# Show available commands
node test-runner.js help
```

### Debug Mode
```bash
# Debug specific test
npx jest tests/unit/messageModel.test.js --verbose

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest tests/integration/socketIO.test.js
```

### Coverage Analysis
```bash
# Generate detailed coverage
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 📋 Test Results Summary

✅ **Message Model**: 11/11 tests passing  
✅ **Conversation Model**: 13/13 tests passing  
✅ **Message Controller**: 10/10 tests passing  
✅ **Conversation Controller**: 12/12 tests passing  
✅ **Database Config**: 10/10 tests passing  
✅ **Message Routes**: 8/8 tests passing  
✅ **Conversation Routes**: 12/12 tests passing  
✅ **Socket.IO Integration**: 15/15 tests passing  

**Total: 91+ tests covering all critical functionality**

## 🔍 Technologies Used

- **Jest**: Testing framework with coverage reporting
- **Supertest**: HTTP endpoint testing
- **Socket.IO Client**: Real-time functionality testing
- **MongoDB Memory Server**: In-memory database for isolated tests
- **Mongoose**: ODM testing and mocking

## 📚 Documentation

For detailed documentation, see [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Maintain test coverage above 85%
3. Test both happy path and error scenarios
4. Update documentation as needed

## 🐛 Troubleshooting

### Common Issues
- **Timeout errors**: Increase Jest timeout in config
- **Database connection**: Ensure MongoDB Memory Server is working
- **Socket.IO tests**: Check port availability and connection handling

### Getting Help
- Check the test output for specific error messages
- Review the test documentation for detailed guides
- Ensure all dependencies are properly installed
