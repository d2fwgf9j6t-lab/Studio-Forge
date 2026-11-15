import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Track } from '@/types/project';

export function TrackHeader({
  track,
  index,
  count,
  selected,
  onSelect,
  onMove,
}: {
  track: Track;
  index: number;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.trackHeader,
        {
          backgroundColor: selected ? colors.panelSelected : colors.panel,
          borderColor: selected ? colors.lime : colors.line,
        },
      ]}
    >
      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityLabel={`Select track ${track.name}`}
        style={styles.trackName}
        testID={`track-select-${track.id}`}
      >
        <View style={[styles.trackColor, { backgroundColor: track.color }]} />
        <View style={styles.trackCopy}>
          <Text
            numberOfLines={1}
            style={[styles.name, { color: colors.foreground }]}
          >
            {track.name}
          </Text>
          <Text style={[styles.kind, { color: colors.mutedForeground }]}>
            {track.kind} · {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
      </Pressable>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${track.name} up`}
          accessibilityState={{ disabled: index === 0 }}
          disabled={index === 0}
          onPress={() => onMove(-1)}
          style={styles.moveButton}
          testID={`track-up-${track.id}`}
        >
          <Ionicons
            name="chevron-up"
            size={11}
            color={index === 0 ? colors.disabled : colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Move ${track.name} down`}
          accessibilityState={{ disabled: index === count - 1 }}
          disabled={index === count - 1}
          onPress={() => onMove(1)}
          style={styles.moveButton}
          testID={`track-down-${track.id}`}
        >
          <Ionicons
            name="chevron-down"
            size={11}
            color={index === count - 1 ? colors.disabled : colors.mutedForeground}
          />
        </Pressable>
        <View style={[styles.inertChip, { borderColor: colors.line }]}>
          <Text style={[styles.inertText, { color: colors.disabled }]}>M</Text>
        </View>
        <View style={[styles.inertChip, { borderColor: colors.line }]}>
          <Text style={[styles.inertText, { color: colors.disabled }]}>S</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackHeader: {
    width: 116,
    minHeight: 68,
    borderWidth: 1,
    borderRightWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'space-between',
  },
  trackName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trackColor: { width: 4, height: 29, borderRadius: 2 },
  trackCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 9, fontWeight: '700' },
  kind: { fontSize: 7, letterSpacing: 0.5, marginTop: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 10 },
  moveButton: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  inertChip: {
    width: 17,
    height: 15,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.48,
  },
  inertText: { fontSize: 7, fontWeight: '800' },
});
