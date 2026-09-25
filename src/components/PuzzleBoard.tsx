import { useRef, useState, type RefObject } from "react";
import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { nearestAxisCut } from "../engine/geometry/cuts";
import { cellKey, getBounds } from "../engine/geometry/shape";
import type { BoardPiece, HintGhost } from "../engine/play/attempt";
import type { CutOrientation, Shape } from "../engine/types";
import { colors, pieceColor } from "../theme/theme";
import { cellCornerRadius, fitPlayCell, TARGET_TRAY_CHROME } from "./fitTarget";

interface Props {
  target: Shape;
  pieces: BoardPiece[];
  hint: HintGhost | null;
  palette: [string, string];
  tray: string;
  playHeight: number;
  mascot?: number;
  cutMode: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCut: (pieceId: string, orientation: CutOrientation, position: number) => void;
  onDrop: (pieceId: string, x: number, y: number) => void;
  onInvalid: () => void;
}

const boardArt = require("../../assets/ui/play-board.png");

export function PuzzleBoard(props: Props) {
  const bounds = getBounds(props.target);
  const { width: screenWidth } = useWindowDimensions();
  const cell = fitPlayCell({
    screenWidth,
    playHeight: props.playHeight,
    columns: bounds.width,
    rows: bounds.height,
    mascot: Boolean(props.mascot),
  });
  const corner = cellCornerRadius(cell);
  const targetKeys = new Set(props.target.map(cellKey));
  const hintKeys = props.hint?.kind === "cells" ? new Set(props.hint.cells.map(cellKey)) : new Set<string>();
  const boardRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const targetOrigin = useRef({ x: 12, y: 36 });
  const pieceOrigins = useRef<Record<string, { x: number; y: number }>>({});
  const placed = props.pieces.filter((piece) => piece.placed);

  return (
    <View ref={boardRef} style={styles.board}>
      <View style={styles.targetRow}>
        {props.mascot ? <Image source={props.mascot} style={styles.mascot} resizeMode="contain" /> : null}
      <View
        style={[styles.tray, { backgroundColor: props.tray, width: Math.max(148, bounds.width * cell + TARGET_TRAY_CHROME) }]}
      >
        <Text numberOfLines={1} style={styles.targetLabel}>Target</Text>
        <View
          onLayout={() => {
            gridRef.current?.measureInWindow((x, y) => {
              targetOrigin.current = { x, y };
            });
          }}
          ref={gridRef}
          style={{ width: bounds.width * cell, height: bounds.height * cell, marginTop: 8 }}
        >
          {Array.from({ length: bounds.height }, (_, row) =>
            Array.from({ length: bounds.width }, (_, column) => {
              const x = bounds.minX + column;
              const y = bounds.minY + row;
              const key = cellKey({ x, y });
              if (!targetKeys.has(key)) return null;
              const ownerIndex = placed.findIndex((piece) =>
                piece.shape.some((cell) => cell.x + piece.x === x && cell.y + piece.y === y),
              );
              return (
                <View
                  key={key}
                  style={[
                    styles.cell,
                    {
                      left: column * cell,
                      top: row * cell,
                      width: cell - 2,
                      height: cell - 2,
                      borderRadius: corner,
                      borderWidth: ownerIndex >= 0 ? 2 : 1,
                      borderColor: ownerIndex >= 0 ? "#C48A4A" : "rgba(120, 72, 32, 0.2)",
                      backgroundColor:
                        ownerIndex >= 0
                          ? pieceColor(props.palette, props.pieces.indexOf(placed[ownerIndex]))
                          : hintKeys.has(key)
                            ? "#F6D98A"
                            : "#F6C56A",
                    },
                  ]}
                />
              );
            }),
          )}
        </View>
      </View>
      </View>
      <View style={styles.captionPill}>
        <Text style={styles.caption}>{props.cutMode ? "Drag across a piece to cut" : "Drag a piece onto the target"}</Text>
      </View>
      <View pointerEvents="box-none" style={styles.pieces}>
        <View pointerEvents="none" style={styles.boardFrame}>
          <Image source={boardArt} style={styles.boardImage} resizeMode="stretch" />
        </View>
        {props.pieces
          .filter((piece) => !piece.placed)
          .map((piece) => (
            <LoosePiece
              key={piece.id}
              boardRef={boardRef}
              piece={piece}
              color={pieceColor(props.palette, props.pieces.indexOf(piece))}
              cellSize={cell}
              selected={piece.id === props.selectedId}
              cutMode={props.cutMode}
              hint={props.hint?.kind === "cut" && props.hint.pieceId === piece.id ? props.hint : null}
              onSelect={() => props.onSelect(piece.id)}
              onMeasureTarget={() => {
                gridRef.current?.measureInWindow((x, y) => {
                  targetOrigin.current = { x, y };
                });
              }}
              onLayoutOrigin={(origin) => {
                pieceOrigins.current[piece.id] = origin;
              }}
              onCut={props.onCut}
              onRelease={(visualX, visualY) => {
                gridRef.current?.measureInWindow((x, y) => {
                  targetOrigin.current = { x, y };
                  const localX = (visualX - x) / cell;
                  const localY = (visualY - y) / cell;
                  props.onDrop(piece.id, bounds.minX + localX, bounds.minY + localY);
                });
              }}
              onInvalid={props.onInvalid}
            />
          ))}
      </View>
    </View>
  );
}

function DashedLine({
  horizontal,
  offset,
  length,
  color,
}: {
  horizontal: boolean;
  offset: number;
  length: number;
  color: string;
}) {
  const count = Math.max(4, Math.floor(length / 8));
  return (
    <View
      pointerEvents="none"
      style={[
        styles.cutLine,
        horizontal
          ? { top: offset - 2, left: 0, width: length, height: 4, flexDirection: "row" }
          : { left: offset - 2, top: 0, height: length, width: 4 },
      ]}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ flex: 1, backgroundColor: index % 2 === 0 ? color : "transparent" }} />
      ))}
    </View>
  );
}

function LoosePiece({
  piece,
  color,
  cellSize,
  selected,
  cutMode,
  hint,
  boardRef,
  onSelect,
  onMeasureTarget,
  onLayoutOrigin,
  onCut,
  onRelease,
  onInvalid,
}: {
  piece: BoardPiece;
  color: string;
  cellSize: number;
  selected: boolean;
  cutMode: boolean;
  hint: Extract<HintGhost, { kind: "cut" }> | null;
  boardRef: RefObject<View | null>;
  onSelect: () => void;
  onMeasureTarget: () => void;
  onLayoutOrigin: (origin: { x: number; y: number }) => void;
  onCut: (pieceId: string, orientation: CutOrientation, position: number) => void;
  onRelease: (visualX: number, visualY: number) => void;
  onInvalid: () => void;
}) {
  const bounds = getBounds(piece.shape);
  const viewRef = useRef<Animated.View>(null);
  const [preview, setPreview] = useState<{ orientation: CutOrientation; offset: number; valid: boolean } | null>(null);
  const layoutOrigin = useRef<{ x: number; y: number } | null>(null);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const dragging = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: selected && dragging.value === 0 ? 1.04 : 1 }],
  }));
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      onSelect();
      dragging.value = cutMode ? 0 : 1;
      onMeasureTarget();
      viewRef.current?.measureInWindow((x, y) => {
        layoutOrigin.current = { x, y };
        onLayoutOrigin({ x, y });
      });
    })
    .onUpdate((event) => {
      if (!cutMode) {
        tx.value = event.translationX;
        ty.value = event.translationY;
        return;
      }
      const orientation: CutOrientation = Math.abs(event.translationX) >= Math.abs(event.translationY) ? "horizontal" : "vertical";
      const along = orientation === "horizontal" ? event.y / cellSize : event.x / cellSize;
      const snapped = nearestAxisCut(piece.shape, orientation, along);
      if (snapped) {
        const offset = snapped.orientation === "horizontal" ? snapped.position - bounds.minY : snapped.position - bounds.minX;
        setPreview({ orientation: snapped.orientation, offset, valid: true });
      } else {
        setPreview({ orientation, offset: along, valid: false });
      }
    })
    .onEnd((event) => {
      const distance = Math.hypot(event.translationX, event.translationY);
      setPreview(null);
      const finish = () => {
        dragging.value = 0;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      };
      if (distance < 14) {
        finish();
        onInvalid();
        return;
      }
      if (cutMode) {
        finish();
        const orientation: CutOrientation = Math.abs(event.translationX) >= Math.abs(event.translationY) ? "horizontal" : "vertical";
        const along = orientation === "horizontal" ? event.y / cellSize : event.x / cellSize;
        onCut(piece.id, orientation, along);
        return;
      }
      viewRef.current?.measureInWindow((x, y) => {
        const layout = layoutOrigin.current;
        const moved = layout ? Math.hypot(x - layout.x, y - layout.y) : 0;
        const includesTransform = moved > Math.max(12, distance * 0.45);
        const visualX = includesTransform ? x : (layout?.x ?? x) + event.translationX;
        const visualY = includesTransform ? y : (layout?.y ?? y) + event.translationY;
        finish();
        onRelease(visualX, visualY);
      });
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={FadeIn.duration(160)}
        onLayout={() => {
          viewRef.current?.measureInWindow((x, y) => onLayoutOrigin({ x, y }));
        }}
        ref={viewRef}
        style={[styles.pieceCard, selected && styles.selected, style]}
      >
        <View style={{ width: bounds.width * cellSize, height: bounds.height * cellSize }}>
          {piece.shape.map((cell) => (
            <View
              key={cellKey(cell)}
              style={[
                styles.cell,
                {
                  left: (cell.x - bounds.minX) * cellSize,
                  top: (cell.y - bounds.minY) * cellSize,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  borderRadius: cellCornerRadius(cellSize),
                  backgroundColor: color,
                },
              ]}
            />
          ))}
          {hint ? (
            <DashedLine
              horizontal={hint.orientation === "horizontal"}
              offset={(hint.orientation === "horizontal" ? hint.position - bounds.minY : hint.position - bounds.minX) * cellSize}
              length={(hint.orientation === "horizontal" ? bounds.width : bounds.height) * cellSize}
              color="#FFF8EF"
            />
          ) : null}
          {preview ? (
            <DashedLine
              horizontal={preview.orientation === "horizontal"}
              offset={preview.offset * cellSize}
              length={(preview.orientation === "horizontal" ? bounds.width : bounds.height) * cellSize}
              color={preview.valid ? "#FFF8EF" : colors.bad}
            />
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1, width: "100%", alignItems: "center", overflow: "visible" },
  targetRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 },
  mascot: { width: 84, height: 84, flexShrink: 0 },
  tray: {
    borderRadius: 22,
    padding: 14,
    paddingTop: 8,
    borderWidth: 3,
    borderColor: "#E7C9A4",
    alignItems: "center",
  },
  targetLabel: {
    alignSelf: "center",
    marginTop: -20,
    marginBottom: 8,
    backgroundColor: "#F4E1C1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    overflow: "hidden",
    color: colors.ink,
    fontWeight: "900",
    fontSize: 14,
  },
  captionPill: {
    marginTop: 10,
    backgroundColor: "#3C2A22",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  caption: { textAlign: "center", color: "#FFF8EF", fontWeight: "800", fontSize: 12 },
  pieces: {
    flex: 1,
    width: "100%",
    overflow: "visible",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingBottom: 8,
    zIndex: 2,
  },
  boardFrame: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 4,
    bottom: 4,
    borderRadius: 28,
    overflow: "hidden",
  },
  boardImage: { width: "100%", height: "100%" },
  pieceCard: { padding: 0, borderRadius: 12 },
  selected: { borderWidth: 2, borderColor: "#F2A03D" },
  cell: { position: "absolute", borderWidth: 1, borderColor: "rgba(120, 72, 32, 0.28)" },
  cutLine: { position: "absolute" },
});
