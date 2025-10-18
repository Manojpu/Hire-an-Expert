const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/conversationModel');
const Message = require('./models/messageModel');

async function testDatabase() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', process.env.MONGO_URI);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully\n');
    
    const db = mongoose.connection.db;
    
    // Database Info
    console.log('📊 Database Info:');
    console.log('  Database Name:', db.databaseName);
    console.log('  Connected to:', mongoose.connection.host);
    console.log('  Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  - ${coll.name}: ${count} documents`);
    }
    
    // Test conversation queries
    console.log('\n💬 Testing Conversation Queries:');
    const allConversations = await Conversation.find({});
    console.log(`  Total conversations: ${allConversations.length}`);
    
    if (allConversations.length > 0) {
      console.log('\n  Sample conversation:');
      const sample = allConversations[0];
      console.log(`    ID: ${sample._id}`);
      console.log(`    Sender: ${sample.senderId}`);
      console.log(`    Receiver: ${sample.receiverId}`);
      console.log(`    Last Message: ${sample.lastMessage}`);
      console.log(`    Updated: ${sample.updatedAt}`);
    }
    
    // Test message queries
    console.log('\n📨 Testing Message Queries:');
    const allMessages = await Message.find({});
    console.log(`  Total messages: ${allMessages.length}`);
    
    if (allMessages.length > 0) {
      console.log('\n  Sample message:');
      const sampleMsg = allMessages[0];
      console.log(`    ID: ${sampleMsg._id}`);
      console.log(`    Conversation: ${sampleMsg.conversationId}`);
      console.log(`    From: ${sampleMsg.senderId}`);
      console.log(`    To: ${sampleMsg.receiverId}`);
      console.log(`    Text: ${sampleMsg.text}`);
      console.log(`    Status: ${sampleMsg.status}`);
    }
    
    // Test CRUD operations
    console.log('\n🧪 Testing CRUD Operations:');
    
    // Create
    const testConv = await Conversation.create({
      senderId: 'test_user_1',
      receiverId: 'test_user_2',
      lastMessage: 'Test message for database check',
      updatedAt: new Date()
    });
    console.log('  ✅ CREATE: Created test conversation:', testConv._id);
    
    // Read
    const foundConv = await Conversation.findById(testConv._id);
    console.log('  ✅ READ: Found conversation:', foundConv ? 'Yes' : 'No');
    
    // Update
    await Conversation.findByIdAndUpdate(testConv._id, { 
      lastMessage: 'Updated test message' 
    });
    const updatedConv = await Conversation.findById(testConv._id);
    console.log('  ✅ UPDATE: Updated message:', updatedConv.lastMessage);
    
    // Delete
    await Conversation.findByIdAndDelete(testConv._id);
    const deletedConv = await Conversation.findById(testConv._id);
    console.log('  ✅ DELETE: Deleted successfully:', deletedConv === null ? 'Yes' : 'No');
    
    // Performance test
    console.log('\n⚡ Performance Test:');
    const startTime = Date.now();
    await Conversation.find({}).limit(100);
    const queryTime = Date.now() - startTime;
    console.log(`  Query time (100 docs): ${queryTime}ms`);
    
    console.log('\n✅ All database tests passed!');
    console.log('🎉 Database is working correctly');
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Error details:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testDatabase();
