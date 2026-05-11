import Constants from "expo-constants";
import type { ApiResponse } from "./types";
import { readToken } from "./token";

const FALLBACK = "http://192.168.1.10:3000";

function resolveBaseUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.apiUrl;
  return (fromEnv || FALLBACK).replace(/\/$/, "");
}

export const API_BASE = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;
  const url = `${API_BASE}/api/mobile/v1${path}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? `Gagal terhubung ke server (${err.message})` : "Gagal terhubung ke server",
      0
    );
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // body kosong / bukan JSON
  }

  if (!response.ok || !payload || payload.success !== true) {
    const message = payload && payload.success === false ? payload.error : `Request gagal (HTTP ${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload.data;
}
