"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUser } from "@/types";
import { getMeApi, loginApi, logoutApi, registerApi, updateProfileApi, getToken, setToken } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (formData: FormData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await getMeApi();
      setUser(data.user);
      connectSocket();
    } catch (err) {
      console.warn("Failed to fetch current user, clearing session:", err);
      setToken(null);
      setUser(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await loginApi(credentials);
    setUser(data.user);
    connectSocket();
  };

  const register = async (payload: { name: string; username: string; email: string; password: string }) => {
    const data = await registerApi(payload);
    setUser(data.user);
    connectSocket();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  const updateProfile = async (formData: FormData) => {
    const data = await updateProfileApi(formData);
    setUser(data.user);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
