import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { homePathForRole, useAuth } from "../lib/auth";
import type { User } from "../lib/types";

type DashboardData = {
  stats: {
    totalAttempts: number;
    averageScore: number;
    masteredAksara: number;
    weeklyAttempts: number;
    weeklyXp: number;
  };
};

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleLogout() {
    await signOut();
    router.replace("/" as never);
  }

  async function loginWithGoogle() {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const signed = await signInWithGoogle();
      if (!signed) return;
      router.replace(homePathForRole(signed.role) as never);
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Login Google gagal.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: user ? "Profil" : "Masuk" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}>
        {user ? (
          <LoggedInView onLogout={handleLogout} user={user} />
        ) : (
          <GuestView onGoogle={loginWithGoogle} googleLoading={googleLoading} googleError={googleError} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GuestView({
  onGoogle,
  googleLoading,
  googleError
}: {
  onGoogle: () => void;
  googleLoading: boolean;
  googleError: string | null;
}) {
  const router = useRouter();

  return (
    <>
      <View>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Akun</Text>
        <Text className="mt-2 text-3xl font-extrabold text-ink">Masuk yuk.</Text>
        <Text className="mt-2 text-sm leading-6 text-muted-foreground">
          Boleh tanpa akun — tapi progres baru kesimpan kalau kamu masuk.
        </Text>
      </View>

      <View className="gap-3">
        <Button label="Masuk dengan Google" onPress={onGoogle} loading={googleLoading} />
        {googleError && (
          <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-semibold text-destructive">{googleError}</Text>
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-border bg-rice p-5">
        <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Cuma latihan dulu?
        </Text>
        <Text className="mt-2 text-sm leading-6 text-muted-foreground">
          Lanjut aja sebagai tamu — skor latihan nggak kesimpan, tapi semua aksara dasar tetap bisa dibuka.
        </Text>
        <View className="mt-3">
          <Button label="Lanjut sebagai tamu" onPress={() => router.back()} variant="ghost" />
        </View>
      </View>
    </>
  );
}

function LoggedInView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: () => api<DashboardData>("/dashboard"),
    enabled: user.role !== "pengajar" && user.role !== "admin"
  });

  const stats = dashboardQuery.data?.stats;

  return (
    <>
      <View>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Profil</Text>
        <Text className="mt-2 text-3xl font-extrabold text-ink">{user.display_name}</Text>
      </View>

      <View className="gap-2 rounded-2xl border border-border bg-rice p-5">
        <Row label="Email" value={user.email} />
        <Row label="Role" value={user.role} />
        <Row label="Tier" value={user.tier} />
      </View>

      {stats && (
        <View className="gap-3">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Progres belajar
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <StatCard label="Percobaan" value={stats.totalAttempts} />
            <StatCard label="Skor rata-rata" value={stats.averageScore} />
            <StatCard label="Aksara dikuasai" value={stats.masteredAksara} />
            <StatCard label="Minggu ini" value={stats.weeklyAttempts} meta={`${stats.weeklyXp} XP`} />
          </View>
        </View>
      )}

      <Button label="Keluar" onPress={onLogout} variant="secondary" />
    </>
  );
}

function StatCard({ label, value, meta }: { label: string; value: number; meta?: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-2xl border border-border bg-rice p-4">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</Text>
      <Text className="mt-2 text-3xl font-extrabold text-ink">{value}</Text>
      {meta && <Text className="mt-1 text-xs font-semibold text-primary">{meta}</Text>}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</Text>
      <Text className="text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}
