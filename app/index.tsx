import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/auth";

export default function IndexRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#B91C1C" />
      </View>
    );
  }

  // Guest atau siswa → lesson list. Guru/admin → ruang guru.
  if (user?.role === "pengajar") return <Redirect href={"/(guru)/ruang" as never} />;
  return <Redirect href={"/(siswa)/dashboard" as never} />;
}
