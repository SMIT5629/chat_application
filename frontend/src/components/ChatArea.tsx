"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { IMessage } from "@/types";

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

  const otherUser = activeConversation?.otherUser;
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) || otherUser.isOnline : false;

  // Active typing indicator for current conversation
  const isOtherTyping =
    activeConversation &&
    typingData[activeConversation._id] &&
    typingData[activeConversation._id].userId !== user?._id;

  const otherTypingName: string =
    (activeConversation && typingData[activeConversation._id]?.username) ||
    otherUser?.name ||
    "Participant";

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isOtherTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      notifyTyping();
    } else {
      notifyStopTyping();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isSendingRef = useRef(false);

  const distinctMessages = React.useMemo(() => {
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

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // If no conversation is active
  if (!activeConversation) {
    return (
      <main className="flex-1 h-screen flex flex-col items-center justify-center bg-[#0f131c] text-[#dfe2ee] p-6 relative select-none">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white shadow-2xl glow-indigo mb-4">
            <span className="material-symbols-outlined text-[32px]">forum</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
          <p className="text-sm text-[#908fa0] leading-relaxed mb-6">
            Select an existing chat thread from the left or start a brand new conversation to connect in real time.
          </p>
          <button
            onClick={onOpenNewChat}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#494bd6] text-white text-xs font-semibold glow-indigo hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Start a New Chat</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen flex flex-col bg-[#0f131c] relative overflow-hidden backdrop-blur-md">
      {/* Top Navigation Bar */}
      <header className="h-16 w-full flex-shrink-0 bg-[#0f131c]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {otherUser?.profilePicture ? (
              <img
                src={otherUser.profilePicture}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#8083ff]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1c2028] flex items-center justify-center text-white font-bold ring-1 ring-white/10">
                {otherUser?.name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            {/* Live Pulsating Emerald Badge */}
            {isOnline ? (
              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-80" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10b981] border-2 border-[#0f131c] glow-emerald" />
              </span>
            ) : (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#464554] border-2 border-[#0f131c]" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-[#dfe2ee] leading-tight">
                {otherUser?.name || "Participant"}
              </h1>
              <span className="text-xs text-[#908fa0] font-mono">@{otherUser?.username}</span>
              {isOnline && (
                <span className="bg-[#10b981]/10 text-[#4edea3] border border-[#10b981]/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  Active now
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[#908fa0] text-[11px] mt-0.5">
              <span>{isOnline ? "Online" : "Offline"}</span>
              {isOtherTyping && (
                <>
                  <span className="text-[#464554]">•</span>
                  <div className="flex items-center gap-1.5 text-[#8083ff] bg-[#8083ff]/10 px-2 py-0.5 rounded-md border border-[#8083ff]/20">
                    <span className="font-medium">{otherTypingName} is typing</span>
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-1 rounded-full bg-[#8083ff] dot-1" />
                      <span className="w-1 h-1 rounded-full bg-[#8083ff] dot-2" />
                      <span className="w-1 h-1 rounded-full bg-[#8083ff] dot-3" />
                    </span>
                    <span className="text-[11px]">✍️</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recipient Status Chip */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="text-[11px] text-[#4edea3] font-medium bg-[#10b981]/10 px-2.5 py-1 rounded-full border border-[#10b981]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] glow-emerald" />
              <span>Active</span>
            </span>
          ) : (
            <span className="text-[11px] text-[#908fa0] font-medium bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#464554]" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </header>

      {/* Message Feed */}
      <section className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Date Divider */}
        <div className="flex items-center justify-center my-2">
          <div className="flex-grow border-t border-white/5" />
          <div className="mx-4 px-3 py-1 rounded-full bg-[#1c2028]/80 border border-white/5 backdrop-blur-md">
            <span className="text-[10px] text-[#908fa0] uppercase tracking-wider font-semibold">
              Conversation Thread
            </span>
          </div>
          <div className="flex-grow border-t border-white/5" />
        </div>

        {loadingMessages ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#908fa0] gap-2">
            <span className="w-6 h-6 border-2 border-white/30 border-t-[#8083ff] rounded-full animate-spin" />
            <span className="text-xs">Loading message history...</span>
          </div>
        ) : distinctMessages.length === 0 ? (
          <div className="py-12 text-center text-[#908fa0] text-xs">
            No messages yet. Send a message to break the ice!
          </div>
        ) : (
          distinctMessages.map((msg) => {
            const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
            const isMe = senderId === user?._id;
            const isRead = msg.readBy && msg.readBy.length > 1;

            if (isMe) {
              return (
                <div key={msg._id} className="flex items-start justify-end gap-3 max-w-2xl ml-auto group">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] text-[#908fa0] font-mono">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#8083ff]">You</span>
                    </div>

                    <div className="relative bubble-sent text-white p-3.5 rounded-2xl rounded-tr-sm max-w-lg">
                      {msg.text && (
                        <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}

                      {/* Image Attachment */}
                      {msg.mediaUrl && msg.mediaType === "image" && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/20 bg-black/40">
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="max-h-72 w-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* File Attachment */}
                      {msg.mediaUrl && msg.mediaType === "file" && (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 text-white text-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">description</span>
                          <span className="underline truncate">Download File Attachment</span>
                        </a>
                      )}

                      {/* Read receipts */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-white/80 text-[10px] font-mono">
                        <span>{isRead ? "✓✓ Read" : "✓ Sent"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Received message
            const senderName = typeof msg.sender === "object" ? msg.sender.name : otherUser?.name;
            const senderPic = typeof msg.sender === "object" ? msg.sender.profilePicture : otherUser?.profilePicture;

            return (
              <div key={msg._id} className="flex items-start gap-3 max-w-2xl group">
                {senderPic ? (
                  <img
                    src={senderPic}
                    alt={senderName || "User"}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 mt-1"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1c2028] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 ring-1 ring-white/10">
                    {senderName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[12px] font-semibold text-[#dfe2ee]">{senderName}</span>
                    <span className="text-[10px] text-[#908fa0] font-mono">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  <div className="relative bubble-received text-[#dfe2ee] p-3.5 rounded-2xl rounded-tl-sm max-w-lg">
                    {msg.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Image Attachment Card */}
                    {msg.mediaUrl && msg.mediaType === "image" && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-[#0b0f17]">
                        <img
                          src={msg.mediaUrl}
                          alt="Attachment"
                          className="max-h-72 w-full object-cover"
                        />
                        <div className="p-2 bg-[#181c24] flex items-center justify-between border-t border-white/5">
                          <span className="text-[11px] text-[#908fa0]">Image</span>
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-md bg-[#262a33] hover:bg-[#31353e] text-[#8083ff] text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.mediaUrl && msg.mediaType === "file" && (
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-[#181c24] hover:bg-[#262a33] border border-white/5 text-[#8083ff] text-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">attach_file</span>
                        <span className="underline truncate">Download Attachment</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Incoming Typing Bubble */}
        {isOtherTyping && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1c2028] flex items-center justify-center text-white text-[10px] font-bold">
              {otherTypingName.charAt(0).toUpperCase()}
            </div>
            <div className="bg-[#1c2028] px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff] dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff] dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff] dot-3" />
              <span className="text-xs text-[#908fa0] ml-2">{otherTypingName} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* Message Composer Area */}
      <footer className="p-4 border-t border-white/5 bg-[#0a0e16]/80 backdrop-blur-xl relative z-20">
        <div className="max-w-5xl mx-auto flex flex-col rounded-2xl bg-[#181c24] border border-white/10 shadow-2xl focus-within:border-[#8083ff] focus-within:ring-1 focus-within:ring-[#8083ff]/30 transition-all">
          {/* File attachment preview banner */}
          {selectedFile && (
            <div className="px-4 py-2 border-b border-white/5 bg-[#1c2028] flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2 min-w-0">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[#8083ff] text-[20px]">
                    attach_file
                  </span>
                )}
                <span className="text-xs text-white truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-[#908fa0]">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="text-[#908fa0] hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Text input */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Type a message to ${otherUser?.name || "chat"}... `}
              rows={2}
              className="w-full bg-transparent text-[#dfe2ee] placeholder:text-[#908fa0] text-sm resize-none border-none focus:outline-none p-0 leading-relaxed"
            />
          </div>

          {/* Composer Toolbar & Send Button */}
          <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-white/5">
            <div className="flex items-center gap-1 text-[#908fa0]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                title="Attach image or file"
              >
                <span className="material-symbols-outlined text-[19px]">attach_file</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText((prev) => prev + " 👍")}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                title="Thumbs up"
              >
                <span className="material-symbols-outlined text-[19px]">thumb_up</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText((prev) => prev + " 🚀")}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                title="Rocket"
              >
                <span className="material-symbols-outlined text-[19px]">rocket_launch</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#908fa0] font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-[#262a33] border border-white/5 text-[#dfe2ee]">
                  Enter ↵
                </kbd>
                <span>to send</span>
              </span>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={sending || (!inputText.trim() && !selectedFile)}
                className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-[#8083ff] via-[#571bc1] to-[#494bd6] text-white text-xs font-semibold flex items-center gap-1.5 glow-indigo hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-md"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[16px]">send</span>
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
