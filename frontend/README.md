# Pulse Messenger — Frontend (Next.js 16 + TypeScript)

This is the real-time chat client frontend built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, styled using the **Google Stitch "Aether Dark Chat"** design system and integrated with the Express + Socket.IO backend.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

The application will run on [http://localhost:3001](http://localhost:3001) (or `http://localhost:3000` if backend port differs).

---

## 🎨 Design System: Stitch "Aether Dark Chat"

- **Project ID**: `16465099609937079220`
- **Design System Asset**: `assets/fe54f3c792f64515b27ec9571377dcf5`
- **Primary Screen ID**: `0f71f229b0204dca8c09636b001f5591`
- **Palette**: Deep Obsidian Canvas (`#0B0F17`, `#0F172A`, `#181C24`), Electric Indigo (`#6366F1`), Violet Glow (`#8B5CF6`), and Live Emerald Presence (`#10B981`).
- **Typography**: Plus Jakarta Sans for titles/headers, Inter for body and messages, JetBrains Mono for usernames and code/timestamps.

---

## 📡 Backend Endpoints Integrated

- **Auth**: Register, Login, Logout, Profile update (with avatar upload), Get current user
- **Users**: Search directory with live online presence status
- **Conversations**: List conversations with unread counter, last message snippet, and create 1-on-1 chats
- **Messages**: Message history, sending text & image/file attachments, mark as read receipts
- **Real-time Socket.IO**: Live presence tracking, instant message arrival, typing indicators, read receipt updates
