import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatLayout } from "@/components/chat/ChatLayout";
import type { Chat } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth/AuthContext";
import { ExpertData, userServiceAPI } from "@/services/userService";
import { messageService } from "@/services/messageService";

const Book = () => {
  const { expertId } = useParams();
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [expertLoading, setExpertLoading] = useState<boolean>(true);
  const [expertError, setExpertError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialConversation, setInitialConversation] = useState<Chat | null>(
    null
  );
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadExpert = async () => {
      if (!expertId) {
        setExpertError("No expert specified");
        setExpert(null);
        setExpertLoading(false);
        return;
      }

      try {
        setExpertLoading(true);
        setExpertError(null);
        const expertData = await userServiceAPI.getUserById(expertId);
        if (isMounted) {
          setExpert(expertData);
        }
      } catch (err) {
        console.error("Failed to load expert profile", err);
        if (isMounted) {
          setExpert(null);
          setExpertError(
            "Failed to load expert profile. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setExpertLoading(false);
        }
      }
    };

    loadExpert();

    return () => {
      isMounted = false;
    };
  }, [expertId]);

  useEffect(() => {
    const setupConversation = async () => {
      if (!user?.uid) {
        return;
      }

      if (expertLoading || !expert) {
        return;
      }

      if (!expert.firebase_uid) {
        console.warn("Expert record missing firebase UID, cannot start chat.");
        setExpertError("Expert account is not configured for messaging yet.");
        return;
      }

      const expertFirebaseUid = expert.firebase_uid;

      if (conversationId) {
        return;
      }

      try {
        const conversation = await messageService.getOrCreateConversation(
          user.uid,
          expertFirebaseUid
        );

        const resolvedId = conversation.id;
        if (!resolvedId) {
          throw new Error("Conversation id missing in response");
        }

        const avatarFallback =
          conversation.avatar && conversation.avatar !== "/placeholder.svg"
            ? conversation.avatar
            : expert.profile_image_url || "/placeholder.svg";
        const nameFallback =
          conversation.name && conversation.name !== "New Conversation"
            ? conversation.name
            : expert.name;

        const receiverId = conversation.receiverId || expertFirebaseUid;

        setInitialConversation({
          ...conversation,
          id: resolvedId,
          name: nameFallback,
          avatar: avatarFallback,
          receiverId,
        });
        setConversationId(resolvedId);
      } catch (error) {
        console.error("Failed to prepare conversation", error);
        toast({
          title: "Unable to start chat",
          description: "Please try reloading the page or contact support.",
          variant: "destructive",
        });
        setExpertError("Failed to start chat with the expert.");
      }
    };

    setupConversation();
  }, [expert, expertLoading, user?.uid, conversationId, toast]);

  if (expertLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        Loading expert details...
      </div>
    );
  }

  if (expertError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        {expertError}
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        Expert not found.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <p className="text-lg font-medium">
            Please sign in to chat with {expert.name}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You need to be logged in to start a conversation with this expert.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {conversationId ? (
        <ChatLayout
          initialConversationId={conversationId}
          expertId={expert.firebase_uid}
          expertName={expert.name}
          initialConversationData={initialConversation ?? undefined}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              Preparing chat with {expert.name}...
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Book;
