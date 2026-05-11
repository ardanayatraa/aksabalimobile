import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { homePathForRole, useAuth } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const user = await signIn({ email: email.trim(), password });
      router.replace(homePathForRole(user.role) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    Alert.alert(
      "Belum tersedia",
      "Login dengan Google belum di-wire. Pakai email dulu ya — atau lanjut sebagai tamu.",
      [{ text: "Oke" }]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Aksa Bali</Text>
          <Text className="mt-2 text-4xl font-extrabold text-ink">Masuk akun.</Text>
          <Text className="mt-2 text-base text-muted-foreground">Lanjutkan latihan nyurat aksara Bali.</Text>

          <View className="mt-8 gap-4">
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="nama@email.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="Minimal 8 karakter"
            />

            {error && (
              <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-semibold text-destructive">{error}</Text>
              </View>
            )}

            <Button label="Masuk dengan Email" onPress={submit} loading={loading} />
          </View>

          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">atau</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Button label="Masuk dengan Google" onPress={loginWithGoogle} variant="secondary" />

          <View className="mt-8 flex-row items-center justify-center gap-2">
            <Text className="text-sm text-muted-foreground">Belum punya akun?</Text>
            <Link href="/(auth)/register" className="text-sm font-bold text-primary">
              Daftar
            </Link>
          </View>

          <View className="mt-6 items-center">
            <Link href={"/" as never} className="text-sm font-bold text-muted-foreground">
              Lanjut sebagai tamu
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
