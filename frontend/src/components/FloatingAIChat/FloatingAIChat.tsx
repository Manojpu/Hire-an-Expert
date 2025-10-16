// Floating AI Chat Widget Component
import React, { useState, useEffect, useRef } from 'react';
import aiChatService, { ChatMessage } from '../../services/aiChatService';
import './FloatingAIChat.css';

// Simple markdown formatter for chat messages
const formatMessageContent = (content: string): string => {
  let formatted = content;
  
  // Convert **text** to <strong>text</strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *text* to <em>text</em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert line breaks to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Convert lists starting with * or -
  formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li>.*<\/li>(\s|<br>)*)+/g, (match) => {
    return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
  });
  
  return formatted;
};

const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if AI service is online
  useEffect(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const checkServiceHealth = async () => {
    const healthy = await aiChatService.checkHealth();
    setIsOnline(healthy);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message on first open
      setMessages([{
        role: 'assistant',
        content: 'Hi! 👋 I\'m your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(updatedMessages);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className={`floating-chat-button ${isOpen ? 'open' : ''}`}>
        <button
          onClick={handleToggleChat}
          className="chat-toggle-btn"
          aria-label="Toggle AI Chat"
        >
          {isOpen ? (
            // Close icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Message icon
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          
          {/* Notification badge for new features */}
          {!isOpen && <span className="notification-badge">AI</span>}
        </button>

        {/* Status indicator */}
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="floating-chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="header-content">
              <div className="ai-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                  <circle cx="9" cy="9" r="1.5"/>
                  <circle cx="15" cy="9" r="1.5"/>
                  <path d="M9 13h6v1.5H9z"/>
                </svg>
              </div>
              <div className="header-text">
                <h3>AI Assistant</h3>
                <span className={`status-text ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={handleClearChat}
                className="action-btn"
                title="Clear chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                {message.role === 'assistant' && (
                  <div className="message-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                )}
                
                <div className="message-content">
                  <div 
                    className="message-text"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content)
                    }}
                  />
                  {message.timestamp && (
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading || !isOnline}
              className="chat-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !isOnline}
              className="send-btn"
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {/* Powered by */}
          <div className="chat-footer">
            <span>Powered by AI • Gemini 2.5 Flash</span>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
