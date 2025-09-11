const mongoose = require('mongoose');
const Conversation = require('../../models/conversationModel');

describe('Conversation Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid conversation', async () => {
      const validConversation = {
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Hello, this is the last message',
        lastMessageId: new mongoose.Types.ObjectId()
      };

      const conversation = new Conversation(validConversation);
      const savedConversation = await conversation.save();

      expect(savedConversation._id).toBeDefined();
      expect(savedConversation.senderId).toBe(validConversation.senderId);
      expect(savedConversation.receiverId).toBe(validConversation.receiverId);
      expect(savedConversation.lastMessage).toBe(validConversation.lastMessage);
      expect(savedConversation.lastMessageId).toEqual(validConversation.lastMessageId);
      expect(savedConversation.unreadCount.senderId).toBe(0); // default value
      expect(savedConversation.unreadCount.receiverId).toBe(0); // default value
      expect(savedConversation.updatedAt).toBeDefined();
    });

    test('should require senderId field', async () => {
      const conversationWithoutSender = {
        receiverId: 'user456',
        lastMessage: 'Hello, this is the last message'
      };

      const conversation = new Conversation(conversationWithoutSender);
      
      await expect(conversation.save()).rejects.toThrow();
    });

    test('should require receiverId field', async () => {
      const conversationWithoutReceiver = {
        senderId: 'user123',
        lastMessage: 'Hello, this is the last message'
      };

      const conversation = new Conversation(conversationWithoutReceiver);
      
      await expect(conversation.save()).rejects.toThrow();
    });

    test('should allow optional fields to be undefined', async () => {
      const minimalConversation = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const conversation = new Conversation(minimalConversation);
      const savedConversation = await conversation.save();

      expect(savedConversation.senderId).toBe(minimalConversation.senderId);
      expect(savedConversation.receiverId).toBe(minimalConversation.receiverId);
      expect(savedConversation.lastMessage).toBeUndefined();
      expect(savedConversation.lastMessageId).toBeUndefined();
      expect(savedConversation.unreadCount.senderId).toBe(0);
      expect(savedConversation.unreadCount.receiverId).toBe(0);
    });

    test('should set default unread counts', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const conversation = new Conversation(conversationData);
      const savedConversation = await conversation.save();

      expect(savedConversation.unreadCount).toBeDefined();
      expect(savedConversation.unreadCount.senderId).toBe(0);
      expect(savedConversation.unreadCount.receiverId).toBe(0);
    });

    test('should set default updatedAt timestamp', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const conversation = new Conversation(conversationData);
      const savedConversation = await conversation.save();

      expect(savedConversation.updatedAt).toBeDefined();
      expect(savedConversation.updatedAt).toBeInstanceOf(Date);
      expect(savedConversation.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should allow custom unread counts', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456',
        unreadCount: {
          senderId: 5,
          receiverId: 3
        }
      };

      const conversation = new Conversation(conversationData);
      const savedConversation = await conversation.save();

      expect(savedConversation.unreadCount.senderId).toBe(5);
      expect(savedConversation.unreadCount.receiverId).toBe(3);
    });
  });

  describe('Model Operations', () => {
    test('should find conversations by user ID', async () => {
      const userId = 'user123';
      const conversationsData = [
        {
          senderId: userId,
          receiverId: 'user456',
          lastMessage: 'Message as sender'
        },
        {
          senderId: 'user789',
          receiverId: userId,
          lastMessage: 'Message as receiver'
        },
        {
          senderId: 'user789',
          receiverId: 'user456',
          lastMessage: 'Message not involving user123'
        }
      ];

      await Conversation.insertMany(conversationsData);

      const userConversations = await Conversation.find({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      });

      expect(userConversations).toHaveLength(2);
      expect(userConversations.some(conv => conv.senderId === userId)).toBe(true);
      expect(userConversations.some(conv => conv.receiverId === userId)).toBe(true);
    });

    test('should update conversation lastMessage and timestamp', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Initial message'
      };

      const conversation = await Conversation.create(conversationData);
      const initialTimestamp = conversation.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const newMessage = 'Updated message';
      const newTimestamp = new Date();

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newMessage,
        updatedAt: newTimestamp
      });

      const updatedConversation = await Conversation.findById(conversation._id);
      expect(updatedConversation.lastMessage).toBe(newMessage);
      expect(updatedConversation.updatedAt.getTime()).toBeGreaterThan(initialTimestamp.getTime());
    });

    test('should update unread counts', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456'
      };

      const conversation = await Conversation.create(conversationData);

      // Update sender unread count
      await Conversation.findByIdAndUpdate(conversation._id, {
        'unreadCount.senderId': 3
      });

      let updatedConversation = await Conversation.findById(conversation._id);
      expect(updatedConversation.unreadCount.senderId).toBe(3);
      expect(updatedConversation.unreadCount.receiverId).toBe(0);

      // Update receiver unread count
      await Conversation.findByIdAndUpdate(conversation._id, {
        'unreadCount.receiverId': 7
      });

      updatedConversation = await Conversation.findById(conversation._id);
      expect(updatedConversation.unreadCount.senderId).toBe(3);
      expect(updatedConversation.unreadCount.receiverId).toBe(7);
    });

    test('should find existing conversation between two users', async () => {
      const user1 = 'user123';
      const user2 = 'user456';

      await Conversation.create({
        senderId: user1,
        receiverId: user2,
        lastMessage: 'Existing conversation'
      });

      // Should find conversation regardless of sender/receiver order
      const conversation1 = await Conversation.findOne({
        $or: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 }
        ]
      });

      const conversation2 = await Conversation.findOne({
        $or: [
          { senderId: user2, receiverId: user1 },
          { senderId: user1, receiverId: user2 }
        ]
      });

      expect(conversation1).toBeDefined();
      expect(conversation2).toBeDefined();
      expect(conversation1._id.toString()).toBe(conversation2._id.toString());
    });

    test('should sort conversations by updatedAt', async () => {
      const now = new Date();
      const conversationsData = [
        {
          senderId: 'user1',
          receiverId: 'user2',
          lastMessage: 'First message',
          updatedAt: new Date(now.getTime() - 3000) // 3 seconds ago
        },
        {
          senderId: 'user1',
          receiverId: 'user3',
          lastMessage: 'Second message',
          updatedAt: new Date(now.getTime() - 1000) // 1 second ago
        },
        {
          senderId: 'user1',
          receiverId: 'user4',
          lastMessage: 'Third message',
          updatedAt: new Date(now.getTime() - 2000) // 2 seconds ago
        }
      ];

      await Conversation.insertMany(conversationsData);

      const sortedConversations = await Conversation.find({
        senderId: 'user1'
      }).sort({ updatedAt: -1 });

      expect(sortedConversations).toHaveLength(3);
      expect(sortedConversations[0].lastMessage).toBe('Second message'); // Most recent
      expect(sortedConversations[1].lastMessage).toBe('Third message');
      expect(sortedConversations[2].lastMessage).toBe('First message'); // Oldest
    });

    test('should delete conversation', async () => {
      const conversationData = {
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Conversation to be deleted'
      };

      const conversation = await Conversation.create(conversationData);
      expect(conversation._id).toBeDefined();

      await Conversation.findByIdAndDelete(conversation._id);

      const deletedConversation = await Conversation.findById(conversation._id);
      expect(deletedConversation).toBeNull();
    });
  });
});
