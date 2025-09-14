import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Chat } from './types';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
}

export const ChatSidebar = ({
  chats,
  selectedChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: ChatSidebarProps) => {
  return (
    <div 
      className="flex flex-col"
      style={{ height: '100vh', backgroundColor: 'rgba(0,255,0,0.1)' }} // Temporary debug
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-chat-header flex-shrink-0">
        <h1 className="text-xl font-semibold mb-4">Messages</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input border-border focus:ring-primary"
          />
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('all')}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('unread')}
            className="flex-1"
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div 
        className="flex-1 min-h-0"
        style={{
          overflowY: 'auto',
          maxHeight: '100%'
        }}
      >
        {chats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No conversations found</p>
          </div>
        ) : (
          <>
            {chats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ backgroundColor: 'hsl(var(--chat-hover))' }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-4 cursor-pointer transition-colors border-b border-border/50",
                  selectedChat?.id === chat.id && "bg-chat-active"
                )}
                onClick={() => onSelectChat(chat)}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar} alt={chat.name} />
                      <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-online-indicator rounded-full border-2 border-chat-sidebar" />
                    )}
                  </div>
                  
                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate text-foreground">{chat.name}</h3>
                      <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="h-5 px-2 text-xs bg-primary">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
