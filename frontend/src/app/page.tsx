"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import AuthModal from "@/components/AuthModal";
import ProfileModal from "@/components/ProfileModal";
import NewChatModal from "@/components/NewChatModal";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F3EE] text-[#1B1C19]">
        <div className="border border-[#E5E2DA] bg-white p-6 flex flex-col items-center gap-4 max-w-xs w-full text-center">
          <div className="w-8 h-8 bg-[#1B1C19] flex items-center justify-center text-white font-mono text-sm font-bold">
            OT
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-serif text-[18px] text-[#1B1C19]">OpenTalk</span>
    
          </div>
          <div className="flex items-center gap-2 text-xs text-[#737373] mt-2">
            <span className="w-3.5 h-3.5 border border-[#737373] border-t-[#1B1C19] rounded-full animate-spin" />
            <span className="label-mono text-[10px]">CONNECTING...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F3EE]">
      {/* ── Minimalist Top Navigation Bar ── */}
      <header className="bg-white flex justify-between items-center w-full px-4 md:px-6 h-14 border-b border-[#E5E2DA] z-20 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-serif text-xl tracking-tight text-[#1B1C19]">OpenTalk</span>
        </div>

        {/* Center Navigation tabs */}
        <nav className="hidden md:flex items-center gap-6">
          <button className="label-mono text-[11px] text-[#1B1C19] border-b border-[#E64B35] pb-0.5 cursor-pointer">
            CHATS
          </button>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="label-mono text-[11px] text-[#737373] hover:text-[#1B1C19] transition-colors cursor-pointer"
          >
            SETTINGS
          </button>
        </nav>

        {/* Trailing action & stats */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#F5F3EE] border border-[#E5E2DA]">
            <span className="w-1.5 h-1.5 bg-[#22C55E]" />
            <span className="label-mono text-[10px] text-[#737373]">LATENCY: 12MS</span>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="btn-ghost py-1 px-3 text-[10px] flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>NEW </span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 overflow-hidden flex flex-row">
        {/* Left Sidebar */}
        <Sidebar
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
        />

        {/* Main Chat Stage */}
        <ChatArea onOpenNewChat={() => setIsNewChatOpen(true)} />
      </div>

      {/* Modals */}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} />}
    </div>
  );
}
