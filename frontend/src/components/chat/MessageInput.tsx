import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, FileText, Image as ImageIcon, Mic, X, Loader2, Trash2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendFile?: (file: File, type: 'image' | 'document' | 'voice') => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  uploadProgress?: number;
}

const emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '👏', '🎉', '❤️', '🔥'];

export const MessageInput = ({ 
  onSendMessage, 
  onSendFile,
  onStartTyping, 
  onStopTyping,
  disabled = false,
  uploadProgress 
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      handleStopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && onStartTyping) {
      onStartTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (onStopTyping) {
      onStopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = (file: File, type: 'image' | 'document') => {
    if (type === 'image' && file.type.startsWith('image/')) {
      // Show preview for images
      const url = URL.createObjectURL(file);
      setPreviewFile({ file, url });
    } else {
      // Send document directly
      onSendFile?.(file, type);
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'image');
    }
    e.target.value = ''; // Reset input
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'document');
    }
    e.target.value = ''; // Reset input
  };

  const handleSendPreview = () => {
    if (previewFile) {
      onSendFile?.(previewFile.file, 'image');
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  const handleCancelPreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ blob: audioBlob, url: audioUrl });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleDeleteRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    setRecordingTime(0);
  };

  const handleSendRecording = () => {
    if (recordedAudio) {
      const audioFile = new File([recordedAudio.blob], `voice-${Date.now()}.webm`, {
        type: recordedAudio.blob.type,
      });
      onSendFile?.(audioFile, 'voice');
      handleDeleteRecording();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Drag and drop for images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file, 'image');
      }
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <>
      {/* Image preview modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={handleCancelPreview}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-lg p-4 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send Image</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreview}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={previewFile.url}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain rounded mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelPreview}>
                  Cancel
                </Button>
                <Button onClick={handleSendPreview}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        {...getRootProps()}
        className={`${
          isDragActive ? 'ring-2 ring-primary' : ''
        }`}
      >
        <input {...getInputProps()} />
        
        <motion.div
          className="p-4 bg-chat-header border-t border-border"
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
        
        {/* Upload progress */}
        {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Uploading...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          {/* Attachment buttons */}
          <div className="flex space-x-1">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleDocumentChange}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleImageClick}
              disabled={disabled}
              title="Send image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDocumentClick}
              disabled={disabled}
              title="Send document"
            >
              <FileText className="h-4 w-4" />
            </Button>

            {/* Voice recorder */}
            {!isRecording && !recordedAudio ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleStartRecording}
                disabled={disabled}
                title="Record voice message"
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : isRecording ? (
              <div className="flex items-center space-x-2 px-2 bg-red-50 dark:bg-red-900/20 rounded-full py-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="h-2 w-2 bg-red-500 rounded-full"
                />
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {formatRecordingTime(recordingTime)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleStopRecording}
                  title="Stop recording"
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              </div>
            ) : recordedAudio ? (
              <div className="flex items-center space-x-2 px-2 bg-primary/10 rounded-full py-1">
                <audio src={recordedAudio.url} controls className="h-8" style={{ width: '150px' }} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={handleDeleteRecording}
                  title="Delete recording"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-primary"
                  onClick={handleSendRecording}
                  title="Send recording"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            ) : null}
          </div>

          {/* Message input */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder={isDragActive ? "Drop image here..." : "Type a message..."}
              className="pr-10 bg-input border-border focus:ring-primary rounded-full"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          
            {/* Emoji picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Send button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              disabled={!message.trim() || disabled}
            >
              {disabled ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </form>
        </motion.div>
      </div>
    </>
  );
};
