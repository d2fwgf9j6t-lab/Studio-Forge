import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { ImportedSound } from '@/types/project';

export function DraggableBeat({
  sound,
  onDragStart,
  onDragMove,
  onDrop,
  onDragCancel,
  onTap,
}: {
  sound: ImportedSound;
  onDragStart: (sound: ImportedSound, x: number, y: number) => void;
  onDragMove: (sound: ImportedSound, x: number, y: number) => void;
  onDrop: (sound: ImportedSound, x: number, y: number) => void;
  onDragCancel: () => void;
  onTap: (sound: ImportedSound) => void;
}) {
  const colors = useColors();
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > 8 ||
          (Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) > 3),
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 8 ||
          (Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) > 3),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_event, gesture) =>
          onDragStart(sound, gesture.moveX, gesture.moveY),
        onPanResponderMove: (_event, gesture) =>
          onDragMove(sound, gesture.moveX, gesture.moveY),
        onPanResponderRelease: (_event, gesture) =>
          onDrop(sound, gesture.moveX, gesture.moveY),
        onPanResponderTerminate: onDragCancel,
      }),
    [onDragCancel, onDragMove, onDragStart, onDrop, sound],
  );

  return (
      <Pressable
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={`Add ${sound.name} to the selected track or drag it onto a specific bar`}
      accessibilityHint="Tap to place at the next open bar, or drag onto a track."
      onPress={() => onTap(sound)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.panelRaised, borderColor: colors.line },
        pressed && styles.pressed,
      ]}
      testID={`drag-beat-${sound.id}`}
    >
      <View style={[styles.glyph, { backgroundColor: colors.violetLow }]}>
        <Ionicons name="musical-note" size={13} color={colors.primary} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.name, { color: colors.foreground }]}
      >
        {sound.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pressed: { opacity: 0.72 },
  glyph: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, fontSize: 8, fontWeight: '700' },
});
