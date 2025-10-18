import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, FileText, Download, Loader2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from './types';
import { Button } from '@/components/ui/button';
import WaveSurfer from 'wavesurfer.js';

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

const ImageMessage = ({ fileUrl, thumbnailUrl, sender }: { 
  fileUrl: string; 
  thumbnailUrl?: string;
  sender: 'me' | 'other';
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setIsFullscreen(true)}>
        <img
          src={thumbnailUrl || fileUrl}
          alt="Shared image"
          className="max-w-xs rounded-lg"
          onLoad={() => setIsLoading(false)}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
        {isLoading && (
          <div className="flex items-center justify-center h-32 w-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={fileUrl}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </>
  );
};

const DocumentMessage = ({ fileName, fileUrl, fileSize }: { 
  fileName?: string; 
  fileUrl: string;
  fileSize?: number;
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-background/10 rounded-lg">
      <div className="flex-shrink-0">
        <FileText className="h-8 w-8" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName || 'Document'}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0"
        onClick={() => window.open(fileUrl, '_blank')}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

const VoiceMessage = ({ fileUrl, duration }: { 
  fileUrl: string;
  duration?: number;
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#a3a3a3',
        progressColor: '#3b82f6',
        cursorColor: '#3b82f6',
        height: 40,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
      });

      wavesurferRef.current.load(fileUrl);

      wavesurferRef.current.on('ready', () => {
        setIsLoading(false);
      });

      wavesurferRef.current.on('play', () => {
        setIsPlaying(true);
      });

      wavesurferRef.current.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurferRef.current.on('finish', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
    };
  }, [fileUrl]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 min-w-[250px]">
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 h-10 w-10 p-0 rounded-full"
        onClick={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      <div className="flex-1">
        <div ref={waveformRef} className="w-full" />
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatDuration(duration)}
      </span>
    </div>
  );
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
              {/* Render based on message type */}
              {message.type === 'image' && message.fileUrl ? (
                <ImageMessage 
                  fileUrl={message.fileUrl} 
                  thumbnailUrl={message.thumbnailUrl}
                  sender={message.sender}
                />
              ) : message.type === 'document' && message.fileUrl ? (
                <DocumentMessage 
                  fileName={message.fileName}
                  fileUrl={message.fileUrl}
                  fileSize={message.fileSize}
                />
              ) : message.type === 'voice' && message.fileUrl ? (
                <VoiceMessage 
                  fileUrl={message.fileUrl}
                  duration={message.duration}
                />
              ) : (
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}
              
              {/* Show caption for images/documents if there's text */}
              {(message.type === 'image' || message.type === 'document') && message.text && (
                <p className="text-sm leading-relaxed mt-2">{message.text}</p>
              )}

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
