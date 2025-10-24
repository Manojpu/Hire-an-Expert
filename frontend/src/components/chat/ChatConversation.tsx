import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chat, Message } from "./types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { messageService } from "@/services/messageService";
import { useAuth } from "@/context/auth/AuthContext";

interface ChatConversationProps {
  chat: Chat;
  onConversationUpdate?: (conversation: any) => void;
}

export const ChatConversation = ({
  chat,
  onConversationUpdate,
}: ChatConversationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribeReceiveMessage: (() => void) | undefined;
    let unsubscribeConversationUpdate: (() => void) | undefined;
    let unsubscribeUserTyping: (() => void) | undefined;
    let unsubscribeMessagesRead: (() => void) | undefined;

    if (chat.id && user?.uid) {
      loadMessages();
      joinRoom();

      // Listen for real-time message updates
      unsubscribeReceiveMessage = messageService.onReceiveMessage((message) => {
        if (message.conversationId === chat.id) {
          const incomingType = message.type || "text";
          const formattedMessage: Message = {
            id: message._id,
            text: message.text,
            sender: message.senderId === user.uid ? "me" : "other",
            timestamp: new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: message.status,
            senderId: message.senderId,
            receiverId: message.receiverId,
            conversationId: message.conversationId,
            type: incomingType,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            mimeType: message.mimeType,
            duration: message.duration,
            thumbnailUrl: message.thumbnailUrl,
          };

          // Duplicate check by message ID OR by timestamp + senderId (for optimistic updates)
          setMessages((prev) => {
            // Check if message already exists by ID
            const existsById = prev.find((msg) => msg.id === message._id);
            if (existsById) {
              return prev; // Message already exists, don't add duplicate
            }

            // Check if this is an optimistic message that was already added
            // (within last 5 seconds, same sender, same conversation, same type)
            const recentOptimistic = prev.find(
              (msg) =>
                msg.senderId === message.senderId &&
                msg.conversationId === message.conversationId &&
                (msg.type || "text") === incomingType &&
                msg.fileUrl === message.fileUrl &&
                (msg.text || "") === (message.text || "") &&
                msg.id.toString().startsWith("temp-")
            );

            if (recentOptimistic) {
              // Replace the optimistic message with the real one
              return prev.map((msg) =>
                msg.id === recentOptimistic.id ? formattedMessage : msg
              );
            }

            // New message, add it
            return [...prev, formattedMessage];
          });

          // Auto-mark messages as read if I received a message (not sent by me)
          if (message.senderId !== user.uid) {
            console.log("📬 Received message from other user, marking as read");
            messageService.markMessagesAsRead(chat.id, user.uid);
          }
        }
      });

      // Listen for conversation updates
      unsubscribeConversationUpdate = messageService.onConversationUpdate(
        (conversation) => {
          if (conversation._id === chat.id && onConversationUpdate) {
            onConversationUpdate(conversation);
          }
        }
      );

      // Listen for typing indicators
      unsubscribeUserTyping = messageService.onUserTyping((data) => {
        if (data.userId !== user.uid) {
          setIsTyping(data.isTyping);
        }
      });

      // Listen for message status updates (real-time read receipts)
      unsubscribeMessagesRead = messageService.onMessagesRead((data) => {
        console.log("📖 Messages read update received:", data);

        if (data.conversationId === chat.id) {
          // Update messages status to 'read' for messages sent by current user
          // that were read by the other user
          setMessages((prev) =>
            prev.map((msg) => {
              // Only update messages sent by me (current user)
              if (msg.senderId === user.uid && msg.status !== "read") {
                console.log(`✅ Updating message ${msg.id} to 'read'`);
                return { ...msg, status: "read" };
              }
              return msg;
            })
          );
        }
      });

      // Mark messages as read when opening conversation
      messageService.markMessagesAsRead(chat.id, user.uid);
    }

    return () => {
      // Cleanup specific listeners for this component
      unsubscribeReceiveMessage?.();
      unsubscribeConversationUpdate?.();
      unsubscribeUserTyping?.();
      unsubscribeMessagesRead?.();
    };
  }, [chat.id, user?.uid]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(chat.id);
      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg._id,
        text: msg.text,
        sender: msg.senderId === user?.uid ? "me" : "other",
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: msg.status,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        conversationId: msg.conversationId,
        type: msg.type || "text",
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        mimeType: msg.mimeType,
        duration: msg.duration,
        thumbnailUrl: msg.thumbnailUrl,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    messageService.joinRoom(chat.id);
  };

  const handleSendMessage = async (text: string) => {
    if (!user?.uid) return;

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const receiverId =
      chat.senderId === user.uid ? chat.receiverId : chat.senderId;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      text: trimmedText,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
      senderId: user.uid,
      receiverId,
      conversationId: chat.id,
      type: "text",
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const savedMessage = await messageService.sendMessage({
        senderId: user.uid,
        receiverId,
        text: trimmedText,
        conversationId: chat.id,
      });

      const savedTimestamp =
        savedMessage.timestamp ||
        savedMessage.createdAt ||
        new Date().toISOString();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId
            ? {
                ...msg,
                id: savedMessage._id || savedMessage.id || optimisticId,
                status: savedMessage.status || "sent",
                timestamp: new Date(savedTimestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
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

  const handleSendFile = async (
    file: File,
    type: "image" | "document" | "voice"
  ) => {
    if (!user?.uid) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file to Cloudinary
      const uploadResult = await messageService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Create optimistic message
      const optimisticMessageId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticMessageId,
        text: "",
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
        senderId: user.uid,
        receiverId:
          chat.senderId === user.uid ? chat.receiverId : chat.senderId,
        conversationId: chat.id,
        type,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        duration: uploadResult.duration,
        thumbnailUrl: uploadResult.thumbnailUrl,
      };

      // Add optimistic message to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Send message with file attachment
      const savedMessage = await messageService.sendMessageWithFile({
        senderId: user.uid,
        receiverId:
          chat.senderId === user.uid ? chat.receiverId : chat.senderId,
        conversationId: chat.id,
        type,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        duration: uploadResult.duration,
        thumbnailUrl: uploadResult.thumbnailUrl,
      });

      // Replace optimistic message with real message from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessageId
            ? {
                ...msg,
                id: savedMessage._id,
                status: savedMessage.status || "sent", // Use backend status
              }
            : msg
        )
      );

      setUploadProgress(100);

      // Reset upload state after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Failed to send file:", error);
      setIsUploading(false);
      setUploadProgress(0);
      // You could show an error toast here if needed
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
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.avatar} alt={chat.name} />
              <AvatarFallback>
                {chat.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {chat.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-online-indicator rounded-full border-2 border-chat-header" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{chat.name}</h2>
            <p className="text-xs text-muted-foreground">
              {isTyping
                ? "Typing..."
                : chat.isOnline
                ? "Online"
                : `Last seen ${chat.lastSeen}`}
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
              <DropdownMenuItem className="text-destructive">
                Block User
              </DropdownMenuItem>
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
        onSendFile={handleSendFile}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
        disabled={isUploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};
