import React from 'react';

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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, currentUserId }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (msg: Message) => {
    if (msg.senderId !== currentUserId) return null; // Only show status for sent messages
    
    switch (msg.status) {
      case 'sent':
        return <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>✓</span>;
      case 'delivered':
        return <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>✓✓</span>;
      case 'read':
        return <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓✓</span>;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        marginBottom: '0.75rem',
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start'
      }}
    >
      <div
        style={{
          maxWidth: '24rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          backgroundColor: isOwn ? '#3b82f6' : 'white',
          color: isOwn ? 'white' : '#1f2937',
          border: isOwn ? 'none' : '1px solid #e5e7eb'
        }}
      >
        <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
          {message.text}
        </p>
        <div style={{ 
          fontSize: '0.75rem', 
          opacity: 0.75,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {formatTime(message.timestamp)} • {message.senderId}
          </span>
          {getMessageStatusIcon(message)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
