import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioUnavailable } from '@/components/studio/AudioUnavailable';
import { StudioFrame } from '@/components/studio/StudioFrame';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';

const TOOLS = [
  {
    id: 'piano-roll',
    title: 'Piano Roll',
    detail: 'Edit and save MIDI note patterns',
    icon: 'musical-notes-outline' as const,
    tint: 'lime' as const,
    route: '/(tabs)/piano-roll' as const,
    available: true,
  },
  {
    id: 'sampler',
    title: 'Sampler',
    detail: 'Imported source files and sample details',
    icon: 'albums-outline' as const,
    tint: 'cyan' as const,
    route: '/sampler' as const,
    available: true,
  },
  {
    id: 'plugins',
    title: 'Plugin Browser',
    detail: 'Plugin hosting is not available yet',
    icon: 'cube-outline' as const,
    tint: 'violet' as const,
    route: '/plugin-browser' as const,
    available: true,
  },
  {
    id: 'audio',
    title: 'Audio Settings',
    detail: 'Audio engine is not connected',
    icon: 'options-outline' as const,
    tint: 'amber' as const,
    route: '/audio-settings' as const,
    available: true,
  },
];

export function ToolDashboard() {
  const colors = useColors();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.toolContent}
      showsVerticalScrollIndicator={false}
    >
      <AudioUnavailable />
      <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
        WINDOWS & UTILITIES
      </Text>
      {TOOLS.map((tool) => {
        const color =
          tool.tint === 'lime'
            ? colors.lime
            : tool.tint === 'cyan'
              ? colors.cyan
              : tool.tint === 'violet'
                ? colors.violet
                : colors.amber;
        return (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${tool.title}`}
            onPress={() => router.push(tool.route)}
            style={({ pressed }) => [
              styles.toolCard,
              { backgroundColor: colors.panel, borderColor: colors.line },
              pressed && styles.pressed,
            ]}
            testID={`tool-${tool.id}`}
          >
            <View style={[styles.toolIcon, { backgroundColor: `${color}14` }]}>
              <Ionicons name={tool.icon} size={18} color={color} />
            </View>
            <View style={styles.toolCopy}>
              <Text style={[styles.toolTitle, { color: colors.foreground }]}>
                {tool.title}
              </Text>
              <Text style={[styles.toolDetail, { color: colors.mutedForeground }]}>
                {tool.detail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.mutedForeground} />
          </Pressable>
        );
      })}
      <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <View style={styles.settingsHeading}>
          <Ionicons name="phone-portrait-outline" size={15} color={colors.cyan} />
          <Text style={[styles.settingsTitle, { color: colors.foreground }]}>
            DEVICE
          </Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>
            Preview platform
          </Text>
          <Text style={[styles.settingValue, { color: colors.foreground }]}>
            {Platform.OS.toUpperCase()}
          </Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>
            Project storage
          </Text>
          <Text style={[styles.settingValue, { color: colors.lime }]}>
            ON DEVICE
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export function ToolWindow({
  kind,
}: {
  kind: 'plugins' | 'sampler' | 'audio';
}) {
  const colors = useColors();
  const { project } = useProject();
  const config = {
    plugins: {
      title: 'Plugin Browser',
      eyebrow: 'WINDOW / PLUGINS',
      subtitle: 'Plugin hosting is not part of Stage 1.',
      icon: 'cube-outline' as const,
    },
    sampler: {
      title: 'Sampler',
      eyebrow: 'WINDOW / SAMPLE SOURCE',
      subtitle: 'Imported files are listed here for the future sampler.',
      icon: 'albums-outline' as const,
    },
    audio: {
      title: 'Audio Settings',
      eyebrow: 'PREFERENCES / AUDIO',
      subtitle: 'Device configuration becomes available with the audio engine.',
      icon: 'options-outline' as const,
    },
  }[kind];

  return (
    <StudioFrame
      title={config.title}
      subtitle={config.subtitle}
      eyebrow={config.eyebrow}
      onBack={() => router.back()}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.toolContent}
        showsVerticalScrollIndicator={false}
      >
        <AudioUnavailable />
        {kind === 'plugins' && (
          <View style={[styles.emptyCard, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <View style={[styles.largeToolIcon, { backgroundColor: colors.violetLow }]}>
              <Ionicons name={config.icon} size={23} color={colors.violet} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No plugin host available
            </Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
              Plugin scanning and instrument loading are intentionally disabled
              until a compatible audio engine is added.
            </Text>
          </View>
        )}
        {kind === 'sampler' && (
          <View style={[styles.sampleCard, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <View style={styles.settingsHeading}>
              <Ionicons name="musical-notes-outline" size={15} color={colors.cyan} />
              <Text style={[styles.settingsTitle, { color: colors.foreground }]}>
                IMPORTED SOURCES
              </Text>
              <Text style={[styles.sourceCount, { color: colors.mutedForeground }]}>
                {project.sounds.length}
              </Text>
            </View>
            {project.sounds.length === 0 ? (
              <View style={styles.sampleEmpty}>
                <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
                  No audio sources have been imported.
                </Text>
                <Pressable
                  onPress={() => router.navigate('/(tabs)/browser')}
                  style={[styles.openBrowser, { backgroundColor: colors.lime }]}
                >
                  <Ionicons name="folder-open-outline" size={14} color={colors.background} />
                  <Text style={[styles.openBrowserText, { color: colors.background }]}>
                    OPEN SOUND BROWSER
                  </Text>
                </Pressable>
              </View>
            ) : (
              project.sounds.map((sound) => (
                <View key={sound.id} style={[styles.sampleRow, { borderTopColor: colors.line }]}>
                  <Ionicons name="musical-note-outline" size={14} color={colors.cyan} />
                  <View style={styles.toolCopy}>
                    <Text numberOfLines={1} style={[styles.sampleName, { color: colors.foreground }]}>
                      {sound.name}
                    </Text>
                    <Text style={[styles.toolDetail, { color: colors.mutedForeground }]}>
                      SOURCE SAVED · PREVIEW DISABLED
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        {kind === 'audio' && (
          <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <View style={styles.settingsHeading}>
              <Ionicons name="hardware-chip-outline" size={15} color={colors.amber} />
              <Text style={[styles.settingsTitle, { color: colors.foreground }]}>
                ENGINE STATUS
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>
                Audio engine
              </Text>
              <Text style={[styles.settingValue, { color: colors.amber }]}>
                NOT INSTALLED
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>
                Output device
              </Text>
              <Text style={[styles.settingValue, { color: colors.disabled }]}>
                UNAVAILABLE
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>
                Sample rate / buffer
              </Text>
              <Text style={[styles.settingValue, { color: colors.disabled }]}>
                UNAVAILABLE
              </Text>
            </View>
            <Text style={[styles.settingsFootnote, { color: colors.mutedForeground }]}>
              No device or latency controls are shown as active because this
              build does not open audio hardware.
            </Text>
          </View>
        )}
      </ScrollView>
    </StudioFrame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolContent: { padding: 14, paddingBottom: 24, gap: 10 },
  groupLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },
  toolCard: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: { flex: 1, gap: 4, minWidth: 0 },
  toolTitle: { fontSize: 11, fontWeight: '700' },
  toolDetail: { fontSize: 9 },
  settingsCard: { borderWidth: 1, borderRadius: 12, padding: 13, gap: 12, marginTop: 5 },
  settingsHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  settingsTitle: { flex: 1, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  settingRow: { minHeight: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  settingLabel: { fontSize: 9 },
  settingValue: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  emptyCard: { minHeight: 220, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 9 },
  largeToolIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emptyCopy: { fontSize: 10, lineHeight: 16, textAlign: 'center' },
  sampleCard: { borderWidth: 1, borderRadius: 12, padding: 13, gap: 10 },
  sourceCount: { fontSize: 8, fontWeight: '800' },
  sampleEmpty: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 12 },
  openBrowser: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 9 },
  openBrowserText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  sampleRow: { minHeight: 46, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 7 },
  sampleName: { fontSize: 10, fontWeight: '700' },
  settingsFootnote: { fontSize: 9, lineHeight: 14, marginTop: 2 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
