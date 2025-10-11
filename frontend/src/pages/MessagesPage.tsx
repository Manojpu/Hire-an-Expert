import { useEffect } from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { useAuth } from '@/context/auth/AuthContext';
import { messageService } from '@/services/messageService';

const MessagesPage = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      // Connect to messaging service when component mounts
      messageService.connect(user.uid);
    }

    return () => {
      // Disconnect when component unmounts
      messageService.disconnect();
    };
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-chat-bg">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Please log in to access messages
          </h2>
          <p className="text-muted-foreground">
            You need to be logged in to use the messaging feature
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <ChatLayout />
    </div>
  );
};

export default MessagesPage;
