import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { API_BASE } from "./api";
import { saveToken } from "./token";
import type { Role } from "./types";

export type GoogleSignInResult =
  | { ok: true; token: string; role: Role }
  | { ok: false; reason: "cancelled" | "error"; message?: string };

const RETURN_SCHEME = "aksabali://auth";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogleWebFlow(): Promise<GoogleSignInResult> {
  const authUrl = `${API_BASE}/api/auth/google?mobile=1`;
  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, RETURN_SCHEME, {
      showInRecents: false
    });

    if (result.type === "cancel" || result.type === "dismiss") {
      return { ok: false, reason: "cancelled" };
    }

    if (result.type !== "success" || !result.url) {
      return { ok: false, reason: "error", message: "Hasil login tidak valid." };
    }

    const parsed = Linking.parse(result.url);
    const params = parsed.queryParams || {};
    const error = typeof params.error === "string" ? params.error : null;
    if (error) return { ok: false, reason: "error", message: error };

    const token = typeof params.token === "string" ? params.token : null;
    const role = (typeof params.role === "string" ? params.role : "siswa") as Role;
    if (!token) {
      return { ok: false, reason: "error", message: "Token tidak diterima dari server." };
    }

    await saveToken(token);
    return { ok: true, token, role };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Login Google gagal."
    };
  }
}
