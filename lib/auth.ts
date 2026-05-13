import { createContext, useContext } from "react";
import { api } from "./api";
import { clearToken, saveToken } from "./token";
import type { AuthPayload, Role, User } from "./types";

export type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (input: { email: string; password: string }) => Promise<User>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    role: Exclude<Role, "admin">;
  }) => Promise<User>;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}

export async function loginRequest(email: string, password: string): Promise<AuthPayload> {
  const data = await api<AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false
  });
  await saveToken(data.token);
  return data;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  displayName: string;
  role: Exclude<Role, "admin">;
}): Promise<AuthPayload> {
  const data = await api<AuthPayload>("/auth/register", {
    method: "POST",
    body: input,
    auth: false
  });
  await saveToken(data.token);
  return data;
}

export async function fetchMe(): Promise<User> {
  const data = await api<{ user: User }>("/auth/me");
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // server-side logout best effort; tetap clear token lokal
  } finally {
    await clearToken();
  }
}

export function homePathForRole(role: Role): string {
  if (role === "pengajar") return "/(guru)/ruang";
  if (role === "admin") return "/(auth)/login";
  return "/(siswa)/dashboard";
}
