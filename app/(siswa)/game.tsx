import { useRouter } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

function normalizePin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

type Session = {
  pin: string;
  title: string;
  status: "lobby" | "live" | "finished";
  question_count: number;
  host_name?: string;
};

export default function GameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [name, setName] = useState(user?.display_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Session | null>(null);

  async function checkRoom() {
    const safePin = normalizePin(pin);
    if (safePin.length !== 6) {
      setError("PIN harus 6 angka.");
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const data = await api<{ session: Session }>(`/game/sessions/${safePin}`, { auth: false });
      setPreview(data.session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Room tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!preview) return;
    const safeName = name.trim();
    if (!safeName) {
      setError("Isi nama dulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api(`/game/sessions/${preview.pin}/join`, {
        method: "POST",
        body: { displayName: safeName },
        auth: Boolean(user)
      });
      router.push(`/game-room/${preview.pin}` as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Belum bisa masuk room.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <AppHeader />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View>
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Game</Text>
            <Text className="mt-2 text-3xl font-extrabold text-ink">Login dulu.</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Buat join game kelas, kamu perlu akun supaya skor masuk ke leaderboard.
            </Text>
          </View>
          <Button label="Masuk akun" onPress={() => router.push("/account" as never)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AppHeader />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View>
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Game</Text>
            <Text className="mt-2 text-3xl font-extrabold text-ink">Gabung pakai PIN.</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Minta PIN dari guru, masuk room, jawab soal aksara.
            </Text>
          </View>

          <View className="gap-3 rounded-2xl border border-border bg-rice p-5">
            <View className="flex-row items-center gap-2">
              <KeyRound size={18} color="#B91C1C" strokeWidth={2} />
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">PIN room</Text>
            </View>
            <Field
              label="6 angka"
              value={pin}
              onChangeText={(v) => setPin(normalizePin(v))}
              keyboardType="number-pad"
              placeholder="123456"
              maxLength={6}
            />
            <Field
              label="Nama pemain"
              value={name}
              onChangeText={setName}
              placeholder="Nama kamu"
              autoCapitalize="words"
            />

            {error && (
              <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-semibold text-destructive">{error}</Text>
              </View>
            )}

            {preview ? (
              <View className="gap-2 rounded-xl border border-border bg-background p-4">
                <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  Room ditemukan
                </Text>
                <Text className="text-lg font-extrabold text-ink">{preview.title}</Text>
                <Text className="text-xs text-muted-foreground">
                  Status: {preview.status} · {preview.question_count} soal
                  {preview.host_name ? ` · Host: ${preview.host_name}` : ""}
                </Text>
              </View>
            ) : null}

            {preview ? (
              <Button label="Gabung sekarang" onPress={joinRoom} loading={loading} />
            ) : (
              <Button label="Cek room" onPress={checkRoom} loading={loading} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
