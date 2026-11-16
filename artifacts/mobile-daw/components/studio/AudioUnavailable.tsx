import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function AudioUnavailable({
  compact = false,
}: {
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.container,
        compact && styles.compact,
        { backgroundColor: colors.amberLow, borderColor: colors.amberLine },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={compact ? 15 : 18}
        color={colors.amber}
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.amber }]}>
          AUDIO ENGINE NOT CONNECTED
        </Text>
        {!compact && (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Playback, monitoring, timeline recording, and mixer controls are
            disabled. Record vocal takes from a Vocals track.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  compact: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  copy: { flex: 1 },
  title: { fontSize: 8, fontWeight: '800', letterSpacing: 0.85 },
  description: { fontSize: 10, lineHeight: 15, marginTop: 4 },
});
