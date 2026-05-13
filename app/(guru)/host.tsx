import { useRouter } from "expo-router";
import { Gamepad2 } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { api, ApiError } from "../../lib/api";

const CATEGORIES = [
  { id: "semua", name: "Semua aksara" },
  { id: "anacaraka", name: "Anacaraka" },
  { id: "swara", name: "Swara AIUEO" },
  { id: "angka", name: "Angka Bali" },
  { id: "gabungan-vokal", name: "Gabungan Vokal" },
  { id: "kata", name: "Kata aksara" }
];

const MODES = [
  { id: "acak", label: "Acak" },
  { id: "huruf", label: "Huruf" },
  { id: "kata", label: "Kata" }
];

type CreateResponse = { session: { pin: string } };

export default function HostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("Game Aksa Bali");
  const [mode, setMode] = useState("acak");
  const [categories, setCategories] = useState<string[]>(["semua"]);
  const [questionCount, setQuestionCount] = useState("10");
  const [seconds, setSeconds] = useState("20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategories((prev) => {
      if (id === "semua") return ["semua"];
      const without = prev.filter((c) => c !== "semua");
      const next = without.includes(id) ? without.filter((c) => c !== id) : [...without, id];
      return next.length ? next : ["semua"];
    });
  }

  async function createRoom() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<CreateResponse>("/game/sessions", {
        method: "POST",
        body: {
          title,
          mode,
          questionCategories: categories,
          questionCount: Number(questionCount) || 10,
          secondsPerQuestion: Number(seconds) || 20
        }
      });
      router.push(`/host-room/${data.session.pin}` as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal buat room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View>
            <View className="flex-row items-center gap-2">
              <Gamepad2 size={18} color="#B91C1C" strokeWidth={2} />
              <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Host game</Text>
            </View>
            <Text className="mt-2 text-3xl font-extrabold text-ink">Buat room.</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Pilih kategori soal, durasi tiap soal, lalu bagikan PIN ke siswa.
            </Text>
          </View>

          <View className="gap-4 rounded-2xl border border-border bg-rice p-5">
            <Field label="Judul room" value={title} onChangeText={setTitle} placeholder="Mis. Kuis Sabtu" />

            <View className="gap-2">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Mode</Text>
              <View className="flex-row gap-2">
                {MODES.map((m) => {
                  const active = mode === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMode(m.id)}
                      className={`flex-1 items-center rounded-xl border px-3 py-2.5 ${
                        active ? "border-primary bg-primary" : "border-border bg-background"
                      }`}
                    >
                      <Text className={`text-sm font-extrabold ${active ? "text-primary-foreground" : "text-ink"}`}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Kategori soal
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = categories.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCategory(c.id)}
                      className={`rounded-full border px-4 py-2 ${
                        active ? "border-primary bg-primary" : "border-border bg-background"
                      }`}
                    >
                      <Text className={`text-sm font-bold ${active ? "text-primary-foreground" : "text-ink"}`}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Jumlah soal"
                  value={questionCount}
                  onChangeText={(v) => setQuestionCount(v.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  placeholder="10"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Detik / soal"
                  value={seconds}
                  onChangeText={(v) => setSeconds(v.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  placeholder="20"
                />
              </View>
            </View>

            {error && (
              <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-semibold text-destructive">{error}</Text>
              </View>
            )}

            <Button label="Buat room" onPress={createRoom} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
