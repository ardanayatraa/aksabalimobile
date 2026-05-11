import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Glyph as GlyphText } from "../../components/Glyph";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getLessonById, lessons, type Glyph } from "../../lib/lessons";

type Question = {
  id: string;
  type: "glyph-to-latin" | "latin-to-glyph";
  glyph: Glyph;
  options: string[];
  answer: string;
};

type Answer = { id: string; value: string; correct: boolean };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(lessonGlyphs: Glyph[]): Question[] {
  const decoyPool = lessons.flatMap((l) => l.glyphs).filter((g) => !lessonGlyphs.find((lg) => lg.char === g.char));
  const out: Question[] = [];

  lessonGlyphs.forEach((glyph, index) => {
    const wrongs = shuffle(decoyPool).slice(0, 3);
    // Glyph → Latin
    out.push({
      id: `g2l-${index}`,
      type: "glyph-to-latin",
      glyph,
      options: shuffle([glyph.latin, ...wrongs.map((w) => w.latin)]),
      answer: glyph.latin
    });
    // Latin → Glyph
    const wrongs2 = shuffle(decoyPool).slice(0, 3);
    out.push({
      id: `l2g-${index}`,
      type: "latin-to-glyph",
      glyph,
      options: shuffle([glyph.char, ...wrongs2.map((w) => w.char)]),
      answer: glyph.char
    });
  });

  return out;
}

export default function QuizScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;

  const questions = useMemo(() => (lesson ? buildQuestions(lesson.glyphs) : []), [lesson]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson) {
      const t = setTimeout(() => router.replace("/" as never), 500);
      return () => clearTimeout(t);
    }
    return;
  }, [lesson, router]);

  if (!lesson) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Kuis" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-base text-muted-foreground">Mengarahkan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const current = questions[index];
  const isFinished = index >= questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  function pick(option: string) {
    if (selected) return;
    if (!current) return;
    setSelected(option);
    const correct = option === current.answer;
    const next: Answer = { id: current.id, value: option, correct };
    setAnswers((prev) => [...prev, next]);
    setTimeout(() => {
      setSelected(null);
      setIndex((i) => i + 1);
    }, 1000);
  }

  async function submitAttempt() {
    if (!user) {
      // Tamu — skip submit, langsung tampil result.
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api("/quiz/attempts", {
        method: "POST",
        body: {
          mode: "huruf",
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          questions: questions.map((q) => ({ id: q.id, type: "choice", answer: q.answer })),
          answers: answers.map((a) => ({ id: a.id, value: a.value }))
        }
      });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gagal kirim hasil kuis.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (isFinished && answers.length === questions.length && user) {
      submitAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  if (isFinished) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Hasil Kuis" }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View className="items-center rounded-2xl border border-border bg-rice p-8">
            <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
              {lesson.title}
            </Text>
            <Text className="mt-4 text-7xl font-extrabold text-ink">{score}</Text>
            <Text className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {correctCount} / {questions.length} benar
            </Text>
            {submitting && (
              <Text className="mt-3 text-xs text-muted-foreground">Menyimpan hasil...</Text>
            )}
            {submitError && (
              <Text className="mt-3 text-xs text-destructive">{submitError}</Text>
            )}
            {!user && (
              <Text className="mt-3 text-center text-xs text-muted-foreground">
                Login untuk simpan progres kuis.
              </Text>
            )}
          </View>

          <View className="gap-3">
            <Button label="Ulangi kuis" onPress={() => router.replace(`/quiz/${lesson.id}` as never)} />
            <Button label="Kembali ke pelajaran" onPress={() => router.back()} variant="secondary" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!current) return null;

  const isCorrect = selected === current.answer;
  const isWrong = selected !== null && !isCorrect;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: lesson.title, headerBackTitle: "Kuis" }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View>
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Soal {index + 1} / {questions.length}
          </Text>
          <Text className="mt-2 text-2xl font-extrabold text-ink">
            {current.type === "glyph-to-latin" ? "Apa bacaan aksara ini?" : "Aksara mana yang dibaca:"}
          </Text>
        </View>

        <View className="aspect-[3/2] items-center justify-center rounded-2xl border border-border bg-rice p-6">
          {current.type === "glyph-to-latin" ? (
            <GlyphText size={96} color="#1A1A1A">
              {current.glyph.char}
            </GlyphText>
          ) : (
            <Text className="text-6xl font-extrabold text-ink">{current.glyph.latin}</Text>
          )}
        </View>

        <View className="gap-3">
          {current.options.map((opt) => {
            const isSelected = selected === opt;
            const isAnswer = opt === current.answer;
            const reveal = selected !== null;
            let cls = "border-border bg-rice";
            if (reveal && isAnswer) cls = "border-[#4A7C59] bg-[#4A7C59]/10";
            else if (reveal && isSelected && !isAnswer) cls = "border-destructive bg-destructive/10";

            const isBaliOption = current.type === "latin-to-glyph";

            return (
              <Pressable
                key={opt}
                onPress={() => pick(opt)}
                disabled={selected !== null}
                className={`min-h-16 flex-row items-center justify-between rounded-2xl border px-5 py-4 ${cls}`}
              >
                {isBaliOption ? (
                  <GlyphText size={36} color="#1A1A1A">
                    {opt}
                  </GlyphText>
                ) : (
                  <Text className="text-2xl font-bold text-ink">{opt}</Text>
                )}
                {reveal && isAnswer && <Check size={20} color="#2F5C3F" strokeWidth={2.5} />}
                {reveal && isSelected && !isAnswer && <X size={20} color="#B91C1C" strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <View
            className={`rounded-2xl border p-4 ${
              isCorrect ? "border-[#4A7C59]/40 bg-[#4A7C59]/10" : "border-destructive/30 bg-destructive/10"
            }`}
          >
            <Text className={`text-sm font-bold ${isCorrect ? "text-[#2F5C3F]" : "text-destructive"}`}>
              {isCorrect ? "Benar!" : `Salah. Jawaban: ${current.answer}`}
            </Text>
          </View>
        )}

        {isWrong && false}
      </ScrollView>
    </SafeAreaView>
  );
}
