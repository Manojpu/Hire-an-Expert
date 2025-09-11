const mongoose = require('mongoose');
const { sendMessage, getMessages, markAsRead } = require('../../controllers/messageContoller');
const Message = require('../../models/messageModel');
const Conversation = require('../../models/conversationModel');

// Mock the models
jest.mock('../../models/messageModel');
jest.mock('../../models/conversationModel');

describe('Message Controller', () => {
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

  describe('sendMessage', () => {
    test('should send message with existing conversation', async () => {
      const mockConversationId = new mongoose.Types.ObjectId();
      const mockMessageId = new mongoose.Types.ObjectId();
      
      req.body = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: mockConversationId
      };

      const mockConversation = {
        _id: mockConversationId,
        senderId: 'user123',
        receiverId: 'user456',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMessage = {
        _id: mockMessageId,
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: mockConversationId,
        save: jest.fn().mockResolvedValue(true)
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      Message.mockImplementation(() => mockMessage);

      await sendMessage(req, res);

      expect(Conversation.findById).toHaveBeenCalledWith(mockConversationId);
      expect(Message).toHaveBeenCalledWith({
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: mockConversationId
      });
      expect(mockMessage.save).toHaveBeenCalled();
      expect(mockConversation.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    test('should create new conversation if not exists', async () => {
      const mockConversationId = new mongoose.Types.ObjectId();
      const mockMessageId = new mongoose.Types.ObjectId();
      
      req.body = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: mockConversationId
      };

      const mockNewConversation = {
        _id: mockConversationId,
        senderId: 'user123',
        receiverId: 'user456',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMessage = {
        _id: mockMessageId,
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: mockConversationId,
        save: jest.fn().mockResolvedValue(true)
      };

      Conversation.findById.mockResolvedValue(null);
      Conversation.mockImplementation(() => mockNewConversation);
      Message.mockImplementation(() => mockMessage);

      await sendMessage(req, res);

      expect(Conversation.findById).toHaveBeenCalledWith(mockConversationId);
      expect(Conversation).toHaveBeenCalledWith({
        _id: mockConversationId,
        senderId: 'user123',
        receiverId: 'user456'
      });
      expect(mockNewConversation.save).toHaveBeenCalled();
      expect(mockMessage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle errors during message sending', async () => {
      req.body = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        conversationId: new mongoose.Types.ObjectId()
      };

      const error = new Error('Database connection failed');
      Conversation.findById.mockRejectedValue(error);

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should update conversation lastMessage and timestamp', async () => {
      const mockConversationId = new mongoose.Types.ObjectId();
      
      req.body = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Updated message',
        conversationId: mockConversationId
      };

      const mockConversation = {
        _id: mockConversationId,
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: '',
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      const mockMessage = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Updated message',
        conversationId: mockConversationId,
        save: jest.fn().mockResolvedValue(true)
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      Message.mockImplementation(() => mockMessage);

      await sendMessage(req, res);

      expect(mockConversation.lastMessage).toBe('Updated message');
      expect(mockConversation.updatedAt).toBeDefined();
      expect(mockConversation.save).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    test('should retrieve messages for a conversation', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      const mockMessages = [
        {
          _id: new mongoose.Types.ObjectId(),
          conversationId,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'First message',
          timestamp: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          conversationId,
          senderId: 'user456',
          receiverId: 'user123',
          text: 'Second message',
          timestamp: new Date()
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockMessages)
      };

      Message.find.mockReturnValue(mockQuery);

      await getMessages(req, res);

      expect(Message.find).toHaveBeenCalledWith({ conversationId });
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: 1 });
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });

    test('should handle errors during message retrieval', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      const error = new Error('Database query failed');
      const mockQuery = {
        sort: jest.fn().mockRejectedValue(error)
      };

      Message.find.mockReturnValue(mockQuery);

      await getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should return empty array for conversation with no messages', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      req.params.id = conversationId;

      const mockQuery = {
        sort: jest.fn().mockResolvedValue([])
      };

      Message.find.mockReturnValue(mockQuery);

      await getMessages(req, res);

      expect(Message.find).toHaveBeenCalledWith({ conversationId });
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('markAsRead', () => {
    test('should mark message as read', async () => {
      const messageId = new mongoose.Types.ObjectId().toString();
      req.params.id = messageId;

      const mockUpdatedMessage = {
        _id: messageId,
        status: 'read'
      };

      Message.findByIdAndUpdate.mockResolvedValue(mockUpdatedMessage);

      await markAsRead(req, res);

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(messageId, { status: 'read' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Message marked as read' });
    });

    test('should handle errors during marking as read', async () => {
      const messageId = new mongoose.Types.ObjectId().toString();
      req.params.id = messageId;

      const error = new Error('Update failed');
      Message.findByIdAndUpdate.mockRejectedValue(error);

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('should handle non-existent message', async () => {
      const messageId = new mongoose.Types.ObjectId().toString();
      req.params.id = messageId;

      Message.findByIdAndUpdate.mockResolvedValue(null);

      await markAsRead(req, res);

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(messageId, { status: 'read' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Message marked as read' });
    });
  });
});
