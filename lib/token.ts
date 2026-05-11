import * as SecureStore from "expo-secure-store";

const KEY = "aksabali.jwt";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(KEY, token);
}

export async function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(KEY);
}
