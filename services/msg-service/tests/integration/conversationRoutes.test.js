const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Conversation = require('../../models/conversationModel');

describe('Conversation Routes Integration Tests', () => {
  beforeAll(async () => {
    // Wait for database connection to be established
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
  });

  describe('GET /api/conversations/:userId', () => {
    test('should retrieve conversations for a user', async () => {
      const userId = 'user123';
      
      // Create conversations where user is sender and receiver
      const conversationsData = [
        {
          senderId: userId,
          receiverId: 'user456',
          lastMessage: 'Message as sender',
          updatedAt: new Date('2024-01-01T10:00:00Z')
        },
        {
          senderId: 'user789',
          receiverId: userId,
          lastMessage: 'Message as receiver',
          updatedAt: new Date('2024-01-01T11:00:00Z')
        },
        {
          senderId: 'user456',
          receiverId: 'user789',
          lastMessage: 'Message not involving user123',
          updatedAt: new Date('2024-01-01T12:00:00Z')
        }
      ];

      await Conversation.insertMany(conversationsData);

      const response = await request(app)
        .get(`/api/conversations/${userId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      
      // Should be sorted by updatedAt descending (most recent first)
      expect(response.body[0].lastMessage).toBe('Message as receiver');
      expect(response.body[1].lastMessage).toBe('Message as sender');

      // Verify user is involved in all returned conversations
      response.body.forEach(conversation => {
        expect(
          conversation.senderId === userId || conversation.receiverId === userId
        ).toBe(true);
      });
    });

    test('should return empty array for user with no conversations', async () => {
      const userId = 'user-with-no-conversations';

      const response = await request(app)
        .get(`/api/conversations/${userId}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    test('should sort conversations by most recent first', async () => {
      const userId = 'user123';
      
      const conversationsData = [
        {
          senderId: userId,
          receiverId: 'user1',
          lastMessage: 'Oldest conversation',
          updatedAt: new Date('2024-01-01T10:00:00Z')
        },
        {
          senderId: userId,
          receiverId: 'user2',
          lastMessage: 'Newest conversation',
          updatedAt: new Date('2024-01-01T12:00:00Z')
        },
        {
          senderId: userId,
          receiverId: 'user3',
          lastMessage: 'Middle conversation',
          updatedAt: new Date('2024-01-01T11:00:00Z')
        }
      ];

      await Conversation.insertMany(conversationsData);

      const response = await request(app)
        .get(`/api/conversations/${userId}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].lastMessage).toBe('Newest conversation');
      expect(response.body[1].lastMessage).toBe('Middle conversation');
      expect(response.body[2].lastMessage).toBe('Oldest conversation');
    });

    test('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/conversations/user123')
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGO_URI || global.__MONGO_URI__);
    });
  });

  describe('POST /api/conversations', () => {
    test('should create a new conversation', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.senderId).toBe(conversationData.senderId);
      expect(response.body.receiverId).toBe(conversationData.receiverId);
      expect(response.body.lastMessage).toBe('');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify conversation was saved to database
      const savedConversation = await Conversation.findById(response.body._id);
      expect(savedConversation).toBeTruthy();
      expect(savedConversation.senderId).toBe(conversationData.senderId);
      expect(savedConversation.receiverId).toBe(conversationData.receiverId);
    });

    test('should return existing conversation if it already exists', async () => {
      // Create an existing conversation
      const existingConversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Existing conversation'
      });

      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(200); // Should return 200, not 201 for existing

      expect(response.body._id).toBe(existingConversation._id.toString());
      expect(response.body.lastMessage).toBe('Existing conversation');
    });

    test('should find conversation regardless of sender/receiver order', async () => {
      // Create conversation with user123 as sender
      const existingConversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Original conversation'
      });

      // Try to create conversation with reversed roles
      const conversationData = {
        senderId: 'user456',
        receiverId: 'user123'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(200);

      expect(response.body._id).toBe(existingConversation._id.toString());
    });

    test('should handle missing senderId', async () => {
      const incompleteData = {
        receiverId: 'user456'
        // Missing senderId
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(incompleteData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing receiverId', async () => {
      const incompleteData = {
        senderId: 'user123'
        // Missing receiverId
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(incompleteData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should initialize default values for new conversation', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body.lastMessage).toBe('');
      expect(response.body.unreadCount).toEqual({
        senderId: 0,
        receiverId: 0
      });
      expect(response.body.updatedAt).toBeDefined();
    });
  });

  describe('GET /api/conversations/details/:id', () => {
    test('should retrieve conversation by ID', async () => {
      const conversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Test conversation',
        unreadCount: {
          senderId: 2,
          receiverId: 1
        }
      });

      const response = await request(app)
        .get(`/api/conversations/details/${conversation._id}`)
        .expect(200);

      expect(response.body._id).toBe(conversation._id.toString());
      expect(response.body.senderId).toBe('user123');
      expect(response.body.receiverId).toBe('user456');
      expect(response.body.lastMessage).toBe('Test conversation');
      expect(response.body.unreadCount.senderId).toBe(2);
      expect(response.body.unreadCount.receiverId).toBe(1);
    });

    test('should return 404 for non-existent conversation', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/conversations/details/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBe('Conversation not found');
    });

    test('should handle invalid conversation ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app)
        .get(`/api/conversations/details/${invalidId}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should return complete conversation object', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Complete conversation test',
        lastMessageId: new mongoose.Types.ObjectId(),
        unreadCount: {
          senderId: 3,
          receiverId: 5
        }
      };

      const conversation = await Conversation.create(conversationData);

      const response = await request(app)
        .get(`/api/conversations/details/${conversation._id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        _id: conversation._id.toString(),
        senderId: conversationData.senderId,
        receiverId: conversationData.receiverId,
        lastMessage: conversationData.lastMessage,
        lastMessageId: conversationData.lastMessageId.toString(),
        unreadCount: conversationData.unreadCount
      });
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('CORS and Headers', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/conversations/user123')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('should accept JSON content type', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const response = await request(app)
        .post('/api/conversations')
        .set('Content-Type', 'application/json')
        .send(conversationData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
    });
  });

  describe('Integration with Message Model', () => {
    test('should work with complete conversation and message flow', async () => {
      // Create conversation
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const createResponse = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(201);

      const conversationId = createResponse.body._id;

      // Send a message
      const messageData = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello from integration test',
        conversationId: conversationId
      };

      await request(app)
        .post('/api/message')
        .send(messageData)
        .expect(201);

      // Retrieve updated conversation
      const conversationResponse = await request(app)
        .get(`/api/conversations/details/${conversationId}`)
        .expect(200);

      expect(conversationResponse.body.lastMessage).toBe('Hello from integration test');

      // Retrieve messages
      const messagesResponse = await request(app)
        .get(`/api/message/${conversationId}`)
        .expect(200);

      expect(messagesResponse.body).toHaveLength(1);
      expect(messagesResponse.body[0].text).toBe('Hello from integration test');
    });
  });
});
