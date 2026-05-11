import { useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { Glyph as GlyphText } from "../../components/Glyph";
import { useGlyphMap, type AksaraCatalogEntry } from "../../lib/catalog";
import { glyphCode, lessons, type Glyph, type Lesson } from "../../lib/lessons";

type TopTab = "pelajaran" | "karakter";

export default function PelajaranScreen() {
  const [tab, setTab] = useState<TopTab>("pelajaran");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AppHeader />
      <SegmentedTabs value={tab} onChange={setTab} />
      {tab === "pelajaran" ? <PelajaranTab /> : <KarakterTab />}
    </SafeAreaView>
  );
}

function SegmentedTabs({ value, onChange }: { value: TopTab; onChange: (next: TopTab) => void }) {
  const items: { id: TopTab; label: string }[] = [
    { id: "pelajaran", label: "Pelajaran" },
    { id: "karakter", label: "Karakter" }
  ];
  return (
    <View className="flex-row gap-2 border-b border-border bg-background px-5 pt-3 pb-3">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            className={`flex-1 items-center rounded-full px-4 py-2.5 ${active ? "bg-ink" : "bg-rice border border-border"}`}
          >
            <Text className={`text-sm font-extrabold uppercase tracking-widest ${active ? "text-primary-foreground" : "text-ink"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PelajaranTab() {
  const router = useRouter();
  const glyphMap = useGlyphMap();
  const grouped = useMemo(
    () =>
      lessons.reduce<Record<Lesson["group"], Lesson[]>>(
        (acc, lesson) => {
          (acc[lesson.group] ||= []).push(lesson);
          return acc;
        },
        { Wrehasta: [], Swara: [], Angka: [] }
      ),
    []
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }}>
      <View>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Pelajaran</Text>
        <Text className="mt-2 text-3xl font-extrabold text-ink">Pilih bagian.</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Tiap bagian berisi 3 aksara. Selesaikan untuk dapat 3 bintang.
        </Text>
      </View>

      {(Object.entries(grouped) as [Lesson["group"], Lesson[]][]).map(([group, items]) =>
        items.length === 0 ? null : (
          <View key={group} className="gap-3">
            <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              {groupLabel(group)}
            </Text>
            {items.map((lesson) => {
              const allLocked = lesson.glyphs.every((g) => !glyphMap.get(g.char)?.svg_url);
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  glyphMap={glyphMap}
                  locked={allLocked}
                  onPress={() => {
                    if (allLocked) {
                      Alert.alert(
                        "Belum tersedia",
                        "Bagian ini belum punya pola stroke. Pilih bagian lain.",
                        [{ text: "Oke" }]
                      );
                      return;
                    }
                    router.push(`/lesson/${lesson.id}` as never);
                  }}
                />
              );
            })}
          </View>
        )
      )}
    </ScrollView>
  );
}

function KarakterTab() {
  const router = useRouter();
  const glyphMap = useGlyphMap();
  const grouped = useMemo(() => {
    const acc: Record<Lesson["group"], Glyph[]> = { Wrehasta: [], Swara: [], Angka: [] };
    for (const lesson of lessons) acc[lesson.group].push(...lesson.glyphs);
    return acc;
  }, []);

  function openCharacter(glyph: Glyph) {
    const entry = glyphMap.get(glyph.char);
    if (!entry?.svg_url) {
      Alert.alert("Belum tersedia", `Pola stroke untuk "${glyph.latin}" belum tersedia. Coba aksara lain.`, [
        { text: "Oke" }
      ]);
      return;
    }
    router.push(`/character/${glyphCode(glyph.char)}` as never);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 28 }}>
      <View>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Karakter</Text>
        <Text className="mt-2 text-3xl font-extrabold text-ink">Semua aksara.</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Tile yang berwarna bisa di-tap untuk latihan stroke. Tile kunci belum tersedia.
        </Text>
      </View>

      <CharacterSection title="Wrehasta" subtitle="18 aksara dasar wianjana" glyphs={grouped.Wrehasta} glyphMap={glyphMap} onPressGlyph={openCharacter} />
      <CharacterSection title="Swara" subtitle="Aksara vokal" glyphs={grouped.Swara} glyphMap={glyphMap} onPressGlyph={openCharacter} />
      <CharacterSection title="Angka" subtitle="0 – 9" glyphs={grouped.Angka} glyphMap={glyphMap} onPressGlyph={openCharacter} />
    </ScrollView>
  );
}

function CharacterSection({
  title,
  subtitle,
  glyphs,
  glyphMap,
  onPressGlyph
}: {
  title: string;
  subtitle: string;
  glyphs: Glyph[];
  glyphMap: Map<string, AksaraCatalogEntry>;
  onPressGlyph: (glyph: Glyph) => void;
}) {
  return (
    <View className="gap-3">
      <View>
        <Text className="text-base font-extrabold text-ink">{title}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle}</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {glyphs.map((glyph) => {
          const locked = !glyphMap.get(glyph.char)?.svg_url;
          return (
            <Pressable
              key={glyph.char}
              onPress={() => onPressGlyph(glyph)}
              disabled={locked}
              className={`w-[31%] gap-2 rounded-2xl border p-3 ${
                locked ? "border-border bg-muted opacity-60" : "border-border bg-rice active:opacity-70"
              }`}
            >
              <View
                className="relative w-full items-center justify-center rounded-xl bg-background"
                style={{ aspectRatio: 3 / 4 }}
              >
                <GlyphText size={42} color="#1A1A1A">
                  {glyph.char}
                </GlyphText>
                {locked && (
                  <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-ink">
                    <Lock size={12} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                )}
              </View>
              <Text
                className={`text-center text-xs font-bold ${locked ? "text-muted-foreground/60" : "text-muted-foreground"}`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {glyph.latin}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function groupLabel(group: Lesson["group"]): string {
  if (group === "Wrehasta") return "Aksara Wianjana — Wrehasta";
  if (group === "Swara") return "Aksara Swara — AIUEO";
  return "Angka Bali";
}

function LessonCard({
  lesson,
  glyphMap,
  locked,
  onPress
}: {
  lesson: Lesson;
  glyphMap: Map<string, AksaraCatalogEntry>;
  locked: boolean;
  onPress: () => void;
}) {
  const slots: (Glyph | null)[] = [...lesson.glyphs];
  while (slots.length < 3) slots.push(null);

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border p-6 ${
        locked ? "border-border bg-muted opacity-60" : "border-border bg-rice active:opacity-80"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[0.62rem] font-extrabold uppercase tracking-widest text-primary">
          {lesson.group}
        </Text>
        {locked && (
          <View className="flex-row items-center gap-1.5">
            <Lock size={12} color="#525252" strokeWidth={2.5} />
            <Text className="text-[0.62rem] font-extrabold uppercase tracking-widest text-muted-foreground">
              Belum tersedia
            </Text>
          </View>
        )}
      </View>

      <View className="mt-6 flex-row items-stretch gap-2">
        {slots.map((glyph, index) => {
          const glyphLocked = glyph ? !glyphMap.get(glyph.char)?.svg_url : false;
          return (
            <View key={glyph?.char ?? `empty-${index}`} className="flex-1 items-center gap-2">
              <View className="relative w-full items-center justify-center overflow-hidden rounded-xl bg-background px-2 py-4">
                {glyph ? (
                  <GlyphText
                    size={40}
                    color="#1A1A1A"
                    style={glyphLocked ? { opacity: 0.35, paddingTop: 4, paddingRight: 4 } : { paddingTop: 4, paddingRight: 4 }}
                  >
                    {glyph.char}
                  </GlyphText>
                ) : (
                  <Text style={{ fontSize: 40, lineHeight: 60 }} className="text-border">
                    ·
                  </Text>
                )}
                {glyph && glyphLocked && (
                  <View className="absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full bg-ink">
                    <Lock size={10} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                )}
              </View>
              {glyph ? (
                <Text
                  className={`text-xs font-bold ${glyphLocked ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {glyph.latin}
                </Text>
              ) : (
                <Text className="text-xs font-bold text-border">—</Text>
              )}
            </View>
          );
        })}
      </View>

      <View className="mt-6 flex-row items-center justify-between border-t border-border pt-4">
        <Text className="text-base font-bold text-ink">{lesson.title}</Text>
        <Text className={`text-xs font-semibold uppercase tracking-widest ${locked ? "text-muted-foreground" : "text-primary"}`}>
          {locked ? "Locked" : "Buka →"}
        </Text>
      </View>
    </Pressable>
  );
}
