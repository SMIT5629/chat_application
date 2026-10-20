import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function connectSocket(): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const token = getToken();

  socketInstance = io(SOCKET_URL, {
    withCredentials: true,
    auth: {
      token: token || undefined,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socketInstance.on("connect", () => {
    console.log("[Socket] Connected with ID:", socketInstance?.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[Socket] Connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// Client event emitters
export function emitJoinConversation(conversationId: string): void {
  if (socketInstance && conversationId) {
    socketInstance.emit("join_conversation", conversationId);
  }
}

export function emitLeaveConversation(conversationId: string): void {
  if (socketInstance && conversationId) {
    socketInstance.emit("leave_conversation", conversationId);
  }
}

export function emitTyping(conversationId: string, receiverId?: string): void {
  if (socketInstance && conversationId) {
    socketInstance.emit("typing", { conversationId, receiverId });
  }
}

export function emitStopTyping(conversationId: string, receiverId?: string): void {
  if (socketInstance && conversationId) {
    socketInstance.emit("stop_typing", { conversationId, receiverId });
  }
}

export function emitMessageRead(conversationId: string, senderId: string, messageId?: string): void {
  if (socketInstance && conversationId && senderId) {
    socketInstance.emit("message_read", { conversationId, senderId, messageId });
  }
}
