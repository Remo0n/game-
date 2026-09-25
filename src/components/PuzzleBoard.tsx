import { Text } from "./Typography";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";
import { listBinaryCuts } from "../engine/geometry/cuts";
import { cellKey, getBounds } from "../engine/geometry/shape";
import type { BoardPiece, HintGhost } from "../engine/play/attempt";
import type { CutOrientation, Shape } from "../engine/types";
import { CutFeedback } from "./CutFeedback";
import { FoodArt } from "./FoodArt";
import { TraySurface } from "./SceneArt";
import { colors, pieceColor } from "../theme/theme";
import { cellCornerRadius } from "./fitTarget";
import {
  BoardCut,
  layoutBoard,
  PieceLayout,
  pieceAtPoint,
  Point,
  resolveBoardCut,
} from "./boardGeometry";

const spring = { damping: 21, stiffness: 250, mass: 0.8 };
interface Props {
  target: Shape;
  pieces: BoardPiece[];
  hint: HintGhost | null;
  palette: [string, string];
  skinId: string;
  trayId: string;
  tray: string;
  playHeight: number;
  boardWidth?: number;
  cutMode: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCut: (
    pieceId: string,
    orientation: CutOrientation,
    position: number,
  ) => boolean;
  onDrop: (pieceId: string, x: number, y: number) => boolean;
  onInvalid: () => void;
  onGestureActive?: (active: boolean) => void;
}

export function PuzzleBoard(props: Props) {
  const [width, setWidth] = useState(props.boardWidth ?? 300);
  const maxCell = useRef(46);
  const viewport = useRef({ width, height: props.playHeight });
  const sameViewport =
    viewport.current.width === width &&
    viewport.current.height === props.playHeight;
  const board = layoutBoard(
    props.target,
    props.pieces,
    width,
    props.playHeight,
    sameViewport ? maxCell.current : 46,
  );
  const { cell, grid, layouts } = board;
  const bounds = getBounds(props.target);
  const previous = useRef<Record<string, PieceLayout>>({});
  const splitOrigins = useRef<Point[]>([]);
  const lastCut = useRef<string | null>(null);
  const strokeStart = useRef<Point>({ x: 0, y: 0 });
  const lastPointer = useRef<Point>({ x: 0, y: 0 });
  const [stroke, setStroke] = useState<{
    tip: Point;
    previous: Point;
    cut: BoardCut | null;
  } | null>(null);
  const [flash, setFlash] = useState<(BoardCut & { key: number }) | null>(null);
  const trayScale = useSharedValue(1);
  const placedCount = props.pieces.filter((p) => p.placed).length;
  const previousPlaced = useRef(placedCount);
  const targetKeys = new Set(props.target.map(cellKey));
  const hintKeys =
    props.hint?.kind === "cells"
      ? new Set(props.hint.cells.map(cellKey))
      : new Set<string>();
  const removed = Object.keys(previous.current).filter((id) => !layouts[id]);
  const added = props.pieces.filter((p) => !previous.current[p.id]);
  const origins: Record<string, Point> = {};
  for (const [index, piece] of added.entries()) {
    if (
      lastCut.current &&
      removed.includes(lastCut.current) &&
      splitOrigins.current[index]
    ) {
      origins[piece.id] = splitOrigins.current[index];
    } else if (removed.length) {
      // Undo joins fragments; newly restored pieces travel back from their former positions.
      const center = removed.reduce(
        (point, id) => ({
          x: point.x + previous.current[id].x + previous.current[id].width / 2,
          y: point.y + previous.current[id].y + previous.current[id].height / 2,
        }),
        { x: 0, y: 0 },
      );
      origins[piece.id] = {
        x: center.x / removed.length - layouts[piece.id].width / 2,
        y: center.y / removed.length - layouts[piece.id].height / 2,
      };
    }
  }
  useLayoutEffect(() => {
    previous.current = layouts;
    // Keep cells steady during a puzzle, but recover their size after a resize
    // or device rotation instead of retaining the smallest previous viewport.
    maxCell.current = cell;
    viewport.current = { width, height: props.playHeight };
    lastCut.current = null;
    splitOrigins.current = [];
  });
  useEffect(() => {
    if (placedCount > previousPlaced.current)
      trayScale.value = withSequence(
        withTiming(1.025, { duration: 100 }),
        withSpring(1, spring),
      );
    previousPlaced.current = placedCount;
  }, [placedCount]);
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [flash]);
  const trayMotion = useAnimatedStyle(() => ({
    transform: [{ scale: trayScale.value }],
  }));

  function point(x: number, y: number): Point {
    return { x, y: y + board.cuttingTop };
  }
  function cutAt(end: Point) {
    return resolveBoardCut(
      strokeStart.current,
      end,
      props.pieces,
      layouts,
      cell,
    );
  }
  const cutGesture = Gesture.Pan()
    .minDistance(5)
    .runOnJS(true)
    .onBegin((event) => {
      strokeStart.current = point(event.x, event.y);
      props.onGestureActive?.(true);
      lastPointer.current = strokeStart.current;
      setStroke({
        tip: strokeStart.current,
        previous: strokeStart.current,
        cut: null,
      });
    })
    .onUpdate((event) => {
      const end = point(event.x, event.y);
      setStroke({ tip: end, previous: lastPointer.current, cut: cutAt(end) });
      lastPointer.current = end;
    })
    .onEnd((event) => {
      const end = point(event.x, event.y);
      const cut = cutAt(end);
      if (cut) {
        const piece = props.pieces.find((p) => p.id === cut.pieceId)!;
        const split = listBinaryCuts(piece.shape).find(
          (c) =>
            c.orientation === cut.orientation && c.position === cut.position,
        )!;
        const pieceBounds = getBounds(piece.shape);
        splitOrigins.current = [split.low, split.high].map((shape) => {
          const b = getBounds(shape);
          return {
            x: layouts[piece.id].x + (b.minX - pieceBounds.minX) * cell,
            y: layouts[piece.id].y + (b.minY - pieceBounds.minY) * cell,
          };
        });
        lastCut.current = piece.id;
        if (props.onCut(cut.pieceId, cut.orientation, cut.position))
          setFlash({ ...cut, key: Date.now() });
      } else if (
        Math.hypot(
          end.x - strokeStart.current.x,
          end.y - strokeStart.current.y,
        ) >= 14
      )
        props.onInvalid();
    })
    .onFinalize(() => {
      setStroke(null);
      props.onGestureActive?.(false);
    });
  const selectGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event) => {
      const piece = pieceAtPoint(
        point(event.x, event.y),
        props.pieces,
        layouts,
        cell,
      );
      if (piece) props.onSelect(piece.id);
    });

  return (
    <View
      testID="puzzle-board"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ width: "100%", height: board.height }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tray,
          {
            left: Math.min(grid.x - 16, (width - 148) / 2),
            top: 0,
            width: Math.max(148, bounds.width * cell + 32),
            height: bounds.height * cell + 56,
            backgroundColor: props.tray,
          },
          trayMotion,
        ]}
      >
        <View style={StyleSheet.absoluteFill}>
          <TraySurface id={props.trayId} />
        </View>
        <Text style={styles.targetLabel}>YOUR BENTO</Text>
      </Animated.View>
      <View
        pointerEvents="none"
        testID="target-grid"
        style={{
          position: "absolute",
          left: grid.x,
          top: grid.y,
          width: bounds.width * cell,
          height: bounds.height * cell,
        }}
      >
        {props.target.map((square) => {
          const key = cellKey(square);
          if (!targetKeys.has(key)) return null;
          return (
            <View
              key={key}
              style={[
                styles.cell,
                {
                  left: (square.x - bounds.minX) * cell,
                  top: (square.y - bounds.minY) * cell,
                  width: cell - 2,
                  height: cell - 2,
                  borderRadius: cellCornerRadius(cell),
                  backgroundColor: hintKeys.has(key)
                    ? "#B6C89A"
                    : "rgba(255,252,234,0.55)",
                  borderColor: "rgba(92,66,37,0.25)",
                },
              ]}
            />
          );
        })}
      </View>
      <View
        pointerEvents="none"
        style={[styles.captionPill, { top: board.cuttingTop - 28 }]}
      >
        <Text style={styles.caption}>
          {props.cutMode ? "SWIPE ACROSS A SEAM" : "MOVE & PACK"}
        </Text>
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.boardFrame,
          {
            top: board.cuttingTop,
            height: board.cuttingHeight,
            borderColor: props.cutMode ? "#9DB98B" : "#FFFFFFAA",
          },
        ]}
      />
      {props.pieces.map((piece, index) => (
        <MovingPiece
          key={piece.id}
          piece={piece}
          layout={layouts[piece.id]}
          origin={origins[piece.id]}
          cell={cell}
          color={pieceColor(props.palette, index)}
          skinId={props.skinId}
          selected={piece.id === props.selectedId}
          cutMode={props.cutMode}
          hint={
            props.hint?.kind === "cut" && props.hint.pieceId === piece.id
              ? props.hint
              : null
          }
          onSelect={() => props.onSelect(piece.id)}
          onGestureActive={props.onGestureActive}
          onDrop={(x, y) =>
            props.onDrop(
              piece.id,
              bounds.minX + (x - grid.x) / cell,
              bounds.minY + (y - grid.y) / cell,
            )
          }
        />
      ))}
      {props.cutMode && (
        <GestureDetector gesture={Gesture.Race(cutGesture, selectGesture)}>
          <View
            testID="cutting-surface"
            accessibilityLabel="Cutting board. Swipe across any piece along a grid seam."
            style={{
              position: "absolute",
              top: board.cuttingTop,
              left: 0,
              right: 0,
              height: board.cuttingHeight,
              zIndex: 60,
            }}
          />
        </GestureDetector>
      )}
      {stroke && (
        <CutFeedback {...stroke} width={width} height={board.height} />
      )}
      {flash && (
        <CutFlash
          key={flash.key}
          cut={flash}
          width={width}
          height={board.height}
        />
      )}
      {props.pieces.every((piece) => piece.placed) && (
        <Animated.View
          entering={FadeIn.duration(180)}
          pointerEvents="none"
          style={[styles.finished, { top: board.cuttingTop + 24 }]}
        >
          <Text style={styles.finishedText}>Beautifully packed!</Text>
        </Animated.View>
      )}
    </View>
  );
}

function MovingPiece({
  piece,
  layout,
  origin,
  cell,
  color,
  skinId,
  selected,
  cutMode,
  hint,
  onSelect,
  onDrop,
  onGestureActive,
}: {
  piece: BoardPiece;
  layout: PieceLayout;
  origin?: Point;
  cell: number;
  color: string;
  skinId: string;
  selected: boolean;
  cutMode: boolean;
  hint: Extract<HintGhost, { kind: "cut" }> | null;
  onSelect: () => void;
  onDrop: (x: number, y: number) => boolean;
  onGestureActive?: (active: boolean) => void;
}) {
  const bounds = getBounds(piece.shape);
  const x = useSharedValue(origin?.x ?? layout.x);
  const y = useSharedValue(origin?.y ?? layout.y + 16);
  const scale = useSharedValue(origin ? 1.04 : 0.88);
  const angle = useSharedValue(0);
  const dragging = useSharedValue(false);
  const selectedAmount = useSharedValue(selected ? 1 : 0);
  const oldRotation = useRef(piece.rotation);
  const pointer = useRef({ rootX: 0, rootY: 0, grabX: 0, grabY: 0 });
  useLayoutEffect(() => {
    x.value = withSpring(layout.x, spring);
    y.value = withSpring(layout.y, spring);
    scale.value = withSpring(1, spring);
    if (oldRotation.current !== piece.rotation) {
      const delta = ((piece.rotation - oldRotation.current + 540) % 360) - 180;
      // Geometry rotates counterclockwise in screen coordinates.
      angle.value = delta;
      angle.value = withTiming(0, { duration: 260 });
      oldRotation.current = piece.rotation;
    }
  }, [layout.x, layout.y, piece.rotation, piece.placed, cell]);
  useEffect(() => {
    selectedAmount.value = withTiming(selected && !piece.placed ? 1 : 0, {
      duration: 180,
    });
  }, [selected, piece.placed]);
  const motion = useAnimatedStyle(() => ({
    zIndex: dragging.value ? 50 : piece.placed ? 3 : selected ? 12 : 10,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${angle.value}deg` },
      { scale: scale.value },
    ],
  }));
  const selection = useAnimatedStyle(() => ({ opacity: selectedAmount.value }));
  function settle() {
    x.value = withSpring(layout.x, spring);
    y.value = withSpring(layout.y, spring);
    scale.value = withSpring(1, spring);
  }
  const pan = Gesture.Pan()
    .enabled(!cutMode && !piece.placed)
    .minDistance(4)
    .runOnJS(true)
    .onBegin((event) => {
      pointer.current = {
        rootX: event.absoluteX - event.x - x.value,
        rootY: event.absoluteY - event.y - y.value,
        grabX: event.x,
        grabY: event.y,
      };
      onSelect();
      onGestureActive?.(true);
      dragging.value = true;
      scale.value = withSpring(1.07, spring);
    })
    .onUpdate((event) => {
      x.value = event.absoluteX - pointer.current.rootX - pointer.current.grabX;
      y.value = event.absoluteY - pointer.current.rootY - pointer.current.grabY;
    })
    .onEnd((event) => {
      const dropX =
        event.absoluteX - pointer.current.rootX - pointer.current.grabX;
      const dropY =
        event.absoluteY - pointer.current.rootY - pointer.current.grabY;
      x.value = dropX;
      y.value = dropY;
      if (Math.hypot(event.translationX, event.translationY) < 10) settle();
      else if (!onDrop(dropX, dropY)) {
        settle();
        angle.value = withSequence(
          withTiming(-4, { duration: 65 }),
          withTiming(4, { duration: 65 }),
          withSpring(0, spring),
        );
      }
    })
    .onFinalize((_, success) => {
      if (!success) settle();
      dragging.value = false;
      scale.value = withSpring(1, spring);
      onGestureActive?.(false);
    });
  const tap = Gesture.Tap()
    .enabled(!piece.placed && !cutMode)
    .runOnJS(true)
    .onEnd(onSelect);
  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View
        testID={`piece-${piece.id}`}
        accessibilityLabel={`${piece.placed ? "Packed" : "Loose"} piece, ${piece.shape.length} squares`}
        pointerEvents={piece.placed || cutMode ? "none" : "auto"}
        entering={FadeIn.duration(100)}
        exiting={FadeOut.duration(110)}
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: layout.width,
            height: layout.height,
          },
          motion,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.selection, selection]}
        />
        {piece.shape.map((square) => (
          <View
            key={cellKey(square)}
            style={[
              styles.cell,
              {
                left: (square.x - bounds.minX) * cell,
                top: (square.y - bounds.minY) * cell,
                width: cell - 2,
                height: cell - 2,
                borderRadius: cellCornerRadius(cell),
                backgroundColor: color,
                borderColor: "rgba(92,66,37,0.20)",
                borderBottomWidth: piece.placed ? 2 : 3,
                shadowColor: colors.ink,
                shadowOpacity: piece.placed ? 0.04 : 0.13,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 3 },
              },
            ]}
          >
            <FoodArt
              id={skinId}
              size={cell - 5}
              variant={square.x + square.y}
            />
          </View>
        ))}
        {hint && (
          <Animated.View
            entering={FadeIn.duration(200)}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          >
            <Svg width={layout.width} height={layout.height}>
              <Line
                x1={
                  hint.orientation === "horizontal"
                    ? 0
                    : (hint.position - bounds.minX) * cell
                }
                y1={
                  hint.orientation === "horizontal"
                    ? (hint.position - bounds.minY) * cell
                    : 0
                }
                x2={
                  hint.orientation === "horizontal"
                    ? layout.width
                    : (hint.position - bounds.minX) * cell
                }
                y2={
                  hint.orientation === "horizontal"
                    ? (hint.position - bounds.minY) * cell
                    : layout.height
                }
                stroke={colors.accent}
                strokeWidth={2}
                strokeDasharray="3 4"
              />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function CutFlash({
  cut,
  width,
  height,
}: {
  cut: BoardCut;
  width: number;
  height: number;
}) {
  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withDelay(70, withTiming(0, { duration: 360 }));
  }, []);
  const motion = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 80 }, motion]}
    >
      <Svg width={width} height={height}>
        <Line
          x1={cut.from.x}
          y1={cut.from.y}
          x2={cut.to.x}
          y2={cut.to.y}
          stroke="#FFFFFF"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <Line
          x1={cut.from.x}
          y1={cut.from.y}
          x2={cut.to.x}
          y2={cut.to.y}
          stroke={colors.accent}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Crumb
          key={index}
          index={index}
          point={{
            x: (cut.from.x + cut.to.x) / 2,
            y: (cut.from.y + cut.to.y) / 2,
          }}
        />
      ))}
    </Animated.View>
  );
}
function Crumb({ point, index }: { point: Point; index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 420 });
  }, []);
  const angle = (index * Math.PI) / 3;
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * 35 * progress.value },
      {
        translateY:
          Math.sin(angle) * 28 * progress.value +
          12 * progress.value * progress.value,
      },
      { rotate: `${progress.value * 140}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: point.x,
          top: point.y,
          width: 5,
          height: 8,
          borderRadius: 2,
          backgroundColor: index % 2 ? colors.coral : colors.gold,
        },
        motion,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  tray: {
    position: "absolute",
    borderRadius: 22,
    alignItems: "center",
    paddingTop: 12,
    overflow: "hidden",
  },
  targetLabel: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: "800",
    color: "#705A3E",
    backgroundColor: "#FFF7E9D9",
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cell: {
    position: "absolute",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  captionPill: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#FFFFFFD9",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  caption: {
    fontSize: 10,
    letterSpacing: 0.9,
    fontWeight: "700",
    color: colors.accentDeep,
  },
  boardFrame: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF63",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 22,
  },
  selection: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -3,
    bottom: -3,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: "#FFFFFF22",
  },
  finished: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
  },
  finishedText: { color: colors.cream, fontWeight: "600", fontSize: 15 },
});
