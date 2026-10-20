import { IUser, IConversation, IMessage } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("chat_jwt_token") || "";
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("chat_jwt_token", token);
  } else {
    localStorage.removeItem("chat_jwt_token");
  }
}

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Supports cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// ======================== Auth Endpoints ========================
export async function registerApi(payload: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ message: string; user: IUser; token: string }> {
  const res = await request<{ message: string; user: IUser; token: string }>("/auth/register", {
    method: "POST",
    body: payload,
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function loginApi(payload: {
  email: string;
  password: string;
}): Promise<{ message: string; user: IUser; token: string }> {
  const res = await request<{ message: string; user: IUser; token: string }>("/auth/login", {
    method: "POST",
    body: payload,
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function logoutApi(): Promise<{ message: string }> {
  try {
    return await request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  } finally {
    setToken(null);
  }
}

export async function getMeApi(): Promise<{ user: IUser }> {
  return request<{ user: IUser }>("/auth/me", {
    method: "GET",
  });
}

export async function updateProfileApi(formData: FormData): Promise<{ message: string; user: IUser }> {
  return request<{ message: string; user: IUser }>("/auth/profile", {
    method: "PUT",
    body: formData,
  });
}

// ======================== User Endpoints ========================
export async function getUsersApi(search: string = ""): Promise<{ users: IUser[] }> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<{ users: IUser[] }>(`/users${query}`, {
    method: "GET",
  });
}

export async function getUserByIdApi(id: string): Promise<{ user: IUser }> {
  return request<{ user: IUser }>(`/users/${id}`, {
    method: "GET",
  });
}

// ======================== Conversation Endpoints ========================
export async function getConversationsApi(): Promise<{ conversations: IConversation[] }> {
  return request<{ conversations: IConversation[] }>("/conversations", {
    method: "GET",
  });
}

export async function getOrCreateConversationApi(receiverId: string): Promise<{ conversation: IConversation }> {
  return request<{ conversation: IConversation }>("/conversations", {
    method: "POST",
    body: { receiverId },
  });
}

export async function getConversationByIdApi(id: string): Promise<{ conversation: IConversation }> {
  return request<{ conversation: IConversation }>(`/conversations/${id}`, {
    method: "GET",
  });
}

// ======================== Message Endpoints ========================
export async function getMessagesApi(conversationId: string): Promise<{ messages: IMessage[] }> {
  return request<{ messages: IMessage[] }>(`/messages/${conversationId}`, {
    method: "GET",
  });
}

export async function sendMessageApi(
  conversationId: string,
  payload: { text?: string; file?: File }
): Promise<{ message: IMessage }> {
  const formData = new FormData();
  if (payload.text) {
    formData.append("text", payload.text);
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }

  return request<{ message: IMessage }>(`/messages/${conversationId}`, {
    method: "POST",
    body: formData,
  });
}

export async function markMessagesAsReadApi(
  conversationId: string
): Promise<{ message: string; modifiedCount: number }> {
  return request<{ message: string; modifiedCount: number }>(`/messages/read/${conversationId}`, {
    method: "PUT",
  });
}
