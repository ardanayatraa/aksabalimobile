import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Pause, Play, UsersRound } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Glyph as GlyphText } from "../../components/Glyph";
import { api, ApiError } from "../../lib/api";

type Player = { id: string; display_name: string; score?: number };
type Question = { id: string; prompt: string; glyph?: string; options?: string[] };
type Session = {
  pin: string;
  title: string;
  status: "lobby" | "live" | "finished";
  question_count: number;
  current_question_index?: number;
  seconds_per_question?: number;
  players?: Player[];
  currentQuestion?: Question;
};

type ControlAction = "start" | "next" | "previous" | "finish";

export default function HostRoom() {
  const { pin } = useLocalSearchParams<{ pin: string }>();
  const router = useRouter();
  const safePin = pin?.replace(/\D/g, "") || "";
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!safePin) return;
    try {
      const data = await api<{ session: Session }>(`/game/sessions/${safePin}`);
      setSession(data.session);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal load room.");
    }
  }, [safePin]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [refresh]);

  const leaderboard = useMemo(
    () => [...(session?.players || [])].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
    [session?.players]
  );

  async function control(action: ControlAction) {
    if (!safePin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ session: Session }>(`/game/sessions/${safePin}/control`, {
        method: "POST",
        body: { action }
      });
      setSession(data.session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sesi belum bisa diatur.");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Host" }} />
        <View className="flex-1 items-center justify-center p-6">
          {error ? (
            <>
              <Text className="text-base font-bold text-destructive">{error}</Text>
              <View className="h-3" />
              <Button label="Kembali" onPress={() => router.back()} variant="secondary" />
            </>
          ) : (
            <>
              <ActivityIndicator color="#B91C1C" />
              <Text className="mt-3 text-sm text-muted-foreground">Memuat room...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const q = session.currentQuestion;
  const questionIndex = (session.current_question_index ?? 0) + 1;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: session.title, headerBackTitle: "Host" }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* PIN besar */}
        <View className="items-center rounded-2xl border border-border bg-rice p-6">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">PIN room</Text>
          <Text className="mt-2 text-6xl font-extrabold tracking-widest text-ink">
            {session.pin}
          </Text>
          <Text className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Status: {session.status} · {session.question_count} soal
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <Stat label="Pemain" value={leaderboard.length} />
          <Stat label="Soal" value={`${Math.min(questionIndex, session.question_count)}/${session.question_count}`} />
          <Stat label="Durasi" value={`${session.seconds_per_question || 0}s`} />
        </View>

        {/* Current question preview */}
        {session.status === "live" && q && (
          <View className="rounded-2xl border border-border bg-rice p-5">
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Soal aktif</Text>
            <Text className="mt-2 text-lg font-bold text-ink">{q.prompt}</Text>
            {q.glyph && (
              <View className="mt-3 items-center rounded-xl bg-background p-4">
                <GlyphText size={96} color="#1A1A1A">
                  {q.glyph}
                </GlyphText>
              </View>
            )}
            {q.options && (
              <View className="mt-3 gap-2">
                {q.options.map((opt) => (
                  <View key={opt} className="rounded-xl border border-border bg-background px-4 py-3">
                    <Text className="text-base font-bold text-ink">{opt}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Controls */}
        <View className="gap-2">
          {session.status === "lobby" && (
            <Button label="Mulai sesi" onPress={() => control("start")} loading={loading} />
          )}
          {session.status === "live" && (
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Pressable
                  onPress={() => control("previous")}
                  disabled={loading}
                  className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-rice px-4 active:opacity-70"
                >
                  <ChevronLeft size={16} color="#1A1A1A" strokeWidth={2.5} />
                  <Text className="text-sm font-extrabold text-ink">Sebelumnya</Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  onPress={() => control("next")}
                  disabled={loading}
                  className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 active:opacity-90"
                >
                  <Text className="text-sm font-extrabold text-primary-foreground">Berikutnya</Text>
                  <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
          )}
          {session.status !== "finished" && (
            <Pressable
              onPress={() => control("finish")}
              disabled={loading}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 active:opacity-70"
            >
              <Pause size={16} color="#B91C1C" strokeWidth={2.5} />
              <Text className="text-sm font-extrabold text-destructive">Selesaikan sesi</Text>
            </Pressable>
          )}
          {session.status === "finished" && (
            <View className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
              <View className="flex-row items-center gap-2">
                <Play size={18} color="#B91C1C" strokeWidth={2.5} />
                <Text className="text-base font-bold text-ink">Sesi selesai</Text>
              </View>
              <Text className="mt-1 text-sm text-muted-foreground">Podium pemain ada di bawah.</Text>
            </View>
          )}
        </View>

        {/* Leaderboard */}
        <View className="rounded-2xl border border-border bg-rice p-5">
          <View className="flex-row items-center gap-2">
            <UsersRound size={16} color="#525252" strokeWidth={2.5} />
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Pemain ({leaderboard.length})
            </Text>
          </View>
          {leaderboard.length ? (
            <View className="mt-3 gap-2">
              {leaderboard.map((player, i) => (
                <View
                  key={player.id}
                  className="flex-row items-center justify-between rounded-xl bg-background px-3 py-2"
                >
                  <Text className="text-sm font-bold text-ink">
                    {i + 1}. {player.display_name}
                  </Text>
                  <Text className="text-sm font-extrabold text-primary">{player.score || 0}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-2 text-sm text-muted-foreground">Belum ada pemain masuk.</Text>
          )}
        </View>

        {error && (
          <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-semibold text-destructive">{error}</Text>
          </View>
        )}

        <Button label="Tutup" onPress={() => router.back()} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-border bg-rice py-3">
      <Text className="text-2xl font-extrabold text-ink">{value}</Text>
      <Text className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">{label}</Text>
    </View>
  );
}
