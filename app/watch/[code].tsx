import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { svgPathProperties } from "svg-path-properties";
import { Button } from "../../components/Button";
import { useGlyphMap } from "../../lib/catalog";
import { getGlyphByCode } from "../../lib/lessons";
import { useSvgReference } from "../../lib/stroke/svgRef";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const STROKE_DURATION_MS = 2400;
const STROKE_GAP_MS = 700;
const LOOP_DELAY_MS = 1500;

export default function WatchScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const result = code ? getGlyphByCode(code) : undefined;
  const glyphMap = useGlyphMap();
  const catalogEntry = result ? glyphMap.get(result.glyph.char) : undefined;
  const svgQuery = useSvgReference(catalogEntry?.svg_url);

  const [activeIndex, setActiveIndex] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  // Stable refs — penting biar useEffect ga re-run tiap render (sebelumnya leak + crash).
  const paths = useMemo(() => svgQuery.data?.paths ?? [], [svgQuery.data]);
  const viewBox = svgQuery.data?.viewBox ?? { width: 109, height: 109 };
  const pathLengths = useMemo(() => paths.map((d) => getLength(d)), [paths]);

  useEffect(() => {
    if (!result) {
      const t = setTimeout(() => router.replace("/" as never), 500);
      return () => clearTimeout(t);
    }
    return;
  }, [result, router]);

  useEffect(() => {
    if (!paths.length) return;
    stoppedRef.current = false;

    function playStroke(index: number) {
      if (stoppedRef.current) return;
      const length = pathLengths[index];
      if (!length) {
        scheduleNext(index);
        return;
      }
      setActiveIndex(index);
      offset.setValue(length);
      animRef.current = Animated.timing(offset, {
        toValue: 0,
        duration: STROKE_DURATION_MS,
        useNativeDriver: false
      });
      animRef.current.start(({ finished }) => {
        if (!finished || stoppedRef.current) return;
        scheduleNext(index);
      });
    }

    function scheduleNext(index: number) {
      if (stoppedRef.current) return;
      const next = index + 1;
      const delay = next >= paths.length ? LOOP_DELAY_MS : STROKE_GAP_MS;
      const targetIndex = next >= paths.length ? 0 : next;
      timeoutRef.current = setTimeout(() => playStroke(targetIndex), delay);
    }

    playStroke(0);

    return () => {
      stoppedRef.current = true;
      animRef.current?.stop();
      animRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [paths, pathLengths, offset]);

  if (!result) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <Stack.Screen options={{ title: "Watch" }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-base text-muted-foreground">Mengarahkan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { glyph, group } = result;
  const activePath = paths[activeIndex];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: glyph.latin, headerBackTitle: "Pelajaran" }} />
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View>
          <Text className="text-center text-xs font-extrabold uppercase tracking-widest text-primary">{group}</Text>
          <Text className="mt-1 text-center text-3xl font-extrabold text-ink">{glyph.latin}</Text>
        </View>

        {svgQuery.isLoading && <ActivityIndicator color="#B91C1C" />}

        {svgQuery.data && paths.length > 0 && (
          <View
            className="w-full overflow-hidden rounded-2xl border border-border bg-rice"
            style={{ aspectRatio: 1 }}
          >
            <Svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
            >
              <Rect x={0} y={0} width={viewBox.width} height={viewBox.height} fill="#FFFAF0" />

              {/* Layer 1: full SVG hampir transparent */}
              {paths.map((d, i) => (
                <Path
                  key={`base-${i}`}
                  d={d}
                  stroke="#1A1A1A"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.08}
                />
              ))}

              {/* Layer 2: animasi stroke aktif, opacity 75% */}
              {activePath && pathLengths[activeIndex] > 0 && (
                <AnimatedPath
                  d={activePath}
                  stroke="#B91C1C"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.75}
                  strokeDasharray={`${pathLengths[activeIndex]},${pathLengths[activeIndex]}`}
                  strokeDashoffset={offset as unknown as number}
                />
              )}
            </Svg>
          </View>
        )}

        <Text className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Stroke {activeIndex + 1} / {paths.length || 0} · Loop
        </Text>

        <View className="w-full max-w-xs">
          <Button label="Mulai latihan" onPress={() => router.replace(`/character/${code}` as never)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getLength(d: string): number {
  try {
    return new svgPathProperties(d).getTotalLength();
  } catch {
    return 0;
  }
}
