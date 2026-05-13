import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Lock, Play, Star } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Glyph as GlyphText } from "../../components/Glyph";
import { useGlyphMap } from "../../lib/catalog";
import { getLessonById } from "../../lib/lessons";

export default function LessonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = id ? getLessonById(id) : undefined;
  const glyphMap = useGlyphMap();

  useEffect(() => {
    if (!lesson) {
      // Auto-redirect kalau URL stale (mis. lesson id lama dari cache router).
      const timer = setTimeout(() => router.replace("/" as never), 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [lesson, router]);

  if (!lesson) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Pelajaran" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-base text-muted-foreground">Mengarahkan ke Pelajaran...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const earnedStars = 0;
  const unlockedGlyphs = lesson.glyphs.filter((g) => glyphMap.get(g.char)?.svg_url);
  const allLocked = unlockedGlyphs.length === 0;
  const firstUnlocked = unlockedGlyphs[0];

  const lessonId = lesson.id;
  function startTest() {
    router.push(`/quiz/${lessonId}` as never);
  }

  function startLatihan() {
    if (!firstUnlocked) return;
    const code = firstUnlocked.char.codePointAt(0)?.toString(16);
    if (!code) return;
    router.push(`/character/${code}` as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: lesson.title, headerBackTitle: "Pelajaran" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}>
        <View>
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">{lesson.group}</Text>
          <Text className="mt-2 text-3xl font-extrabold text-ink">{lesson.title}</Text>
        </View>

        <Stars earned={earnedStars} total={3} />

        <View className="gap-3">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Aksara di bagian ini · Tap buat lihat animasinya
          </Text>
          {lesson.glyphs.map((glyph, index) => {
            const locked = !glyphMap.get(glyph.char)?.svg_url;
            const code = glyph.char.codePointAt(0)?.toString(16);
            const onPress = () => {
              if (locked || !code) return;
              router.push(`/watch/${code}` as never);
            };
            return (
              <Pressable
                key={glyph.char}
                onPress={onPress}
                disabled={locked}
                className={`flex-row items-center gap-4 rounded-2xl border p-4 ${
                  locked ? "border-border bg-muted opacity-70" : "border-border bg-rice active:opacity-80"
                }`}
              >
                <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-background">
                  <GlyphText size={48} color="#1A1A1A" style={locked ? { opacity: 0.4 } : undefined}>
                    {glyph.char}
                  </GlyphText>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    Aksara {index + 1}
                  </Text>
                  <Text className="mt-1 text-2xl font-extrabold text-ink">{glyph.latin}</Text>
                  <View className="mt-1 flex-row items-center gap-1.5">
                    <Text className="text-xs font-semibold text-muted-foreground">
                      U+{glyph.char.codePointAt(0)?.toString(16).toUpperCase()}
                    </Text>
                    {locked && (
                      <>
                        <Text className="text-xs font-semibold text-muted-foreground">·</Text>
                        <Lock size={12} color="#525252" strokeWidth={2.5} />
                        <Text className="text-xs font-semibold text-muted-foreground">belum tersedia</Text>
                      </>
                    )}
                  </View>
                </View>
                {!locked && (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Play size={16} color="#B91C1C" strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="TEST" onPress={startTest} variant="secondary" />
          </View>
          <View className="flex-1">
            <Button label="LATIHAN" onPress={startLatihan} disabled={allLocked} />
          </View>
        </View>
        {allLocked && (
          <Text className="text-center text-xs text-muted-foreground">
            Pola stroke bagian ini lagi disiapin. Pilih bagian lain dulu ya.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stars({ earned, total }: { earned: number; total: number }) {
  return (
    <View className="items-center gap-2 rounded-2xl border border-border bg-rice p-5">
      <View className="flex-row gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <Star
            key={i}
            size={36}
            color={i < earned ? "#B91C1C" : "#E5E5E5"}
            fill={i < earned ? "#B91C1C" : "transparent"}
            strokeWidth={2}
          />
        ))}
      </View>
      <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {earned === 0 ? "Belum dimulai" : `${earned} / ${total} bintang`}
      </Text>
    </View>
  );
}
