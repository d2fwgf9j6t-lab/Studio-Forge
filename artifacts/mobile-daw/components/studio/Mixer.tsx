import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioUnavailable } from '@/components/studio/AudioUnavailable';
import { useColors } from '@/hooks/useColors';

function MixerStrip({
  name,
  color,
  compact,
}: {
  name: string;
  color: string;
  compact: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        compact ? styles.compactStrip : styles.strip,
        { backgroundColor: colors.panel, borderColor: colors.line },
      ]}
    >
      <View style={styles.stripHeading}>
        <View style={[styles.stripColor, { backgroundColor: color }]} />
        <Text numberOfLines={1} style={[styles.stripName, { color: colors.foreground }]}>
          {name}
        </Text>
      </View>
      {!compact && (
        <>
          <View style={styles.meterArea}>
            <View style={[styles.meterTrack, { backgroundColor: colors.background }]}>
              <View style={[styles.meterFill, { backgroundColor: color, height: '64%' }]} />
            </View>
            <View style={[styles.faderTrack, { backgroundColor: colors.line }]}>
              <View style={[styles.faderThumb, { backgroundColor: colors.foreground }]} />
            </View>
            <View style={[styles.meterTrack, { backgroundColor: colors.background }]}>
              <View style={[styles.meterFill, { backgroundColor: color, height: '58%' }]} />
            </View>
          </View>
          <Text style={[styles.gainLabel, { color: colors.mutedForeground }]}>
            0.0 dB
          </Text>
          <View style={styles.panTrack}>
            <View style={[styles.panLine, { backgroundColor: colors.line }]} />
            <View style={[styles.panDot, { backgroundColor: colors.cyan }]} />
          </View>
          <Text style={[styles.panLabel, { color: colors.mutedForeground }]}>PAN · C</Text>
        </>
      )}
      <View style={styles.muteSoloRow}>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityLabel={`${name} mute unavailable`}
          accessibilityState={{ disabled: true }}
          style={[styles.msButton, { borderColor: colors.line }]}
        >
          <Text style={[styles.msText, { color: colors.disabled }]}>M</Text>
        </Pressable>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityLabel={`${name} solo unavailable`}
          accessibilityState={{ disabled: true }}
          style={[styles.msButton, { borderColor: colors.line }]}
        >
          <Text style={[styles.msText, { color: colors.disabled }]}>S</Text>
        </Pressable>
      </View>
      {compact && (
        <View style={[styles.compactFader, { backgroundColor: colors.line }]}>
          <View style={[styles.compactFaderFill, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

export function MixerSurface({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  const channels = Array.from({ length: compact ? 6 : 16 }, (_, index) => ({
    name: compact
      ? `CH ${String(index + 1).padStart(2, '0')}`
      : `CHANNEL ${String(index + 1).padStart(2, '0')}`,
    color: ['#C6F36D', '#78DDE2', '#E6A96B', '#B99AF5'][index % 4],
  }));
  if (!compact) {
    channels.push({ name: 'MASTER', color: colors.lime });
  }

  return (
    <View style={styles.container}>
      {!compact && (
        <View style={styles.noticeWrap}>
          <AudioUnavailable />
          <View style={styles.mixerSectionTitle}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                16-channel mixer
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Faders, pan, mute, and solo are visible but inactive.
              </Text>
            </View>
            <View style={[styles.enginePill, { borderColor: colors.amberLine }]}>
              <View style={[styles.engineDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.enginePillText, { color: colors.amber }]}>
                DISABLED
              </Text>
            </View>
          </View>
        </View>
      )}
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.strips}
      >
        {channels.map((channel) => (
          <MixerStrip
            key={channel.name}
            name={channel.name}
            color={channel.color}
            compact={compact}
          />
        ))}
      </ScrollView>
      {!compact && (
        <View style={styles.mixerFooter}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.mixerFooterText, { color: colors.mutedForeground }]}>
            Controls unlock when audio processing is implemented.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  noticeWrap: { gap: 13, paddingHorizontal: 14, paddingTop: 14 },
  mixerSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionSub: { fontSize: 9, marginTop: 3 },
  enginePill: {
    height: 23,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  engineDot: { width: 5, height: 5, borderRadius: 3 },
  enginePillText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.7 },
  strips: { gap: 7, paddingHorizontal: 14, paddingVertical: 4 },
  strip: {
    width: 77,
    minHeight: 225,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  compactStrip: {
    width: 82,
    height: 57,
    borderWidth: 1,
    borderRadius: 8,
    padding: 7,
    justifyContent: 'space-between',
  },
  stripHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 5 },
  stripColor: { width: 4, height: 12, borderRadius: 2 },
  stripName: { flex: 1, fontSize: 7, fontWeight: '800', letterSpacing: 0.35 },
  meterArea: {
    height: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  meterTrack: {
    width: 6,
    height: 100,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  meterFill: { width: '100%', borderRadius: 3, opacity: 0.44 },
  faderTrack: { width: 2, height: 88, justifyContent: 'center' },
  faderThumb: { width: 16, height: 5, borderRadius: 3, marginLeft: -7 },
  gainLabel: { fontSize: 8, fontWeight: '700', marginTop: 5 },
  panTrack: { width: 42, height: 12, justifyContent: 'center', marginTop: 7 },
  panLine: { width: '100%', height: 2 },
  panDot: { position: 'absolute', left: 19, width: 6, height: 6, borderRadius: 3 },
  panLabel: { fontSize: 6, fontWeight: '700', letterSpacing: 0.55, marginTop: 1 },
  muteSoloRow: { flexDirection: 'row', gap: 5, marginTop: 'auto', paddingTop: 8 },
  msButton: {
    width: 24,
    height: 20,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
  },
  msText: { fontSize: 8, fontWeight: '800' },
  compactFader: { height: 3, borderRadius: 2, width: '100%', overflow: 'hidden' },
  compactFaderFill: { width: '56%', height: '100%', opacity: 0.65 },
  mixerFooter: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
  },
  mixerFooterText: { fontSize: 9 },
});
