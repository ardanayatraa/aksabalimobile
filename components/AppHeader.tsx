import { useRouter } from "expo-router";
import { LogIn, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { Glyph } from "./Glyph";

function initials(name?: string | null, email?: string | null): string {
  const source = name || email || "AB";
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function AppHeader() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-3">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Glyph size={18} color="#FFFFFF">
            ᬅ
          </Glyph>
        </View>
        <View>
          <Text className="text-base font-extrabold text-ink">Aksa Bali</Text>
          <Text className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
            {user ? user.display_name?.split(" ")[0] || user.role : "Mode tamu"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => router.push("/settings" as never)}
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-rice active:opacity-60"
          accessibilityLabel="Pengaturan"
        >
          <Settings size={18} color="#1A1A1A" strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/account" as never)}
          className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
            user ? "bg-ink" : "border border-border bg-rice"
          }`}
          accessibilityLabel={user ? "Profil" : "Masuk"}
        >
          {user ? (
            <Text className="text-sm font-extrabold text-primary-foreground">
              {initials(user.display_name, user.email)}
            </Text>
          ) : (
            <LogIn size={18} color="#1A1A1A" strokeWidth={2} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
