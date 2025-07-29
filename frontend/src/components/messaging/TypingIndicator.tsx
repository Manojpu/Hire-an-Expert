import React from 'react';

interface TypingIndicatorProps {
  typingUsers: Set<string>;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.size === 0) return null;

  return (
    <div style={{
      marginBottom: '0.75rem',
      display: 'flex',
      justifyContent: 'flex-start'
    }}>
      <div style={{
        maxWidth: '12rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '1px solid #e5e7eb',
        fontStyle: 'italic'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: '#6b7280', 
              borderRadius: '50%',
              animation: 'typing 1.4s infinite ease-in-out'
            }}></div>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: '#6b7280', 
              borderRadius: '50%',
              animation: 'typing 1.4s infinite ease-in-out 0.2s'
            }}></div>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: '#6b7280', 
              borderRadius: '50%',
              animation: 'typing 1.4s infinite ease-in-out 0.4s'
            }}></div>
          </div>
          <span style={{ fontSize: '0.75rem' }}>
            {Array.from(typingUsers)[0]} is typing...
          </span>
        </div>
      </div>
      
      {/* CSS for typing animation */}
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
