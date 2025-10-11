import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
}

const MessageStatus = ({ status }: { status?: Message['status'] }) => {
  if (!status) return null;

  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3 text-white/70" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-white/70" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-white" />;
    default:
      return null;
  }
};

export const MessageList = ({ messages }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div 
      className="flex-1 p-4 space-y-4 min-h-0"
      style={{
        overflowY: 'auto',
        maxHeight: '100%'
      }}
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
              delay: index * 0.05,
            }}
            className={cn(
              "flex",
              message.sender === 'me' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-chat",
                message.sender === 'me'
                  ? 'bg-chat-message-sent text-white rounded-br-md'
                  : 'bg-chat-message-received text-foreground rounded-bl-md'
              )}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={cn(
                    "text-xs",
                    message.sender === 'me'
                      ? 'text-white/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {message.timestamp}
                </p>
                {message.sender === 'me' && (
                  <MessageStatus status={message.status} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
