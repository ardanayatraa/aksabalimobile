import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";

export default function RuangGuru() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View>
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Ruang guru</Text>
          <Text className="mt-2 text-3xl font-extrabold text-ink">{user?.display_name || "Guru"}.</Text>
          <Text className="mt-1 text-sm leading-6 text-muted-foreground">
            Buat room game, kontrol jalannya soal, dan lihat aktivitas kelas.
          </Text>
        </View>

        <View className="rounded-2xl border border-border bg-rice p-5">
          <Text className="text-base font-bold text-ink">Cara mulai</Text>
          <Text className="mt-2 text-sm leading-6 text-muted-foreground">
            Buka tab <Text className="font-bold text-ink">Host Game</Text> untuk bikin room baru. Statistik kelas
            bakal muncul di sini.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
