const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Message = require('../../models/messageModel');
const Conversation = require('../../models/conversationModel');

describe('Socket.IO Integration Tests', () => {
  let httpServer;
  let io;
  let clientSocket1;
  let clientSocket2;
  let serverPort;

  beforeAll((done) => {
    // Create HTTP server and Socket.IO instance for testing
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Find available port
    httpServer.listen(() => {
      serverPort = httpServer.address().port;
      
      // Set up Socket.IO event handlers (simplified version of server.js)
      io.on('connection', (socket) => {
        socket.on('registerUser', (userId) => {
          socket.userId = userId;
        });

        socket.on('joinRoom', (conversationId) => {
          socket.join(conversationId);
          socket.currentRoom = conversationId;
        });

        socket.on('sendMessage', async (data) => {
          const { senderId, receiverId, text, conversationId } = data;
          
          try {
            const message = new Message({
              senderId,
              receiverId,
              text,
              conversationId,
              status: 'sent'
            });
            
            await message.save();
            
            // Update conversation
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: text,
              lastMessageId: message._id,
              updatedAt: Date.now()
            }, { upsert: true });

            // Emit to room
            io.to(conversationId).emit('receiveMessage', message);
            
          } catch (error) {
            socket.emit('messageError', { error: 'Failed to send message' });
          }
        });

        socket.on('startTyping', (data) => {
          const { conversationId, userId } = data;
          socket.to(conversationId).emit('userTyping', { userId, isTyping: true });
        });

        socket.on('stopTyping', (data) => {
          const { conversationId, userId } = data;
          socket.to(conversationId).emit('userTyping', { userId, isTyping: false });
        });

        socket.on('markMessagesAsRead', async (data) => {
          const { conversationId, userId } = data;
          
          try {
            await Message.updateMany(
              { 
                conversationId, 
                receiverId: userId, 
                status: { $ne: 'read' } 
              },
              { 
                status: 'read', 
                readAt: new Date() 
              }
            );

            io.to(conversationId).emit('messagesReadUpdate', { 
              conversationId, 
              readBy: userId,
              timestamp: new Date()
            });
          } catch (error) {
            socket.emit('error', { message: 'Failed to mark messages as read' });
          }
        });
      });

      done();
    });
  });

  beforeEach((done) => {
    // Create client connections
    clientSocket1 = new Client(`http://localhost:${serverPort}`);
    clientSocket2 = new Client(`http://localhost:${serverPort}`);
    
    // Wait for both clients to connect
    let connectCount = 0;
    const checkConnection = () => {
      connectCount++;
      if (connectCount === 2) {
        done();
      }
    };

    clientSocket1.on('connect', checkConnection);
    clientSocket2.on('connect', checkConnection);
  });

  afterEach(() => {
    if (clientSocket1?.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  describe('Connection and User Registration', () => {
    test('should connect and register users', (done) => {
      let registeredCount = 0;
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      // Just verify connection works - no specific response expected
      setTimeout(() => {
        expect(clientSocket1.connected).toBe(true);
        expect(clientSocket2.connected).toBe(true);
        done();
      }, 100);
    });

    test('should handle multiple connections from same user', (done) => {
      const clientSocket3 = new Client(`http://localhost:${serverPort}`);
      
      clientSocket3.on('connect', () => {
        clientSocket1.emit('registerUser', 'user123');
        clientSocket3.emit('registerUser', 'user123'); // Same user
        
        setTimeout(() => {
          expect(clientSocket1.connected).toBe(true);
          expect(clientSocket3.connected).toBe(true);
          clientSocket3.disconnect();
          done();
        }, 100);
      });
    });
  });

  describe('Room Management', () => {
    test('should join and leave rooms', (done) => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      // Wait for registration to complete
      setTimeout(() => {
        clientSocket1.emit('joinRoom', conversationId);
        clientSocket2.emit('joinRoom', conversationId);
        
        // Wait for room joining to complete
        setTimeout(() => {
          clientSocket2.on('userTyping', (data) => {
            expect(data.userId).toBe('user123');
            expect(data.isTyping).toBe(true);
            done();
          });
          
          // Send typing indicator
          clientSocket1.emit('startTyping', { conversationId, userId: 'user123' });
        }, 300);
      }, 200);
    });

    test('should isolate messages to specific rooms', (done) => {
      const conversationId1 = new mongoose.Types.ObjectId().toString();
      const conversationId2 = new mongoose.Types.ObjectId().toString();
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      clientSocket1.emit('joinRoom', conversationId1);
      clientSocket2.emit('joinRoom', conversationId2);
      
      let receivedMessages = 0;
      
      clientSocket1.on('userTyping', () => {
        receivedMessages++;
      });
      
      clientSocket2.on('userTyping', () => {
        receivedMessages++;
      });
      
      // Send typing indicator to conversation 1 only
      setTimeout(() => {
        clientSocket1.emit('startTyping', { conversationId: conversationId1, userId: 'user123' });
        
        // Wait and verify only appropriate users received the message
        setTimeout(() => {
          expect(receivedMessages).toBe(0); // Neither should receive since they're in different rooms
          done();
        }, 200);
      }, 100);
    });
  });

  describe('Real-time Messaging', () => {
    test('should send and receive messages in real-time', (done) => {
      const conversationId = new mongoose.Types.ObjectId();
      
      // Create conversation first
      Conversation.create({
        _id: conversationId,
        senderId: 'user123',
        receiverId: 'user456'
      }).then(() => {
        clientSocket1.emit('registerUser', 'user123');
        clientSocket2.emit('registerUser', 'user456');
        
        clientSocket1.emit('joinRoom', conversationId.toString());
        clientSocket2.emit('joinRoom', conversationId.toString());
        
        const messageData = {
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Hello from Socket.IO test!',
          conversationId: conversationId.toString()
        };
        
        clientSocket2.on('receiveMessage', async (receivedMessage) => {
          expect(receivedMessage.senderId).toBe(messageData.senderId);
          expect(receivedMessage.receiverId).toBe(messageData.receiverId);
          expect(receivedMessage.text).toBe(messageData.text);
          expect(receivedMessage.conversationId).toBe(messageData.conversationId);
          expect(receivedMessage.status).toBe('sent');
          
          // Verify message was saved to database
          const savedMessage = await Message.findById(receivedMessage._id);
          expect(savedMessage).toBeTruthy();
          expect(savedMessage.text).toBe(messageData.text);
          
          done();
        });
        
        setTimeout(() => {
          clientSocket1.emit('sendMessage', messageData);
        }, 100);
      });
    });

    test('should handle message sending errors', (done) => {
      const conversationId = 'invalid-conversation-id'; // Invalid ObjectId
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket1.emit('joinRoom', conversationId);
      
      const messageData = {
        senderId: 'user123',
        receiverId: 'user456',
        text: 'This should fail',
        conversationId: conversationId
      };
      
      clientSocket1.on('messageError', (error) => {
        expect(error.error).toBe('Failed to send message');
        done();
      });
      
      setTimeout(() => {
        clientSocket1.emit('sendMessage', messageData);
      }, 100);
    });

    test('should update conversation when message is sent', (done) => {
      const conversationId = new mongoose.Types.ObjectId();
      
      Conversation.create({
        _id: conversationId,
        senderId: 'user123',
        receiverId: 'user456',
        lastMessage: 'Previous message'
      }).then(() => {
        clientSocket1.emit('registerUser', 'user123');
        clientSocket1.emit('joinRoom', conversationId.toString());
        
        const messageData = {
          senderId: 'user123',
          receiverId: 'user456',
          text: 'New message for conversation update test',
          conversationId: conversationId.toString()
        };
        
        clientSocket1.on('receiveMessage', async () => {
          // Check if conversation was updated
          const updatedConversation = await Conversation.findById(conversationId);
          expect(updatedConversation.lastMessage).toBe(messageData.text);
          expect(updatedConversation.lastMessageId).toBeDefined();
          done();
        });
        
        setTimeout(() => {
          clientSocket1.emit('sendMessage', messageData);
        }, 100);
      });
    });
  });

  describe('Typing Indicators', () => {
    test('should broadcast typing indicators', (done) => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      // Wait for registration to complete
      setTimeout(() => {
        clientSocket1.emit('joinRoom', conversationId);
        clientSocket2.emit('joinRoom', conversationId);
        
        // Wait for room joining to complete
        setTimeout(() => {
          clientSocket2.on('userTyping', (data) => {
            expect(data.userId).toBe('user123');
            expect(data.isTyping).toBe(true);
            done();
          });
          
          clientSocket1.emit('startTyping', { conversationId, userId: 'user123' });
        }, 300);
      }, 200);
    });

    test('should handle stop typing events', (done) => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      let typingEvents = [];
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      // Wait for registration to complete
      setTimeout(() => {
        clientSocket1.emit('joinRoom', conversationId);
        clientSocket2.emit('joinRoom', conversationId);
        
        // Wait for room joining to complete
        setTimeout(() => {
          clientSocket2.on('userTyping', (data) => {
            typingEvents.push(data);
            
            if (typingEvents.length === 2) {
              expect(typingEvents[0].isTyping).toBe(true);
              expect(typingEvents[1].isTyping).toBe(false);
              done();
            }
          });
          
          // Start typing
          clientSocket1.emit('startTyping', { conversationId, userId: 'user123' });
          
          // Stop typing after a short delay
          setTimeout(() => {
            clientSocket1.emit('stopTyping', { conversationId, userId: 'user123' });
          }, 100);
        }, 300);
      }, 200);
    });

    test('should not send typing indicators to sender', (done) => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket1.emit('joinRoom', conversationId);
      
      let receivedTyping = false;
      
      clientSocket1.on('userTyping', () => {
        receivedTyping = true;
      });
      
      setTimeout(() => {
        clientSocket1.emit('startTyping', { conversationId, userId: 'user123' });
        
        setTimeout(() => {
          expect(receivedTyping).toBe(false);
          done();
        }, 200);
      }, 100);
    });
  });

  describe('Read Receipts', () => {
    test('should mark messages as read and broadcast update', (done) => {
      const conversationId = new mongoose.Types.ObjectId();
      
      // Create conversation and messages
      Promise.all([
        Conversation.create({
          _id: conversationId,
          senderId: 'user123',
          receiverId: 'user456'
        }),
        Message.create({
          conversationId,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Test message 1',
          status: 'sent'
        }),
        Message.create({
          conversationId,
          senderId: 'user123',
          receiverId: 'user456',
          text: 'Test message 2',
          status: 'delivered'
        })
      ]).then(() => {
        clientSocket1.emit('registerUser', 'user123');
        clientSocket2.emit('registerUser', 'user456');
        
        clientSocket1.emit('joinRoom', conversationId.toString());
        clientSocket2.emit('joinRoom', conversationId.toString());
        
        clientSocket1.on('messagesReadUpdate', async (data) => {
          expect(data.conversationId).toBe(conversationId.toString());
          expect(data.readBy).toBe('user456');
          expect(data.timestamp).toBeDefined();
          
          // Verify messages were updated in database
          const updatedMessages = await Message.find({ 
            conversationId, 
            receiverId: 'user456' 
          });
          
          updatedMessages.forEach(message => {
            expect(message.status).toBe('read');
            expect(message.readAt).toBeDefined();
          });
          
          done();
        });
        
        setTimeout(() => {
          clientSocket2.emit('markMessagesAsRead', { 
            conversationId: conversationId.toString(), 
            userId: 'user456' 
          });
        }, 100);
      });
    });

    test('should handle read receipt errors gracefully', (done) => {
      const invalidConversationId = 'invalid-id';
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket1.emit('joinRoom', invalidConversationId);
      
      clientSocket1.on('error', (error) => {
        expect(error.message).toBe('Failed to mark messages as read');
        done();
      });
      
      setTimeout(() => {
        clientSocket1.emit('markMessagesAsRead', { 
          conversationId: invalidConversationId, 
          userId: 'user123' 
        });
      }, 100);
    });
  });

  describe('Connection Management', () => {
    test('should handle client disconnection gracefully', (done) => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      
      clientSocket1.emit('registerUser', 'user123');
      clientSocket2.emit('registerUser', 'user456');
      
      clientSocket1.emit('joinRoom', conversationId);
      clientSocket2.emit('joinRoom', conversationId);
      
      // Start typing, then disconnect
      clientSocket1.emit('startTyping', { conversationId, userId: 'user123' });
      
      setTimeout(() => {
        clientSocket1.disconnect();
        
        // Verify the other client is still functional
        setTimeout(() => {
          expect(clientSocket2.connected).toBe(true);
          done();
        }, 100);
      }, 100);
    });

    test('should handle rapid connect/disconnect cycles', (done) => {
      let connectionCount = 0;
      const maxConnections = 5;
      
      function createAndDestroyConnection() {
        const tempClient = new Client(`http://localhost:${serverPort}`);
        
        tempClient.on('connect', () => {
          connectionCount++;
          tempClient.disconnect();
          
          if (connectionCount < maxConnections) {
            setTimeout(createAndDestroyConnection, 50);
          } else {
            // Verify main clients are still functional
            expect(clientSocket1.connected).toBe(true);
            expect(clientSocket2.connected).toBe(true);
            done();
          }
        });
      }
      
      createAndDestroyConnection();
    });
  });
});
