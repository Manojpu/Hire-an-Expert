import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, UserX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth/AuthContext";
import { messageService } from "@/services/messageService";
import type { Chat } from "./types";

// Import components using absolute path
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatConversation } from "@/components/chat/ChatConversation";

interface ChatLayoutProps {
  initialConversationId?: string;
  expertId?: string;
  expertName?: string;
  initialConversationData?: Chat;
}

export const ChatLayout = ({
  initialConversationId,
  expertId,
  expertName,
  initialConversationData,
}: ChatLayoutProps) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSelectedInitialChat, setHasSelectedInitialChat] = useState(false); // Track if we've already selected the initial chat
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    // Navigate to appropriate dashboard based on user role
    if (user?.role === "expert") {
      navigate("/expert-dashboard");
    } else if (user?.role === "client") {
      navigate("/client-dashboard");
    } else {
      navigate("/"); // Default to home page
    }
  };

  const handleBlockUser = async () => {
    if (!selectedChat) return;

    try {
      // Add your block user logic here
      console.log("Blocking user:", selectedChat.name);
      // You can implement the actual blocking functionality
      // await messageService.blockUser(selectedChat.id);

      // Remove from conversations list
      setConversations((prev) =>
        prev.filter((chat) => chat.id !== selectedChat.id)
      );
      setSelectedChat(null);

      // Show success message (you can add a toast notification here)
      alert(`User ${selectedChat.name} has been blocked`);
    } catch (error) {
      console.error("Failed to block user:", error);
      alert("Failed to block user. Please try again.");
    }
  };

  const handleClearChat = async () => {
    if (!selectedChat) return;

    if (
      window.confirm(
        `Are you sure you want to clear all messages with ${selectedChat.name}? This action cannot be undone.`
      )
    ) {
      try {
        // Add your clear chat logic here
        console.log("Clearing chat:", selectedChat.id);
        // You can implement the actual clear chat functionality
        // await messageService.clearChat(selectedChat.id);

        // Update the conversation to show no messages
        setConversations((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? { ...chat, lastMessage: "Chat cleared", unreadCount: 0 }
              : chat
          )
        );

        // Show success message
        alert(`Chat with ${selectedChat.name} has been cleared`);
      } catch (error) {
        console.error("Failed to clear chat:", error);
        alert("Failed to clear chat. Please try again.");
      }
    }
  };

  useEffect(() => {
    let unsubscribeConversationUpdate: (() => void) | undefined;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const fetchedConversations = await messageService.getConversations(
          user.uid
        );

        let mergedConversations = fetchedConversations;

        if (initialConversationData) {
          const exists = fetchedConversations.some(
            (chat) => chat.id === initialConversationData.id
          );

          if (!exists) {
            mergedConversations = [
              initialConversationData,
              ...fetchedConversations,
            ];
          }
        } else if (initialConversationId && expertId && expertName) {
          const exists = fetchedConversations.some(
            (chat) => chat.id === initialConversationId
          );

          if (!exists) {
            const placeholderConversation: Chat = {
              id: initialConversationId,
              name: expertName,
              lastMessage: "No messages yet",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              unreadCount: 0,
              isOnline: false,
              avatar: "/placeholder.svg",
              senderId: user.uid,
              receiverId: expertId,
              updatedAt: new Date().toISOString(),
            };
            mergedConversations = [
              placeholderConversation,
              ...fetchedConversations,
            ];
          }
        }

        setConversations(mergedConversations);

        // If we have an initial conversation ID from navigation AND haven't selected it yet
        if (initialConversationId && !hasSelectedInitialChat) {
          const targetConversation = mergedConversations.find(
            (conv) => conv.id === initialConversationId
          );
          if (targetConversation) {
            console.log(
              `🎯 Selecting conversation from GigView: ${initialConversationId}`
            );
            setSelectedChat(targetConversation);
            setHasSelectedInitialChat(true); // Mark as selected to prevent re-selection
          } else {
            console.log(
              `⚠️ Initial conversation not found in list, selecting first`
            );
            if (mergedConversations.length > 0) {
              setSelectedChat(mergedConversations[0]);
            }
            setHasSelectedInitialChat(true);
          }
        } else if (
          mergedConversations.length > 0 &&
          !selectedChat &&
          !hasSelectedInitialChat
        ) {
          // Default behavior: select first conversation only if we haven't selected anything yet
          setSelectedChat(mergedConversations[0]);
          setHasSelectedInitialChat(true);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      // Connect to Socket.IO
      console.log("🔌 Connecting to message service...");
      messageService.connect(user.uid);

      loadConversations();

      // Listen for conversation updates globally (for all conversations)
      unsubscribeConversationUpdate = messageService.onConversationUpdate(
        (updatedConversation) => {
          console.log("📬 Global conversation update received:", {
            convId: updatedConversation._id,
            lastMessage: updatedConversation.lastMessage,
            senderId: updatedConversation.senderId,
            receiverId: updatedConversation.receiverId,
            unreadCount: updatedConversation.unreadCount,
            currentUser: user?.uid,
          });

          setConversations((prev) => {
            // Find if this conversation exists
            const existingIndex = prev.findIndex(
              (conv) => conv.id === updatedConversation._id
            );

            if (existingIndex >= 0) {
              // Calculate new unread count based on whether current user is sender or receiver
              const isSender = user?.uid === updatedConversation.senderId;

              console.log(`🔍 Debug unread count:`, {
                "user.uid": user?.uid,
                "conversation.senderId": updatedConversation.senderId,
                "conversation.receiverId": updatedConversation.receiverId,
                "senderId type": typeof updatedConversation.senderId,
                "receiverId type": typeof updatedConversation.receiverId,
                "user.uid type": typeof user?.uid,
                isSender: isSender,
                "strict equality": user?.uid === updatedConversation.senderId,
                "unreadCount object": updatedConversation.unreadCount,
                "unreadCount.senderId":
                  updatedConversation.unreadCount?.senderId,
                "unreadCount.receiverId":
                  updatedConversation.unreadCount?.receiverId,
              });

              // Make sure to convert to string for comparison
              const currentUserIdStr = String(user?.uid);
              const senderIdStr = String(updatedConversation.senderId);
              const receiverIdStr = String(updatedConversation.receiverId);
              const isSenderStrict = currentUserIdStr === senderIdStr;

              const newUnreadCount = isSenderStrict
                ? updatedConversation.unreadCount?.senderId || 0
                : updatedConversation.unreadCount?.receiverId || 0;

              const oldUnreadCount = prev[existingIndex].unreadCount;

              console.log(
                `📊 Unread count update - Current user is ${
                  isSenderStrict ? "SENDER" : "RECEIVER"
                }, Old: ${oldUnreadCount}, New: ${newUnreadCount}`
              );

              // Update existing conversation
              const updatedConv = {
                ...prev[existingIndex],
                lastMessage: updatedConversation.lastMessage,
                timestamp: new Date(
                  updatedConversation.updatedAt
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                updatedAt: updatedConversation.updatedAt,
                unreadCount: newUnreadCount,
              };

              // Only move to top if this is a NEW message (unread count increased)
              // Don't move to top when just marking messages as read
              const isNewMessage = newUnreadCount > oldUnreadCount;

              if (isNewMessage) {
                // Move updated conversation to top
                const newConversations = [...prev];
                newConversations.splice(existingIndex, 1); // Remove from current position
                newConversations.unshift(updatedConv); // Add to top
                console.log(
                  `✅ New message in conversation ${updatedConv.id}, moved to top, unread: ${updatedConv.unreadCount}`
                );
                return newConversations;
              } else {
                // Just update in place (e.g., when marking as read)
                const newConversations = [...prev];
                newConversations[existingIndex] = updatedConv;
                console.log(
                  `✅ Updated conversation ${updatedConv.id} in place, unread: ${updatedConv.unreadCount}`
                );
                return newConversations;
              }
            } else {
              // New conversation - reload all conversations
              console.log("🆕 New conversation detected, reloading...");
              loadConversations();
              return prev;
            }
          });
        }
      );
    }

    return () => {
      // Cleanup the specific listener for this component
      if (unsubscribeConversationUpdate) {
        unsubscribeConversationUpdate();
      }
    };
  }, [
    user?.uid,
    selectedChat,
    initialConversationData,
    initialConversationId,
    expertId,
    expertName,
  ]);

  const filteredChats = conversations.filter((chat) => {
    const matchesSearch = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || chat.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  const handleConversationUpdate = (updatedConversation: any) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === updatedConversation._id
          ? {
              ...conv,
              lastMessage: updatedConversation.lastMessage,
              unreadCount:
                user?.uid === updatedConversation.senderId
                  ? updatedConversation.unreadCount?.senderId || 0
                  : updatedConversation.unreadCount?.receiverId || 0,
              timestamp: new Date(
                updatedConversation.updatedAt
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
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
        transition={{ duration: 0.3, ease: "easeOut" }}
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
