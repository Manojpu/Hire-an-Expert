import React from 'react';

interface ChatHeaderProps {
  connected: boolean;
  receiverId: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ connected, receiverId }) => {
  return (
    <div style={{ 
      borderBottom: '1px solid #e5e7eb', 
      paddingBottom: '0.5rem', 
      marginBottom: '1rem' 
    }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
        💬 Chat Conversation
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
        Chatting with {receiverId}
      </p>
    </div>
  );
};

export default ChatHeader;
