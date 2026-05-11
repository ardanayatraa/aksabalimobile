import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { RolePicker, type PickerRole } from "../../components/RolePicker";
import { homePathForRole, useAuth } from "../../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PickerRole>("siswa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signUp({
        email: email.trim(),
        password,
        displayName: name.trim() || email.split("@")[0],
        role
      });
      router.replace(homePathForRole(user.role) as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-primary">Daftar</Text>
          <Text className="mt-2 text-4xl font-extrabold text-ink">Bikin akun baru.</Text>
          <Text className="mt-2 text-base text-muted-foreground">Pilih siswa atau guru — fiturnya beda.</Text>

          <View className="mt-8 gap-4">
            <RolePicker value={role} onChange={setRole} />

            <Field
              label="Nama"
              value={name}
              onChangeText={setName}
              placeholder="Nama lengkap kamu"
              autoComplete="name"
            />
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
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
            />

            {error && (
              <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <Text className="text-sm font-semibold text-destructive">{error}</Text>
              </View>
            )}

            <Button label="Buat akun" onPress={submit} loading={loading} />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-2">
            <Text className="text-sm text-muted-foreground">Sudah punya akun?</Text>
            <Link href="/(auth)/login" className="text-sm font-bold text-primary">
              Masuk
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
