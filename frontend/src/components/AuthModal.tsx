"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim() || !username.trim() || !email.trim() || !password) {
          setError("ALL_FIELDS_REQUIRED");
          setLoading(false);
          return;
        }
        await register({ name, username, email, password });
      } else {
        if (!email.trim() || !password) {
          setError("EMAIL_AND_PASSWORD_REQUIRED");
          setLoading(false);
          return;
        }
        await login({ email, password });
      }
    } catch (err: any) {
      setError(err.message || "AUTH_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F3EE]">
      {/* ── TOP BAR ── */}
      <header className="shrink-0 w-full bg-[#FBFAF4] border-b border-[#E5E2DA] flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-4">
          <span className="font-serif text-xl tracking-tight text-[#1B1C19]">OpenTalk</span>
          <span className="font-mono text-[11px] text-[#737373] tracking-[0.04em] uppercase">
           
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 border border-[#E5E2DA] bg-white">
            
           
           
          </div> */}
          <span className="ppercase">
            
          </span>
        </div>
      </header>

      {/* ── MAIN CANVAS ── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-xl bg-[#FBFAF4] border border-[#E5E2DA]">

          {/* Panel header */}
          {/* <div className="border-b border-[#E5E2DA] px-6 py-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="accent-sq" />
              <span className="label-mono text-[#1B1C19]">AUTHENTICATION PROTOCOL</span>
            </div>
            <span className="label-mono text-[#737373]">SOCKET.IO // TLS_1.3</span>
          </div> */}

          {/* Title block */}
          <div className="border-b border-[#E5E2DA] px-6 py-6 bg-[#F5F3EE]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-[36px] leading-[44px] tracking-[-0.015em] text-[#1B1C19] mb-2">
                  Access Terminal
                </h1>
                <p className="font-sans text-[15px] text-[#737373] leading-6">
                  Real-time collaborative messaging engine.
                </p>
              </div>
              <div className="border border-[#E5E2DA] p-2 bg-white mt-1">
                <span className="material-symbols-outlined text-[20px] text-[#1B1C19]">terminal</span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex items-end gap-8 mt-6 border-b border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`pb-3 label-mono text-[12px] font-bold tracking-[0.08em] transition-colors relative ${
                  !isRegister ? "text-[#1B1C19]" : "text-[#737373] hover:text-[#1B1C19]"
                }`}
              >
                SIGN IN
                {!isRegister && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E64B35]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`pb-3 label-mono text-[12px] font-medium tracking-[0.08em] transition-colors relative ${
                  isRegister ? "text-[#1B1C19]" : "text-[#737373] hover:text-[#1B1C19]"
                }`}
              >
                CREATE ACCOUNT
                {isRegister && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E64B35]" />
                )}
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="px-6 py-6 border-b border-[#E5E2DA] bg-[#F5F3EE]">
            {error && (
              <div className="mb-5 border border-[#E64B35] bg-white px-4 py-3 flex items-center gap-3">
                <span className="accent-sq" style={{ background: "#E64B35" }} />
                <span className="font-mono text-[11px] text-[#E64B35] tracking-[0.04em] uppercase">
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {isRegister && (
                <>
                  {/* Full Name */}
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
                      placeholder="Your full name"
                      className="input-field"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="accent-sq w-[6px] h-[6px]" />
                        <label className="label-mono text-[11px] text-[#1B1C19]">USERNAME</label>
                      </div>
                      <span className="label-mono text-[#737373] text-[10px]"></span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 label-mono text-[#737373] text-[12px]">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="accent-sq w-[6px] h-[6px]" />
                    <label className="label-mono text-[11px] text-[#1B1C19]">EMAIL ADDRESS</label>
                    <span className="text-[#E64B35] label-mono text-[11px]">*</span>
                  </div>
                  {/* <span className="label-mono text-[#737373] text-[10px]">FORMAT // RFC_5322</span> */}
                </div>
                <div className="relative">
                  {/* <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-[18px] pointer-events-none select-none">
                    mail
                  </span> */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="input-field pl-10 pr-4 font-mono text-[13px]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="accent-sq w-[6px] h-[6px]" />
                    <label className="label-mono text-[11px] text-[#1B1C19]">PASSWORD</label>
                    <span className="text-[#E64B35] label-mono text-[11px]">*</span>
                  </div>
                  {!isRegister && (
                    <button type="button" className="label-mono text-[10px] text-[#737373] hover:text-[#E64B35] transition-colors uppercase tracking-[0.04em]">
                     
                    </button>
                  )}
                </div>
                <div className="relative">
                  {/* <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-[18px] pointer-events-none select-none">
                    lock
                  </span> */}
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-field pl-10 pr-10 font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1B1C19] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              {/* {!isRegister && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-[#E5E2DA] bg-[#1B1C19] flex items-center justify-center cursor-pointer shrink-0">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                  <span className="label-mono text-[11px] text-[#737373]">PERSIST SESSION (30 DAYS)</span>
                  <span className="label-mono text-[10px] text-[#737373] ml-auto">HARDWARE_ENCLAVE</span>
                </div>
              )} */}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-12 mt-1 justify-between"
              >
                <span>{loading ? "AUTHENTICATING..." : (isRegister ? "CREATE ACCESS" : "AUTHORIZE ACCESS")}</span>
                <span className="flex items-center gap-2">
                  {loading ? (
                    <span className="w-3 h-3 border border-[#F5F3EE]/40 border-t-[#F5F3EE] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-[#F5F3EE]/60">[↵]</span>
                      <span className="text-[#E64B35]">→</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Federated auth */}
          <div className="px-6 py-5 border-b border-[#E5E2DA] bg-[#F5F3EE]">
            {/* <div className="flex items-center justify-between mb-4">
              <span className="label-mono text-[#737373] text-[10px]">FEDERATED CREDENTIALS</span>
              <span className="label-mono text-[#737373] text-[10px]">OAUTH2 // SAML</span>
            </div> */}
            {/* <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost h-11 gap-2 justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="label-mono text-[11px]">&lt;&gt; GITHUB</span>
              </button>
              <button className="btn-ghost h-11 gap-2 justify-center">
                <span className="material-symbols-outlined text-[14px]">key</span>
                <span className="label-mono text-[11px]">PASSKEY / WEBAUTHN</span>
              </button>
            </div> */}
          </div>

          {/* Footer status */}
          {/* <div className="px-6 py-4 bg-[#F5F3EE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="accent-sq w-[6px] h-[6px]" />
              <span className="label-mono text-[10px] text-[#737373]">SOCKET_POOL: CONNECTED (12ms)</span>
            </div>
            <span className="label-mono text-[10px] text-[#737373]">ID // 9f82c4</span>
          </div> */}
        </div>
      </main>

      {/* ── FOOTER ── */}
      {/* <footer className="shrink-0 border-t border-[#E5E2DA] bg-[#F5F3EE] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif font-medium text-sm text-[#1B1C19]">OPENTALK</span>
          <span className="label-mono text-[10px] text-[#737373]">DISTRIBUTED INTELLIGENCE — SOCKET.IO / NEXT.JS RUNTIME</span>
        </div>
        <div className="flex items-center gap-4">
          {["SECURITY SPEC", "SYS_STATUS", "PRIVACY // GDPR"].map((l) => (
            <span key={l} className="label-mono text-[10px] text-[#737373] hover:text-[#1B1C19] cursor-pointer transition-colors">
              {l}
            </span>
          ))}
        </div>
      </footer> */}
    </div>
  );
}
