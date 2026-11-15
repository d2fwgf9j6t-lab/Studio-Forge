import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';
import { MixerSurface } from '@/components/studio/Mixer';
import { TrackHeader } from '@/components/studio/TrackHeader';

const HEADER_WIDTH = 116;
const BAR_COUNT = 8;
const BEATS_PER_BAR = 4;

function TimelineRuler({ barWidth }: { barWidth: number }) {
  const colors = useColors();
  return (
    <View style={styles.timelineRow}>
      <View style={[styles.rulerLabel, { borderColor: colors.line }]}>
        <Text style={[styles.rulerLabelText, { color: colors.mutedForeground }]}>
          TRACK / BAR
        </Text>
      </View>
      <View style={styles.rulerBars}>
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <View
            key={index}
            style={[
              styles.rulerBar,
              {
                width: barWidth,
                borderColor: colors.line,
                backgroundColor: index % 2 === 0 ? colors.panelRaised : colors.panel,
              },
            ]}
          >
            <Text style={[styles.barNumber, { color: colors.mutedForeground }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.beatTicks}>
              {Array.from({ length: BEATS_PER_BAR }, (_, beat) => (
                <View
                  key={beat}
                  style={[styles.beatTick, { backgroundColor: colors.line }]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ArrangementGrid({ barWidth }: { barWidth: number }) {
  const colors = useColors();
  const { project, activeTrackId, setActiveTrackId, moveTrack } = useProject();
  return (
    <View>
      {project.tracks.map((track, index) => (
        <View key={track.id} style={styles.trackLane}>
          <TrackHeader
            track={track}
            index={index}
            count={project.tracks.length}
            selected={activeTrackId === track.id}
            onSelect={() => setActiveTrackId(track.id)}
            onMove={(direction) => moveTrack(track.id, direction)}
          />
          <View style={styles.gridBars}>
            {Array.from({ length: BAR_COUNT }, (_, barIndex) => (
              <View
                key={barIndex}
                style={[
                  styles.gridBar,
                  {
                    width: barWidth,
                    borderColor: colors.line,
                    backgroundColor:
                      barIndex % 2 === 0 ? colors.panel : colors.panelRaised,
                  },
                ]}
              >
                {Array.from({ length: BEATS_PER_BAR - 1 }, (_, beat) => (
                  <View
                    key={beat}
                    style={[
                      styles.gridBeat,
                      {
                        left: `${((beat + 1) / BEATS_PER_BAR) * 100}%`,
                        backgroundColor: colors.line,
                      },
                    ]}
                  />
                ))}
                {barIndex === 0 && index === 0 && (
                  <Text
                    style={[styles.dropHint, { color: colors.mutedForeground }]}
                  >
                    EMPTY
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MixerDock() {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <View
      style={[
        styles.mixerDock,
        { backgroundColor: colors.panel, borderColor: colors.line },
      ]}
    >
      <View style={styles.dockHeading}>
        <View style={styles.dockLabel}>
          <Ionicons name="options-outline" size={14} color={colors.cyan} />
          <Text style={[styles.dockTitle, { color: colors.foreground }]}>
            MIXER PANEL
          </Text>
          <Text style={[styles.dockMeta, { color: colors.mutedForeground }]}>
            16 CH · OFFLINE
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse mixer panel' : 'Expand mixer panel'}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [styles.collapseButton, pressed && styles.pressed]}
          testID="mixer-dock-toggle"
        >
          <Text style={[styles.collapseText, { color: colors.cyan }]}>
            {expanded ? 'COLLAPSE' : 'EXPAND'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.cyan}
          />
        </Pressable>
      </View>
      {expanded && <MixerSurface compact />}
    </View>
  );
}

export function Playlist() {
  const colors = useColors();
  const { project, addTrack } = useProject();
  const [zoom, setZoom] = useState(64);
  const barWidth = zoom;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
      <View style={styles.workspaceTop}>
        <View style={styles.projectMeta}>
          <Text style={[styles.arrangementTag, { color: colors.mutedForeground }]}>
            ARRANGEMENT
          </Text>
          <Text style={[styles.barRange, { color: colors.foreground }]}>
            BARS 01—08
          </Text>
        </View>
        <View style={styles.workspaceActions}>
          <View style={[styles.zoomControl, { borderColor: colors.line }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              onPress={() => setZoom((value) => Math.max(44, value - 8))}
              style={styles.zoomButton}
              testID="zoom-out"
            >
              <Ionicons name="remove" size={13} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.zoomText, { color: colors.mutedForeground }]}>
              ZOOM
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              onPress={() => setZoom((value) => Math.min(96, value + 8))}
              style={styles.zoomButton}
              testID="zoom-in"
            >
              <Ionicons name="add" size={13} color={colors.foreground} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add track"
            onPress={addTrack}
            style={({ pressed }) => [
              styles.addTrackButton,
              { backgroundColor: colors.lime },
              pressed && styles.pressed,
            ]}
            testID="add-track"
          >
            <Ionicons name="add" size={15} color={colors.background} />
            <Text style={[styles.addTrackText, { color: colors.background }]}>
              TRACK
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.scrollHint, { backgroundColor: colors.panel }]}>
        <Ionicons name="swap-horizontal" size={13} color={colors.mutedForeground} />
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          SWIPE TO SCROLL THE ARRANGEMENT
        </Text>
        <Text style={[styles.trackCount, { color: colors.cyan }]}>
          {project.tracks.length} TRACKS
        </Text>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        style={[styles.gridContainer, { borderColor: colors.line }]}
        contentContainerStyle={{ minWidth: HEADER_WIDTH + BAR_COUNT * barWidth }}
      >
        <View>
          <TimelineRuler barWidth={barWidth} />
          <ArrangementGrid barWidth={barWidth} />
        </View>
      </ScrollView>

      <View style={styles.arrangementFooter}>
        <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
        <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
          Empty lanes are ready for clips. Audio placement is not available yet.
        </Text>
      </View>

      <MixerDock />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/(tabs)/piano-roll')}
        style={({ pressed }) => [
          styles.pianoShortcut,
          { backgroundColor: colors.panelRaised, borderColor: colors.line },
          pressed && styles.pressed,
        ]}
        testID="open-piano-roll"
      >
        <View style={styles.pianoIcon}>
          <Ionicons name="musical-notes-outline" size={17} color={colors.lime} />
        </View>
        <View style={styles.pianoCopy}>
          <Text style={[styles.pianoTitle, { color: colors.foreground }]}>
            OPEN PIANO ROLL
          </Text>
          <Text style={[styles.pianoSubtitle, { color: colors.mutedForeground }]}>
            Edit MIDI notes for the selected track
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 24, gap: 10 },
  workspaceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  projectMeta: { gap: 4 },
  arrangementTag: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  barRange: { fontSize: 15, fontWeight: '700' },
  workspaceActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  zoomControl: {
    height: 32,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  zoomButton: { width: 26, height: 30, alignItems: 'center', justifyContent: 'center' },
  zoomText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  addTrackButton: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addTrackText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  scrollHint: {
    minHeight: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: { flex: 1, fontSize: 7, fontWeight: '700', letterSpacing: 0.6 },
  trackCount: { fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  gridContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  timelineRow: { flexDirection: 'row', height: 39 },
  rulerLabel: {
    width: HEADER_WIDTH,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulerLabelText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  rulerBars: { flexDirection: 'row' },
  rulerBar: {
    height: 39,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 6,
    paddingTop: 5,
    justifyContent: 'space-between',
  },
  barNumber: { fontSize: 8, fontWeight: '800' },
  beatTicks: { height: 7, flexDirection: 'row', justifyContent: 'space-between' },
  beatTick: { width: 1, height: 6 },
  trackLane: { flexDirection: 'row', minHeight: 68 },
  gridBars: { flexDirection: 'row' },
  gridBar: {
    height: 68,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    position: 'relative',
  },
  gridBeat: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.55,
  },
  dropHint: {
    position: 'absolute',
    top: 27,
    left: 9,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.3,
    opacity: 0.5,
  },
  arrangementFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 3 },
  footerHint: { fontSize: 9, flex: 1 },
  mixerDock: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  dockHeading: {
    minHeight: 41,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dockTitle: { fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  dockMeta: { fontSize: 7, fontWeight: '700', letterSpacing: 0.4 },
  collapseButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 5 },
  collapseText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  pianoShortcut: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pianoIcon: { width: 30, alignItems: 'center' },
  pianoCopy: { flex: 1, gap: 4 },
  pianoTitle: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  pianoSubtitle: { fontSize: 9 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
