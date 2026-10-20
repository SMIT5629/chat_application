export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
  isOnline?: boolean;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  } | string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "file" | "none";
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  participants: (IUser | string)[];
  lastMessage?: IMessage | null;
  updatedAt: string;
  createdAt: string;
  unreadCount?: number;
  otherUser?: IUser | null;
}

export interface SocketTypingData {
  conversationId: string;
  userId: string;
  username?: string;
}

export interface SocketMessageReadData {
  conversationId: string;
  readBy: string;
  messageId?: string;
}

export interface SocketConversationUpdatedData {
  conversationId: string;
  lastMessage: IMessage;
}
