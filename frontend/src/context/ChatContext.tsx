"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { IConversation, IMessage, IUser, SocketConversationUpdatedData, SocketTypingData } from "@/types";
import {
  getConversationsApi,
  getMessagesApi,
  getOrCreateConversationApi,
  markMessagesAsReadApi,
  sendMessageApi,
} from "@/lib/api";
import {
  connectSocket,
  emitJoinConversation,
  emitLeaveConversation,
  emitMessageRead,
  emitStopTyping,
  emitTyping,
  getSocket,
} from "@/lib/socket";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  conversations: IConversation[];
  activeConversation: IConversation | null;
  messages: IMessage[];
  onlineUsers: Set<string>;
  typingData: Record<string, { userId: string; username?: string }>;
  loadingConversations: boolean;
  loadingMessages: boolean;
  selectConversation: (conversation: IConversation) => Promise<void>;
  sendMessage: (payload: { text?: string; file?: File }) => Promise<void>;
  startConversationWithUser: (user: IUser) => Promise<IConversation>;
  notifyTyping: () => void;
  notifyStopTyping: () => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingData, setTypingData] = useState<Record<string, { userId: string; username?: string }>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeConversationRef = useRef<IConversation | null>(null);
  activeConversationRef.current = activeConversation;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all conversations
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingConversations(true);
      const data = await getConversationsApi();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, refreshConversations]);

  // Select active conversation and load messages
  const selectConversation = async (conversation: IConversation) => {
    if (activeConversationRef.current?._id === conversation._id) return;

    if (activeConversationRef.current) {
      emitLeaveConversation(activeConversationRef.current._id);
    }

    setActiveConversation(conversation);
    emitJoinConversation(conversation._id);

    try {
      setLoadingMessages(true);
      const data = await getMessagesApi(conversation._id);
      
      // Deduplicate fetched messages by _id
      const uniqueMessages: IMessage[] = [];
      const seenIds = new Set<string>();
      for (const msg of data.messages || []) {
        const id = String(msg._id);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          uniqueMessages.push(msg);
        }
      }
      setMessages(uniqueMessages);

      // Mark unread messages as read
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        await markMessagesAsReadApi(conversation._id).catch(() => {});
        setConversations((prev) =>
          prev.map((c) => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c))
        );

        const otherUserId = conversation.otherUser?._id;
        if (otherUserId) {
          emitMessageRead(conversation._id, otherUserId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages for conversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Start new or select existing conversation with another user
  const startConversationWithUser = async (targetUser: IUser): Promise<IConversation> => {
    const existing = conversations.find((c) => c.otherUser?._id === targetUser._id);
    if (existing) {
      await selectConversation(existing);
      return existing;
    }

    const data = await getOrCreateConversationApi(targetUser._id);
    const newConv: IConversation = {
      ...data.conversation,
      otherUser: targetUser,
      unreadCount: 0,
    };

    setConversations((prev) => [newConv, ...prev.filter((c) => c._id !== newConv._id)]);
    await selectConversation(newConv);
    return newConv;
  };

  // Send message in active conversation
  const sendMessage = async ({ text, file }: { text?: string; file?: File }) => {
    if (!activeConversation || (!text?.trim() && !file)) return;

    try {
      const data = await sendMessageApi(activeConversation._id, { text, file });
      const newMsg = data.message;

      // Safe deduplicated add
      setMessages((prev) => {
        const idStr = String(newMsg._id);
        if (prev.some((m) => String(m._id) === idStr)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: newMsg, updatedAt: new Date().toISOString() }
            : c
        )
      );

      // Stop typing
      notifyStopTyping();
    } catch (err) {
      console.error("Failed to send message:", err);
      throw err;
    }
  };

  // Typing indicators
  const notifyTyping = () => {
    if (!activeConversation) return;
    const receiverId = activeConversation.otherUser?._id;
    emitTyping(activeConversation._id, receiverId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      notifyStopTyping();
    }, 2500);
  };

  const notifyStopTyping = () => {
    if (!activeConversation) return;
    const receiverId = activeConversation.otherUser?._id;
    emitStopTyping(activeConversation._id, receiverId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Socket event subscriptions
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleNewMessage = (newMsg: IMessage) => {
      const currentActive = activeConversationRef.current;

      // If message belongs to active chat, append it and mark as read
      if (currentActive && currentActive._id === newMsg.conversation) {
        setMessages((prev) => {
          const idStr = String(newMsg._id);
          if (prev.some((m) => String(m._id) === idStr)) return prev;
          return [...prev, newMsg];
        });

        markMessagesAsReadApi(currentActive._id).catch(() => {});
        const senderId = typeof newMsg.sender === "object" ? newMsg.sender._id : newMsg.sender;
        if (senderId) {
          emitMessageRead(currentActive._id, senderId, newMsg._id);
        }
      }

      // Update sidebar conversations
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === newMsg.conversation);
        if (index > -1) {
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = newMsg;
          conv.updatedAt = newMsg.createdAt;
          if (!currentActive || currentActive._id !== newMsg.conversation) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(index, 1);
          return [conv, ...updated];
        } else {
          // If conversation is not in list, fetch conversations
          refreshConversations();
          return prev;
        }
      });
    };

    const handleConversationUpdated = (data: SocketConversationUpdatedData) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? { ...c, lastMessage: data.lastMessage, updatedAt: data.lastMessage.createdAt }
            : c
        )
      );
    };

    const handleUserTyping = (data: SocketTypingData) => {
      setTypingData((prev) => ({
        ...prev,
        [data.conversationId]: { userId: data.userId, username: data.username },
      }));
    };

    const handleUserStopTyping = (data: SocketTypingData) => {
      setTypingData((prev) => {
        const next = { ...prev };
        delete next[data.conversationId];
        return next;
      });
    };

    const handleMessagesRead = (data: { conversationId: string; readBy: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.conversation === data.conversationId && !m.readBy.includes(data.readBy)) {
            return { ...m, readBy: [...m.readBy, data.readBy] };
          }
          return m;
        })
      );
    };

    socket.on("get_online_users", handleOnlineUsers);
    socket.on("new_message", handleNewMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("get_online_users", handleOnlineUsers);
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [user, refreshConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        onlineUsers,
        typingData,
        loadingConversations,
        loadingMessages,
        selectConversation,
        sendMessage,
        startConversationWithUser,
        notifyTyping,
        notifyStopTyping,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
