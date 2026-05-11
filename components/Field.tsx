import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

type Props = TextInputProps & {
  label: string;
};

export function Field({ label, ...inputProps }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor="#9CA3AF"
        className="min-h-12 rounded-xl border border-border bg-rice px-4 text-base text-ink"
      />
    </View>
  );
}
