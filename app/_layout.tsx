import "../global.css";

import { useFonts, NotoSansBalinese_400Regular } from "@expo-google-fonts/noto-sans-balinese";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, fetchMe, homePathForRole, loginRequest, logoutRequest, registerRequest } from "../lib/auth";
import { readToken } from "../lib/token";
import type { Role, User } from "../lib/types";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

// Cold start selalu mulai dari "/" supaya nggak nyangkut di URL lama (mis. /lesson/abc yang sudah expired).
export const unstable_settings = {
  initialRouteName: "index"
};

function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await readToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      async signIn(input: { email: string; password: string }) {
        const data = await loginRequest(input.email, input.password);
        setUser(data.user);
        return data.user;
      },
      async signUp(input: {
        email: string;
        password: string;
        displayName: string;
        role: Exclude<Role, "admin">;
      }) {
        const data = await registerRequest(input);
        setUser(data.user);
        return data.user;
      },
      async signOut() {
        await logoutRequest();
        setUser(null);
      },
      async refresh() {
        try {
          const me = await fetchMe();
          setUser(me);
        } catch {
          setUser(null);
        }
      }
    }),
    [user, loading]
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  const router = useRouter();
  const segments = useSegments();
  const bootedRef = useRef(false);

  useEffect(() => {
    if (auth.loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inGuruGroup = segments[0] === "(guru)";

    // Cold start: kalau tamu nyangkut di halaman auth (cache route lama),
    // lempar balik ke home. Setelah ini, navigasi manual ke /(auth)/login tetap diizinkan.
    if (!bootedRef.current) {
      bootedRef.current = true;
      if (!auth.user && inAuthGroup) {
        router.replace("/" as never);
        return;
      }
    }

    // Guru/admin area tetap butuh login.
    if (inGuruGroup && !auth.user) {
      router.replace("/(auth)/login");
      return;
    }
    // Sudah login & masih di halaman auth -> kembalikan ke home sesuai role.
    if (auth.user && inAuthGroup) {
      router.replace(homePathForRole(auth.user.role) as never);
    }
  }, [auth.loading, auth.user, segments, router]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ NotoSansBalinese_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAFA" }}>
        <ActivityIndicator color="#B91C1C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAFAFA" }
            }}
          >
            <Stack.Screen name="lesson/[id]" options={{ headerShown: true, headerTitle: "Pelajaran" }} />
            <Stack.Screen name="quiz/[lessonId]" options={{ headerShown: true, headerTitle: "Kuis" }} />
            <Stack.Screen name="character/[code]" options={{ headerShown: true, headerTitle: "Karakter" }} />
            <Stack.Screen name="watch/[code]" options={{ headerShown: true, headerTitle: "Lihat goresan" }} />
            <Stack.Screen name="game-room/[pin]" options={{ headerShown: true, headerTitle: "Game" }} />
            <Stack.Screen name="host-room/[pin]" options={{ headerShown: true, headerTitle: "Host" }} />
            <Stack.Screen name="account" options={{ headerShown: true, headerTitle: "Akun" }} />
            <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: "Pengaturan" }} />
          </Stack>
        </AuthGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
