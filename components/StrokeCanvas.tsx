import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, View, type LayoutChangeEvent } from "react-native";
import Svg, { G, Line, Path, Rect } from "react-native-svg";
import { svgPathProperties } from "svg-path-properties";
import { evaluateStroke, pointsToPath, type Metric } from "../lib/stroke/engine";
import type { Point } from "../lib/stroke/geometry";
import type { SvgReference } from "../lib/stroke/svgRef";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const HINT_DURATION_MS = 2200;

export type StrokeAttempt = {
  rawPoints: Point[];
  pathD: string;
  status: "correct" | "wrong" | "correctAfterMiss";
  metric: Metric;
};

type Props = {
  reference: SvgReference;
  activeStrokeIndex: number;
  onStrokeEvaluated: (index: number, attempt: StrokeAttempt) => void;
  attempts: StrokeAttempt[];
  /** Bump untuk replay animasi stroke-order pada stroke aktif. */
  hintKey?: number;
  showAll?: boolean;
  minScoreToPass?: number;
};

export function StrokeCanvas({
  reference,
  activeStrokeIndex,
  onStrokeEvaluated,
  attempts,
  hintKey = 0,
  showAll = false,
  minScoreToPass = 64
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hintActive, setHintActive] = useState(false);
  const pointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const hintOffset = useRef(new Animated.Value(0)).current;

  const { viewBox } = reference;
  const activeRefPath = reference.paths[activeStrokeIndex];

  const activeRefLength = useMemo(() => {
    if (!activeRefPath) return 0;
    try {
      return new svgPathProperties(activeRefPath).getTotalLength();
    } catch {
      return 0;
    }
  }, [activeRefPath]);

  // Replay animasi tiap kali hintKey berubah.
  useEffect(() => {
    if (hintKey === 0 || !activeRefLength) return;
    let cancelled = false;
    let lingerTimer: ReturnType<typeof setTimeout> | null = null;

    setHintActive(true);
    hintOffset.setValue(activeRefLength);
    const anim = Animated.timing(hintOffset, {
      toValue: 0,
      duration: HINT_DURATION_MS,
      useNativeDriver: false
    });
    anim.start(({ finished }) => {
      if (!finished || cancelled) return;
      lingerTimer = setTimeout(() => {
        if (!cancelled) setHintActive(false);
      }, 800);
    });
    return () => {
      cancelled = true;
      anim.stop();
      if (lingerTimer) clearTimeout(lingerTimer);
    };
  }, [hintKey, activeRefLength, hintOffset]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const toViewBox = useCallback(
    (px: number, py: number): Point => {
      if (size.width === 0 || size.height === 0) return { x: 0, y: 0 };
      return {
        x: (px / size.width) * viewBox.width,
        y: (py / size.height) * viewBox.height
      };
    },
    [size, viewBox]
  );

  const finalizeStroke = useCallback(() => {
    if (pointsRef.current.length < 4) {
      pointsRef.current = [];
      isDrawingRef.current = false;
      setCurrentPoints([]);
      return;
    }
    const refPath = reference.paths[activeStrokeIndex];
    if (!refPath) {
      pointsRef.current = [];
      isDrawingRef.current = false;
      setCurrentPoints([]);
      return;
    }
    const { normalizedPoints, metric } = evaluateStroke(pointsRef.current, refPath);
    const status: StrokeAttempt["status"] = metric.score >= minScoreToPass ? "correct" : "wrong";
    const attempt: StrokeAttempt = {
      rawPoints: [...pointsRef.current],
      pathD: pointsToPath(normalizedPoints),
      status,
      metric
    };
    onStrokeEvaluated(activeStrokeIndex, attempt);
    pointsRef.current = [];
    isDrawingRef.current = false;
    setCurrentPoints([]);
  }, [activeStrokeIndex, minScoreToPass, onStrokeEvaluated, reference]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          isDrawingRef.current = true;
          const { locationX, locationY } = event.nativeEvent;
          const p = toViewBox(locationX, locationY);
          pointsRef.current = [p];
          setCurrentPoints([p]);
        },
        onPanResponderMove: (event) => {
          if (!isDrawingRef.current) return;
          const { locationX, locationY } = event.nativeEvent;
          const p = toViewBox(locationX, locationY);
          pointsRef.current = [...pointsRef.current, p];
          setCurrentPoints(pointsRef.current);
        },
        onPanResponderRelease: finalizeStroke,
        onPanResponderTerminate: finalizeStroke
      }),
    [finalizeStroke, toViewBox]
  );

  const currentPath = useMemo(() => pointsToPath(currentPoints), [currentPoints]);
  const isFinished = activeStrokeIndex >= reference.paths.length;

  return (
    <View
      onLayout={onLayout}
      {...panResponder.panHandlers}
      className="overflow-hidden rounded-2xl border border-border bg-rice"
      style={{ aspectRatio: 1 }}
    >
      <Svg
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <Rect x={0} y={0} width={viewBox.width} height={viewBox.height} fill="#FFFAF0" />
        <G stroke="#1A1A1A" strokeOpacity={0.06} strokeWidth={0.45}>
          {[1, 2].map((i) => (
            <Line
              key={`v${i}`}
              x1={(viewBox.width / 3) * i}
              y1={0}
              x2={(viewBox.width / 3) * i}
              y2={viewBox.height}
            />
          ))}
          {[1, 2].map((i) => (
            <Line
              key={`h${i}`}
              x1={0}
              y1={(viewBox.height / 3) * i}
              x2={viewBox.width}
              y2={(viewBox.height / 3) * i}
            />
          ))}
        </G>

        {/* Reference: semua stroke faded (saat hint aktif atau selesai semua) */}
        {reference.paths.map((d, index) => {
          const isActive = index === activeStrokeIndex;
          const shouldShow = showAll || isFinished || isActive;
          if (!shouldShow) return null;
          if (isActive && hintActive) return null; // animated version yang dipakai
          return (
            <Path
              key={`ref-${index}`}
              d={d}
              stroke={isActive ? "#D89A2B" : "#241917"}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={isActive ? 0.45 : 0.12}
            />
          );
        })}

        {/* Animated hint stroke pada aktif */}
        {hintActive && activeRefPath && activeRefLength > 0 && (
          <AnimatedPath
            d={activeRefPath}
            stroke="#B91C1C"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={`${activeRefLength},${activeRefLength}`}
            strokeDashoffset={hintOffset as unknown as number}
          />
        )}

        {/* Strokes yang sudah lulus: render reference path (bukan user path) biar rapi */}
        {attempts.map((attempt, index) => {
          const cleanPath = reference.paths[index] ?? attempt.pathD;
          return (
            <Path
              key={`done-${index}`}
              d={cleanPath}
              stroke="#1A1A1A"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={attempt.status === "correctAfterMiss" ? 0.65 : 1}
            />
          );
        })}

        {/* Stroke yang sedang digambar */}
        {currentPath ? (
          <Path
            d={currentPath}
            stroke="#15616D"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}
