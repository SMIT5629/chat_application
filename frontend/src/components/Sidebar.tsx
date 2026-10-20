"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { IConversation } from "@/types";

interface SidebarProps {
  onOpenProfile: () => void;
  onOpenNewChat: () => void;
}

export default function Sidebar({ onOpenProfile, onOpenNewChat }: SidebarProps) {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    onlineUsers,
    loadingConversations,
  } = useChat();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && (!c.unreadCount || c.unreadCount === 0)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const otherName = c.otherUser?.name?.toLowerCase() || "";
        const otherUsername = c.otherUser?.username?.toLowerCase() || "";
        const lastText = c.lastMessage?.text?.toLowerCase() || "";
        return otherName.includes(q) || otherUsername.includes(q) || lastText.includes(q);
      }
      return true;
    });
  }, [conversations, filter, search]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <aside className="h-screen w-[360px] flex-shrink-0 flex flex-col bg-[#181c24] border-r border-white/5 relative z-20">
      {/* Current User Profile Header */}
      <div className="p-4 border-b border-white/5 bg-[#181c24]/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-bold ring-2 ring-white/10">
                  {user?.name.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#181c24] glow-emerald" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-[#dfe2ee] leading-none">
                  {user?.name}
                </span>
                <span
                  className="material-symbols-outlined text-[15px] text-[#10b981]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-[#908fa0] font-mono">@{user?.username}</span>
                <span className="text-[#464554] text-[10px]">•</span>
                <span className="text-[11px] text-[#4edea3] font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#908fa0] hover:text-white hover:bg-white/5 transition-colors"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-[19px]">settings</span>
            </button>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#908fa0] hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[19px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#908fa0] text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages or people (⌘K)..."
            className="w-full bg-[#262a33]/80 text-[#dfe2ee] placeholder:text-[#908fa0] text-xs pl-9 pr-8 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-[#908fa0] hover:text-white text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & New Chat Trigger */}
      <div className="px-4 py-2 flex flex-col gap-2">
        <div className="flex items-center gap-1 bg-[#0a0e16]/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-[#262a33] text-[#c0c1ff] shadow-sm"
                : "text-[#908fa0] hover:text-white"
            }`}
          >
            All Chats
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              filter === "unread"
                ? "bg-[#262a33] text-[#c0c1ff] shadow-sm"
                : "text-[#908fa0] hover:text-white"
            }`}
          >
            <span>Unread</span>
            {totalUnreadCount > 0 && (
              <span className="bg-[#8083ff]/30 text-[#c0c1ff] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Glowing + New Chat Button */}
        <button
          onClick={onOpenNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8083ff] via-[#571bc1] to-[#494bd6] text-white text-xs font-semibold flex items-center justify-center gap-2 glow-indigo hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <span className="material-symbols-outlined text-[19px]">add_circle</span>
          <span>New Chat</span>
        </button>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {loadingConversations ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#908fa0] gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-[#8083ff] rounded-full animate-spin" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-[#908fa0] text-xs px-4">
            {search
              ? "No conversations match your search."
              : "No active conversations yet. Click 'New Chat' to start messaging!"}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversation?._id === conv._id;
            const other = conv.otherUser;
            const isOnline = other ? onlineUsers.has(other._id) || other.isOnline : false;
            const unread = conv.unreadCount || 0;
            const lastMsg = conv.lastMessage;

            // Check if last message was sent by current user
            const isLastSentByMe =
              lastMsg &&
              user &&
              (typeof lastMsg.sender === "object"
                ? lastMsg.sender._id === user._id
                : lastMsg.sender === user._id);

            return (
              <div
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`relative group mx-1 p-2.5 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#262a33]/90 border-[#8083ff]/40 glow-indigo"
                    : "hover:bg-[#1c2028]/80 border-transparent hover:border-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {other?.profilePicture ? (
                      <img
                        src={other.profilePicture}
                        alt={other.name}
                        className={`w-11 h-11 rounded-full object-cover ring-2 ${
                          isActive ? "ring-[#8083ff]" : "ring-white/10"
                        }`}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#1c2028] flex items-center justify-center text-white font-semibold text-sm ring-1 ring-white/10">
                        {other?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#181c24] ${
                        isOnline ? "bg-[#10b981] glow-emerald" : "bg-[#464554]"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#dfe2ee] truncate">
                        {other?.name || "Unknown User"}
                      </span>
                      <span
                        className={`text-[11px] ${
                          isActive ? "text-[#c0c1ff] font-medium" : "text-[#908fa0]"
                        }`}
                      >
                        {formatTime(conv.updatedAt || conv.createdAt)}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#908fa0] mb-0.5 font-mono">
                      @{other?.username || "user"}
                    </div>

                    <p className="text-xs text-[#c7c4d7] truncate font-normal flex items-center gap-1">
                      {isLastSentByMe && (
                        <span className="text-[#8083ff] font-medium text-[11px]">✓✓</span>
                      )}
                      {lastMsg?.mediaType === "image" && (
                        <span className="material-symbols-outlined text-[14px] text-[#8083ff]">
                          image
                        </span>
                      )}
                      {lastMsg?.mediaType === "file" && (
                        <span className="material-symbols-outlined text-[14px] text-[#8083ff]">
                          attach_file
                        </span>
                      )}
                      <span>
                        {lastMsg?.text || (lastMsg?.mediaUrl ? "Attachment" : "Started conversation")}
                      </span>
                    </p>
                  </div>

                  {unread > 0 && (
                    <div className="self-center">
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#8083ff] text-[#0d0096] text-[11px] font-bold shadow-md">
                        {unread}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/5 bg-[#181c24] flex items-center justify-between text-[#908fa0] text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            <span>Settings</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span>v2.0 Next+TS</span>
        </div>
      </div>
    </aside>
  );
}
