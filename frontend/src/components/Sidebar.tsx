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

  const totalUnread = useMemo(
    () => conversations.reduce((a, c) => a + (c.unreadCount || 0), 0),
    [conversations]
  );

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && !c.unreadCount) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.otherUser?.name?.toLowerCase().includes(q) ||
          c.otherUser?.username?.toLowerCase().includes(q) ||
          c.lastMessage?.text?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, filter, search]);

  const fmtTime = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "NOW";
    if (diff < 60) return `${diff}M`;
    if (diff < 1440) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <aside className="h-screen w-[320px] flex-shrink-0 flex flex-col bg-[#FBFAF4] border-r border-[#E5E2DA]">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 h-14 border-b border-[#E5E2DA] flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 bg-[#1B1C19] flex items-center justify-center text-white font-mono text-[11px] font-bold shrink-0"
            title={user?.name}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[13px] font-medium text-[#1B1C19] leading-none">
                {user?.name}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#22C55E]" />
                <span className="label-mono text-[9px] text-[#737373]">ONLINE</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#737373]">@{user?.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProfile}
            className="p-1.5 text-[#737373] hover:text-[#1B1C19] hover:bg-[#EAE8E3] transition-colors"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[17px]">settings</span>
          </button>
          <button
            onClick={logout}
            className="p-1.5 text-[#737373] hover:text-[#E64B35] hover:bg-[#EAE8E3] transition-colors"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 px-3 py-3 border-b border-[#E5E2DA]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] text-[15px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads..."
            className="w-full bg-white border border-[#E5E2DA] text-[#1B1C19] placeholder:text-[#737373] font-mono text-[11px] pl-8 pr-7 py-2 outline-none focus:border-[#1B1C19] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1B1C19]"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs + New Chat ── */}
      <div className="shrink-0 px-3 py-2.5 border-b border-[#E5E2DA] flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 border-b border-transparent">
          <button
            onClick={() => setFilter("all")}
            className={`label-mono text-[11px] pb-1 relative transition-colors ${
              filter === "all" ? "text-[#1B1C19]" : "text-[#737373] hover:text-[#1B1C19]"
            }`}
          >
            ALL
            {filter === "all" && <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#E64B35]" />}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`label-mono text-[11px] pb-1 relative transition-colors flex items-center gap-1 ${
              filter === "unread" ? "text-[#1B1C19]" : "text-[#737373] hover:text-[#1B1C19]"
            }`}
          >
            UNREAD
            {totalUnread > 0 && (
              <span className="bg-[#1B1C19] text-white font-mono text-[9px] px-1 py-0.5 leading-none">
                {totalUnread}
              </span>
            )}
            {filter === "unread" && <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#E64B35]" />}
          </button>
        </div>
        <button
          onClick={onOpenNewChat}
          className="btn-primary py-1.5 px-3 text-[10px] flex items-center gap-1.5 h-auto"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          <span>NEW</span>
        </button>
      </div>

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {loadingConversations ? (
          <div className="py-12 flex flex-col items-center gap-3 text-[#737373]">
            <span className="w-4 h-4 border border-[#737373] border-t-[#1B1C19] rounded-full animate-spin" />
            <span className="label-mono text-[10px]">LOADING THREADS...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <span className="label-mono text-[10px] text-[#737373]">
              {search ? "NO RESULTS" : "NO ACTIVE CONVERSATIONS"}
            </span>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeConversation?._id === conv._id;
            const other = conv.otherUser;
            const isOnline = other ? onlineUsers.has(other._id) || other.isOnline : false;
            const unread = conv.unreadCount || 0;
            const lastMsg = conv.lastMessage;
            const isLastMine =
              lastMsg &&
              user &&
              (typeof lastMsg.sender === "object"
                ? lastMsg.sender._id === user._id
                : lastMsg.sender === user._id);

            return (
              <div
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`px-3 py-3 cursor-pointer border-b border-[#E5E2DA] transition-colors ${
                  isActive
                    ? "bg-white border-l-2 border-l-[#E64B35]"
                    : "hover:bg-[#EAE8E3] border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {other?.profilePicture ? (
                      <img
                        src={other.profilePicture}
                        alt={other.name}
                        className="w-9 h-9 object-cover"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 flex items-center justify-center font-mono text-[12px] font-bold ${
                          isActive ? "bg-[#1B1C19] text-white" : "bg-[#E5E2DA] text-[#1B1C19]"
                        }`}
                      >
                        {other?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    {/* Online indicator */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-[#FBFAF4] ${
                        isOnline ? "bg-[#22C55E]" : "bg-[#737373]"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-sans text-[13px] font-medium truncate ${
                        isActive ? "text-[#1B1C19]" : "text-[#1B1C19]"
                      }`}>
                        {other?.name || "Unknown"}
                      </span>
                      <span className="font-mono text-[10px] text-[#737373] shrink-0 ml-2">
                        {fmtTime(conv.updatedAt || conv.createdAt)}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[#737373] mb-1">
                      @{other?.username || "user"}
                    </div>
                    <p className="font-sans text-[12px] text-[#737373] truncate flex items-center gap-1">
                      {isLastMine && <span className="text-[#1B1C19] font-medium text-[11px]">You:</span>}
                      {lastMsg?.mediaType === "image" && <span className="font-mono text-[10px]">[IMG]</span>}
                      {lastMsg?.mediaType === "file"  && <span className="font-mono text-[10px]">[FILE]</span>}
                      <span>{lastMsg?.text || (lastMsg?.mediaUrl ? "Attachment" : "Thread opened")}</span>
                    </p>
                  </div>

                  {/* Unread badge */}
                  {unread > 0 && (
                    <div className="shrink-0 self-start mt-1">
                      <span className="bg-[#E64B35] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 leading-none">
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

      {/* ── Footer ── */}
      <div className="shrink-0 p-3 border-t border-[#E5E2DA] bg-white flex items-center justify-between gap-2">
        <button
          onClick={onOpenProfile}
          className="flex-1 py-1.5 px-2.5 border border-[#E5E2DA] hover:bg-[#F5F3EE] flex items-center justify-center gap-1.5 text-[#1B1C19] transition-colors"
          title="Profile Settings"
        >
          <span className="material-symbols-outlined text-[15px]">settings</span>
          <span className="label-mono text-[10px]">SETTINGS</span>
        </button>
        <button
          onClick={logout}
          className="flex-1 py-1.5 px-2.5 border border-[#E5E2DA] hover:bg-[#FFF5F5] hover:border-[#E64B35]/40 flex items-center justify-center gap-1.5 text-[#737373] hover:text-[#E64B35] transition-colors"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[15px]">logout</span>
          <span className="label-mono text-[10px]">SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
