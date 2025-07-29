import React, { forwardRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  conversationId: string;
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
}

interface ChatWindowProps {
  activeConversation: string;
  loading: boolean;
  messages: Message[];
  typingUsers: Set<string>;
  connected: boolean;
  receiverId: string;
  senderId: string;
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({
  activeConversation,
  loading,
  messages,
  typingUsers,
  connected,
  receiverId,
  senderId,
  text,
  onTextChange,
  onKeyPress,
  onSendMessage
}, messagesEndRef) => {
  if (!activeConversation) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#6b7280'
      }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💬</h3>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Welcome to Hire an Expert Messaging!</p>
        <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
          Select a conversation from the left to start chatting,<br />
          or click "New Chat" to begin a new conversation.
        </p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader connected={connected} receiverId={receiverId} />

      {/* Messages */}
      <div style={{ 
        flex: '1', 
        overflowY: 'auto', 
        border: '1px solid #e5e7eb', 
        borderRadius: '0.5rem', 
        padding: '1rem', 
        marginBottom: '1rem', 
        backgroundColor: '#f9fafb' 
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            No messages yet. Start a conversation!<br />
            <small>💡 Open another browser tab and login as a different user to test real-time messaging</small>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={msg.senderId === senderId}
                currentUserId={senderId}
              />
            ))}
            
            <TypingIndicator typingUsers={typingUsers} />
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        text={text}
        connected={connected}
        onTextChange={onTextChange}
        onKeyPress={onKeyPress}
        onSendMessage={onSendMessage}
      />
    </>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
