const mongoose = require('mongoose');
const Message = require('../../models/messageModel');

describe('Message Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid message', async () => {
      const validMessage = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message'
      };

      const message = new Message(validMessage);
      const savedMessage = await message.save();

      expect(savedMessage._id).toBeDefined();
      expect(savedMessage.conversationId).toEqual(validMessage.conversationId);
      expect(savedMessage.senderId).toBe(validMessage.senderId);
      expect(savedMessage.receiverId).toBe(validMessage.receiverId);
      expect(savedMessage.text).toBe(validMessage.text);
      expect(savedMessage.status).toBe('sent'); // default value
      expect(savedMessage.timestamp).toBeDefined();
      expect(savedMessage.readAt).toBeUndefined();
    });

    test('should require senderId field', async () => {
      const messageWithoutSender = {
        conversationId: new mongoose.Types.ObjectId(),
        receiverId: 'user456',
        text: 'Hello, this is a test message'
      };

      const message = new Message(messageWithoutSender);
      
      await expect(message.save()).rejects.toThrow();
    });

    test('should require receiverId field', async () => {
      const messageWithoutReceiver = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        text: 'Hello, this is a test message'
      };

      const message = new Message(messageWithoutReceiver);
      
      await expect(message.save()).rejects.toThrow();
    });

    test('should require text field', async () => {
      const messageWithoutText = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456'
      };

      const message = new Message(messageWithoutText);
      
      await expect(message.save()).rejects.toThrow();
    });

    test('should validate status enum values', async () => {
      const messageWithInvalidStatus = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Hello, this is a test message',
        status: 'invalid_status'
      };

      const message = new Message(messageWithInvalidStatus);
      
      await expect(message.save()).rejects.toThrow();
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['sent', 'delivered', 'read'];
      
      for (const status of validStatuses) {
        const messageData = {
          conversationId: new mongoose.Types.ObjectId(),
          senderId: 'user123',
          receiverId: 'user456',
          text: `Message with status: ${status}`,
          status: status
        };

        const message = new Message(messageData);
        const savedMessage = await message.save();
        
        expect(savedMessage.status).toBe(status);
      }
    });

    test('should set readAt when status is read', async () => {
      const messageData = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Read message',
        status: 'read',
        readAt: new Date()
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();
      
      expect(savedMessage.readAt).toBeDefined();
      expect(savedMessage.readAt).toBeInstanceOf(Date);
    });

    test('should set default timestamp', async () => {
      const messageData = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Message with default timestamp'
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();
      
      expect(savedMessage.timestamp).toBeDefined();
      expect(savedMessage.timestamp).toBeInstanceOf(Date);
      expect(savedMessage.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Model Operations', () => {
    test('should find messages by conversationId', async () => {
      const conversationId = new mongoose.Types.ObjectId();
      
      // Create multiple messages for the same conversation
      const messagesData = [
        {
          conversationId,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'First message'
        },
        {
          conversationId,
          senderId: 'user456',
          receiverId: 'user123',
          text: 'Second message'
        },
        {
          conversationId: new mongoose.Types.ObjectId(), // Different conversation
          senderId: 'user789',
          receiverId: 'user123',
          text: 'Different conversation message'
        }
      ];

      await Message.insertMany(messagesData);
      
      const conversationMessages = await Message.find({ conversationId });
      
      expect(conversationMessages).toHaveLength(2);
      expect(conversationMessages.every(msg => msg.conversationId.equals(conversationId))).toBe(true);
    });

    test('should update message status', async () => {
      const messageData = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Message to be updated'
      };

      const message = await Message.create(messageData);
      expect(message.status).toBe('sent');

      await Message.findByIdAndUpdate(message._id, { 
        status: 'read',
        readAt: new Date()
      });

      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.status).toBe('read');
      expect(updatedMessage.readAt).toBeDefined();
    });

    test('should delete message', async () => {
      const messageData = {
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user123',
        receiverId: 'user456',
        text: 'Message to be deleted'
      };

      const message = await Message.create(messageData);
      expect(message._id).toBeDefined();

      await Message.findByIdAndDelete(message._id);
      
      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage).toBeNull();
    });
  });
});
