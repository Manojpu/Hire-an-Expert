import React from 'react';

interface Conversation {
  _id: string;
  senderId: string;
  receiverId: string;
  lastMessage: string;
  lastMessageId: string;
  unreadCount: {
    senderId: number;
    receiverId: number;
  };
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  conversationsLoading: boolean;
  activeConversation: string;
  senderId: string;
  currentUser: any;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateNewConversation: (targetUserId: string) => void;
  onLogout: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  conversationsLoading,
  activeConversation,
  senderId,
  currentUser,
  onSelectConversation,
  onCreateNewConversation,
  onLogout
}) => {
  const getUnreadCount = (conversation: Conversation) => {
    const unreadCount = conversation.senderId === senderId 
      ? conversation.unreadCount?.senderId || 0
      : conversation.unreadCount?.receiverId || 0;
    return unreadCount;
  };

  const hasUnreadMessages = (conversation: Conversation) => {
    return getUnreadCount(conversation) > 0;
  };

  return (
    <div style={{ 
      width: '33.333333%', 
      borderRight: '1px solid #e5e7eb', 
      backgroundColor: 'white', 
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* User Info */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Conversations
        </h2>
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}>
          <p><strong>👤 {currentUser.username}</strong></p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {currentUser.userType} • {currentUser.userId}
          </p>
          <button
            onClick={onLogout}
            style={{
              marginTop: '0.5rem',
              padding: '0.4rem 0.8rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* New Conversation Button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => {
            const targetId = currentUser.userType === 'user' ? 'expert456' : 'user123';
            onCreateNewConversation(targetId);
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          + New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div style={{ flex: '1', overflowY: 'auto' }}>
        {conversationsLoading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            <p>No conversations yet.</p>
            <p style={{ fontSize: '0.8rem' }}>Click "New Chat" to start!</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherUserId = conversation.senderId === senderId ? conversation.receiverId : conversation.senderId;
            const isActive = activeConversation === conversation._id;
            const unreadCount = getUnreadCount(conversation);
            const hasUnread = hasUnreadMessages(conversation);
            
            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                style={{
                  padding: '0.75rem',
                  margin: '0.5rem 0',
                  backgroundColor: isActive ? '#3b82f6' : '#f9fafb',
                  color: isActive ? 'white' : '#1f2937',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {otherUserId}
                    </p>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px',
                      fontWeight: hasUnread ? '600' : '400'
                    }}>
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </p>
                    {unreadCount > 0 && (
                      <div style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: '600'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
