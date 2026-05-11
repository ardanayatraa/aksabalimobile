import { Tabs } from "expo-router";
import { BookOpenText, Gamepad2, PenLine } from "lucide-react-native";

export default function SiswaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B91C1C",
        tabBarInactiveTintColor: "#525252",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E5E5E5" }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Pelajaran",
          tabBarIcon: ({ color, size }) => <BookOpenText size={size} color={color} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="latihan"
        options={{
          title: "Mode lain",
          tabBarIcon: ({ color, size }) => <PenLine size={size} color={color} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: "Game",
          tabBarIcon: ({ color, size }) => <Gamepad2 size={size} color={color} strokeWidth={2} />
        }}
      />
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}
