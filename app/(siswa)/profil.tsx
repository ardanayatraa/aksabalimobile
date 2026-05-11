import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { useAuth } from "../../lib/auth";

export default function ProfilSiswa() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function logout() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Profil siswa</Text>
        <Text className="text-3xl font-extrabold text-ink">{user?.display_name}</Text>

        <View className="gap-2 rounded-2xl border border-border bg-rice p-5">
          <Row label="Email" value={user?.email || "-"} />
          <Row label="Role" value={user?.role || "-"} />
          <Row label="Tier" value={user?.tier || "-"} />
        </View>

        <Button label="Keluar" onPress={logout} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</Text>
      <Text className="text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}
