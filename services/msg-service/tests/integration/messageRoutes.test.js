const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Message = require('../../models/messageModel');
const Conversation = require('../../models/conversationModel');

describe('Message Routes Integration Tests', () => {
  describe('POST /api/message', () => {
    test('should create a new message and conversation', async () => {
      const messageData = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/message')
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.senderId).toBe(messageData.senderId);
      expect(response.body.receiverId).toBe(messageData.receiverId);
      expect(response.body.text).toBe(messageData.text);
      expect(response.body.status).toBe('sent');

      // Verify message was saved to database
      const savedMessage = await Message.findById(response.body._id);
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.text).toBe(messageData.text);

      // Verify conversation was created/updated
      const conversation = await Conversation.findById(messageData.conversationId);
      expect(conversation).toBeTruthy();
      expect(conversation.lastMessage).toBe(messageData.text);
    });

    test('should handle missing required fields', async () => {
      const incompleteMessageData = {
        senderId: 'user123',
        // Missing receiverId, text, and conversationId
      };

      const response = await request(app)
        .post('/api/message')
        .send(incompleteMessageData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should update existing conversation', async () => {
      // Create a conversation first
      const conversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Previous message'
      });

      const messageData = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'New message in existing conversation',
        conversationId: conversation._id
      };

      const response = await request(app)
        .post('/api/message')
        .send(messageData)
        .expect(201);

      expect(response.body.text).toBe(messageData.text);

      // Verify conversation was updated
      const updatedConversation = await Conversation.findById(conversation._id);
      expect(updatedConversation.lastMessage).toBe(messageData.text);
      expect(updatedConversation.updatedAt.getTime()).toBeGreaterThan(conversation.updatedAt.getTime());
    });
  });

  describe('GET /api/message/:id', () => {
    test('should retrieve messages for a conversation', async () => {
      // Create a conversation
      const conversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456'
      });

      // Create messages
      const messagesData = [
        {
          conversationId: conversation._id,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'First message',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          conversationId: conversation._id,
          senderId: 'user456',
          receiverId: 'user123',
          text: 'Second message',
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        {
          conversationId: conversation._id,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Third message',
          timestamp: new Date('2024-01-01T10:02:00Z')
        }
      ];

      await Message.insertMany(messagesData);

      const response = await request(app)
        .get(`/api/message/${conversation._id}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].text).toBe('First message'); // Should be sorted by timestamp
      expect(response.body[1].text).toBe('Second message');
      expect(response.body[2].text).toBe('Third message');

      // Verify all messages belong to the conversation
      response.body.forEach(message => {
        expect(message.conversationId).toBe(conversation._id.toString());
      });
    });

    test('should return empty array for conversation with no messages', async () => {
      const conversationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/message/${conversationId}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    test('should handle invalid conversation ID', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/api/message/${invalidId}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should return messages in chronological order', async () => {
      const conversation = await Conversation.create({
        senderId: 'user123',
        receiverId: 'user456'
      });

      // Create messages with timestamps out of order
      const messagesData = [
        {
          conversationId: conversation._id,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Third message chronologically',
          timestamp: new Date('2024-01-01T10:02:00Z')
        },
        {
          conversationId: conversation._id,
          senderId: 'user456',
          receiverId: 'user123',
          text: 'First message chronologically',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          conversationId: conversation._id,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Second message chronologically',
          timestamp: new Date('2024-01-01T10:01:00Z')
        }
      ];

      await Message.insertMany(messagesData);

      const response = await request(app)
        .get(`/api/message/${conversation._id}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].text).toBe('First message chronologically');
      expect(response.body[1].text).toBe('Second message chronologically');
      expect(response.body[2].text).toBe('Third message chronologically');
    });
  });

  describe('PATCH /api/message/:id/read', () => {
    test('should mark message as read', async () => {
      // Create a message
      const message = await Message.create({
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Test message',
        status: 'sent'
      });

      const response = await request(app)
        .patch(`/api/message/${message._id}/read`)
        .expect(200);

      expect(response.body.message).toBe('Message marked as read');

      // Verify message status was updated
      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.status).toBe('read');
    });

    test('should handle non-existent message ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/message/${nonExistentId}/read`)
        .expect(200);

      expect(response.body.message).toBe('Message marked as read');
    });

    test('should handle invalid message ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .patch(`/api/message/${invalidId}/read`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should update message from any status to read', async () => {
      const statuses = ['sent', 'delivered'];
      
      for (const status of statuses) {
        const message = await Message.create({
          conversationId: new mongoose.Types.ObjectId(),
          senderId: 'user123',
          receiverId: 'user456',
          text: `Message with ${status} status`,
          status: status
        });

        await request(app)
          .patch(`/api/message/${message._id}/read`)
          .expect(200);

        const updatedMessage = await Message.findById(message._id);
        expect(updatedMessage.status).toBe('read');
      }
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'message-service');
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily close the database connection
      await mongoose.connection.close();

      const messageData = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Test message',
        conversationId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/message')
        .send(messageData)
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGO_URI || global.__MONGO_URI__);
    });
  });
});
