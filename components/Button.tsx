import { ActivityIndicator, Pressable, Text } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
};

const base = "min-h-12 flex-row items-center justify-center rounded-xl px-5";
const styles: Record<Variant, { container: string; text: string; spinner: string }> = {
  primary: {
    container: "bg-primary active:opacity-90",
    text: "text-primary-foreground font-bold text-base",
    spinner: "#FFFFFF"
  },
  secondary: {
    container: "border border-border bg-rice active:opacity-80",
    text: "text-ink font-bold text-base",
    spinner: "#1A1A1A"
  },
  ghost: {
    container: "active:opacity-70",
    text: "text-primary font-bold text-base",
    spinner: "#B91C1C"
  }
};

export function Button({ label, onPress, loading, disabled, variant = "primary" }: Props) {
  const style = styles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${style.container} ${isDisabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={style.spinner} />
      ) : (
        <Text className={style.text}>{label}</Text>
      )}
    </Pressable>
  );
}
