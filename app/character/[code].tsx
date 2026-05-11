import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Eraser, Lightbulb, Lock, Trophy, Volume2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StrokeCanvas, type StrokeAttempt } from "../../components/StrokeCanvas";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useGlyphMap } from "../../lib/catalog";
import { getGlyphByCode } from "../../lib/lessons";
import { useSvgReference } from "../../lib/stroke/svgRef";

export default function CharacterDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const result = code ? getGlyphByCode(code) : undefined;
  const glyphMap = useGlyphMap();
  const catalogEntry = result ? glyphMap.get(result.glyph.char) : undefined;
  const svgQuery = useSvgReference(catalogEntry?.svg_url);

  const [strokeIndex, setStrokeIndex] = useState(0);
  const [attempts, setAttempts] = useState<StrokeAttempt[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hintKey, setHintKey] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [lastMetric, setLastMetric] = useState<StrokeAttempt | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!result) {
      const timer = setTimeout(() => router.replace("/" as never), 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [result, router]);

  const totalStrokes = svgQuery.data?.paths.length ?? 0;
  const isFinished = strokeIndex >= totalStrokes && totalStrokes > 0;

  const reset = useCallback(() => {
    setStrokeIndex(0);
    setAttempts([]);
    setMistakes(0);
    setHintKey(0);
    setConsecutiveWrong(0);
    setLastMetric(null);
    setSubmitStatus("idle");
    setSubmitError(null);
    startedAtRef.current = Date.now();
    submittedRef.current = false;
  }, []);

  const triggerHint = useCallback(() => {
    setHintKey((k) => k + 1);
  }, []);

  const onStrokeEvaluated = useCallback(
    (index: number, attempt: StrokeAttempt) => {
      setLastMetric(attempt);
      if (attempt.status === "correct") {
        setAttempts((prev) => [...prev, attempt]);
        setStrokeIndex(index + 1);
        setConsecutiveWrong(0);
      } else {
        setMistakes((m) => m + 1);
        setConsecutiveWrong((c) => {
          const next = c + 1;
          // Auto-trigger hint setelah 3x salah berturut (match web).
          if (next >= 3) {
            setTimeout(() => triggerHint(), 400);
            return 0;
          }
          return next;
        });
      }
    },
    [triggerHint]
  );

  // Submit hasil ke server saat semua stroke selesai (sekali per session).
  useEffect(() => {
    if (!result || !catalogEntry) return;
    if (!svgQuery.data) return;
    if (attempts.length === 0 || attempts.length < svgQuery.data.paths.length) return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const avgScore = Math.round(
      attempts.reduce((acc, a) => acc + a.metric.score, 0) / attempts.length
    );
    const passed = avgScore >= 64;
    const durationSeconds = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

    if (!user) return; // tamu — skip submit

    setSubmitStatus("saving");
    api("/strokes/attempts", {
      method: "POST",
      body: {
        aksaraId: catalogEntry.id,
        mode: "practice",
        score: avgScore,
        passed,
        mistakes,
        durationSeconds,
        metrics: attempts.map((a) => a.metric),
        rawStrokes: attempts.map((a) => a.rawPoints),
        normalizedStrokes: attempts.map((a) => a.pathD)
      }
    })
      .then(() => setSubmitStatus("saved"))
      .catch((err) => {
        setSubmitStatus("error");
        setSubmitError(err instanceof ApiError ? err.message : "Gagal simpan hasil");
      });
  }, [attempts, catalogEntry, mistakes, result, svgQuery.data, user]);

  if (!result) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Karakter" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-base text-muted-foreground">Mengarahkan ke Karakter...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { glyph, group } = result;
  const hasSvg = Boolean(catalogEntry?.svg_url);

  function notReady(label: string) {
    Alert.alert(label, "Fitur ini masih dalam pengembangan.", [{ text: "Oke" }]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: glyph.latin, headerBackTitle: "Karakter" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-5xl font-extrabold text-ink">{glyph.latin}</Text>
            <Text className="mt-1 text-sm font-bold uppercase tracking-widest text-primary">{group}</Text>
          </View>
          {hasSvg && totalStrokes > 0 && (
            isFinished ? (
              <View className="flex-row items-center gap-2 rounded-full bg-primary px-4 py-2">
                <Trophy size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-extrabold uppercase tracking-widest text-primary-foreground">
                  Selesai
                </Text>
              </View>
            ) : (
              <View className="items-end">
                <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  Stroke
                </Text>
                <Text className="text-2xl font-extrabold text-ink">
                  {Math.min(strokeIndex + 1, totalStrokes)} / {totalStrokes}
                </Text>
              </View>
            )
          )}
        </View>

        {!hasSvg && (
          <View className="rounded-2xl border border-border bg-muted p-5">
            <View className="flex-row items-center gap-2">
              <Lock size={18} color="#1A1A1A" strokeWidth={2.5} />
              <Text className="text-base font-bold text-ink">Belum tersedia</Text>
            </View>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Pola stroke untuk aksara ini belum disiapkan. Coba aksara lain di tab Karakter.
            </Text>
          </View>
        )}

        {hasSvg && svgQuery.isLoading && (
          <View className="aspect-square items-center justify-center rounded-2xl border border-border bg-rice">
            <ActivityIndicator color="#B91C1C" />
            <Text className="mt-2 text-xs text-muted-foreground">Memuat pola stroke...</Text>
          </View>
        )}

        {hasSvg && svgQuery.error instanceof Error && (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
            <Text className="text-sm font-bold text-destructive">{svgQuery.error.message}</Text>
          </View>
        )}

        {hasSvg && svgQuery.data && (
          <>
            <StrokeCanvas
              reference={svgQuery.data}
              activeStrokeIndex={strokeIndex}
              attempts={attempts}
              onStrokeEvaluated={onStrokeEvaluated}
              hintKey={hintKey}
              showAll={isFinished}
            />

            {lastMetric && !isFinished && (
              <Text
                className={`text-center text-sm font-bold ${
                  lastMetric.status === "correct" ? "text-[#2F5C3F]" : "text-destructive"
                }`}
              >
                {lastMetric.status === "correct" ? "Bagus, lanjut." : lastMetric.metric.feedbackMessage}
              </Text>
            )}

            {isFinished && user && submitStatus !== "idle" && (
              <Text
                className={`text-center text-xs font-bold uppercase tracking-widest ${
                  submitStatus === "error" ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {submitStatus === "saving" && "Menyimpan..."}
                {submitStatus === "saved" && "Hasil tersimpan"}
                {submitStatus === "error" && (submitError || "Gagal simpan")}
              </Text>
            )}

            <View className="flex-row items-center justify-around px-6 py-2">
              <ActionButton icon={Eraser} label="Hapus" onPress={reset} />
              <ActionButton icon={Volume2} label="Suara" onPress={() => notReady("Suara")} />
              <ActionButton icon={Lightbulb} label="Petunjuk" onPress={triggerHint} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function ActionButton({
  icon: Icon,
  label,
  onPress
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-12 w-12 items-center justify-center rounded-full active:opacity-50"
    >
      <Icon size={24} color="#1A1A1A" strokeWidth={2} />
    </Pressable>
  );
}
