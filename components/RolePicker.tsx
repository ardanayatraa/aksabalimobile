import { Pressable, Text, View } from "react-native";

export type PickerRole = "siswa" | "pengajar";

type Props = {
  value: PickerRole;
  onChange: (role: PickerRole) => void;
};

const options: { value: PickerRole; label: string; hint: string }[] = [
  { value: "siswa", label: "Siswa", hint: "Latihan nyurat, kuis, ikut game kelas" },
  { value: "pengajar", label: "Guru", hint: "Host game Kahoot untuk kelas" }
];

export function RolePicker({ value, onChange }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Daftar sebagai</Text>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`flex-1 rounded-xl border px-4 py-3 ${
                active ? "border-primary bg-primary" : "border-border bg-rice"
              }`}
            >
              <Text className={`text-base font-bold ${active ? "text-primary-foreground" : "text-ink"}`}>
                {option.label}
              </Text>
              <Text className={`mt-1 text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {option.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
