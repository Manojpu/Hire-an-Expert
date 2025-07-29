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

interface MessageInputProps {
  text: string;
  connected: boolean;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  text,
  connected,
  onTextChange,
  onKeyPress,
  onSendMessage
}) => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        style={{
          border: '1px solid #d1d5db',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          flex: '1',
          outline: 'none',
          fontSize: '1rem'
        }}
        placeholder="Type a message..."
        value={text}
        onChange={onTextChange}
        onKeyPress={onKeyPress}
        disabled={!connected}
      />
      <button
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          color: 'white',
          fontWeight: '500',
          backgroundColor: (connected && text.trim()) ? '#3b82f6' : '#9ca3af',
          cursor: (connected && text.trim()) ? 'pointer' : 'not-allowed',
          border: 'none',
          fontSize: '1rem'
        }}
        onClick={onSendMessage}
        disabled={!connected || !text.trim()}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
