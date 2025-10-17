const mongoose = require('mongoose');
const Conversation = require('./models/conversationModel');
const Message = require('./models/messageModel');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    
    // Check conversations
    const conversations = await Conversation.find({}).sort({ updatedAt: -1 });
    console.log('\n📊 Total conversations:', conversations.length);
    
    console.log('\n💬 All conversations:');
    conversations.forEach((c, i) => {
      console.log(`\n${i+1}. ID: ${c._id}`);
      console.log(`   Sender: ${c.senderId}`);
      console.log(`   Receiver: ${c.receiverId}`);
      console.log(`   Last Message: ${c.lastMessage}`);
      console.log(`   Updated: ${c.updatedAt}`);
    });
    
    // Check messages
    const messages = await Message.find({}).sort({ timestamp: -1 });
    console.log('\n\n📨 Total messages:', messages.length);
    
    console.log('\n📝 Recent messages (last 5):');
    messages.slice(0, 5).forEach((m, i) => {
      console.log(`\n${i+1}. From: ${m.senderId}`);
      console.log(`   To: ${m.receiverId}`);
      console.log(`   Text: ${m.text.substring(0, 50)}...`);
      console.log(`   Status: ${m.status}`);
      console.log(`   Time: ${m.timestamp}`);
    });
    
    await mongoose.disconnect();
    console.log('\n\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkDatabase();
