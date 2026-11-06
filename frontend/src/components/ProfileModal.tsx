"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.profilePicture || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      if (file) formData.append("profilePicture", file);
      await updateProfile(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "PROFILE_UPDATE_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-[#FBFAF4] border border-[#E5E2DA] shadow-none">

        {/* Modal Top Bar */}
        <div className="h-12 border-b border-[#E5E2DA] px-5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="font-serif text-[18px] text-[#1B1C19]">Edit Profile</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#1B1C19] p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="border-b border-[#E64B35] bg-white px-5 py-2.5 flex items-center gap-2">
            
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Identity Box */}
          <div className="p-6 border-b border-[#E5E2DA] bg-[#F5F3EE]">
            <div className="border border-[#E5E2DA] bg-white p-6 flex flex-col items-center text-center">
              {/* Avatar square */}
              <div
                className="relative w-20 h-20 bg-[#1B1C19] flex items-center justify-center text-white font-mono text-2xl font-bold cursor-pointer group mb-3"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0).toUpperCase() || "U"}</span>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#E64B35]" />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="label-mono text-[11px] text-[#1B1C19]">AVATAR IDENTITY</span>
                <span className="border border-[#E5E2DA] px-1.5 py-0.5 label-mono text-[9px] text-[#737373]">
                  MAX 2.4MB
                </span>
              </div>
              <p className="font-sans text-[12px] text-[#737373] leading-4 max-w-xs mb-4">
                High-contrast square glyph or photo representation for audit logs and real-time generation turns.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost py-1.5 px-3 text-[10px]"
                >
                  <span className="material-symbols-outlined text-[13px]">upload</span>
                  <span>UPLOAD NEW IMAGE</span>
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="btn-ghost py-1.5 px-3 text-[10px] text-[#E64B35]"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5 bg-[#F5F3EE] border-b border-[#E5E2DA]">
            {/* Display Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="accent-sq w-[6px] h-[6px]" />
                  <label className="label-mono text-[11px] text-[#1B1C19]">DISPLAY NAME</label>
                </div>
                
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
                className="input-field"
              />
              <p className="font-sans text-[11px] text-[#737373] mt-1">
                Public identifier displayed across active workspace conversations.
              </p>
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="accent-sq w-[6px] h-[6px]" />
                  <label className="label-mono text-[11px] text-[#1B1C19]">USERNAME</label>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 label-mono text-[#737373] text-[12px]">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-field pl-8 font-mono"
                />
              </div>
              {/* <div className="flex items-center justify-between mt-1">
                <span className="label-mono text-[10px] text-[#737373]">
                  URL: opentalk.dev/@{username}
                </span>
                <span className="label-mono text-[10px] text-[#737373]">
                  VALID // RESERVED
                </span>
              </div> */}
            </div>

            {/* Status box */}
            {/* <div className="border border-[#E5E2DA] bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="accent-sq w-[6px] h-[6px]" />
                <span className="label-mono text-[10px] text-[#1B1C19]">ACCOUNT STATUS</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="border border-[#E5E2DA] px-2 py-0.5 label-mono text-[10px] text-[#1B1C19]">
                  ONLINE • DEVELOPER TIER
                </span>
                <span className="label-mono text-[10px] text-[#737373]">RATE: UNLIMITED</span>
              </div>
            </div> */}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-white flex items-center justify-between">
            <button type="button" onClick={onClose} className="btn-ghost">
              CANCEL
            </button>
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              <span className="accent-sq w-[5px] h-[5px] bg-[#E64B35]" />
              <span>{loading ? "SAVING..." : "SAVE CHANGES"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
