import { Tabs } from "expo-router";
import { Gamepad2, GraduationCap, UserRound } from "lucide-react-native";

export default function GuruLayout() {
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
        name="ruang"
        options={{
          title: "Ruang Guru",
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="host"
        options={{
          title: "Host Game",
          tabBarIcon: ({ color, size }) => <Gamepad2 size={size} color={color} strokeWidth={2} />
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} strokeWidth={2} />
        }}
      />
    </Tabs>
  );
}
