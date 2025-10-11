import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth/AuthContext';
import { messageService } from '@/services/messageService';
import type { Chat } from './types';

// Import components using absolute path
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatConversation } from '@/components/chat/ChatConversation';

export const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    // Navigate to appropriate dashboard based on user role
    if (user?.role === 'expert') {
      navigate('/expert-dashboard');
    } else if (user?.role === 'client') {
      navigate('/client-dashboard');
    } else {
      navigate('/'); // Default to home page
    }
  };

  const handleBlockUser = async () => {
    if (!selectedChat) return;
    
    try {
      // Add your block user logic here
      console.log('Blocking user:', selectedChat.name);
      // You can implement the actual blocking functionality
      // await messageService.blockUser(selectedChat.id);
      
      // Remove from conversations list
      setConversations(prev => prev.filter(chat => chat.id !== selectedChat.id));
      setSelectedChat(null);
      
      // Show success message (you can add a toast notification here)
      alert(`User ${selectedChat.name} has been blocked`);
    } catch (error) {
      console.error('Failed to block user:', error);
      alert('Failed to block user. Please try again.');
    }
  };

  const handleClearChat = async () => {
    if (!selectedChat) return;
    
    if (window.confirm(`Are you sure you want to clear all messages with ${selectedChat.name}? This action cannot be undone.`)) {
      try {
        // Add your clear chat logic here
        console.log('Clearing chat:', selectedChat.id);
        // You can implement the actual clear chat functionality
        // await messageService.clearChat(selectedChat.id);
        
        // Update the conversation to show no messages
        setConversations(prev => 
          prev.map(chat => 
            chat.id === selectedChat.id 
              ? { ...chat, lastMessage: 'Chat cleared', unreadCount: 0 }
              : chat
          )
        );
        
        // Show success message
        alert(`Chat with ${selectedChat.name} has been cleared`);
      } catch (error) {
        console.error('Failed to clear chat:', error);
        alert('Failed to clear chat. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations(user?.uid);
      setConversations(data);
      if (data.length > 0 && !selectedChat) {
        setSelectedChat(data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = conversations.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || chat.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  const handleConversationUpdate = (updatedConversation: any) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation._id 
          ? {
              ...conv,
              lastMessage: updatedConversation.lastMessage,
              unreadCount: user?.uid === updatedConversation.senderId 
                ? updatedConversation.unreadCount?.senderId || 0
                : updatedConversation.unreadCount?.receiverId || 0,
              timestamp: new Date(updatedConversation.updatedAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          : conv
      )
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-chat-bg items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-chat-bg overflow-hidden relative">
      {/* Action Buttons - Fixed in upper right corner */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={handleBackToDashboard}
          variant="ghost"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        {/* Options Menu - Only show when a chat is selected */}
        {selectedChat && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={handleClearChat}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleBlockUser}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <motion.div
        className="w-80 bg-chat-sidebar border-r border-border flex-shrink-0 flex flex-col relative overflow-hidden"
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <ChatSidebar
          chats={filteredChats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </motion.div>
      
      <motion.div
        className="flex-1 flex flex-col overflow-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {selectedChat ? (
          <ChatConversation 
            chat={selectedChat} 
            onConversationUpdate={handleConversationUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-chat-bg">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Select a conversation
              </h2>
              <p className="text-muted-foreground">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
