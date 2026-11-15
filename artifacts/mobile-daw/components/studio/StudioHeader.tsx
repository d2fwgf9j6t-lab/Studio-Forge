import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useProject } from '@/contexts/ProjectContext';

function OfflineControl({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Unavailable until an audio engine is added."
      accessibilityState={{ disabled: true }}
      disabled
      style={({ pressed }) => [
        styles.transportButton,
        { borderColor: colors.line, backgroundColor: colors.panel },
        pressed && styles.pressed,
      ]}
      testID={`transport-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <Ionicons name={icon} size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function StudioHeader() {
  const colors = useColors();
  const {
    project,
    editProject,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved,
    isHydrated,
    storageError,
    saveProject,
  } = useProject();
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const [saving, setSaving] = useState(false);

  const openRename = () => {
    setDraftName(project.name);
    setRenameOpen(true);
  };

  const commitRename = () => {
    const name = draftName.trim();
    if (!name) {
      Alert.alert('Project name required', 'Enter a name for this session.');
      return;
    }
    editProject((current) => ({ ...current, name }));
    setRenameOpen(false);
    void Haptics.selectionAsync();
  };

  const handleSave = async () => {
    setSaving(true);
    const saved = await saveProject();
    setSaving(false);
    if (!saved) {
      Alert.alert(
        'Could not save',
        storageError ?? 'The session could not be saved on this device.',
      );
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const status = !isHydrated
    ? 'LOADING SESSION'
    : storageError
      ? 'LOCAL STORAGE ISSUE'
      : saving
        ? 'SAVING SESSION'
        : isSaved
          ? 'SAVED LOCALLY'
          : 'UNSAVED CHANGES';

  return (
    <>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.panel, borderBottomColor: colors.line },
        ]}
      >
        <View style={styles.projectRow}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.lime }]}>
              <Ionicons name="pulse" size={17} color={colors.background} />
            </View>
            <View style={styles.projectText}>
              <Text style={[styles.brandName, { color: colors.mutedForeground }]}>
                NORTHLINE / STUDIO
              </Text>
              <Pressable
                onPress={openRename}
                accessibilityRole="button"
                accessibilityLabel={`Rename project ${project.name}`}
                testID="project-name"
              >
                <Text
                  numberOfLines={1}
                  style={[styles.projectName, { color: colors.foreground }]}
                >
                  {project.name}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo"
              accessibilityState={{ disabled: !canUndo }}
              disabled={!canUndo}
              onPress={undo}
              style={({ pressed }) => [
                styles.iconButton,
                { borderColor: colors.line },
                !canUndo && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              testID="undo-button"
            >
              <Ionicons
                name="return-up-back"
                size={17}
                color={canUndo ? colors.foreground : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Redo"
              accessibilityState={{ disabled: !canRedo }}
              disabled={!canRedo}
              onPress={redo}
              style={({ pressed }) => [
                styles.iconButton,
                { borderColor: colors.line },
                !canRedo && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              testID="redo-button"
            >
              <Ionicons
                name="return-up-forward"
                size={17}
                color={canRedo ? colors.foreground : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save project locally"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: colors.lime },
                pressed && styles.pressed,
              ]}
              testID="save-project"
            >
              <Ionicons name="save-outline" size={15} color={colors.background} />
              <Text style={[styles.saveText, { color: colors.background }]}>
                SAVE
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.transportRow}
          keyboardShouldPersistTaps="handled"
        >
          <OfflineControl icon="play" label="Play" />
          <OfflineControl icon="pause" label="Pause" />
          <OfflineControl icon="stop" label="Stop" />
          <OfflineControl icon="radio-button-on" label="Record" />
          <View style={[styles.toolbarDivider, { backgroundColor: colors.line }]} />
          <View
            style={[
              styles.bpmControl,
              { borderColor: colors.line, backgroundColor: colors.panelRaised },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease tempo"
              onPress={() =>
                editProject((current) => ({
                  ...current,
                  bpm: Math.max(40, current.bpm - 1),
                }))
              }
              style={styles.bpmStep}
              testID="bpm-decrease"
            >
              <Ionicons name="remove" size={14} color={colors.mutedForeground} />
            </Pressable>
            <View style={styles.bpmValue}>
              <Text style={[styles.bpmNumber, { color: colors.lime }]}>
                {project.bpm}
              </Text>
              <Text style={[styles.bpmLabel, { color: colors.mutedForeground }]}>
                BPM
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase tempo"
              onPress={() =>
                editProject((current) => ({
                  ...current,
                  bpm: Math.min(240, current.bpm + 1),
                }))
              }
              style={styles.bpmStep}
              testID="bpm-increase"
            >
              <Ionicons name="add" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.timeChip, { borderColor: colors.line }]}>
            <Text style={[styles.timeText, { color: colors.foreground }]}>
              {project.timeSignature.numerator}/{project.timeSignature.denominator}
            </Text>
          </View>
          <OfflineControl icon="timer-outline" label="Metronome" />
          <OfflineControl icon="repeat" label="Loop" />
          <OfflineControl icon="download-outline" label="Export" />
        </ScrollView>

        <View style={styles.engineStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: storageError ? colors.destructive : colors.amber },
            ]}
          />
          <Text style={[styles.engineText, { color: colors.mutedForeground }]}>
            {status}
          </Text>
          <View style={[styles.statusDivider, { backgroundColor: colors.line }]} />
          <Text style={[styles.engineText, { color: colors.amber }]}>
            AUDIO ENGINE OFFLINE
          </Text>
        </View>
      </View>

      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameOpen(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalScrim}>
          <View
            style={[
              styles.renameCard,
              { backgroundColor: colors.panelRaised, borderColor: colors.line },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Rename session
            </Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              maxLength={48}
              returnKeyType="done"
              onSubmitEditing={commitRename}
              placeholder="Session name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.renameInput,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.line,
                  color: colors.foreground,
                },
              ]}
              testID="project-name-input"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRenameOpen(false)} style={styles.modalButton}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={commitRename}
                style={[styles.confirmButton, { backgroundColor: colors.lime }]}
              >
                <Text style={[styles.confirmText, { color: colors.background }]}>
                  UPDATE NAME
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 7,
  },
  projectRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectText: { flex: 1 },
  brandName: { fontSize: 8, fontWeight: '700', letterSpacing: 1.4 },
  projectName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.42 },
  saveButton: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  saveText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  transportRow: { alignItems: 'center', gap: 7, paddingVertical: 7 },
  transportButton: {
    width: 34,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
    opacity: 0.48,
  },
  toolbarDivider: { width: 1, height: 26, marginHorizontal: 2 },
  bpmControl: {
    height: 35,
    borderWidth: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpmStep: { width: 25, height: 33, alignItems: 'center', justifyContent: 'center' },
  bpmValue: { minWidth: 44, alignItems: 'center' },
  bpmNumber: { fontSize: 12, fontWeight: '800', lineHeight: 14 },
  bpmLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  timeChip: {
    height: 32,
    minWidth: 41,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeText: { fontSize: 11, fontWeight: '700' },
  engineStatus: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  engineText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.65 },
  statusDivider: { width: 1, height: 10, marginHorizontal: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: 22,
  },
  renameCard: { padding: 18, borderWidth: 1, borderRadius: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  renameInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  modalButton: { paddingHorizontal: 8, paddingVertical: 10 },
  cancelText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  confirmButton: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11 },
  confirmText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
});
