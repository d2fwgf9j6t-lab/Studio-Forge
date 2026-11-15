import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TOP_PITCH = 71;
const ROW_COUNT = 12;
const STEP_COUNT = 32;
const KEY_WIDTH = 50;
const CELL_WIDTH = 25;

export function PianoRoll() {
  const colors = useColors();
  const { project, activeTrackId, toggleMidiNote, addTrack } = useProject();
  const track =
    project.tracks.find((candidate) => candidate.id === activeTrackId) ??
    project.tracks[0];
  const notes = project.midiNotes.filter((note) => note.trackId === track?.id);

  if (!track) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="musical-notes-outline" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Add a track to begin
        </Text>
        <Pressable
          onPress={addTrack}
          style={[styles.addButton, { backgroundColor: colors.lime }]}
        >
          <Text style={[styles.addButtonText, { color: colors.background }]}>
            ADD TRACK
          </Text>
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
      <View style={styles.rollInfo}>
        <View style={styles.activeTrack}>
          <View style={[styles.trackDot, { backgroundColor: track.color }]} />
          <Text style={[styles.trackName, { color: colors.foreground }]}>
            {track.name}
          </Text>
        </View>
        <Text style={[styles.noteCount, { color: colors.mutedForeground }]}>
          {notes.length} NOTES
        </Text>
      </View>
      <View style={styles.rollHint}>
        <Ionicons name="hand-left-outline" size={14} color={colors.cyan} />
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          TAP A GRID CELL TO ADD OR REMOVE A MIDI NOTE
        </Text>
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
                <Ionicons name="musical-notes-outline" size={12} color={colors.cyan} />
              </View>
              {Array.from({ length: 4 }, (_, bar) => (
                <View
                  key={bar}
                  style={[
                    styles.rollBar,
                    {
                      width: CELL_WIDTH * 8,
                      backgroundColor: colors.panelRaised,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  <Text style={[styles.rollBarText, { color: colors.mutedForeground }]}>
                    BAR {String(bar + 1).padStart(2, '0')}
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
                        backgroundColor: isBlack ? colors.panelRaised : colors.panel,
                        borderColor: colors.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        { color: isBlack ? colors.mutedForeground : colors.foreground },
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
                    return (
                      <Pressable
                        key={step}
                        accessibilityRole="button"
                        accessibilityLabel={`${note ? 'Remove' : 'Add'} ${label} note at step ${step + 1}`}
                        accessibilityState={{ selected: note }}
                        onPress={() => toggleMidiNote(track.id, pitch, step)}
                        style={[
                          styles.noteCell,
                          {
                            width: CELL_WIDTH,
                            backgroundColor: note
                              ? track.color
                              : isBlack
                                ? colors.panelSelected
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
                              { backgroundColor: colors.foreground },
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
  content: { padding: 14, paddingBottom: 24, gap: 11 },
  rollInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeTrack: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trackDot: { width: 7, height: 7, borderRadius: 4 },
  trackName: { fontSize: 11, fontWeight: '700' },
  noteCount: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  rollHint: {
    minHeight: 33,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(120,221,226,0.06)',
  },
  hintText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.65 },
  gridFrame: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  ruler: { flexDirection: 'row', height: 31 },
  keyColumnHeader: { alignItems: 'center', justifyContent: 'center' },
  rollBar: {
    borderLeftWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rollBarText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  noteRow: { flexDirection: 'row', height: 27 },
  keyLabel: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 8, fontWeight: '700' },
  noteCell: {
    height: 27,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  noteFill: { width: '100%', height: 3, borderRadius: 2, opacity: 0.7 },
  bottomNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomText: { flex: 1, fontSize: 9, lineHeight: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 13, fontWeight: '700' },
  addButton: { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { fontSize: 8, fontWeight: '800' },
});
