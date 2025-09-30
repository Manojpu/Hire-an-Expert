const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Conversation = require('./models/conversationModel');
const Message = require('./models/messageModel');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://asith:GLKKuAFEJqLyWxLh@cluster0.dqfprho.mongodb.net/msg_service');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Sample Firebase UIDs (you can replace these with real ones from your user service)
const sampleUsers = [
  'TofKaKhGUlewv9CrWfkfbkg0CfF2', // Your user ID
  'firebase_uid_user_2',
  'firebase_uid_user_3',
  'firebase_uid_expert_1',
  'firebase_uid_expert_2'
];

// Sample data creation
const createSampleData = async () => {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    
    const conversations = [];
    const messages = [];
    
    // Create conversations
    const conv1 = new Conversation({
      senderId: sampleUsers[0], // Your user ID
      receiverId: sampleUsers[1],
      lastMessage: "Hey, I need help with my website design",
      updatedAt: new Date('2024-09-14T10:00:00Z')
    });
    conversations.push(conv1);
    
    const conv2 = new Conversation({
      senderId: sampleUsers[0], // Your user ID  
      receiverId: sampleUsers[3],
      lastMessage: "When can we schedule the consultation?",
      updatedAt: new Date('2024-09-14T11:30:00Z')
    });
    conversations.push(conv2);
    
    const conv3 = new Conversation({
      senderId: sampleUsers[2],
      receiverId: sampleUsers[0], // Your user ID
      lastMessage: "Thanks for the quick response!",
      updatedAt: new Date('2024-09-14T12:15:00Z')
    });
    conversations.push(conv3);
    
    // Save conversations
    console.log('💬 Creating conversations...');
    const savedConversations = await Conversation.insertMany(conversations);
    console.log(`✅ Created ${savedConversations.length} conversations`);
    
    // Create messages for conversation 1
    const conv1Messages = [
      new Message({
        conversationId: savedConversations[0]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[1],
        text: "Hi! I saw your profile and I need help with my website design. Are you available?",
        timestamp: new Date('2024-09-14T09:30:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[0]._id,
        senderId: sampleUsers[1],
        receiverId: sampleUsers[0],
        text: "Hello! Yes, I'd be happy to help with your website design. What kind of website are you looking to create?",
        timestamp: new Date('2024-09-14T09:35:00Z'),
        status: 'read'
      }),
      new Message({
        conversationId: savedConversations[0]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[1],
        text: "It's for my small business - a local bakery. I want something modern and mobile-friendly.",
        timestamp: new Date('2024-09-14T09:40:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[0]._id,
        senderId: sampleUsers[1],
        receiverId: sampleUsers[0],
        text: "Perfect! I have experience with bakery websites. I can create a beautiful, responsive design with an online ordering system if needed.",
        timestamp: new Date('2024-09-14T09:45:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[0]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[1],
        text: "Hey, I need help with my website design",
        timestamp: new Date('2024-09-14T10:00:00Z'),
        status: 'sent'
      })
    ];
    
    // Create messages for conversation 2
    const conv2Messages = [
      new Message({
        conversationId: savedConversations[1]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[3],
        text: "Hi there! I'm interested in your business consulting services.",
        timestamp: new Date('2024-09-14T11:00:00Z'),
        status: 'read'
      }),
      new Message({
        conversationId: savedConversations[1]._id,
        senderId: sampleUsers[3],
        receiverId: sampleUsers[0],
        text: "Great to hear from you! I'd love to help with your business needs. What specific areas are you looking to improve?",
        timestamp: new Date('2024-09-14T11:15:00Z'),
        status: 'read'
      }),
      new Message({
        conversationId: savedConversations[1]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[3],
        text: "I'm struggling with marketing strategy and customer acquisition for my startup.",
        timestamp: new Date('2024-09-14T11:20:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[1]._id,
        senderId: sampleUsers[3],
        receiverId: sampleUsers[0],
        text: "Those are common challenges for startups. I can help you develop a comprehensive marketing strategy. When can we schedule the consultation?",
        timestamp: new Date('2024-09-14T11:30:00Z'),
        status: 'sent'
      })
    ];
    
    // Create messages for conversation 3
    const conv3Messages = [
      new Message({
        conversationId: savedConversations[2]._id,
        senderId: sampleUsers[2],
        receiverId: sampleUsers[0],
        text: "Hello! I saw your expertise in web development. Can you help me with a React project?",
        timestamp: new Date('2024-09-14T12:00:00Z'),
        status: 'read'
      }),
      new Message({
        conversationId: savedConversations[2]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[2],
        text: "Absolutely! I'd be happy to help with your React project. What specific challenges are you facing?",
        timestamp: new Date('2024-09-14T12:05:00Z'),
        status: 'read'
      }),
      new Message({
        conversationId: savedConversations[2]._id,
        senderId: sampleUsers[2],
        receiverId: sampleUsers[0],
        text: "I'm having trouble with state management and API integration. The app is getting complex.",
        timestamp: new Date('2024-09-14T12:10:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[2]._id,
        senderId: sampleUsers[0],
        receiverId: sampleUsers[2],
        text: "Those are common issues with larger React apps. I can help you implement Redux or Context API for state management and optimize your API calls.",
        timestamp: new Date('2024-09-14T12:12:00Z'),
        status: 'delivered'
      }),
      new Message({
        conversationId: savedConversations[2]._id,
        senderId: sampleUsers[2],
        receiverId: sampleUsers[0],
        text: "Thanks for the quick response!",
        timestamp: new Date('2024-09-14T12:15:00Z'),
        status: 'sent'
      })
    ];
    
    // Combine all messages
    messages.push(...conv1Messages, ...conv2Messages, ...conv3Messages);
    
    // Save messages
    console.log('📝 Creating messages...');
    const savedMessages = await Message.insertMany(messages);
    console.log(`✅ Created ${savedMessages.length} messages`);
    
    // Update conversation lastMessageId
    console.log('🔗 Updating conversation references...');
    for (let i = 0; i < savedConversations.length; i++) {
      const convMessages = savedMessages.filter(msg => 
        msg.conversationId.toString() === savedConversations[i]._id.toString()
      );
      const lastMessage = convMessages[convMessages.length - 1];
      
      await Conversation.findByIdAndUpdate(savedConversations[i]._id, {
        lastMessageId: lastMessage._id
      });
    }
    
    console.log('🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${savedConversations.length} conversations created`);
    console.log(`- ${savedMessages.length} messages created`);
    console.log(`\n🔍 Test with your Firebase UID: ${sampleUsers[0]}`);
    console.log(`\n🌐 Test URLs:`);
    console.log(`- Get conversations: http://localhost:8005/api/conversations/user/${sampleUsers[0]}`);
    console.log(`- Get messages for conv1: http://localhost:8005/api/message/conversation/${savedConversations[0]._id}`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting sample data creation...');
  await connectDB();
  await createSampleData();
  
  console.log('\n✅ Done! Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
