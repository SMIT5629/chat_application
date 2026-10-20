"use client";

import React, { useState, useEffect } from "react";
import { IUser } from "@/types";
import { getUsersApi } from "@/lib/api";
import { useChat } from "@/context/ChatContext";

export default function NewChatModal({ onClose }: { onClose: () => void }) {
  const { startConversationWithUser, onlineUsers } = useChat();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getUsersApi(search);
        if (active) {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const delay = setTimeout(fetchUsers, 250);
    return () => {
      active = false;
      clearTimeout(delay);
    };
  }, [search]);

  const handleSelectUser = async (user: IUser) => {
    try {
      setStartingChatUserId(user._id);
      await startConversationWithUser(user);
      onClose();
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingChatUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6366f1] text-[24px]">person_add</span>
            <h3 className="text-lg font-bold text-white">Start New Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#64748b] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, @username, or email..."
            className="w-full bg-[#0b0f17] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
            autoFocus
          />
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8] gap-2">
              <span className="w-6 h-6 border-2 border-white/30 border-t-[#6366f1] rounded-full animate-spin" />
              <span className="text-xs">Finding people...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-[#64748b] text-sm">
              No users found matching your search.
            </div>
          ) : (
            users.map((u) => {
              const isOnline = onlineUsers.has(u._id) || u.isOnline;
              const isStarting = startingChatUserId === u._id;

              return (
                <div
                  key={u._id}
                  onClick={() => !isStarting && handleSelectUser(u)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1e293b]/50 hover:bg-[#1e293b] border border-white/5 hover:border-[#6366f1]/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {u.profilePicture ? (
                        <img
                          src={u.profilePicture}
                          alt={u.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#31353e] flex items-center justify-center text-white font-semibold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f172a] ${
                          isOnline ? "bg-[#10b981] glow-emerald" : "bg-[#64748b]"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#f8fafc] group-hover:text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isOnline && (
                          <span className="text-[10px] text-[#10b981] font-medium bg-[#10b981]/10 px-1.5 py-0.5 rounded-full">
                            Online
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#94a3b8] font-mono">@{u.username}</div>
                    </div>
                  </div>

                  <button
                    disabled={isStarting}
                    className="px-3.5 py-1.5 rounded-lg bg-[#6366f1]/10 text-[#c0c1ff] group-hover:bg-[#6366f1] group-hover:text-white font-medium text-xs border border-[#6366f1]/30 transition-all flex items-center gap-1"
                  >
                    {isStarting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Chat</span>
                        <span className="material-symbols-outlined text-[15px]">send</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
