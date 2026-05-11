import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Trophy, UsersRound, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Glyph as GlyphText } from "../../components/Glyph";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Player = { id: string; user_id?: string; display_name: string; score?: number };
type Question = { id: string; prompt: string; glyph?: string; options?: string[] };
type Session = {
  pin: string;
  title: string;
  status: "lobby" | "live" | "finished";
  question_count: number;
  current_question_index?: number;
  seconds_per_question?: number;
  host_id?: string;
  host_name?: string;
  players?: Player[];
  currentQuestion?: Question;
};

type AnswerResult = { correct: boolean; correctOption: string; scoreDelta: number };

function isBaliText(text: string): boolean {
  return /[ᬀ-᭿]/.test(text);
}

export default function GameRoom() {
  const { pin } = useLocalSearchParams<{ pin: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerState, setAnswerState] = useState<{ questionKey: string; selected: string; result: AnswerResult | null }>({
    questionKey: "",
    selected: "",
    result: null
  });
  const startedAtRef = useRef(Date.now());
  const safePin = pin?.replace(/\D/g, "") || "";

  const refresh = useCallback(async () => {
    if (!safePin) return;
    try {
      const data = await api<{ session: Session }>(`/game/sessions/${safePin}`, { auth: Boolean(user) });
      setSession(data.session);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal load room.");
    }
  }, [safePin, user]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [refresh]);

  const question = session?.currentQuestion;
  const questionKey = question
    ? `${question.id}-${session?.current_question_index ?? 0}`
    : session?.status || "";
  const selected = answerState.questionKey === questionKey ? answerState.selected : "";
  const result = answerState.questionKey === questionKey ? answerState.result : null;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [questionKey]);

  const leaderboard = useMemo(
    () => [...(session?.players || [])].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
    [session?.players]
  );

  async function submitAnswer(option: string) {
    if (!session || !question || result || session.status !== "live") return;
    setAnswerState({ questionKey, selected: option, result: null });
    setSubmitting(true);
    try {
      const data = await api<AnswerResult>(`/game/sessions/${safePin}/answer`, {
        method: "POST",
        body: {
          questionIndex: session.current_question_index,
          answer: option,
          elapsedMs: Date.now() - startedAtRef.current,
          displayName: user?.display_name || "Siswa"
        }
      });
      setAnswerState({ questionKey, selected: option, result: data });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Jawaban belum terkirim.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Game" }} />
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: session.title || `PIN ${session.pin}`, headerBackTitle: "Game" }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">PIN {session.pin}</Text>
            <Text className="mt-1 text-xl font-extrabold text-ink">{session.title}</Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-1.5">
              <UsersRound size={14} color="#525252" strokeWidth={2.5} />
              <Text className="text-sm font-extrabold text-ink">{leaderboard.length}</Text>
            </View>
            <Text className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
              {session.status}
            </Text>
          </View>
        </View>

        {session.status === "lobby" && (
          <View className="rounded-2xl border border-border bg-rice p-5">
            <Text className="text-base font-bold text-ink">Tunggu guru memulai.</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Room akan otomatis lanjut ke soal pertama saat host menekan Mulai.
            </Text>
          </View>
        )}

        {session.status === "live" && question && (
          <>
            <View className="rounded-2xl border border-border bg-rice p-5">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
                Soal {(session.current_question_index ?? 0) + 1} / {session.question_count}
              </Text>
              <Text className="mt-2 text-2xl font-extrabold text-ink">{question.prompt}</Text>
              {question.glyph && (
                <View className="mt-4 items-center rounded-xl bg-background p-6">
                  <GlyphText size={120} color="#1A1A1A">
                    {question.glyph}
                  </GlyphText>
                </View>
              )}
            </View>

            <View className="gap-2">
              {question.options?.map((opt) => {
                const isSel = selected === opt;
                const isCorrect = result?.correctOption === opt;
                const isWrongPick = Boolean(result && isSel && !isCorrect);
                let cls = "border-border bg-rice";
                if (result && isCorrect) cls = "border-[#4A7C59] bg-[#4A7C59]/10";
                else if (isWrongPick) cls = "border-destructive bg-destructive/10";
                else if (isSel && !result) cls = "border-primary bg-primary/5";

                return (
                  <Pressable
                    key={opt}
                    onPress={() => submitAnswer(opt)}
                    disabled={Boolean(result) || submitting}
                    className={`min-h-16 flex-row items-center justify-between rounded-2xl border px-5 py-4 ${cls}`}
                  >
                    {isBaliText(opt) ? (
                      <GlyphText size={36} color="#1A1A1A">
                        {opt}
                      </GlyphText>
                    ) : (
                      <Text className="text-lg font-bold text-ink">{opt}</Text>
                    )}
                    {result && isCorrect && <Check size={20} color="#2F5C3F" strokeWidth={2.5} />}
                    {isWrongPick && <X size={20} color="#B91C1C" strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </View>

            {result && (
              <View
                className={`rounded-2xl border p-4 ${
                  result.correct ? "border-[#4A7C59]/40 bg-[#4A7C59]/10" : "border-destructive/30 bg-destructive/10"
                }`}
              >
                <Text className={`text-sm font-bold ${result.correct ? "text-[#2F5C3F]" : "text-destructive"}`}>
                  {result.correct ? `Benar! +${result.scoreDelta} poin` : `Salah. Jawaban: ${result.correctOption}`}
                </Text>
              </View>
            )}
          </>
        )}

        {session.status === "finished" && (
          <View className="items-center rounded-2xl border border-primary/30 bg-primary/10 p-6">
            <Trophy size={32} color="#B91C1C" strokeWidth={2.5} />
            <Text className="mt-3 text-xl font-extrabold text-ink">Sesi selesai</Text>
            <Text className="mt-1 text-sm text-muted-foreground">Lihat podium di bawah.</Text>
          </View>
        )}

        <View className="rounded-2xl border border-border bg-rice p-5">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Peringkat</Text>
          {leaderboard.length ? (
            <View className="mt-3 gap-2">
              {leaderboard.slice(0, 10).map((player, i) => (
                <View
                  key={player.id}
                  className={`flex-row items-center justify-between rounded-xl px-3 py-2 ${
                    i === 0 && session.status === "finished" ? "bg-primary/10" : "bg-background"
                  }`}
                >
                  <Text className="text-sm font-bold text-ink">
                    {i + 1}. {player.display_name}
                  </Text>
                  <Text className="text-sm font-extrabold text-primary">{player.score || 0}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-2 text-sm text-muted-foreground">Belum ada pemain.</Text>
          )}
        </View>

        {error && (
          <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm font-semibold text-destructive">{error}</Text>
          </View>
        )}

        <Button label="Keluar room" onPress={() => router.back()} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}
