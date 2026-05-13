import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";

export default function LatihanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Mode lain</Text>
        <Text className="text-3xl font-extrabold text-ink">Selain stroke.</Text>
        <Text className="text-sm text-muted-foreground">
          Stroke ada di tab Pelajaran. Tab ini buat mode lain yang lagi disiapin.
        </Text>

        <View className="gap-3">
          {[
            { title: "Flashcard huruf", desc: "Hafalin aksara dasar pakai kartu bolak-balik" },
            { title: "Latihan kata", desc: "Cocokin kata Latin sama aksara Bali" },
            { title: "Latihan baca", desc: "Baca aksara dulu, cek jawaban setelahnya" }
          ].map((mode) => (
            <View key={mode.title} className="rounded-2xl border border-border bg-rice p-5">
              <Text className="text-base font-bold text-ink">{mode.title}</Text>
              <Text className="mt-1 text-sm text-muted-foreground">{mode.desc}</Text>
              <Text className="mt-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Lagi disiapin
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
