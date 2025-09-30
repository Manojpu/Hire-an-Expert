import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Chat, Message } from './types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { messageService } from '@/services/messageService';
import { useAuth } from '@/context/auth/AuthContext';

interface ChatConversationProps {
  chat: Chat;
  onConversationUpdate?: (conversation: any) => void;
}

export const ChatConversation = ({ chat, onConversationUpdate }: ChatConversationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (chat.id && user?.uid) {
      loadMessages();
      joinRoom();
      
      // Listen for real-time message updates
      messageService.onReceiveMessage((message) => {
        if (message.conversationId === chat.id) {
          const formattedMessage: Message = {
            id: message._id,
            text: message.text,
            sender: message.senderId === user.uid ? 'me' : 'other',
            timestamp: new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: message.status,
            senderId: message.senderId,
            receiverId: message.receiverId,
            conversationId: message.conversationId
          };
          
          // Simple duplicate check by message ID
          setMessages(prev => {
            const exists = prev.find(msg => msg.id === message._id);
            if (exists) {
              return prev; // Message already exists, don't add duplicate
            }
            return [...prev, formattedMessage];
          });
        }
      });

      // Listen for conversation updates
      messageService.onConversationUpdate((conversation) => {
        if (conversation._id === chat.id && onConversationUpdate) {
          onConversationUpdate(conversation);
        }
      });

      // Listen for typing indicators
      messageService.onUserTyping((data) => {
        if (data.userId !== user.uid) {
          setIsTyping(data.isTyping);
        }
      });

      // Listen for message status updates
      messageService.onMessagesRead((data) => {
        if (data.conversationId === chat.id) {
          setMessages(prev => prev.map(msg => 
            msg.sender === 'me' && msg.status !== 'read' 
              ? { ...msg, status: 'read' } 
              : msg
          ));
        }
      });

      // Mark messages as read when opening conversation
      messageService.markMessagesAsRead(chat.id, user.uid);
    }

    return () => {
      messageService.cleanup();
    };
  }, [chat.id, user?.uid]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(chat.id);
      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg._id,
        text: msg.text,
        sender: msg.senderId === user?.uid ? 'me' : 'other',
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: msg.status,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        conversationId: msg.conversationId
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    messageService.joinRoom(chat.id);
  };

  const handleSendMessage = async (text: string) => {
    if (!user?.uid) return;

    try {
      await messageService.sendMessage({
        senderId: user.uid,
        receiverId: chat.senderId === user.uid ? chat.receiverId : chat.senderId,
        text,
        conversationId: chat.id
      });
      
      // No optimistic update - let the real-time listener handle adding the message
      // This prevents duplicates and database overhead
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could show an error toast here if needed
    }
  };

  const handleStartTyping = () => {
    if (user?.uid) {
      messageService.startTyping(chat.id, user.uid);
    }
  };

  const handleStopTyping = () => {
    if (user?.uid) {
      messageService.stopTyping(chat.id, user.uid);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-chat-bg overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 bg-chat-header border-b border-border shadow-chat"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.avatar} alt={chat.name} />
              <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            {chat.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-online-indicator rounded-full border-2 border-chat-header" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{chat.name}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping ? 'Typing...' : chat.isOnline ? 'Online' : `Last seen ${chat.lastSeen}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
};
