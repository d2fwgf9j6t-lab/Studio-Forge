import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';
import { copyAudioToAppStorage } from '@/lib/audioFiles';
import { DraggableBeat } from '@/components/studio/DraggableBeat';
import { MixerSurface } from '@/components/studio/Mixer';
import { TrackHeader } from '@/components/studio/TrackHeader';
import { VocalRecorder } from '@/components/studio/VocalRecorder';
import type { ImportedSound } from '@/types/project';

const HEADER_WIDTH = 116;
const BAR_COUNT = 8;
const BEATS_PER_BAR = 4;

function TimelineRuler({
  barWidth,
  headerWidth,
  compact,
}: {
  barWidth: number;
  headerWidth: number;
  compact: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.timelineRow, compact && styles.compactTimelineRow]}>
      <View style={[styles.rulerLabel, { width: headerWidth, borderColor: colors.line }]}>
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
              compact && styles.compactRulerBar,
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

function ArrangementGrid({
  barWidth,
  headerWidth,
  compact,
  isDragging,
  onRecordTrack,
}: {
  barWidth: number;
  headerWidth: number;
  compact: boolean;
  isDragging: boolean;
  onRecordTrack: (trackId: string) => void;
}) {
  const colors = useColors();
  const { project, activeTrackId, setActiveTrackId, moveTrack } = useProject();
  return (
    <View>
      {project.tracks.map((track, index) => (
        <View
          key={track.id}
          style={[styles.trackLane, compact && styles.compactTrackLane]}
        >
          <TrackHeader
            track={track}
            index={index}
            count={project.tracks.length}
            width={headerWidth}
            compact={compact}
            selected={activeTrackId === track.id}
            onSelect={() => setActiveTrackId(track.id)}
            onMove={(direction) => moveTrack(track.id, direction)}
            onRecord={() => onRecordTrack(track.id)}
          />
          <View style={styles.gridBars}>
            {Array.from({ length: BAR_COUNT }, (_, barIndex) => (
              <View
                key={barIndex}
                style={[
                  styles.gridBar,
                  compact && styles.compactGridBar,
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
                {barIndex === 0 &&
                  index === 0 &&
                  !project.audioClips.some(
                    (clip) => clip.trackId === track.id && clip.startBar === 0,
                  ) && (
                  <Text
                    style={[
                      styles.dropHint,
                      compact && styles.compactDropHint,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    EMPTY
                  </Text>
                )}
              </View>
            ))}
            {project.audioClips
              .filter(
                (clip) =>
                  clip.trackId === track.id &&
                  clip.startBar >= 0 &&
                  clip.startBar < BAR_COUNT,
              )
              .map((clip) => {
                const remainingBars = BAR_COUNT - clip.startBar;
                const width = Math.max(
                  28,
                  Math.min(clip.durationBars, remainingBars) * barWidth - 8,
                );
                return (
                  <View
                    key={clip.id}
                    accessibilityLabel={`${clip.source === 'recording' ? 'Recorded vocal' : 'Audio clip'} ${clip.name}, bar ${clip.startBar + 1}`}
                    style={[
                      styles.audioClip,
                      compact && styles.compactAudioClip,
                      {
                        left: clip.startBar * barWidth + 4,
                        width,
                        borderColor: track.color,
                        backgroundColor: colors.panelSelected,
                        top: compact ? 5 : 10,
                      },
                    ]}
                    testID={`arrangement-clip-${clip.id}`}
                  >
                    <Ionicons
                      name={clip.source === 'recording' ? 'mic' : 'musical-note'}
                      size={compact ? 10 : 12}
                      color={track.color}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.audioClipName,
                        compact && styles.compactAudioClipName,
                        { color: colors.foreground },
                      ]}
                    >
                      {clip.name}
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>
      ))}
      {isDragging && (
        <View pointerEvents="none" style={styles.dropOverlay}>
          <Text style={[styles.dropOverlayText, { color: colors.primary }]}>
            DROP ON A TRACK
          </Text>
        </View>
      )}
    </View>
  );
}

function MixerDock({ compactLandscape }: { compactLandscape: boolean }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <View
      style={[
        styles.mixerDock,
        { backgroundColor: colors.panel, borderColor: colors.line },
      ]}
    >
      <View
        style={[
          styles.dockHeading,
          compactLandscape && styles.compactLandscapeDockHeading,
        ]}
      >
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
  const {
    project,
    activeTrackId,
    addTrack,
    addAudioClip,
    setActiveTrackId,
  } = useProject();
  const { width, height } = useWindowDimensions();
  const compactLandscape = width > height && height < 600;
  const headerWidth = compactLandscape ? 104 : HEADER_WIDTH;
  const [zoom, setZoom] = useState(64);
  const barWidth = zoom;
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [beatTrayOpen, setBeatTrayOpen] = useState(false);
  const [draggedSound, setDraggedSound] = useState<ImportedSound | null>(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const [rootOrigin, setRootOrigin] = useState({ x: 0, y: 0 });
  const rootRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const arrangementRef = useRef<React.ComponentRef<typeof View> | null>(null);

  const handleAddTrack = (kind: 'AUDIO' | 'VOCALS') => {
    const trackId = addTrack(kind);
    setTrackPickerOpen(false);
    if (kind === 'VOCALS') setRecordingTrackId(trackId);
  };

  const handleDragStart = useCallback(
    (sound: ImportedSound, x: number, y: number) => {
      setDraggedSound(sound);
      setDragPoint({ x, y });
    },
    [],
  );
  const handleDragMove = useCallback(
    (sound: ImportedSound, x: number, y: number) => {
      setDraggedSound(sound);
      setDragPoint({ x, y });
    },
    [],
  );
  const handleDragCancel = useCallback(() => setDraggedSound(null), []);
  const placeSoundOnTrack = useCallback(
    async (sound: ImportedSound, trackId: string, startBar: number) => {
      const track = project.tracks.find((candidate) => candidate.id === trackId);
      if (!track) throw new Error('Choose an existing track before placing audio.');
      const stored = await copyAudioToAppStorage(sound.uri, `clip-${sound.id}`);
      addAudioClip({
        trackId: track.id,
        name: sound.name,
        uri: stored.uri,
        startBar,
        durationBars: 1,
        source: 'library',
        sourceSoundId: sound.id,
      });
      setActiveTrackId(track.id);
      setBeatTrayOpen(false);
    },
    [addAudioClip, project.tracks, setActiveTrackId],
  );
  const handleQuickAddSound = useCallback(
    (sound: ImportedSound) => {
      const track =
        project.tracks.find((candidate) => candidate.id === activeTrackId) ??
        project.tracks[0];
      if (!track) return;
      const lastClipEnd = project.audioClips
        .filter((clip) => clip.trackId === track.id)
        .reduce(
          (end, clip) => Math.max(end, clip.startBar + clip.durationBars),
          0,
        );
      void placeSoundOnTrack(sound, track.id, Math.ceil(lastClipEnd)).catch(
        (error: unknown) =>
          Alert.alert(
            'Could not place audio',
            error instanceof Error
              ? error.message
              : 'The audio file could not be added to the arrangement.',
          ),
      );
    },
    [activeTrackId, placeSoundOnTrack, project.audioClips, project.tracks],
  );
  const handleRecordTrack = useCallback(
    (trackId: string) => {
      setActiveTrackId(trackId);
      setRecordingTrackId(trackId);
    },
    [setActiveTrackId],
  );
  const handleDrop = useCallback(
    (sound: ImportedSound, screenX: number, screenY: number) => {
      setDraggedSound(null);
      arrangementRef.current?.measureInWindow((left, top) => {
        const laneHeight = compactLandscape ? 44 : 68;
        const rulerHeight = compactLandscape ? 28 : 39;
        const barOffset = screenX - left - headerWidth;
        const laneOffset = screenY - top - rulerHeight;
        const barIndex = Math.floor(barOffset / barWidth);
        const trackIndex = Math.floor(laneOffset / laneHeight);
        if (
          barOffset < 0 ||
          barIndex < 0 ||
          barIndex >= BAR_COUNT ||
          laneOffset < 0 ||
          trackIndex < 0 ||
          trackIndex >= project.tracks.length
        ) {
          return;
        }

        const track = project.tracks[trackIndex];
        if (!track) return;
        void placeSoundOnTrack(sound, track.id, barIndex).catch(
          (error: unknown) =>
            Alert.alert(
              'Could not place audio',
              error instanceof Error
                ? error.message
                : 'The audio file could not be added to the arrangement.',
            ),
        );
      });
    },
    [
      barWidth,
      compactLandscape,
      headerWidth,
      placeSoundOnTrack,
      project.tracks,
    ],
  );

  const recordingTrack = project.tracks.find(
    (track) => track.id === recordingTrackId,
  );
  const saveRecording = useCallback(
    (uri: string, durationSeconds: number) => {
      const track = project.tracks.find(
        (candidate) => candidate.id === recordingTrackId,
      );
      if (!track) throw new Error('The vocal track is no longer available.');
      const secondsPerBar =
        (60 / project.bpm) *
        project.timeSignature.numerator *
        (4 / project.timeSignature.denominator);
      const durationBars = Math.max(
        0.25,
        Math.ceil((durationSeconds / secondsPerBar) * 4) / 4,
      );
      const clipsOnTrack = project.audioClips.filter(
        (clip) => clip.trackId === track.id,
      );
      const lastClipEnd = clipsOnTrack.reduce(
        (end, clip) => Math.max(end, clip.startBar + clip.durationBars),
        0,
      );
      const takeNumber = clipsOnTrack.filter(
        (clip) => clip.source === 'recording',
      ).length + 1;
      addAudioClip({
        trackId: track.id,
        name: `${track.name} Take ${takeNumber}`,
        uri,
        startBar: Math.ceil(lastClipEnd),
        durationBars,
        source: 'recording',
      });
      setActiveTrackId(track.id);
    },
    [
      addAudioClip,
      project.audioClips,
      project.bpm,
      project.timeSignature.denominator,
      project.timeSignature.numerator,
      project.tracks,
      recordingTrackId,
      setActiveTrackId,
    ],
  );

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={styles.root}
      onLayout={() =>
        rootRef.current?.measureInWindow((x, y) => setRootOrigin({ x, y }))
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          compactLandscape && styles.compactLandscapeContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
      <View
        style={[
          styles.workspaceTop,
          compactLandscape && styles.compactLandscapeWorkspaceTop,
        ]}
      >
        <View
          style={[
            styles.projectMeta,
            compactLandscape && styles.compactLandscapeProjectMeta,
          ]}
        >
          {!compactLandscape && (
            <Text style={[styles.arrangementTag, { color: colors.mutedForeground }]}>
              ARRANGEMENT
            </Text>
          )}
          <Text
            style={[
              styles.barRange,
              compactLandscape && styles.compactLandscapeBarRange,
              { color: colors.foreground },
            ]}
          >
            BARS 01—08
          </Text>
        </View>
        <View
          style={[
            styles.workspaceActions,
            compactLandscape && styles.compactLandscapeWorkspaceActions,
          ]}
        >
          <View
            style={[
              styles.zoomControl,
              compactLandscape && styles.compactLandscapeZoomControl,
              { borderColor: colors.line },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              onPress={() => setZoom((value) => Math.max(44, value - 8))}
              style={[
                styles.zoomButton,
                compactLandscape && styles.compactLandscapeZoomButton,
              ]}
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
              style={[
                styles.zoomButton,
                compactLandscape && styles.compactLandscapeZoomButton,
              ]}
              testID="zoom-in"
            >
              <Ionicons name="add" size={13} color={colors.foreground} />
            </Pressable>
          </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                beatTrayOpen
                  ? 'Hide imported beat tray'
                  : `Show imported beat tray, ${project.sounds.length} sounds`
              }
              onPress={() => setBeatTrayOpen((value) => !value)}
              style={[
                styles.beatTrayToggle,
                compactLandscape && styles.compactLandscapeBeatTrayToggle,
                {
                  backgroundColor: beatTrayOpen
                    ? colors.panelSelected
                    : colors.panel,
                  borderColor: colors.line,
                },
              ]}
              testID="toggle-beat-tray"
            >
              <Ionicons
                name="albums-outline"
                size={13}
                color={beatTrayOpen ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.beatTrayToggleText,
                  { color: beatTrayOpen ? colors.primary : colors.mutedForeground },
                ]}
              >
                BEATS
              </Text>
            </Pressable>
            <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add track"
              onPress={() => setTrackPickerOpen(true)}
            style={({ pressed }) => [
              styles.addTrackButton,
              compactLandscape && styles.compactLandscapeAddTrackButton,
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

      <View
        style={[
          styles.scrollHint,
          compactLandscape && styles.compactLandscapeScrollHint,
          { backgroundColor: colors.panel },
        ]}
      >
        <Ionicons name="swap-horizontal" size={13} color={colors.mutedForeground} />
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          SWIPE TO SCROLL THE ARRANGEMENT
        </Text>
        <Text style={[styles.trackCount, { color: colors.cyan }]}>
          {project.tracks.length} TRACKS
        </Text>
      </View>

      {beatTrayOpen && (
        <View
          style={[
            styles.beatTray,
            compactLandscape && styles.compactLandscapeBeatTray,
            { backgroundColor: colors.panel, borderColor: colors.line },
          ]}
        >
          <View style={styles.beatTrayHeader}>
            <Text style={[styles.beatTrayTitle, { color: colors.foreground }]}>
              IMPORTED AUDIO
            </Text>
            <Text style={[styles.beatTrayHint, { color: colors.mutedForeground }]}>
              DRAG A SOUND TO A TRACK
            </Text>
          </View>
          {project.sounds.length > 0 ? (
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.beatTrayItems}
              keyboardShouldPersistTaps="handled"
            >
              {project.sounds.map((sound) => (
                <DraggableBeat
                  key={sound.id}
                  sound={sound}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDrop={handleDrop}
                  onDragCancel={handleDragCancel}
                  onTap={handleQuickAddSound}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.beatTrayEmpty}>
              <Text style={[styles.beatTrayEmptyText, { color: colors.mutedForeground }]}>
                Import a beat in Sounds to place it here.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open sound browser"
                onPress={() => router.navigate('/(tabs)/browser')}
                style={styles.openSoundsButton}
                testID="open-sound-browser"
              >
                <Text style={[styles.openSoundsText, { color: colors.primary }]}>
                  OPEN SOUNDS
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        style={[styles.gridContainer, { borderColor: colors.line }]}
        contentContainerStyle={{ minWidth: headerWidth + BAR_COUNT * barWidth }}
      >
        <View ref={arrangementRef} collapsable={false}>
          <TimelineRuler
            barWidth={barWidth}
            headerWidth={headerWidth}
            compact={compactLandscape}
          />
          <ArrangementGrid
            barWidth={barWidth}
            headerWidth={headerWidth}
            compact={compactLandscape}
            isDragging={draggedSound !== null}
            onRecordTrack={handleRecordTrack}
          />
        </View>
      </ScrollView>

      {!compactLandscape && (
        <View style={styles.arrangementFooter}>
          <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
            Drag a beat from the tray onto a lane. Playback is not connected yet.
          </Text>
        </View>
      )}

      <MixerDock compactLandscape={compactLandscape} />

      {!compactLandscape && <Pressable
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
      </Pressable>}
      </ScrollView>

      {draggedSound && (
        <View
          pointerEvents="none"
          style={[
            styles.dragPreview,
            {
              left: dragPoint.x - rootOrigin.x - 66,
              top: dragPoint.y - rootOrigin.y - 19,
              backgroundColor: colors.panelRaised,
              borderColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="musical-note" size={14} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[styles.dragPreviewText, { color: colors.foreground }]}
          >
            {draggedSound.name}
          </Text>
        </View>
      )}

      <Modal
        visible={trackPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackPickerOpen(false)}
      >
        <View style={[styles.trackPickerScrim, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.trackPicker,
              { backgroundColor: colors.panel, borderColor: colors.line },
            ]}
          >
            <View style={styles.trackPickerHeading}>
              <View style={styles.trackPickerCopy}>
                <Text style={[styles.trackPickerEyebrow, { color: colors.mutedForeground }]}>
                  ARRANGEMENT
                </Text>
                <Text style={[styles.trackPickerTitle, { color: colors.foreground }]}>
                  Add a track
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close add track menu"
                onPress={() => setTrackPickerOpen(false)}
                style={styles.trackPickerClose}
                testID="close-add-track"
              >
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add audio track"
              onPress={() => handleAddTrack('AUDIO')}
              style={[
                styles.trackOption,
                { backgroundColor: colors.panelRaised, borderColor: colors.line },
              ]}
              testID="add-audio-track"
            >
              <View style={[styles.trackOptionIcon, { backgroundColor: colors.violetLow }]}>
                <Ionicons name="musical-note-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.trackOptionCopy}>
                <Text style={[styles.trackOptionTitle, { color: colors.foreground }]}>
                  AUDIO
                </Text>
                <Text style={[styles.trackOptionDetail, { color: colors.mutedForeground }]}>
                  Add an arrangement lane
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add vocals track and record"
              onPress={() => handleAddTrack('VOCALS')}
              style={[
                styles.trackOption,
                { backgroundColor: colors.panelRaised, borderColor: colors.line },
              ]}
              testID="add-vocals-track"
            >
              <View style={[styles.trackOptionIcon, { backgroundColor: colors.violetLow }]}>
                <Ionicons name="mic-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.trackOptionCopy}>
                <Text style={[styles.trackOptionTitle, { color: colors.foreground }]}>
                  VOCALS
                </Text>
                <Text style={[styles.trackOptionDetail, { color: colors.mutedForeground }]}>
                  Create a track and record a take
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {recordingTrack && (
        <VocalRecorder
          trackName={recordingTrack.name}
          onClose={() => setRecordingTrackId(null)}
          onSave={saveRecording}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 24, gap: 10 },
  compactLandscapeContent: { padding: 7, paddingBottom: 9, gap: 5 },
  workspaceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactLandscapeWorkspaceTop: { gap: 5 },
  projectMeta: { gap: 4 },
  compactLandscapeProjectMeta: { gap: 1 },
  arrangementTag: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  barRange: { fontSize: 15, fontWeight: '700' },
  compactLandscapeBarRange: { fontSize: 12 },
  workspaceActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  compactLandscapeWorkspaceActions: { gap: 5 },
  beatTrayToggle: {
    height: 32,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactLandscapeBeatTrayToggle: {
    height: 28,
    borderRadius: 7,
    paddingHorizontal: 6,
  },
  beatTrayToggleText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  zoomControl: {
    height: 32,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  compactLandscapeZoomControl: { height: 28, borderRadius: 7 },
  zoomButton: { width: 26, height: 30, alignItems: 'center', justifyContent: 'center' },
  compactLandscapeZoomButton: { width: 22, height: 26 },
  zoomText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  addTrackButton: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactLandscapeAddTrackButton: { height: 28, paddingHorizontal: 7, borderRadius: 7 },
  addTrackText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  scrollHint: {
    minHeight: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLandscapeScrollHint: { minHeight: 21, paddingHorizontal: 6, gap: 4 },
  hintText: { flex: 1, fontSize: 7, fontWeight: '700', letterSpacing: 0.6 },
  trackCount: { fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  beatTray: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 7,
  },
  compactLandscapeBeatTray: { paddingHorizontal: 7, paddingVertical: 5, gap: 4 },
  beatTrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  beatTrayTitle: { fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  beatTrayHint: { fontSize: 6, fontWeight: '700', letterSpacing: 0.5 },
  beatTrayItems: { flexDirection: 'row', gap: 7, paddingVertical: 1 },
  beatTrayEmpty: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  beatTrayEmptyText: { flex: 1, fontSize: 8 },
  openSoundsButton: { paddingHorizontal: 4, paddingVertical: 7 },
  openSoundsText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  gridContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  timelineRow: { flexDirection: 'row', height: 39 },
  compactTimelineRow: { height: 28 },
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
  compactRulerBar: { height: 28, paddingHorizontal: 4, paddingTop: 3 },
  barNumber: { fontSize: 8, fontWeight: '800' },
  beatTicks: { height: 7, flexDirection: 'row', justifyContent: 'space-between' },
  beatTick: { width: 1, height: 6 },
  trackLane: { flexDirection: 'row', minHeight: 68 },
  compactTrackLane: { minHeight: 44 },
  gridBars: { flexDirection: 'row', position: 'relative' },
  gridBar: {
    height: 68,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    position: 'relative',
  },
  compactGridBar: { height: 44 },
  gridBeat: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.55,
  },
  audioClip: {
    position: 'absolute',
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 2,
    overflow: 'hidden',
  },
  compactAudioClip: {
    height: 25,
    borderRadius: 6,
    paddingHorizontal: 4,
    gap: 3,
  },
  audioClipName: { flex: 1, fontSize: 8, fontWeight: '700' },
  compactAudioClipName: { fontSize: 6 },
  dropOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  dropOverlayText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
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
  compactDropHint: { top: 17, left: 6, fontSize: 6, letterSpacing: 0.8 },
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
  compactLandscapeDockHeading: { minHeight: 30, paddingHorizontal: 8 },
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
  dragPreview: {
    position: 'absolute',
    width: 132,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    zIndex: 20,
    elevation: 8,
  },
  dragPreviewText: { flex: 1, fontSize: 8, fontWeight: '700' },
  trackPickerScrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  trackPicker: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 9,
  },
  trackPickerHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackPickerCopy: { flex: 1, gap: 3 },
  trackPickerEyebrow: { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  trackPickerTitle: { fontSize: 15, fontWeight: '700' },
  trackPickerClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  trackOption: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackOptionCopy: { flex: 1, gap: 4 },
  trackOptionTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  trackOptionDetail: { fontSize: 8 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
