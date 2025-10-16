const mongoose = require('mongoose');
const { getUserConversations, createConversation, getConversation } = require('../../controllers/conversationController');
const Conversation = require('../../models/conversationModel');

// Mock the model
jest.mock('../../models/conversationModel');

describe('Conversation Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getUserConversations', () => {
    test('should retrieve conversations for a user', async () => {
      const userId = 'user123';
      req.params.userId = userId;

      const mockConversations = [
        {
          _id: new mongoose.Types.ObjectId(),
          senderId: userId,
          receiverId: 'user456',
          lastMessage: 'Hello from user123',
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            senderId: userId,
            receiverId: 'user456',
            lastMessage: 'Hello from user123',
            updatedAt: new Date()
          })
        },
        {
          _id: new mongoose.Types.ObjectId(),
          senderId: 'user789',
          receiverId: userId,
          lastMessage: 'Hello to user123',
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            senderId: 'user789',
            receiverId: userId,
            lastMessage: 'Hello to user123',
            updatedAt: new Date()
          })
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockConversations)
      };

      Conversation.find.mockReturnValue(mockQuery);

      await getUserConversations(req, res);

      expect(Conversation.find).toHaveBeenCalledWith({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ updatedAt: -1 });
      // Since the function enhances conversations with user details, we expect an array of enhanced conversations
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    test('should handle errors during conversation retrieval', async () => {
      const userId = 'user123';
      req.params.userId = userId;

      const error = new Error('Database query failed');
      const mockQuery = {
        sort: jest.fn().mockRejectedValue(error)
      };

      Conversation.find.mockReturnValue(mockQuery);

      await getUserConversations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should return empty array for user with no conversations', async () => {
      const userId = 'user123';
      req.params.userId = userId;

      const mockQuery = {
        sort: jest.fn().mockResolvedValue([])
      };

      Conversation.find.mockReturnValue(mockQuery);

      await getUserConversations(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('createConversation', () => {
    test('should return existing conversation if it exists', async () => {
      req.body = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const existingConversation = {
        _id: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Existing conversation',
        updatedAt: new Date()
      };

      Conversation.findOne.mockResolvedValue(existingConversation);

      await createConversation(req, res);

      expect(Conversation.findOne).toHaveBeenCalledWith({
        $or: [
          { senderId: 'user123', receiverId: 'user456' },
          { senderId: 'user456', receiverId: 'user123' }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(existingConversation);
      expect(res.status).not.toHaveBeenCalled(); // Should not set status for existing conversation
    });

    test('should create new conversation if it does not exist', async () => {
      req.body = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const newConversation = {
        _id: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: '',
        updatedAt: Date.now(),
        save: jest.fn().mockResolvedValue(true)
      };

      Conversation.findOne.mockResolvedValue(null);
      Conversation.mockImplementation(() => newConversation);

      await createConversation(req, res);

      expect(Conversation.findOne).toHaveBeenCalledWith({
        $or: [
          { senderId: 'user123', receiverId: 'user456' },
          { senderId: 'user456', receiverId: 'user123' }
        ]
      });
      expect(Conversation).toHaveBeenCalledWith({
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: '',
        updatedAt: expect.any(Number)
      });
      expect(newConversation.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newConversation);
    });

    test('should handle errors during conversation creation', async () => {
      req.body = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const error = new Error('Database save failed');
      Conversation.findOne.mockRejectedValue(error);

      await createConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should handle missing senderId or receiverId', async () => {
      req.body = {
        senderId: 'user123'
        // Missing receiverId
      };

      const error = new Error('receiverId is required');
      const newConversation = {
        save: jest.fn().mockRejectedValue(error)
      };

      Conversation.findOne.mockResolvedValue(null);
      Conversation.mockImplementation(() => newConversation);

      await createConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should find conversation regardless of sender/receiver order', async () => {
      req.body = {
        senderId: 'user456',
        receiverId: 'user123'
      };

      const existingConversation = {
        _id: new mongoose.Types.ObjectId(),
        senderId: 'user123', // Original order
        receiverId: 'user456',
        lastMessage: 'Existing conversation',
        updatedAt: new Date()
      };

      Conversation.findOne.mockResolvedValue(existingConversation);

      await createConversation(req, res);

      expect(Conversation.findOne).toHaveBeenCalledWith({
        $or: [
          { senderId: 'user456', receiverId: 'user123' },
          { senderId: 'user123', receiverId: 'user456' }
        ]
      });
      expect(res.json).toHaveBeenCalledWith(existingConversation);
    });
  });

  describe('getConversation', () => {
    test('should retrieve conversation by ID', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      const mockConversation = {
        _id: conversationId,
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Test conversation',
        updatedAt: new Date()
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      await getConversation(req, res);

      expect(Conversation.findById).toHaveBeenCalledWith(conversationId);
      expect(res.json).toHaveBeenCalledWith(mockConversation);
    });

    test('should return 404 for non-existent conversation', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      Conversation.findById.mockResolvedValue(null);

      await getConversation(req, res);

      expect(Conversation.findById).toHaveBeenCalledWith(conversationId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Conversation not found' });
    });

    test('should handle errors during conversation retrieval', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      const error = new Error('Database query failed');
      Conversation.findById.mockRejectedValue(error);

      await getConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should handle invalid conversation ID format', async () => {
      const invalidId = 'invalid-id';
      req.params.id = invalidId;

      const error = new Error('Cast to ObjectId failed');
      Conversation.findById.mockRejectedValue(error);

      await getConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
