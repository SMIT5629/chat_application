"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";

export default function ChatArea({ onOpenNewChat }: { onOpenNewChat: () => void }) {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    sendMessage,
    onlineUsers,
    typingData,
    notifyTyping,
    notifyStopTyping,
    loadingMessages,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSendingRef = useRef(false);

  const otherUser = activeConversation?.otherUser;
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) || otherUser.isOnline : false;

  const isOtherTyping =
    activeConversation &&
    typingData[activeConversation._id] &&
    typingData[activeConversation._id].userId !== user?._id;

  const otherTypingName =
    (activeConversation && typingData[activeConversation._id]?.username) ||
    otherUser?.name ||
    "User";

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => { scrollToBottom(false); }, [activeConversation?._id]);
  useEffect(() => { scrollToBottom(true); }, [messages, isOtherTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) notifyTyping();
    else notifyStopTyping();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const distinctMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((m) => {
      const id = String(m._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSendingRef.current) return;
    const textToSend = inputText.trim();
    const fileToSend = selectedFile || undefined;
    if (!textToSend && !fileToSend) return;

    isSendingRef.current = true;
    setSending(true);
    setInputText("");
    handleClearFile();
    notifyStopTyping();

    try {
      await sendMessage({ text: textToSend, file: fileToSend });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      isSendingRef.current = false;
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fmtTime = (d: string) => {
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Empty state
  if (!activeConversation) {
    return (
      <main className="flex-1 h-screen flex flex-col items-center justify-center bg-[#F5F3EE] p-8">
        <div className="w-full max-w-sm border border-[#E5E2DA] bg-white p-8 text-center">
          <div className="w-10 h-10 border border-[#E5E2DA] bg-[#F5F3EE] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[20px] text-[#1B1C19]">forum</span>
          </div>
          <h2 className="font-serif text-[22px] text-[#1B1C19] mb-1">No Active Thread</h2>
          <p className="font-sans text-[13px] text-[#737373] leading-5 mb-6">
            Select a conversation from the sidebar or initiate a new channel session.
          </p>
          <button onClick={onOpenNewChat} className="btn-primary w-full">
            <span>INITIATE THREAD </span>
            <span className="text-[#E64B35]">→</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen flex flex-col bg-[#F5F3EE] overflow-hidden">
      {/* ── Thread Header ── */}
      <header className="shrink-0 h-14 bg-white border-b border-[#E5E2DA] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {otherUser?.profilePicture ? (
              <img src={otherUser.profilePicture} alt={otherUser.name} className="w-8 h-8 object-cover" />
            ) : (
              <div className="w-8 h-8 bg-[#1B1C19] text-white flex items-center justify-center font-mono text-[12px] font-bold">
                {otherUser?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white ${
              isOnline ? "bg-[#22C55E]" : "bg-[#737373]"
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[13px] font-semibold text-[#1B1C19] leading-none">
                {otherUser?.name || "Participant"}
              </span>
              <span className="font-mono text-[10px] text-[#737373]">@{otherUser?.username}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="label-mono text-[9px] text-[#737373]">
                {isOnline ? "STATUS // ONLINE" : "STATUS // OFFLINE"}
              </span>
              {isOtherTyping && (
                <>
                  <span className="text-[#737373] text-[10px]">•</span>
                  <span className="label-mono text-[9px] text-[#E64B35]">
                    {otherTypingName} TYPING...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-[#F5F3EE] border border-[#E5E2DA]">
            
          </div>
          <span className="label-mono text-[10px] text-[#737373]">THREAD #{activeConversation._id.slice(-4).toUpperCase()}</span>
        </div>
      </header>

      {/* ── Message Transcript (Manuscript Style) ── */}
      <section className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{ scrollbarWidth: "thin" }}>
        {/* Thread marker */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
          <span className="label-mono text-[10px] text-[#737373]">
           START OF RECORD
          </span>
          <span className="label-mono text-[10px] text-[#737373]">
            {new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {loadingMessages ? (
          <div className="py-12 flex flex-col items-center gap-3 text-[#737373]">
            <span className="w-4 h-4 border border-[#737373] border-t-[#1B1C19] rounded-full animate-spin" />
            <span className="label-mono text-[10px]">SYNCING TRANSCRIPT...</span>
          </div>
        ) : distinctMessages.length === 0 ? (
          <div className="py-12 text-center">
           
          </div>
        ) : (
          distinctMessages.map((msg) => {
            const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
            const isMe = senderId === user?._id;
            const senderName = isMe ? "YOU" : (typeof msg.sender === "object" ? msg.sender.name : otherUser?.name);
            const isRead = msg.readBy && msg.readBy.length > 1;

            return (
              <div
                key={msg._id}
                className={`msg-block ${isMe ? "sent" : "received"}`}
              >
                {/* Meta line */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="label-mono text-[10px] font-semibold text-[#1B1C19]">
                    {isMe ? "YOU" : senderName?.toUpperCase()}
                  </span>
                  <span className="text-[#737373] text-[9px] font-mono">•</span>
                  <span className="font-mono text-[10px] text-[#737373]">
                    {fmtTime(msg.createdAt)}
                  </span>
                  {isMe && (
                    <span className="font-mono text-[10px] text-[#737373] ml-auto">
                      {isRead ? "✓✓ READ" : "✓ SENT"}
                    </span>
                  )}
                </div>

                {/* Text */}
                {msg.text && (
                  <p className="font-sans text-[14px] text-[#1B1C19] leading-6 whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {/* Image attachment */}
                {msg.mediaUrl && msg.mediaType === "image" && (
                  <div className="mt-2 border border-[#E5E2DA] max-w-sm overflow-hidden bg-white">
                    <img src={msg.mediaUrl} alt="Attachment" className="max-h-60 w-full object-cover" />
                  </div>
                )}

                {/* File attachment */}
                {msg.mediaUrl && msg.mediaType === "file" && (
                  <a
                    href={msg.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 border border-[#E5E2DA] bg-white font-mono text-[11px] text-[#1B1C19] hover:bg-[#F5F3EE] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">attachment</span>
                    <span>DOWNLOAD ATTACHMENT</span>
                  </a>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="msg-block received flex items-center gap-2">
            <span className="label-mono text-[10px] text-[#737373]">
              {otherTypingName?.toUpperCase()} IS TRANSMITTING
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 bg-[#1B1C19] dot-1" />
              <span className="w-1 h-1 bg-[#1B1C19] dot-2" />
              <span className="w-1 h-1 bg-[#1B1C19] dot-3" />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* ── Prompt Composer ── */}
      <footer className="shrink-0 p-4 border-t border-[#E5E2DA] bg-[#FBFAF4]">
        <div className="border border-[#E5E2DA] bg-white transition-colors focus-within:border-[#1B1C19]">
          {/* File preview bar */}
          {selectedFile && (
            <div className="px-3 py-2 border-b border-[#E5E2DA] bg-[#F5F3EE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#1B1C19]">attachment</span>
                <span className="font-mono text-[11px] text-[#1B1C19] truncate max-w-xs">{selectedFile.name}</span>
                <span className="font-mono text-[10px] text-[#737373]">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button onClick={handleClearFile} className="text-[#737373] hover:text-[#1B1C19]">
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="p-3">
            <textarea
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Draft transmission to ${otherUser?.name || "peer"}... [Enter ↵ to send]`}
              rows={2}
              className="w-full font-sans text-[14px] text-[#1B1C19] placeholder:text-[#737373] resize-none outline-none border-none p-0 bg-transparent leading-5"
            />
          </div>

          {/* Composer Action Bar */}
          <div className="px-3 py-2 border-t border-[#E5E2DA] flex items-center justify-between bg-[#FBFAF4]">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-[#737373] hover:text-[#1B1C19] transition-colors"
                title="Attach file"
              >
                <span className="material-symbols-outlined text-[17px]">attach_file</span>
              </button>
              <button
                type="button"
                onClick={() => setInputText((p) => p + " 👍")}
                className="p-1 text-[#737373] hover:text-[#1B1C19] transition-colors"
                title="Thumbs up"
              >
                <span className="material-symbols-outlined text-[17px]">thumb_up</span>
              </button>
              <button
                type="button"
                onClick={() => setInputText((p) => p + " 🚀")}
                className="p-1 text-[#737373] hover:text-[#1B1C19] transition-colors"
                title="Rocket"
              >
                <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline label-mono text-[10px] text-[#737373]">
                [ENTER ↵] TRANSMIT
              </span>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || (!inputText.trim() && !selectedFile)}
                className="btn-primary py-1.5 px-3 text-[10px] flex items-center gap-1.5 h-auto"
              >
                {sending ? (
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>SEND</span>
                    <span className="text-[#E64B35]">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
