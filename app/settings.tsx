import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: "Pengaturan" }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <View>
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Pengaturan</Text>
          <Text className="mt-2 text-3xl font-extrabold text-ink">Aksa Bali.</Text>
        </View>

        <SettingRow label="Tema" value="Terang" hint="Mode gelap belum tersedia" />
        <SettingRow label="Bahasa antarmuka" value="Bahasa Indonesia" hint="Bali coming soon" />
        <SettingRow label="Suara" value="Aktif" hint="Pengucapan aksara" />
        <SettingRow label="Notifikasi" value="Nonaktif" hint="Pengingat latihan harian" />

        <View className="rounded-2xl border border-border bg-rice p-5">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Tentang</Text>
          <Text className="mt-2 text-sm leading-6 text-muted-foreground">
            Aksa Bali Mobile v0.1.0 — masih dalam pengembangan. Fitur penuh segera hadir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="rounded-2xl border border-border bg-rice p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">{label}</Text>
        <Text className="text-sm font-semibold text-muted-foreground">{value}</Text>
      </View>
      {hint && <Text className="mt-1 text-xs text-muted-foreground">{hint}</Text>}
    </View>
  );
}
