# Chat Application Backend API & Real-time Architecture

A modern, production-ready TypeScript backend for real-time chat built with **Express 5**, **MongoDB / Mongoose**, **Socket.IO**, **JWT Authentication with Token Blacklisting**, and **Multer + ImageKit** for media attachments.

---

## 🛠️ Tech Stack & Features

- **TypeScript (ESM / NodeNext)** with strict typing
- **Express 5** REST API
- **Socket.IO 4.8** with JWT authentication, presence tracking (online/offline), typing indicators, real-time message broadcasting, and read receipts
- **MongoDB & Mongoose** with optimized indexes on conversations and messages
- **JWT Authentication** stored in HTTP-only cookies and Authorization headers with MongoDB-backed token blacklisting on logout
- **Multer & ImageKit** for image and attachment uploads (with automatic dev fallback)
- **CORS** pre-configured for frontend integration (e.g. Vite React on `http://localhost:5173`)

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat-app
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Optional: ImageKit for cloud media storage (fallback provided if omitted)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## 🚀 Getting Started

```bash
cd backend
npm install
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (name, username, email, password) | No |
| `POST` | `/api/auth/login` | Login with email and password | No |
| `POST` | `/api/auth/logout` | Logout, blacklists token, clears cookie | Yes |
| `GET` | `/api/auth/me` | Get currently logged-in user profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile (name, username, `profilePicture` file) | Yes |

### 👥 Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users?search=query` | Search and list users with online presence indicator | Yes |
| `GET` | `/api/users/:id` | Get user details by ID | Yes |

### 💬 Conversations (`/api/conversations`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/conversations` | List user's conversations with last message, unread badge & other user info | Yes |
| `POST` | `/api/conversations` | Get or create 1-on-1 conversation (`{ receiverId: "..." }`) | Yes |
| `GET` | `/api/conversations/:id` | Get conversation details by ID | Yes |

### 📨 Messages (`/api/messages`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/messages/:conversationId` | Fetch message history for conversation | Yes |
| `POST` | `/api/messages/:conversationId` | Send text and optional media file (`file` field in form-data) | Yes |
| `PUT` | `/api/messages/read/:conversationId` | Mark messages in conversation as read | Yes |

---

## ⚡ Socket.IO Real-time Events Reference

### Connection & Auth
Connect with cookie or handshake auth:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  withCredentials: true,
  auth: {
    token: "your_jwt_token" // or rely on HTTP-only cookie
  }
});
```

### Events Emitted by Server:
- `get_online_users`: `string[]` - Array of user IDs currently online.
- `new_message`: `Message` - Broadcast when a message is sent in a conversation.
- `conversation_updated`: `{ conversationId, lastMessage }` - For updating sidebar list immediately.
- `user_typing`: `{ conversationId, userId, username }` - When other participant is typing.
- `user_stop_typing`: `{ conversationId, userId }` - When other participant stops typing.
- `messages_read`: `{ conversationId, readBy }` - Sent when recipient marks messages as read.

### Events Emitted by Client:
- `join_conversation`: `conversationId` - Join a conversation room.
- `leave_conversation`: `conversationId` - Leave a conversation room.
- `typing`: `{ conversationId, receiverId }` - Notify that current user is typing.
- `stop_typing`: `{ conversationId, receiverId }` - Notify that current user stopped typing.
- `message_read`: `{ conversationId, senderId, messageId }` - Acknowledge reading a message.
