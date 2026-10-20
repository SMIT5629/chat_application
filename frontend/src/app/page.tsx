"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import AuthModal from "@/components/AuthModal";
import ProfileModal from "@/components/ProfileModal";
import NewChatModal from "@/components/NewChatModal";

export default function Home() {
  const { user, loading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0f17] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-2xl glow-indigo mb-4 animate-pulse">
          <span className="material-symbols-outlined text-[26px]">chat</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#908fa0]">
          <span className="w-4 h-4 border-2 border-white/30 border-t-[#8083ff] rounded-full animate-spin" />
          <span>Connecting to Pulse Messenger...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-[#0b0f17]">
      {/* Left Sidebar */}
      <Sidebar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
      />

      {/* Main Chat Stage */}
      <ChatArea onOpenNewChat={() => setIsNewChatOpen(true)} />

      {/* Modals */}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} />}
    </div>
  );
}
