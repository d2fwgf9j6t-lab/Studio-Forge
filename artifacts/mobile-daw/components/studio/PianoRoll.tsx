import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TOP_PITCH = 83;
const ROW_COUNT = 24;
const STEP_COUNT = 32;
const KEY_WIDTH = 44;
const CELL_WIDTH = 24;
const ROW_HEIGHT = 25;
type NoteTool = 'draw' | 'erase';

function ToolButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  testID: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={15}
        color={
          disabled
            ? colors.disabled
            : selected
              ? colors.primary
              : colors.foreground
        }
      />
      {selected && (
        <View style={[styles.toolIndicator, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
}

export function PianoRoll() {
  const colors = useColors();
  const {
    project,
    activeTrackId,
    toggleMidiNote,
    addTrack,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useProject();
  const [cellWidth, setCellWidth] = useState<number>(CELL_WIDTH);
  const [noteTool, setNoteTool] = useState<NoteTool>('draw');
  const track =
    project.tracks.find((candidate) => candidate.id === activeTrackId) ??
    project.tracks[0];
  const notes = project.midiNotes.filter((note) => note.trackId === track?.id);
  const handleCellPress = (pitch: number, step: number, exists: boolean) => {
    if (noteTool === 'erase' && !exists) return;
    toggleMidiNote(track.id, pitch, step);
  };

  if (!track) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="musical-notes-outline" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Add a track to begin
        </Text>
        <Pressable
          onPress={addTrack}
          accessibilityRole="button"
          accessibilityLabel="Add track"
          style={[styles.addButton, { borderColor: colors.line }]}
          testID="piano-roll-add-track"
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View style={styles.rollInfo}>
          <View style={styles.activeTrack}>
            <View style={[styles.trackDot, { backgroundColor: track.color }]} />
            <Text
              numberOfLines={1}
              style={[styles.trackName, { color: colors.foreground }]}
            >
              {track.name}
            </Text>
          </View>
          <Text style={[styles.noteCount, { color: colors.mutedForeground }]}>
            {notes.length}
          </Text>
        </View>
        <View
          style={[
            styles.toolbar,
            { backgroundColor: colors.panel, borderColor: colors.line },
          ]}
        >
          <ToolButton
            icon="return-up-back"
            label="Undo"
            onPress={undo}
            disabled={!canUndo}
            testID="piano-roll-undo"
          />
          <ToolButton
            icon="return-up-forward"
            label="Redo"
            onPress={redo}
            disabled={!canRedo}
            testID="piano-roll-redo"
          />
          <View style={[styles.toolbarDivider, { backgroundColor: colors.line }]} />
          <ToolButton
            icon="pencil-outline"
            label="Draw notes"
            onPress={() => setNoteTool('draw')}
            selected={noteTool === 'draw'}
            testID="piano-roll-draw"
          />
          <ToolButton
            icon="remove-circle-outline"
            label="Erase notes"
            onPress={() => setNoteTool('erase')}
            selected={noteTool === 'erase'}
            testID="piano-roll-erase"
          />
          <View style={[styles.toolbarDivider, { backgroundColor: colors.line }]} />
          <ToolButton
            icon="remove"
            label="Zoom out"
            onPress={() => setCellWidth((value) => Math.max(18, value - 2))}
            disabled={cellWidth <= 18}
            testID="piano-roll-zoom-out"
          />
          <ToolButton
            icon="add"
            label="Zoom in"
            onPress={() => setCellWidth((value) => Math.min(32, value + 2))}
            disabled={cellWidth >= 32}
            testID="piano-roll-zoom-in"
          />
        </View>
      </View>
      <View style={[styles.gridFrame, { borderColor: colors.line }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.ruler}>
              <View
                style={[
                  styles.keyColumnHeader,
                  { width: KEY_WIDTH, backgroundColor: colors.panelRaised },
                ]}
              >
                <Ionicons name="musical-notes-outline" size={12} color={colors.primary} />
              </View>
              {Array.from({ length: 4 }, (_, bar) => (
                <View
                  key={bar}
                  style={[
                    styles.rollBar,
                    {
                      width: cellWidth * 8,
                      backgroundColor: colors.panelRaised,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  <Text style={[styles.rollBarText, { color: colors.foreground }]}>
                    {bar + 1}
                  </Text>
                </View>
              ))}
            </View>
            {Array.from({ length: ROW_COUNT }, (_, rowIndex) => {
              const pitch = TOP_PITCH - rowIndex;
              const label = `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
              const isBlack = NOTE_NAMES[pitch % 12].includes('#');
              return (
                <View key={pitch} style={styles.noteRow}>
                  <View
                    style={[
                      styles.keyLabel,
                      {
                        width: KEY_WIDTH,
                        backgroundColor: isBlack
                          ? colors.panelRaised
                          : colors.secondaryForeground,
                        borderColor: colors.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        { color: isBlack ? colors.foreground : colors.background },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  {Array.from({ length: STEP_COUNT }, (_, step) => {
                    const note = notes.some(
                      (candidate) => candidate.pitch === pitch && candidate.step === step,
                    );
                    const isBar = step % 8 === 0;
                    const isBeat = step % 2 === 0;
                    return (
                      <Pressable
                        key={step}
                        accessibilityRole="button"
                        accessibilityLabel={`${note ? 'Remove' : 'Add'} ${label} note at step ${step + 1}`}
                        accessibilityState={{ selected: note }}
                        onPress={() => handleCellPress(pitch, step, note)}
                        style={[
                          styles.noteCell,
                          {
                            width: cellWidth,
                            backgroundColor: isBlack
                              ? colors.panelSelected
                              : isBeat
                                ? colors.panelRaised
                                : colors.panel,
                            borderColor: isBar ? colors.lineStrong : colors.line,
                          },
                        ]}
                        testID={`note-cell-${pitch}-${step}`}
                      >
                        {note && (
                          <View
                            style={[
                              styles.noteFill,
                              { backgroundColor: track.color },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View style={styles.bottomNote}>
        <Ionicons name="save-outline" size={13} color={colors.mutedForeground} />
        <Text style={[styles.bottomText, { color: colors.mutedForeground }]}>
          MIDI note edits are saved with this project. Audio preview is not available.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 10, paddingBottom: 20, gap: 8 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rollInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  activeTrack: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trackDot: { width: 7, height: 7, borderRadius: 4 },
  trackName: { flexShrink: 1, fontSize: 10, fontWeight: '700' },
  noteCount: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    gap: 1,
  },
  toolButton: {
    position: 'relative',
    width: 29,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIndicator: {
    position: 'absolute',
    bottom: 1,
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  toolbarDivider: { width: 1, height: 17, marginHorizontal: 2 },
  gridFrame: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  ruler: { flexDirection: 'row', height: 27 },
  keyColumnHeader: { alignItems: 'center', justifyContent: 'center' },
  rollBar: {
    borderLeftWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rollBarText: { fontSize: 8, fontWeight: '800' },
  noteRow: { flexDirection: 'row', height: ROW_HEIGHT },
  keyLabel: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 8, fontWeight: '700' },
  noteCell: {
    height: ROW_HEIGHT,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  noteFill: { width: '100%', height: 13, borderRadius: 3, opacity: 0.95 },
  bottomNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomText: { flex: 1, fontSize: 9, lineHeight: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 13, fontWeight: '700' },
  addButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.42 },
});
