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
        if (active) setUsers(data.users || []);
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

  const handleSelectUser = async (u: IUser) => {
    try {
      setStartingChatUserId(u._id);
      await startConversationWithUser(u);
      onClose();
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingChatUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-[#FBFAF4] border border-[#E5E2DA] flex flex-col max-h-[80vh]">

        {/* Modal Top Bar */}
        <div className="h-12 border-b border-[#E5E2DA] px-5 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif text-[18px] text-[#1B1C19]">Initiate Thread</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#1B1C19] p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#E5E2DA] bg-[#F5F3EE] shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
            </div>
            <span className="label-mono text-[10px] text-[#737373]">NAME / USERNAME / EMAIL</span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query peer identity..."
              autoFocus
              className="input-field pl-9 font-mono text-[13px]"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E2DA] bg-[#F5F3EE]" style={{ scrollbarWidth: "thin" }}>
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-[#737373]">
              <span className="w-4 h-4 border border-[#737373] border-t-[#1B1C19] rounded-full animate-spin" />
              <span className="label-mono text-[10px]">SCANNING DIRECTORY...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-[#737373]">
              <span className="label-mono text-[11px]">NO PEERS FOUND</span>
            </div>
          ) : (
            users.map((u) => {
              const isOnline = onlineUsers.has(u._id) || u.isOnline;
              const isStarting = startingChatUserId === u._id;

              return (
                <div
                  key={u._id}
                  onClick={() => !isStarting && handleSelectUser(u)}
                  className="px-5 py-3.5 bg-white hover:bg-[#F5F3EE] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt={u.name} className="w-8 h-8 object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-[#1B1C19] text-white flex items-center justify-center font-mono text-[11px] font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white ${
                          isOnline ? "bg-[#22C55E]" : "bg-[#737373]"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[13px] font-medium text-[#1B1C19]">
                          {u.name}
                        </span>
                        <span className="label-mono text-[9px] text-[#737373]">
                          {isOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#737373]">@{u.username}</span>
                    </div>
                  </div>

                  <button
                    disabled={isStarting}
                    className="btn-ghost py-1 px-3 text-[10px] flex items-center gap-1.5"
                  >
                    {isStarting ? (
                      <span className="w-3 h-3 border border-[#1B1C19]/30 border-t-[#1B1C19] rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>CONNECT</span>
                        <span className="text-[#E64B35]">→</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#E5E2DA] bg-white flex items-center justify-between shrink-0">
          {/* <span className="label-mono text-[10px] text-[#737373]">PEERS RETURNED: {users.length}</span> */}
          <button type="button" onClick={onClose} className="btn-ghost py-1 px-3 text-[10px]">
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
